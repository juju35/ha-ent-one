"""Base entity of the ENT ONE integration: one service device per account."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import EntCoordinator


class EntEntity(CoordinatorEntity[EntCoordinator]):
    """An entity of an ENT account, attached to its device."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: EntCoordinator, key: str, unique: str | None = None) -> None:
        super().__init__(coordinator)
        entry = coordinator.config_entry
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{unique or key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer="Edifice",
            model="ENT ONE",
            entry_type=DeviceEntryType.SERVICE,
            configuration_url=coordinator.api.base_url,
        )

    @property
    def base_attributes(self) -> dict:
        data = self.coordinator.data
        return {"config_entry_id": self.coordinator.config_entry.entry_id, "stale": list(data.stale) if data else []}
