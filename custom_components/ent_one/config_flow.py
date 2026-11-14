"""Config flow for ENT ONE."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any
from urllib.parse import urlsplit

import aiohttp
import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigEntryState, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_create_clientsession
from homeassistant.helpers.selector import (
    BooleanSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .api import EntActionRequiredError, EntApi, EntAuthError, EntError, normalize_url
from .const import (
    CONF_HOMEWORK_DAYS,
    CONF_NOTIFY,
    CONF_PASSWORD_SECRET,
    CONF_SCAN_INTERVAL,
    CONF_SHOW_PANEL,
    CONF_USERNAME_SECRET,
    DEFAULT_HOMEWORK_DAYS,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_SHOW_PANEL,
    DEFAULT_URL,
    DOMAIN,
    MIN_SCAN_INTERVAL,
)
from .secret import SecretNotFoundError, async_credentials

PASSWORD = TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD))


def new_session(hass: HomeAssistant) -> aiohttp.ClientSession:
    """A session with its own cookie jar: the ENT session cookie must never reach other integrations."""
    return async_create_clientsession(hass, cookie_jar=aiohttp.CookieJar())


async def validate(
    hass: HomeAssistant, url: str, username: str, password: str
) -> tuple[dict[str, Any] | None, str | None]:
    """Log in once: the user info, or an error key."""
    session = new_session(hass)
    try:
        api = EntApi(session, url, username, password)
        await api.login()
        return await api.user_info(), None
    except EntAuthError:
        return None, "invalid_auth"
    except EntActionRequiredError:
        return None, "action_required"
    except EntError:
        return None, "cannot_connect"
    finally:
        session.detach()


def credential_fields(defaults: Mapping[str, Any], *, username: bool = True) -> dict:
    """Each credential, or the name of the secrets.yaml entry holding it."""
    fields: dict = {}
    if username:
        fields[vol.Optional(CONF_USERNAME, default=defaults.get(CONF_USERNAME, ""))] = str
        fields[vol.Optional(CONF_USERNAME_SECRET, default=defaults.get(CONF_USERNAME_SECRET, ""))] = str
    fields[vol.Optional(CONF_PASSWORD)] = PASSWORD
    fields[vol.Optional(CONF_PASSWORD_SECRET, default=defaults.get(CONF_PASSWORD_SECRET, ""))] = str
    return fields


def _secret_name(value: Any) -> str:
    return str(value or "").strip().removeprefix("!secret").strip()


async def credentials(
    hass: HomeAssistant, user_input: Mapping[str, Any]
) -> tuple[dict[str, str], tuple[str, str] | None, str | None]:
    """The credentials part of the entry data, the resolved (username, password), and an error key."""
    data: dict[str, str] = {}
    for key, secret, error in (
        (CONF_USERNAME, CONF_USERNAME_SECRET, "username_or_secret"),
        (CONF_PASSWORD, CONF_PASSWORD_SECRET, "password_or_secret"),
    ):
        value = str(user_input.get(key) or "")
        value = value.strip() if key == CONF_USERNAME else value
        name = _secret_name(user_input.get(secret))
        if bool(value.strip()) == bool(name):
            return {}, None, error
        data.update({secret: name} if name else {key: value})
    try:
        return data, await async_credentials(hass, data), None
    except SecretNotFoundError:
        return {}, None, "secret_not_found"


def _account(data: Mapping[str, Any]) -> str:
    """The username for the forms' texts, or its secret when it is one."""
    return data.get(CONF_USERNAME) or f"!secret {data.get(CONF_USERNAME_SECRET, '')}"


class EntConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for ENT ONE."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            secret, resolved, error = await credentials(self.hass, user_input)
            try:
                url = normalize_url(user_input[CONF_URL])
            except EntError:
                errors[CONF_URL] = "invalid_url"
            else:
                info = None
                if resolved is not None:
                    info, error = await validate(self.hass, url, *resolved)
                if info is not None:
                    await self.async_set_unique_id(f"{urlsplit(url).netloc}_{info['userId']}")
                    self._abort_if_unique_id_configured()
                    schools = [s for s in info.get("structureNames") or [] if s]
                    return self.async_create_entry(
                        title=f"ENT ONE · {schools[0]}" if schools else "ENT ONE",
                        data={CONF_URL: url, **secret},
                    )
                errors["base"] = error or "cannot_connect"

        defaults = user_input or {}
        schema = vol.Schema(
            {
                vol.Required(CONF_URL, default=defaults.get(CONF_URL, "")): TextSelector(
                    TextSelectorConfig(type=TextSelectorType.URL)
                ),
                **credential_fields(defaults),
            }
        )
        return self.async_show_form(
            step_id="user", data_schema=schema, errors=errors, description_placeholders={"example": DEFAULT_URL}
        )

    async def _check(self, entry: ConfigEntry, username: str, password: str) -> str | None:
        """Log in with new credentials of an existing entry: an error key, or None when it works."""
        info, error = await validate(self.hass, entry.data[CONF_URL], username, password)
        if info is None:
            return error or "cannot_connect"
        if entry.unique_id and not entry.unique_id.endswith(f"_{info['userId']}"):
            return "wrong_account"
        return None

    def _update_and_abort(self, entry: ConfigEntry, data: Mapping[str, Any], reason: str) -> ConfigFlowResult:
        """Save the new data and reload once: the update listener reloads a loaded entry whose data changed,
        so reload here only when it won't (entry not loaded, or same data after an edited secret)."""
        loaded = entry.state is ConfigEntryState.LOADED
        changed = self.hass.config_entries.async_update_entry(entry, data=dict(data))
        if not (loaded and changed):
            self.hass.config_entries.async_schedule_reload(entry.entry_id)
        return self.async_abort(reason=reason)

    @staticmethod
    def _new_data(entry: ConfigEntry, part: Mapping[str, str], keys: tuple[str, ...]) -> dict[str, Any]:
        """The entry data with the credentials named by `keys` replaced by `part`."""
        return {**{k: v for k, v in entry.data.items() if k not in keys}, **part}

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        if entry_data.get(CONF_PASSWORD_SECRET):
            return await self.async_step_reauth_secret()
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """A stored password was refused: type the new one (the username stays as configured)."""
        errors: dict[str, str] = {}
        entry = self._get_reauth_entry()
        if user_input is not None:
            try:
                username, _old = await async_credentials(self.hass, entry.data)
            except SecretNotFoundError:
                errors["base"] = "secret_not_found"
            else:
                error = await self._check(entry, username, user_input[CONF_PASSWORD])
                if error == "wrong_account":
                    return self.async_abort(reason="wrong_account")
                if error is None:
                    data = self._new_data(
                        entry, {CONF_PASSWORD: user_input[CONF_PASSWORD]}, (CONF_PASSWORD, CONF_PASSWORD_SECRET)
                    )
                    return self._update_and_abort(entry, data, "reauth_successful")
                errors["base"] = error
        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema({vol.Required(CONF_PASSWORD): PASSWORD}),
            errors=errors,
            description_placeholders={"username": _account(entry.data)},
        )

    async def async_step_reauth_secret(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The password lives in secrets.yaml: edit the secret, then submit (the next update also picks it up)."""
        errors: dict[str, str] = {}
        entry = self._get_reauth_entry()
        if user_input is not None:
            try:
                resolved = await async_credentials(self.hass, entry.data)
            except SecretNotFoundError:
                errors["base"] = "secret_not_found"
            else:
                error = await self._check(entry, *resolved)
                if error == "wrong_account":
                    return self.async_abort(reason="wrong_account")
                if error is None:
                    return self._update_and_abort(entry, entry.data, "reauth_successful")
                errors["base"] = error
        return self.async_show_form(
            step_id="reauth_secret",
            data_schema=vol.Schema({}),
            errors=errors,
            description_placeholders={"secret": entry.data[CONF_PASSWORD_SECRET], "username": _account(entry.data)},
        )

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Change the credentials, or switch each one between a stored value and a secrets.yaml entry."""
        errors: dict[str, str] = {}
        entry = self._get_reconfigure_entry()
        if user_input is not None:
            part, resolved, error = await credentials(self.hass, user_input)
            if resolved is not None:
                error = await self._check(entry, *resolved)
            if resolved is not None and error is None:
                data = self._new_data(
                    entry, part, (CONF_USERNAME, CONF_USERNAME_SECRET, CONF_PASSWORD, CONF_PASSWORD_SECRET)
                )
                return self._update_and_abort(entry, data, "reconfigure_successful")
            errors["base"] = error or "cannot_connect"
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=vol.Schema(credential_fields(user_input or entry.data)),
            errors=errors,
            description_placeholders={"username": _account(entry.data)},
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return EntOptionsFlow()


class EntOptionsFlow(OptionsFlow):
    """Polling interval, homework window, notifications and sidebar panel."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=clean_options(user_input))
        return self.async_show_form(step_id="init", data_schema=options_schema(self.hass, self.config_entry.options))


def clean_options(options: dict[str, Any]) -> dict[str, Any]:
    return {
        CONF_SCAN_INTERVAL: max(MIN_SCAN_INTERVAL, int(options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL))),
        CONF_HOMEWORK_DAYS: min(60, max(1, int(options.get(CONF_HOMEWORK_DAYS, DEFAULT_HOMEWORK_DAYS)))),
        CONF_NOTIFY: sorted(
            {f"notify.{n.strip().removeprefix('notify.')}" for n in options.get(CONF_NOTIFY, []) if n.strip()}
        ),
        CONF_SHOW_PANEL: bool(options.get(CONF_SHOW_PANEL, DEFAULT_SHOW_PANEL)),
    }


def notify_choices(hass: HomeAssistant, current: list[str]) -> list[str]:
    return sorted(
        {f"notify.{name}" for name in hass.services.async_services_for_domain("notify")}
        - {"notify.send_message", "notify.persistent_notification"}
        | set(current)
    )


def options_schema(hass: HomeAssistant, options: Mapping[str, Any]) -> vol.Schema:
    notify: list[str] = list(options.get(CONF_NOTIFY, []))
    return vol.Schema(
        {
            vol.Required(
                CONF_SCAN_INTERVAL, default=options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)
            ): NumberSelector(
                NumberSelectorConfig(
                    min=MIN_SCAN_INTERVAL, max=360, step=5, unit_of_measurement="min", mode=NumberSelectorMode.BOX
                )
            ),
            vol.Required(
                CONF_HOMEWORK_DAYS, default=options.get(CONF_HOMEWORK_DAYS, DEFAULT_HOMEWORK_DAYS)
            ): NumberSelector(
                NumberSelectorConfig(min=1, max=60, step=1, unit_of_measurement="d", mode=NumberSelectorMode.BOX)
            ),
            vol.Optional(CONF_NOTIFY, default=notify): SelectSelector(
                SelectSelectorConfig(
                    options=notify_choices(hass, notify),
                    multiple=True,
                    custom_value=True,
                    mode=SelectSelectorMode.DROPDOWN,
                )
            ),
            vol.Required(CONF_SHOW_PANEL, default=options.get(CONF_SHOW_PANEL, DEFAULT_SHOW_PANEL)): BooleanSelector(),
        }
    )
