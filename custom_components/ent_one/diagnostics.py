"""Diagnostics for ENT ONE: the config entry and the shape of the last update, without anything personal."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME
from homeassistant.core import HomeAssistant

from .const import CONF_PASSWORD_SECRET
from .coordinator import SECTIONS, EntConfigEntry

TO_REDACT = {CONF_USERNAME, CONF_PASSWORD, CONF_PASSWORD_SECRET, "unique_id"}


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: EntConfigEntry) -> dict[str, Any]:
    coordinator = entry.runtime_data
    data = coordinator.data
    # Children, teachers, messages and words are about real children: only counts leave Home Assistant.
    return {
        "entry": async_redact_data(
            {"data": dict(entry.data), "options": dict(entry.options), "unique_id": entry.unique_id}, TO_REDACT
        ),
        "coordinator": {
            "update_interval": str(coordinator.update_interval),
            "last_update_success": coordinator.last_update_success,
            "homework_days": coordinator.homework_days,
        },
        "data": {
            "account_type": data.account.get("type") if data else None,
            "children": len(data.children) if data else 0,
            "unread": data.unread if data else 0,
            "stale": data.stale if data else [],
            **{section: len(getattr(data, section)) if data else 0 for section in SECTIONS},
            "books": len(data.books) if data else 0,
        },
    }
