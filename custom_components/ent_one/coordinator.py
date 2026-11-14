"""Data update coordinator for ENT ONE."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.translation import async_get_translations
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import EntActionRequiredError, EntApi, EntAuthError, EntError, html_to_text
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

_LOGGER = logging.getLogger(__name__)

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
    parsed = dt_util.parse_datetime(text)
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
        # Ids already seen per kind; None until the first successful update, so nothing fires at startup.
        self._seen: dict[str, set[str]] | None = None

    async def _async_update_data(self) -> EntData:
        try:
            return await self._read()
        except EntAuthError as err:
            # The client won't log in again on its own: a reauth with new credentials is needed.
            raise ConfigEntryAuthFailed(str(err)) from err
        except EntActionRequiredError as err:
            raise UpdateFailed(str(err)) from err
        except EntError as err:
            raise UpdateFailed(str(err)) from err

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
        for section, reader in readers.items():
            try:
                await reader(data)
            except (EntAuthError, EntActionRequiredError):
                raise
            except EntError as err:
                # An application missing from this ENT, or a hiccup: keep that section as it was.
                _LOGGER.debug("ENT section %s not updated: %s", section, err)
                data.stale.append(section)
                self._keep(section, previous, data)
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
        data.unread = await self.api.unread_count()
        data.messages = [
            {
                "id": _str(m.get("id")),
                "subject": m.get("subject") or "",
                "sender": _person(m.get("from")),
                "date": iso(m.get("date")),
                "unread": bool(m.get("unread")),
                "attachment": bool(m.get("hasAttachment")),
            }
            for m in await self.api.inbox(MESSAGES_KEPT)
        ]

    async def _read_words(self, data: EntData) -> None:
        me = data.account["user_id"]
        words: list[dict[str, Any]] = []
        for child_id, child in data.children.items():
            for w in await self.api.words(child_id):
                acks = w.get("acknowledgments") or []
                words.append(
                    {
                        "id": _str(w.get("id")),
                        "child_id": child_id,
                        "child": child["first_name"],
                        "title": w.get("title") or "",
                        "text": html_to_text(w.get("text")),
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
        for book in await self.api.homework_books():
            book_id = _str(book.get("_id"))
            if not book_id:
                continue
            content = await self.api.homework_book(book_id)
            title = content.get("title") or book.get("title") or ""
            data.books[book_id] = title
            days = [d for d in content.get("data") or [] if isinstance(d, dict)]
            due = [(when, d) for d in days if (when := day(d.get("date"))) and first <= when <= last]
            if not due:
                continue
            done = await self.api.homework_done(book_id)
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
                            "text": html_to_text(entry.get("value")),
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
                "text": html_to_text(n.get("content")),
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
        for calendar in await self.api.calendars():
            calendar_id = _str(calendar.get("_id") or calendar.get("id"))
            if not calendar_id:
                continue
            for e in await self.api.calendar_events(calendar_id):
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
        """Fire ent_one_new_* for unread messages, unsigned words and homework seen for the first time."""
        current = {
            "message": {m["id"]: m for m in data.messages if m["unread"]},
            "word": {w["id"]: w for w in data.words if not w["signed"]},
            "homework": {h["id"]: h for h in data.homework if not h["done"]},
        }
        seen = self._seen
        # Ids are remembered even once read or signed, so a word signed then shown again never fires twice.
        self._seen = {kind: set(items) | (seen or {}).get(kind, set()) for kind, items in current.items()}
        if seen is None:
            return
        for message in (m for key, m in current["message"].items() if key not in seen["message"]):
            self._fire(
                EVENT_NEW_MESSAGE, {"id": message["id"], "subject": message["subject"], "sender": message["sender"]}
            )
        for word in (w for key, w in current["word"].items() if key not in seen["word"]):
            self._fire(
                EVENT_NEW_WORD,
                {"id": word["id"], "child_id": word["child_id"], "child": word["child"], "title": word["title"]},
            )
        for item in (h for key, h in current["homework"].items() if key not in seen["homework"]):
            self._fire(
                EVENT_NEW_HOMEWORK,
                {"id": item["id"], "book": item["book"], "date": item["date"], "title": item["title"]},
            )

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

    async def async_sign_word(self, word_id: str, child_id: str) -> None:
        await self.api.sign_word(word_id, child_id)
        await self.async_request_refresh()

    async def async_set_homework_done(self, book_id: str, entry_id: str, done: bool) -> None:
        await self.api.set_homework_done(book_id, entry_id, done)
        # Shown at once; the next update confirms it with the ENT's own status.
        if self.data:
            for item in self.data.homework:
                if item["id"] == entry_id and item["book_id"] == book_id:
                    item["done"] = done
            self.async_update_listeners()
