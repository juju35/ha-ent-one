"""Data update coordinator for ENT ONE."""

from __future__ import annotations

import asyncio
import logging
import time
from collections import OrderedDict
from dataclasses import dataclass, field, replace
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.translation import async_get_translations
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import (
    EntActionRequiredError,
    EntApi,
    EntAuthError,
    EntError,
    html_content,
    html_files,
    html_to_text,
    without_file_names,
)
from .const import (
    CONF_HOMEWORK_DAYS,
    CONF_NOTIFY,
    CONF_SCAN_INTERVAL,
    DEFAULT_HOMEWORK_DAYS,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    EVENT_NEW_HOMEWORK,
    EVENT_NEW_MESSAGE,
    EVENT_NEW_WORD,
    MESSAGES_KEPT,
    MIN_SCAN_INTERVAL,
    NEWS_KEPT,
)
from .secret import SecretNotFoundError, async_credentials

_LOGGER = logging.getLogger(__name__)

# Messages read in full kept for the session, and files kept for a few minutes within a size budget.
MESSAGE_CACHE = 30
FILE_CACHE_TTL = 15 * 60
FILE_CACHE_BYTES = 40 * 1024 * 1024

# School calendar events kept around today: past ones for the calendar view, upcoming ones for the card.
EVENTS_PAST = timedelta(days=30)
EVENTS_AHEAD = timedelta(days=180)
# Homework already due stays visible for a day, so what was due today can still be ticked.
HOMEWORK_PAST = timedelta(days=1)

type EntConfigEntry = ConfigEntry[EntCoordinator]

SECTIONS = ("messages", "words", "homework", "news", "events")


@dataclass
class EntData:
    """Everything one update read from the ENT."""

    account: dict[str, Any] = field(default_factory=dict)
    children: dict[str, dict[str, str]] = field(default_factory=dict)
    unread: int = 0
    messages: list[dict[str, Any]] = field(default_factory=list)
    words: list[dict[str, Any]] = field(default_factory=list)
    homework: list[dict[str, Any]] = field(default_factory=list)
    books: dict[str, str] = field(default_factory=dict)
    news: list[dict[str, Any]] = field(default_factory=list)
    events: list[dict[str, Any]] = field(default_factory=list)
    # Sections whose last read failed: their content is the one of the update before.
    stale: list[str] = field(default_factory=list)


def _str(value: Any) -> str:
    return "" if value is None else str(value)


def _person(value: Any) -> str | None:
    if isinstance(value, dict):
        return value.get("displayName") or value.get("name") or None
    return value or None


def parse_when(value: Any) -> datetime | date | None:
    """An ENT date: milliseconds, {"$date": …} (MongoDB), an ISO date or date-time."""
    if isinstance(value, dict):
        value = value.get("$date")
    if isinstance(value, int | float) and not isinstance(value, bool):
        try:
            return dt_util.utc_from_timestamp(value / 1000)
        except (OverflowError, OSError, ValueError):
            return None
    text = _str(value).strip()
    if not text:
        return None
    # A date alone is a day, not that day's midnight (an all-day event's last day, a homework due date).
    parsed = None if len(text) == 10 else dt_util.parse_datetime(text)
    if parsed is None:
        return dt_util.parse_date(text[:10])
    # The ENT sometimes stores local times without offset.
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=dt_util.get_default_time_zone())


def iso(value: Any) -> str | None:
    when = parse_when(value)
    if isinstance(when, datetime):
        return dt_util.as_local(when).isoformat()
    return when.isoformat() if when else None


def day(value: Any) -> date | None:
    when = parse_when(value)
    if isinstance(when, datetime):
        return dt_util.as_local(when).date()
    return when


