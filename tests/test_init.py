"""Tests of the ENT ONE integration with a patched client."""

from __future__ import annotations

from datetime import timedelta
from typing import Any
from unittest.mock import patch

import pytest
from homeassistant.components import frontend
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_capture_events

from custom_components.ent_one.api import EntAuthError, EntError
from custom_components.ent_one.const import DOMAIN, EVENT_NEW_WORD, PANEL_URL_PATH
from custom_components.ent_one.diagnostics import async_get_config_entry_diagnostics

URL = "https://ent.example.fr"


def _tomorrow() -> str:
    return (dt_util.now().date() + timedelta(days=1)).isoformat()


class FakeApi:
    """Stands for EntApi: same methods, canned answers."""

    def __init__(self, session: Any, url: str, username: str, password: str) -> None:
        self.base_url = url
        self.password = password
        self.signed: list[tuple[str, str]] = []
        self.done_calls: list[tuple[str, str, bool]] = []
        self.words_list = [
            {
                "id": 11,
                "title": "Sortie au musée",
                "text": "<p>Merci de signer</p>",
                "sending_date": "2026-11-10",
                "owner_name": "Mme Martin",
                "acknowledgments": [],
            }
        ]
        self.news_fails = False

    def update_password(self, password: str) -> None:
        self.password = password

    async def login(self) -> None:
        if self.password != "secret":
            raise EntAuthError("refused")

    async def user_info(self) -> dict[str, Any]:
        await self.login()
        return {
            "userId": "u1",
            "username": "Parent",
            "type": "PERSRELELEVE",
            "structureNames": ["École Jules Ferry"],
            "classNames": None,
            "children": {"c1": {"firstName": "Alice", "lastName": "Test"}},
        }

    async def unread_count(self) -> int:
        return 2

    async def inbox(self, size: int) -> list[dict[str, Any]]:
        return [
            {
                "id": "m1",
                "subject": "Piscine",
                "from": {"displayName": "Mme Martin"},
                "date": 1763200000000,
                "unread": True,
            }
        ]

    async def words(self, child_id: str) -> list[dict[str, Any]]:
        return list(self.words_list)

    async def sign_word(self, word_id: str, child_id: str) -> None:
        self.signed.append((word_id, child_id))

    async def homework_books(self) -> list[dict[str, Any]]:
        return [{"_id": "b1", "title": "CE2 A"}]

    async def homework_book(self, book_id: str) -> dict[str, Any]:
        return {
            "_id": "b1",
            "title": "CE2 A",
            "data": [
                {
                    "date": f"{_tomorrow()}T00:00:00.000Z",
                    "entries": [{"_id": "e1", "title": "Poésie", "value": "<p>p. 12</p>"}],
                },
                {"date": "2020-01-01T00:00:00.000Z", "entries": [{"_id": "old", "title": "Vieux", "value": ""}]},
            ],
        }

    async def homework_done(self, book_id: str) -> set[str]:
        return set()

    async def set_homework_done(self, book_id: str, entry_id: str, done: bool) -> None:
        self.done_calls.append((book_id, entry_id, done))

    async def news(self, size: int) -> list[dict[str, Any]]:
        if self.news_fails:
            raise EntError("HTTP 404 on /actualites")
        return [{"id": 5, "title": "Kermesse", "content": "<p>Samedi</p>", "publicationDate": "2026-11-12T10:00:00Z"}]

    async def calendars(self) -> list[dict[str, Any]]:
        return [{"_id": "cal1", "title": "École"}]

    async def calendar_events(self, calendar_id: str) -> list[dict[str, Any]]:
        start = dt_util.now() + timedelta(days=3)
        return [
            {
                "_id": "ev1",
                "title": "Réunion",
                "startMoment": start.isoformat(),
                "endMoment": (start + timedelta(hours=1)).isoformat(),
            }
        ]


