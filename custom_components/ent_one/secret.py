"""Password of an ENT ONE account: stored in the entry, or read from an entry of secrets.yaml."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from homeassistant.const import CONF_PASSWORD
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util.yaml import load_yaml_dict

from .const import CONF_PASSWORD_SECRET, SECRETS_FILE


class SecretNotFoundError(HomeAssistantError):
    """The secrets.yaml entry named in the config entry is missing or empty."""


async def async_password(hass: HomeAssistant, data: Mapping[str, Any]) -> str:
    """The password to log in with. A secret is read again on each call, so editing secrets.yaml is enough."""
    name = data.get(CONF_PASSWORD_SECRET)
    if not name:
        return data[CONF_PASSWORD]

    def read() -> Any:
        try:
            return load_yaml_dict(hass.config.path(SECRETS_FILE)).get(name)
        except (FileNotFoundError, HomeAssistantError):
            return None

    value = await hass.async_add_executor_job(read)
    if value is None or not str(value):
        raise SecretNotFoundError(f"No '{name}' entry in {SECRETS_FILE}")
    return str(value)