class EntCoordinator(DataUpdateCoordinator[EntData]):
    """Poll one ENT ONE account."""

    config_entry: EntConfigEntry

    def __init__(self, hass: HomeAssistant, entry: EntConfigEntry, api: EntApi) -> None:
        minutes = max(MIN_SCAN_INTERVAL, int(entry.options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)))
        super().__init__(hass, _LOGGER, config_entry=entry, name=DOMAIN, update_interval=timedelta(minutes=minutes))
        self.api = api
        self.homework_days = int(entry.options.get(CONF_HOMEWORK_DAYS, DEFAULT_HOMEWORK_DAYS))
        self.notify_services: list[str] = list(entry.options.get(CONF_NOTIFY, []))
        # Ids present at the last successful read of each kind; a kind is absent until its first one.
        self._seen: dict[str, set[str]] = {}
        # Messages read in full and files fetched, kept a while: reopening one asks nothing of the ENT.
        self._message_cache: OrderedDict[str, dict[str, Any]] = OrderedDict()
        self._file_cache: OrderedDict[str, tuple[float, bytes, str, str | None]] = OrderedDict()
        self._auth_failed = False

    async def _async_update_data(self) -> EntData:
        try:
            # Credentials kept in secrets.yaml are read again each time: editing the secret is enough after a change.
            self.api.update_credentials(*await async_credentials(self.hass, self.config_entry.data))
        except SecretNotFoundError as err:
            raise UpdateFailed(str(err)) from err
        try:
            data = await self._read()
        except EntAuthError as err:
            # The client won't log in again with the same password: a reauth (or an edited secret) is needed.
            self._auth_failed = True
            raise ConfigEntryAuthFailed(str(err)) from err
        except EntError as err:
            raise UpdateFailed(str(err)) from err
        if self._auth_failed:
            # Back in after a refusal (the secret was edited): the waiting reauth form is no longer needed.
            self._auth_failed = False
            self._abort_reauth()
        return data

    def _abort_reauth(self) -> None:
        for flow in self.hass.config_entries.flow.async_progress_by_handler(DOMAIN):
            context = flow["context"]
            if context.get("source") == "reauth" and context.get("entry_id") == self.config_entry.entry_id:
                self.hass.config_entries.flow.async_abort(flow["flow_id"])

    async def _read(self) -> EntData:
        previous = self.data or EntData()
        info = await self.api.user_info()
        data = EntData(
            account={
                "user_id": _str(info.get("userId")),
                "name": info.get("username") or "",
                "type": info.get("type") or "",
                "schools": [s for s in info.get("structureNames") or [] if s],
                "classes": [c for c in info.get("classNames") or [] if c],
            },
            children={
                _str(child_id): {
                    "first_name": (child or {}).get("firstName") or "",
                    "last_name": (child or {}).get("lastName") or "",
                }
                for child_id, child in (info.get("children") or {}).items()
            },
        )
        readers = {
            "messages": self._read_messages,
            "words": self._read_words,
            "homework": self._read_homework,
            "news": self._read_news,
            "events": self._read_events,
        }
        # The applications are read side by side (the client keeps a few requests at a time).
        results = await asyncio.gather(*(reader(data) for reader in readers.values()), return_exceptions=True)
        for section, result in zip(readers, results, strict=True):
            if isinstance(result, (EntAuthError, EntActionRequiredError)):
                raise result
            if isinstance(result, EntError):
                # An application missing from this ENT, or a hiccup: keep that section as it was.
                _LOGGER.debug("ENT section %s not updated: %s", section, result)
                data.stale.append(section)
                self._keep(section, previous, data)
            elif isinstance(result, BaseException):
                raise result
        data.stale.sort(key=list(readers).index)
        self._fire_new(data)
        return data

    @staticmethod
    def _keep(section: str, previous: EntData, data: EntData) -> None:
        if section == "messages":
            data.unread, data.messages = previous.unread, previous.messages
        elif section == "homework":
            data.homework, data.books = previous.homework, previous.books
        else:
            setattr(data, section, getattr(previous, section))

    async def _read_messages(self, data: EntData) -> None:
        unread, inbox = await asyncio.gather(self.api.unread_count(), self.api.inbox(MESSAGES_KEPT))
        data.unread = unread
        data.messages = [
            {
                "id": _str(m.get("id")),
                "subject": m.get("subject") or "",
                "sender": _person(m.get("from")),
                "date": iso(m.get("date")),
                "unread": bool(m.get("unread")),
                "attachment": bool(m.get("hasAttachment")),
            }
            for m in inbox
        ]

    async def _read_words(self, data: EntData) -> None:
        me = data.account["user_id"]
        words: list[dict[str, Any]] = []
        lists = await asyncio.gather(*(self.api.words(child_id) for child_id in data.children))
        for (child_id, child), child_words in zip(data.children.items(), lists, strict=True):
            for w in child_words:
                acks = w.get("acknowledgments") or []
                words.append(
                    {
                        "id": _str(w.get("id")),
                        "child_id": child_id,
                        "child": child["first_name"],
                        "title": w.get("title") or "",
                        "text": (content := html_content(w.get("text"), self.api.base_url))[0],
                        "attachments": content[1],
                        "date": iso(w.get("sending_date")),
                        "author": w.get("owner_name"),
                        "category": w.get("category"),
                        "reply_possible": bool(w.get("reply")),
                        "signed": any(isinstance(a, dict) and _str(a.get("owner")) == me for a in acks),
                    }
                )
        words.sort(key=lambda w: w["date"] or "", reverse=True)
        data.words = words

    async def _read_homework(self, data: EntData) -> None:
        today = dt_util.now().date()
        first, last = today - HOMEWORK_PAST, today + timedelta(days=self.homework_days)
        homework: list[dict[str, Any]] = []
        books = {_str(b.get("_id")): b for b in await self.api.homework_books() if b.get("_id")}

        async def read_book(book_id: str) -> tuple[dict[str, Any], set[str]]:
            content = await self.api.homework_book(book_id)
            days = [d for d in content.get("data") or [] if isinstance(d, dict)]
            due = any((when := day(d.get("date"))) and first <= when <= last for d in days)
            return content, (await self.api.homework_done(book_id) if due else set())

        for book_id, (content, done) in zip(books, await asyncio.gather(*map(read_book, books)), strict=True):
            title = content.get("title") or books[book_id].get("title") or ""
            data.books[book_id] = title
            days = [d for d in content.get("data") or [] if isinstance(d, dict)]
            due = [(when, d) for d in days if (when := day(d.get("date"))) and first <= when <= last]
            for when, d in due:
                for entry in d.get("entries") or []:
                    if not isinstance(entry, dict) or not entry.get("_id"):
                        continue
                    entry_id = _str(entry["_id"])
                    homework.append(
                        {
                            "id": entry_id,
                            "book_id": book_id,
                            "book": title,
                            "date": when.isoformat(),
                            "title": entry.get("title") or "",
                            "text": (text := html_content(entry.get("value"), self.api.base_url))[0],
                            "attachments": text[1],
                            "done": entry_id in done,
                        }
                    )
        homework.sort(key=lambda h: (h["date"], h["book"], h["title"]))
        data.homework = homework

    async def _read_news(self, data: EntData) -> None:
        data.news = [
            {
                "id": _str(n.get("id")),
                "title": n.get("title") or "",
                "text": (content := html_content(n.get("content"), self.api.base_url))[0],
                "attachments": content[1],
                "date": iso(n.get("publicationDate") or n.get("publication_date") or n.get("created")),
                "author": _person(n.get("owner")),
                "headline": bool(n.get("headline")),
            }
            for n in await self.api.news(NEWS_KEPT)
        ]

    async def _read_events(self, data: EntData) -> None:
        now = dt_util.now()
        first, last = (now - EVENTS_PAST).date(), (now + EVENTS_AHEAD).date()
        events: list[dict[str, Any]] = []
        calendars = {_str(c.get("_id") or c.get("id")): c for c in await self.api.calendars()}
        calendars.pop("", None)
        lists = await asyncio.gather(*(self.api.calendar_events(i) for i in calendars))
        for calendar, calendar_events in zip(calendars.values(), lists, strict=True):
            for e in calendar_events:
                start = e.get("startMoment") or e.get("start")
                end = e.get("endMoment") or e.get("end") or start
                start_day, end_day = day(start), day(end)
                if start_day is None or start_day > last or (end_day or start_day) < first:
                    continue
                events.append(
                    {
                        "id": _str(e.get("_id") or e.get("id")),
                        "calendar": calendar.get("title") or "",
                        "title": e.get("title") or "",
                        "description": html_to_text(e.get("description")),
                        "location": e.get("location") or None,
                        "start": iso(start),
                        "end": iso(end),
                        "all_day": bool(e.get("allday")),
                    }
                )
        events.sort(key=lambda e: e["start"] or "")
        data.events = events

    def _fire_new(self, data: EntData) -> None:
        """Fire ent_one_new_* for unread messages, unsigned words and homework to do seen for the first time.

        A kind starts being followed at its first successful read, which only records what is there: a section that
        failed at startup does not fire everything it holds once it comes back. The ids remembered are the ones
        present in the last read (read, signed or done included), so the set stays small and an item signed then
        shown again never fires twice.
        """
        kinds = {
            "message": ("messages", data.messages, lambda m: m["unread"], EVENT_NEW_MESSAGE, ("subject", "sender")),
            "word": ("words", data.words, lambda w: not w["signed"], EVENT_NEW_WORD, ("child_id", "child", "title")),
            "homework": (
                "homework",
                data.homework,
                lambda h: not h["done"],
                EVENT_NEW_HOMEWORK,
                ("book", "date", "title"),
            ),
        }
        for kind, (section, items, pending, event, fields) in kinds.items():
            if section in data.stale:
                continue  # Content of the update before: nothing new to look at.
            seen = self._seen.get(kind)
            self._seen[kind] = {item["id"] for item in items}
            if seen is None:
                continue
            for item in items:
                if pending(item) and item["id"] not in seen:
                    self._fire(event, {"id": item["id"], **{f: item[f] for f in fields}})

    def _fire(self, event: str, data: dict[str, Any]) -> None:
        data = {"config_entry_id": self.config_entry.entry_id, **data}
        self.hass.bus.async_fire(event, data)
        if self.notify_services:
            self.hass.async_create_task(self._async_notify(event, data), f"{DOMAIN}_notify")

    async def _async_notify(self, event: str, data: dict[str, Any]) -> None:
        """Tell the notify actions chosen in the options, in Home Assistant's language."""
        strings = await async_get_translations(self.hass, self.hass.config.language, "exceptions", [DOMAIN])
        kind = event.removeprefix(f"{DOMAIN}_")

        def text(key: str, **placeholders: Any) -> str:
            message = strings.get(f"component.{DOMAIN}.exceptions.{key}.message", key)
            try:
                return message.format(**placeholders)
            except (KeyError, IndexError, ValueError):
                return message

        title = text(f"notify_{kind}", child=data.get("child") or "")
        if event == EVENT_NEW_MESSAGE:
            message = " · ".join(p for p in (data.get("sender"), data.get("subject")) if p)
        elif event == EVENT_NEW_HOMEWORK:
            message = " · ".join(p for p in (data.get("title") or data.get("book"), data.get("date")) if p)
        else:
            message = data.get("title") or ""
        for service in self.notify_services:
            target = service.removeprefix("notify.")
            if not self.hass.services.has_service("notify", target):
                _LOGGER.warning("Notify action notify.%s not found", target)
                continue
            try:
                await self.hass.services.async_call(
                    "notify",
                    target,
                    {"title": title, "message": message or title, "data": {"tag": f"{kind}_{data['id']}"}},
                )
            except Exception:  # noqa: BLE001 - a broken notifier must not stop the others
                _LOGGER.exception("Could not notify with notify.%s", target)

    async def async_message(self, message_id: str) -> dict[str, Any]:
        """A message in full, for the card and the panel. The ENT marks it read: the list follows at once, without
        reading the whole ENT again."""
        message_id = _str(message_id)
        if message_id in self._message_cache:
            self._message_cache.move_to_end(message_id)
            return self._message_cache[message_id]
        m = await self.api.message(message_id)
        attachments = [
            {
                "path": f"/conversation/message/{message_id}/attachment/{_str(a.get('id'))}",
                "name": a.get("filename") or a.get("name") or _str(a.get("id")),
                "size": a.get("size"),
                "kind": "file",
            }
            for a in m.get("attachments") or []
            if isinstance(a, dict) and a.get("id")
        ]
        body = m.get("body") or ""
        attachments += [
            f for f in html_files(body, self.api.base_url) if f["path"] not in {a["path"] for a in attachments}
        ]
        result = {
            "id": message_id,
            "subject": m.get("subject") or "",
            "sender": _person(m.get("from")),
            "date": iso(m.get("date")),
            "text": without_file_names(html_to_text(body), attachments),
            "attachments": attachments,
        }
        self._message_cache[message_id] = result
        while len(self._message_cache) > MESSAGE_CACHE:
            self._message_cache.popitem(last=False)
        data = self.data
        if data and any(msg["id"] == message_id and msg["unread"] for msg in data.messages):
            messages = [{**msg, "unread": False} if msg["id"] == message_id else msg for msg in data.messages]
            self.async_set_updated_data(replace(data, messages=messages, unread=max(0, data.unread - 1)))
        return result

    async def async_file(self, path: str) -> tuple[bytes, str, str | None]:
        """An ENT file, kept a few minutes within a size budget: a redraw or a second look is instant."""
        now = time.monotonic()
        hit = self._file_cache.get(path)
        if hit and now - hit[0] < FILE_CACHE_TTL:
            self._file_cache.move_to_end(path)
            return hit[1], hit[2], hit[3]
        body, content_type, name = await self.api.download(path)
        self._file_cache[path] = (now, body, content_type, name)
        self._file_cache.move_to_end(path)
        total = sum(len(v[1]) for v in self._file_cache.values())
        while total > FILE_CACHE_BYTES and len(self._file_cache) > 1:
            _, old = self._file_cache.popitem(last=False)
            total -= len(old[1])
        return body, content_type, name

    async def async_sign_word(self, word_id: str, child_id: str) -> None:
        await self.api.sign_word(word_id, child_id)
        await self.async_request_refresh()

    async def async_set_homework_done(self, book_id: str, entry_id: str, done: bool) -> None:
        await self.api.set_homework_done(book_id, entry_id, done)
        # Shown at once; the next update confirms it with the ENT's own status. New dicts: the previous ones are
        # shared with the states already written.
        if self.data:
            self.data.homework = [
                {**item, "done": done} if item["id"] == entry_id and item["book_id"] == book_id else item
                for item in self.data.homework
            ]
            self.async_update_listeners()