@pytest.fixture
def api():
    holder: dict[str, FakeApi] = {}

    def factory(*args: Any) -> FakeApi:
        holder["api"] = FakeApi(*args)
        return holder["api"]

    with (
        patch("custom_components.ent_one.EntApi", side_effect=factory),
        patch("custom_components.ent_one.config_flow.EntApi", side_effect=factory),
    ):
        yield holder


@pytest.fixture
def entry(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="ENT ONE · École Jules Ferry",
        data={CONF_URL: URL, CONF_USERNAME: "parent", CONF_PASSWORD: "secret"},
        unique_id="ent.example.fr_u1",
    )
    entry.add_to_hass(hass)
    return entry


async def _setup(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


def _entity(hass: HomeAssistant, domain: str, key: str) -> str:
    from homeassistant.helpers import entity_registry as er

    reg = er.async_get(hass)
    for e in reg.entities.values():
        if e.platform == DOMAIN and e.domain == domain and e.unique_id.endswith(key):
            return e.entity_id
    raise AssertionError(f"no {domain} {key}")


async def test_setup_entities(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    assert entry.state is ConfigEntryState.LOADED
    assert hass.states.get(_entity(hass, "sensor", "unread_messages")).state == "2"
    words = hass.states.get(_entity(hass, "sensor", "words_to_sign"))
    assert words.state == "1"
    assert words.attributes["words"][0]["text"] == "Merci de signer"
    homework = hass.states.get(_entity(hass, "sensor", "homework"))
    assert homework.state == "1"
    assert [h["id"] for h in homework.attributes["homework"]] == ["e1"]
    last = hass.states.get(_entity(hass, "sensor", "last_update"))
    assert last.attributes["children"] == [{"id": "c1", "first_name": "Alice", "last_name": "Test"}]
    assert hass.states.get(_entity(hass, "calendar", "school")) is not None
    todo = _entity(hass, "todo", "homework_b1")
    assert hass.states.get(todo).state == "1"
    assert PANEL_URL_PATH in hass.data[frontend.DATA_PANELS]


async def test_todo_marks_homework_done(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    todo = _entity(hass, "todo", "homework_b1")
    await hass.services.async_call(
        "todo", "update_item", {"item": "e1", "status": "completed"}, target={"entity_id": todo}, blocking=True
    )
    assert api["api"].done_calls == [("b1", "e1", True)]
    assert hass.states.get(todo).state == "0"


async def test_sign_word_service_and_new_word_event(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    events = async_capture_events(hass, EVENT_NEW_WORD)
    await hass.services.async_call(DOMAIN, "sign_word", {"word_id": "11", "child_id": "c1"}, blocking=True)
    assert api["api"].signed == [("11", "c1")]
    api["api"].words_list.append({"id": 12, "title": "Photos", "text": "", "acknowledgments": []})
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()
    assert [e.data["id"] for e in events] == ["12"]
    assert events[0].data["child"] == "Alice"


async def test_failed_section_keeps_previous(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    api["api"].news_fails = True
    await entry.runtime_data.async_refresh()
    news = hass.states.get(_entity(hass, "sensor", "news"))
    assert news.state == "1"
    assert news.attributes["stale"] == ["news"]


async def test_diagnostics_has_no_names(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    diag = await async_get_config_entry_diagnostics(hass, entry)
    text = str(diag)
    assert "Alice" not in text and "secret" not in text and "Martin" not in text
    assert diag["data"]["words"] == 1


async def test_config_flow(hass: HomeAssistant, api) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] is FlowResultType.FORM
    bad = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: "ent.example.fr", CONF_USERNAME: "parent", CONF_PASSWORD: "nope"}
    )
    assert bad["errors"] == {"base": "invalid_auth"}
    with patch("custom_components.ent_one.async_setup_entry", return_value=True):
        ok = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_URL: "ent.example.fr", CONF_USERNAME: "parent", CONF_PASSWORD: "secret"}
        )
    assert ok["type"] is FlowResultType.CREATE_ENTRY
    assert ok["title"] == "ENT ONE · École Jules Ferry"
    assert ok["data"][CONF_URL] == URL
    assert ok["result"].unique_id == "ent.example.fr_u1"


async def test_settings_websocket(hass: HomeAssistant, api, entry, hass_ws_client) -> None:
    await _setup(hass, entry)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "ent_one/settings"})
    msg = await client.receive_json()
    assert msg["result"]["accounts"][0]["options"]["scan_interval"] == 30
    await client.send_json(
        {"id": 2, "type": "ent_one/settings/update", "entry_id": entry.entry_id, "options": {"show_panel": False}}
    )
    msg = await client.receive_json()
    assert msg["success"]
    await hass.async_block_till_done()
    assert PANEL_URL_PATH not in hass.data[frontend.DATA_PANELS]


