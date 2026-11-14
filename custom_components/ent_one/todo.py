"""One to-do list per homework notebook: ticking an item marks the homework done in the ENT."""

from __future__ import annotations

from homeassistant.components.todo import TodoItem, TodoItemStatus, TodoListEntity, TodoListEntityFeature
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .api import EntError
from .const import DOMAIN
from .coordinator import EntConfigEntry, EntCoordinator
from .entity import EntEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: EntConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = entry.runtime_data
    known: set[str] = set()

    @callback
    def add_new_books() -> None:
        books = coordinator.data.books if coordinator.data else {}
        new = [EntHomeworkTodo(coordinator, book_id) for book_id in books if book_id not in known]
        known.update(e.book_id for e in new)
        if new:
            async_add_entities(new)

    add_new_books()
    entry.async_on_unload(coordinator.async_add_listener(add_new_books))


class EntHomeworkTodo(EntEntity, TodoListEntity):
    """The homework of a notebook within the configured window. Only the done box can change, as in the ENT."""

    _attr_supported_features = TodoListEntityFeature.UPDATE_TODO_ITEM

    def __init__(self, coordinator: EntCoordinator, book_id: str) -> None:
        super().__init__(coordinator, "homework_book", f"homework_{book_id}")
        self.book_id = book_id
        self._attr_translation_placeholders = {"book": coordinator.data.books.get(book_id, book_id)}

    @property
    def todo_items(self) -> list[TodoItem]:
        data = self.coordinator.data
        if not data:
            return []
        return [
            TodoItem(
                uid=item["id"],
                summary=item["title"] or item["text"][:80] or item["book"],
                status=TodoItemStatus.COMPLETED if item["done"] else TodoItemStatus.NEEDS_ACTION,
                due=dt_util.parse_date(item["date"]),
                description=item["text"] or None,
            )
            for item in data.homework
            if item["book_id"] == self.book_id
        ]

    async def async_update_todo_item(self, item: TodoItem) -> None:
        if item.uid is None:
            return
        try:
            await self.coordinator.async_set_homework_done(
                self.book_id, item.uid, item.status == TodoItemStatus.COMPLETED
            )
        except EntError as err:
            raise HomeAssistantError(
                translation_domain=DOMAIN, translation_key="action_failed", translation_placeholders={"error": str(err)}
            ) from err
