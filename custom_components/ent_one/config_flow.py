"""Config flow for ENT ONE."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any
from urllib.parse import urlsplit

import aiohttp
import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
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
    DEFAULT_HOMEWORK_DAYS,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_SHOW_PANEL,
    DEFAULT_URL,
    DOMAIN,
    MIN_SCAN_INTERVAL,
)
from .secret import SecretNotFoundError, async_password

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


def password_fields(defaults: Mapping[str, Any]) -> dict:
    """Either a password, or the name of a secrets.yaml entry holding it."""
    return {
        vol.Optional(CONF_PASSWORD): PASSWORD,
        vol.Optional(CONF_PASSWORD_SECRET, default=defaults.get(CONF_PASSWORD_SECRET, "")): str,
    }


async def credentials(
    hass: HomeAssistant, user_input: Mapping[str, Any]
) -> tuple[dict[str, str], str | None, str | None]:
    """The password part of the entry data, the password itself, and an error key."""
    password = user_input.get(CONF_PASSWORD) or ""
    if not password.strip():
        password = ""
    name = (user_input.get(CONF_PASSWORD_SECRET) or "").strip().removeprefix("!secret").strip()
    if bool(password) == bool(name):
        return {}, None, "password_or_secret"
    data = {CONF_PASSWORD_SECRET: name} if name else {CONF_PASSWORD: password}
    try:
        return data, await async_password(hass, data), None
    except SecretNotFoundError:
        return {}, None, "secret_not_found"


class EntConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for ENT ONE."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            username = user_input[CONF_USERNAME].strip()
            secret, password, error = await credentials(self.hass, user_input)
            try:
                url = normalize_url(user_input[CONF_URL])
            except EntError:
                errors[CONF_URL] = "invalid_url"
            else:
                if password is not None:
                    info, error = await validate(self.hass, url, username, password)
                if password is not None and info is not None:
                    await self.async_set_unique_id(f"{urlsplit(url).netloc}_{info['userId']}")
                    self._abort_if_unique_id_configured()
                    schools = [s for s in info.get("structureNames") or [] if s]
                    return self.async_create_entry(
                        title=f"ENT ONE · {schools[0]}" if schools else "ENT ONE",
                        data={CONF_URL: url, CONF_USERNAME: username, **secret},
                    )
                errors["base"] = error or "cannot_connect"

        defaults = user_input or {}
        schema = vol.Schema(
            {
                vol.Required(CONF_URL, default=defaults.get(CONF_URL, "")): TextSelector(
                    TextSelectorConfig(type=TextSelectorType.URL)
                ),
                vol.Required(CONF_USERNAME, default=defaults.get(CONF_USERNAME, "")): str,
                **password_fields(defaults),
            }
        )
        return self.async_show_form(
            step_id="user", data_schema=schema, errors=errors, description_placeholders={"example": DEFAULT_URL}
        )

    async def _check(self, entry: ConfigEntry, password: str) -> str | None:
        """Log in with the new password of an existing entry: an error key, or None when it works."""
        info, error = await validate(self.hass, entry.data[CONF_URL], entry.data[CONF_USERNAME], password)
        if info is None:
            return error or "cannot_connect"
        if entry.unique_id and not entry.unique_id.endswith(f"_{info['userId']}"):
            return "wrong_account"
        return None

    def _new_data(self, entry: ConfigEntry, secret: Mapping[str, str]) -> dict[str, Any]:
        data = {k: v for k, v in entry.data.items() if k not in (CONF_PASSWORD, CONF_PASSWORD_SECRET)}
        return {**data, **secret}

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        if entry_data.get(CONF_PASSWORD_SECRET):
            return await self.async_step_reauth_secret()
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        entry = self._get_reauth_entry()
        if user_input is not None:
            error = await self._check(entry, user_input[CONF_PASSWORD])
            if error == "wrong_account":
                return self.async_abort(reason="wrong_account")
            if error is None:
                return self.async_update_reload_and_abort(
                    entry, data=self._new_data(entry, {CONF_PASSWORD: user_input[CONF_PASSWORD]})
                )
            errors["base"] = error
        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema({vol.Required(CONF_PASSWORD): PASSWORD}),
            errors=errors,
            description_placeholders={"username": entry.data[CONF_USERNAME]},
        )

    async def async_step_reauth_secret(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The password lives in secrets.yaml: edit the secret, then submit (the next update also picks it up)."""
        errors: dict[str, str] = {}
        entry = self._get_reauth_entry()
        if user_input is not None:
            try:
                password = await async_password(self.hass, entry.data)
            except SecretNotFoundError:
                errors["base"] = "secret_not_found"
            else:
                error = await self._check(entry, password)
                if error == "wrong_account":
                    return self.async_abort(reason="wrong_account")
                if error is None:
                    return self.async_update_reload_and_abort(entry, data=dict(entry.data))
                errors["base"] = error
        return self.async_show_form(
            step_id="reauth_secret",
            data_schema=vol.Schema({}),
            errors=errors,
            description_placeholders={
                "secret": entry.data[CONF_PASSWORD_SECRET],
                "username": entry.data[CONF_USERNAME],
            },
        )

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Change the password, or switch between a stored password and a secrets.yaml entry."""
        errors: dict[str, str] = {}
        entry = self._get_reconfigure_entry()
        if user_input is not None:
            secret, password, error = await credentials(self.hass, user_input)
            if password is not None:
                error = await self._check(entry, password)
            if password is not None and error is None:
                return self.async_update_reload_and_abort(entry, data=self._new_data(entry, secret))
            errors["base"] = error or "cannot_connect"
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=vol.Schema(password_fields(user_input or entry.data)),
            errors=errors,
            description_placeholders={"username": entry.data[CONF_USERNAME]},
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
