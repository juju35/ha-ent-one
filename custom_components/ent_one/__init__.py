"""The ENT ONE integration: homework, liaison book, messages, news and calendar of an Edifice ENT ONE account."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant.components import frontend, panel_custom, websocket_api
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_URL, CONF_USERNAME, EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import Event, HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ConfigEntryNotReady, HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .api import EntApi, EntError
from .config_flow import clean_options, new_session, notify_choices
from .const import (
    ATTR_CHILD_ID,
    ATTR_CONFIG_ENTRY_ID,
    ATTR_WORD_ID,
    CARD_FILENAME,
    CONF_SHOW_PANEL,
    DEFAULT_SHOW_PANEL,
    DOMAIN,
    FRONTEND_URL,
    PANEL_FILENAME,
    PANEL_URL_PATH,
    SERVICE_REFRESH,
    SERVICE_SIGN_WORD,
)
from .coordinator import EntConfigEntry, EntCoordinator
from .secret import SecretNotFoundError, async_password

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.CALENDAR, Platform.SENSOR, Platform.TODO]
FRONTEND_DIR = Path(__file__).parent / "frontend"
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

REFRESH_SCHEMA = vol.Schema({vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string})
SIGN_WORD_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_WORD_ID): vol.All(cv.string, vol.Strip, vol.Length(min=1)),
        vol.Required(ATTR_CHILD_ID): vol.All(cv.string, vol.Strip, vol.Length(min=1)),
    }
)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the card and the panel, and register the services and websocket commands once."""
    await hass.http.async_register_static_paths([StaticPathConfig(FRONTEND_URL, str(FRONTEND_DIR), True)])
    await _async_register_card(hass)

    websocket_api.async_register_command(hass, ws_settings)
    websocket_api.async_register_command(hass, ws_update_settings)
    websocket_api.async_register_command(hass, ws_homework_done)

    async def refresh(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass, call.data.get(ATTR_CONFIG_ENTRY_ID))
        await coordinator.async_refresh()
        if not coordinator.last_update_success:
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="refresh_failed",
                translation_placeholders={"error": str(coordinator.last_exception or "unknown error")},
            )

    async def sign_word(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass, call.data.get(ATTR_CONFIG_ENTRY_ID))
        try:
            await coordinator.async_sign_word(call.data[ATTR_WORD_ID], call.data[ATTR_CHILD_ID])
        except EntError as err:
            raise HomeAssistantError(
                translation_domain=DOMAIN, translation_key="action_failed", translation_placeholders={"error": str(err)}
            ) from err

    hass.services.async_register(DOMAIN, SERVICE_REFRESH, refresh, REFRESH_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_SIGN_WORD, sign_word, SIGN_WORD_SCHEMA)
    return True


async def _file_url(hass: HomeAssistant, filename: str) -> tuple[str, str]:
    """Base URL of a frontend file, and the same URL versioned with the file's hash for the browser cache."""
    path = FRONTEND_DIR / filename
    digest = await hass.async_add_executor_job(
        lambda: hashlib.md5(path.read_bytes(), usedforsecurity=False).hexdigest()[:8]
    )
    base_url = f"{FRONTEND_URL}/{filename}"
    return base_url, f"{base_url}?v={digest}"


async def _async_register_card(hass: HomeAssistant) -> None:
    """Add the card to the dashboard resources, as ha-parcel does."""
    base_url, url = await _file_url(hass, CARD_FILENAME)

    async def register(_event: Event | None = None) -> None:
        resources, mode = _lovelace_resources(hass.data.get("lovelace"))
        if resources is None or mode != "storage":
            add_extra_js_url(hass, url)
            return
        try:
            if not resources.loaded:
                await resources.async_load()
                resources.loaded = True
            existing = [item for item in resources.async_items() if item.get("url", "").split("?")[0] == base_url]
            if not existing:
                await resources.async_create_item({"res_type": "module", "url": url})
                _LOGGER.info("ENT ONE card added to dashboard resources: %s", url)
            elif existing[0].get("url") != url:
                await resources.async_update_item(existing[0]["id"], {"res_type": "module", "url": url})
            for duplicate in existing[1:]:
                await resources.async_delete_item(duplicate["id"])
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning(
                "Could not add the ENT ONE card to dashboard resources (%s). Add %s manually "
                "in Settings > Dashboards > Resources (JavaScript module)",
                err,
                url,
            )
            add_extra_js_url(hass, url)

    if hass.is_running:
        await register()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, register)


