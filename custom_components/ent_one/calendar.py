"""School calendar of an ENT ONE account: the ENT's calendar events and the homework due dates."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Any

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .coordinator import EntConfigEntry, EntCoordinator, parse_when
from .entity import EntEntity

# An event with a start time and no usable end gets one hour.
TIMED_EVENT_LENGTH = timedelta(hours=1)


async def async_setup_entry(
    hass: HomeAssistant, entry: EntConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    async_add_entities([EntCalendar(entry.runtime_data)])


def _all_day_end(first: date, end: datetime | date | None) -> date:
    """Exclusive end date of an all-day event.

    An end at midnight already is the exclusive end (Friday 00:00 after a Thursday event); any other end time
    (23:59, or a date alone) is the last day, followed by the exclusive end the day after.
    """
    if isinstance(end, datetime):
        local = dt_util.as_local(end)
        if local.time() == time.min and local.date() > first:
            return local.date()
        end = local.date()
    return max(end or first, first) + timedelta(days=1)


def school_event(event: dict[str, Any]) -> CalendarEvent | None:
    start = parse_when(event.get("start"))
    if start is None:
        return None
    end = parse_when(event.get("end"))
    if event.get("all_day") or not isinstance(start, datetime):
        first = dt_util.as_local(start).date() if isinstance(start, datetime) else start
        start, end = first, _all_day_end(first, end)
    elif not isinstance(end, datetime) or end <= start:
        end = start + TIMED_EVENT_LENGTH
    return CalendarEvent(
        start=start,
        end=end,
        summary=event.get("title") or event.get("calendar") or "ENT",
        description=event.get("description") or None,
        location=event.get("location"),
        uid=f"event-{event.get('id')}",
    )


def homework_event(item: dict[str, Any]) -> CalendarEvent | None:
    due = dt_util.parse_date(item.get("date") or "")
    if due is None:
        return None
    title = item.get("title") or item.get("book") or "Homework"
    return CalendarEvent(
        start=due,
        end=due + timedelta(days=1),
        summary=f"{item.get('book')} · {title}" if item.get("book") and item.get("title") else title,
        description=item.get("text") or None,
        uid=f"homework-{item.get('id')}",
    )


class EntCalendar(EntEntity, CalendarEntity):
    """The ENT's calendars and the homework, as all-day events on their due date."""

    def __init__(self, coordinator: EntCoordinator) -> None:
        super().__init__(coordinator, "school")

    def _events(self) -> list[CalendarEvent]:
        data = self.coordinator.data
        if not data:
            return []
        events = [e for raw in data.events if (e := school_event(raw))]
        events += [e for item in data.homework if (e := homework_event(item))]
        return sorted(events, key=lambda e: e.start_datetime_local)

    @property
    def event(self) -> CalendarEvent | None:
        now = dt_util.now()
        return next((e for e in self._events() if e.end_datetime_local > now), None)

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        return [e for e in self._events() if e.start_datetime_local < end_date and e.end_datetime_local > start_date]
