"""Credentials of an ENT ONE account: stored in the entry, or read from entries of secrets.yaml."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from homeassistant.const import CONF_PASSWORD, CONF_USERNAME
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util.yaml import load_yaml_dict

from .const import CONF_PASSWORD_SECRET, CONF_USERNAME_SECRET, SECRETS_FILE

# Each credential and the key naming the secrets.yaml entry that can hold it instead.
FIELDS = ((CONF_USERNAME, CONF_USERNAME_SECRET), (CONF_PASSWORD, CONF_PASSWORD_SECRET))


class SecretNotFoundError(HomeAssistantError):
    """A secrets.yaml entry named in the config entry is missing or empty."""


async def async_credentials(hass: HomeAssistant, data: Mapping[str, Any]) -> tuple[str, str]:
    """Username and password to log in with. Secrets are read again on each call: editing secrets.yaml is enough."""
    names = {key: data[secret] for key, secret in FIELDS if data.get(secret)}
    secrets: dict[str, Any] = {}
    if names:

        def read() -> dict[str, Any]:
            try:
                return load_yaml_dict(hass.config.path(SECRETS_FILE))
            except (FileNotFoundError, HomeAssistantError):
                return {}

        secrets = await hass.async_add_executor_job(read)
    values = []
    for key, _secret in FIELDS:
        if key not in names:
            values.append(data[key])
            continue
        value = secrets.get(names[key])
        if value is None or not str(value):
            raise SecretNotFoundError(f"No '{names[key]}' entry in {SECRETS_FILE}")
        values.append(str(value).strip() if key == CONF_USERNAME else str(value))
    return values[0], values[1]