def _lovelace_resources(lovelace: Any) -> tuple[Any, str]:
    """Lovelace resources and their mode: hass.data["lovelace"] is a dict before 2025.2, then a dataclass."""
    if isinstance(lovelace, dict):
        return lovelace.get("resources"), lovelace.get("resource_mode", lovelace.get("mode", "storage"))
    return getattr(lovelace, "resources", None), getattr(
        lovelace, "resource_mode", getattr(lovelace, "mode", "storage")
    )


async def _async_update_panel(hass: HomeAssistant, setting_up: EntConfigEntry) -> None:
    """Show the sidebar panel while at least one account wants it (the one being set up is not LOADED yet)."""
    entries = [*_loaded_entries(hass), setting_up]
    wanted = any(e.options.get(CONF_SHOW_PANEL, DEFAULT_SHOW_PANEL) for e in entries)
    registered = PANEL_URL_PATH in hass.data.get(frontend.DATA_PANELS, {})
    if wanted and not registered:
        _base, url = await _file_url(hass, PANEL_FILENAME)
        # The panel reuses the card file's helpers and translations: it imports the same versioned URL.
        _base, card_url = await _file_url(hass, CARD_FILENAME)
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name="ent-one-panel",
            sidebar_title="ENT ONE",
            sidebar_icon="mdi:school-outline",
            module_url=url,
            require_admin=False,
            config={"card_url": card_url},
        )
    elif not wanted and registered:
        frontend.async_remove_panel(hass, PANEL_URL_PATH)


async def async_setup_entry(hass: HomeAssistant, entry: EntConfigEntry) -> bool:
    try:
        password = await async_password(hass, entry.data)
    except SecretNotFoundError as err:
        raise ConfigEntryNotReady(str(err)) from err
    session = new_session(hass)
    api = EntApi(session, entry.data[CONF_URL], entry.data[CONF_USERNAME], password)
    coordinator = EntCoordinator(hass, entry, api)
    # Created during the entry setup, the session is detached by Home Assistant when the entry unloads.
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    await _async_update_panel(hass, entry)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: EntConfigEntry) -> bool:
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        # The entry is still LOADED here: decide on the panel without it.
        others = [e for e in _loaded_entries(hass) if e.entry_id != entry.entry_id]
        wanted = any(e.options.get(CONF_SHOW_PANEL, DEFAULT_SHOW_PANEL) for e in others)
        if not wanted and PANEL_URL_PATH in hass.data.get(frontend.DATA_PANELS, {}):
            frontend.async_remove_panel(hass, PANEL_URL_PATH)
    return unloaded


async def _async_reload(hass: HomeAssistant, entry: EntConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


def _loaded_entries(hass: HomeAssistant) -> list[EntConfigEntry]:
    return [e for e in hass.config_entries.async_entries(DOMAIN) if e.state is ConfigEntryState.LOADED]


def _get_coordinator(hass: HomeAssistant, entry_id: str | None) -> EntCoordinator:
    entries = _loaded_entries(hass)
    if entry_id:
        entries = [e for e in entries if e.entry_id == entry_id]
    if not entries:
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="no_account")
    if len(entries) > 1:
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="several_accounts")
    return entries[0].runtime_data


@websocket_api.websocket_command({vol.Required("type"): "ent_one/settings"})
@callback
def ws_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """The accounts and their options, for the panel's Settings tab."""
    accounts = [
        {
            "entry_id": e.entry_id,
            "title": e.title,
            "url": e.data[CONF_URL],
            "options": clean_options(dict(e.options)),
        }
        for e in _loaded_entries(hass)
    ]
    notify = notify_choices(hass, [])
    connection.send_result(
        msg["id"], {"accounts": accounts, "notify_services": notify, "admin": connection.user.is_admin}
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "ent_one/settings/update", vol.Required("entry_id"): str, vol.Required("options"): dict}
)
@callback
def ws_update_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Save an account's options from the panel; the update listener reloads it."""
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "not_found", "Unknown ENT ONE account")
        return
    try:
        options = clean_options({**entry.options, **msg["options"]})
    except (TypeError, ValueError) as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    hass.config_entries.async_update_entry(entry, options=options)
    connection.send_result(msg["id"], {"options": options})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "ent_one/homework_done",
        vol.Required("config_entry_id"): str,
        vol.Required("book_id"): str,
        vol.Required("homework_id"): str,
        vol.Required("done"): bool,
    }
)
@websocket_api.async_response
async def ws_homework_done(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Tick or untick a homework from the card or the panel."""
    try:
        coordinator = _get_coordinator(hass, msg["config_entry_id"])
        await coordinator.async_set_homework_done(msg["book_id"], msg["homework_id"], msg["done"])
    except (ServiceValidationError, EntError) as err:
        connection.send_error(msg["id"], "failed", str(err))
        return
    connection.send_result(msg["id"])
