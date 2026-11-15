"""Sensors of an ENT ONE account: unread messages, words to sign, homework to do, news, blog, last update."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .config_flow import panel_tabs
from .coordinator import EntConfigEntry, EntCoordinator, EntData
from .entity import EntEntity


@dataclass(frozen=True, kw_only=True)
class EntSensorDescription(SensorEntityDescription):
    value: Callable[[EntData], int]
    attributes: Callable[[EntData], dict[str, Any]]


SENSORS: tuple[EntSensorDescription, ...] = (
    EntSensorDescription(
        key="unread_messages",
        state_class=SensorStateClass.MEASUREMENT,
        value=lambda d: d.unread,
        attributes=lambda d: {"messages": d.messages},
    ),
    EntSensorDescription(
        key="words_to_sign",
        state_class=SensorStateClass.MEASUREMENT,
        value=lambda d: sum(1 for w in d.words if not w["signed"]),
        attributes=lambda d: {"words": d.words},
    ),
    EntSensorDescription(
        key="homework",
        state_class=SensorStateClass.MEASUREMENT,
        value=lambda d: sum(1 for h in d.homework if not h["done"]),
        attributes=lambda d: {"homework": d.homework, "books": d.books},
    ),
    EntSensorDescription(
        key="news",
        value=lambda d: len(d.news),
        attributes=lambda d: {"news": d.news},
    ),
    EntSensorDescription(
        key="blog",
        value=lambda d: len(d.blog),
        attributes=lambda d: {"blog": d.blog},
    ),
)


async def async_setup_entry(
    hass: HomeAssistant, entry: EntConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = entry.runtime_data
    entities: list[SensorEntity] = [EntSensor(coordinator, d) for d in SENSORS]
    entities.append(EntLastUpdateSensor(coordinator))
    async_add_entities(entities)


class EntSensor(EntEntity, SensorEntity):
    """A count, with the matching items in the attributes."""

    entity_description: EntSensorDescription
    # The lists change often and can be large: keep them out of the recorder.
    _unrecorded_attributes = frozenset({"messages", "words", "homework", "books", "news", "blog"})

    def __init__(self, coordinator: EntCoordinator, description: EntSensorDescription) -> None:
        super().__init__(coordinator, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> int | None:
        return self.entity_description.value(self.coordinator.data) if self.coordinator.data else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        data = self.coordinator.data
        return {**self.base_attributes, **(self.entity_description.attributes(data) if data else {})}


class EntLastUpdateSensor(EntEntity, SensorEntity):
    """When the ENT was last read, with the account (school, classes, children) and the school calendar."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _unrecorded_attributes = frozenset({"account", "children", "events", "url", "panel_tabs"})

    def __init__(self, coordinator: EntCoordinator) -> None:
        super().__init__(coordinator, "last_update")
        self._updated: datetime | None = dt_util.utcnow() if coordinator.data else None

    def _handle_coordinator_update(self) -> None:
        if self.coordinator.last_update_success:
            self._updated = dt_util.utcnow()
        super()._handle_coordinator_update()

    @property
    def native_value(self) -> datetime | None:
        return self._updated

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        data = self.coordinator.data
        if not data:
            return self.base_attributes
        return {
            **self.base_attributes,
            "url": self.coordinator.api.base_url,
            "account": data.account,
            "children": [{"id": key, **child} for key, child in data.children.items()],
            "events": data.events,
            "panel_tabs": panel_tabs(self.coordinator.config_entry.options),
        }