def _secrets(hass: HomeAssistant, text: str) -> None:
    with open(hass.config.path("secrets.yaml"), "w", encoding="utf-8") as f:
        f.write(text)


async def test_config_flow_with_secret(hass: HomeAssistant, api) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    both = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {CONF_URL: URL, CONF_USERNAME: "parent", CONF_PASSWORD: "secret", "password_secret": "ent_one_password"},
    )
    assert both["errors"] == {"base": "password_or_secret"}
    missing = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: URL, CONF_USERNAME: "parent", "password_secret": "ent_one_password"}
    )
    assert missing["errors"] == {"base": "secret_not_found"}
    await hass.async_add_executor_job(_secrets, hass, "ent_one_password: secret\n")
    with patch("custom_components.ent_one.async_setup_entry", return_value=True):
        ok = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_URL: URL, CONF_USERNAME: "parent", "password_secret": "!secret ent_one_password"}
        )
    assert ok["type"] is FlowResultType.CREATE_ENTRY
    assert ok["data"] == {CONF_URL: URL, CONF_USERNAME: "parent", "password_secret": "ent_one_password"}


async def test_secret_read_again_at_each_update(hass: HomeAssistant, api) -> None:
    """A refused password stops the account until the secret is edited; the next update then works alone."""
    await hass.async_add_executor_job(_secrets, hass, "ent_one_password: secret\n")
    entry = MockConfigEntry(
        domain=DOMAIN,
        data={CONF_URL: URL, CONF_USERNAME: "parent", "password_secret": "ent_one_password"},
        unique_id="ent.example.fr_u1",
    )
    entry.add_to_hass(hass)
    await _setup(hass, entry)
    assert entry.state is ConfigEntryState.LOADED
    coordinator = entry.runtime_data
    await hass.async_add_executor_job(_secrets, hass, "ent_one_password: old\n")
    await coordinator.async_refresh()
    await hass.async_block_till_done()
    assert not coordinator.last_update_success
    flows = hass.config_entries.flow.async_progress_by_handler(DOMAIN)
    assert [f["step_id"] for f in flows] == ["reauth_secret"]
    await hass.async_add_executor_job(_secrets, hass, "ent_one_password: secret\n")
    await coordinator.async_refresh()
    await hass.async_block_till_done()
    assert coordinator.last_update_success
    assert hass.config_entries.flow.async_progress_by_handler(DOMAIN) == []


async def test_reconfigure_switches_to_a_secret(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    await hass.async_add_executor_job(_secrets, hass, "ent_pw: secret\n")
    result = await entry.start_reconfigure_flow(hass)
    done = await hass.config_entries.flow.async_configure(result["flow_id"], {"password_secret": "ent_pw"})
    # The update listener reloads the entry: let the reload finish before the test ends.
    await hass.async_block_till_done()
    assert done["reason"] == "reconfigure_successful"
    assert entry.state is ConfigEntryState.LOADED
    assert CONF_PASSWORD not in entry.data
    assert entry.data["password_secret"] == "ent_pw"
