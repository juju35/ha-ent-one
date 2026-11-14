"""Tests of the ENT ONE integration with a patched client."""

from __future__ import annotations

from datetime import timedelta
from typing import Any
from unittest.mock import patch

import pytest
from homeassistant.components import frontend
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME
from homeassistant.core import Context, HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import Unauthorized
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_capture_events, async_fire_time_changed

from custom_components.ent_one.api import EntAuthError, EntError, EntUnavailableError
from custom_components.ent_one.const import DOMAIN, EVENT_NEW_WORD, PANEL_URL_PATH
from custom_components.ent_one.diagnostics import async_get_config_entry_diagnostics

URL = "https://ent.example.fr"


def _tomorrow() -> str:
    return (dt_util.now().date() + timedelta(days=1)).isoformat()


class FakeApi:
    """Stands for EntApi: same methods, canned answers."""

    def __init__(self, session: Any, url: str, username: str, password: str) -> None:
        self.base_url = url
        self.username = username
        self.password = password
        self.signed: list[tuple[str, str]] = []
        self.done_calls: list[tuple[str, str, bool]] = []
        self.words_list = [
            {
                "id": 11,
                "title": "Sortie au musée",
                "text": '<p>Merci de signer</p><a href="/workspace/document/d1">Autorisation.pdf</a>',
                "sending_date": "2026-11-10",
                "owner_name": "Mme Martin",
                "acknowledgments": [],
            }
        ]
        self.news_fails = False
        self.words_fail = False
        self.books = [{"_id": "b1", "title": "CE2 A"}]
        self.calls: dict[str, int] = {}
        self.blog_missing = False

    def update_credentials(self, username: str, password: str) -> None:
        self.username, self.password = username, password

    async def login(self) -> None:
        if self.password != "secret" or self.username != "parent":
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
        self.calls["unread"] = self.calls.get("unread", 0) + 1
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

    async def blogs(self) -> list[dict[str, Any]]:
        if self.blog_missing:
            raise EntUnavailableError("HTTP 404 on /blog/list/all")
        return [{"_id": "bl1", "title": "Blog du CE2", "thumbnail": "/workspace/document/th1?thumbnail=120x120"}]

    async def blog_posts(self, blog_id: str) -> list[dict[str, Any]]:
        return [
            {
                "_id": "p1",
                "title": "Sortie au parc",
                "content": '<p>Belle journée.</p><img src="/workspace/document/ph1" alt="Photo">',
                "author": {"username": "Mme Martin"},
                "firstPublishDate": {"$date": 1763200000000},
                "nbComments": 2,
            }
        ]

    async def words(self, child_id: str) -> list[dict[str, Any]]:
        if self.words_fail:
            raise EntError("HTTP 500 on /schoolbook")
        return list(self.words_list)

    async def message(self, message_id: str) -> dict[str, Any]:
        self.calls["message"] = self.calls.get("message", 0) + 1
        return {
            "id": message_id,
            "subject": "Piscine",
            "body": "<p>Bonnet obligatoire</p>",
            "attachments": [{"id": "a1", "filename": "liste.pdf", "size": 1200}],
        }

    async def download(self, path: str) -> tuple[bytes, str, str | None]:
        self.calls["download"] = self.calls.get("download", 0) + 1
        if path.endswith("page"):
            return b"<script>alert(1)</script>", "text/html", "page.html"
        if path.endswith("a2"):
            # The ENT often gives no name and no type: the signature and the card's name decide.
            return b"\x89PNG\r\n\x1a\n....", "application/octet-stream", None
        return b"%PDF-1.4", "application/pdf", "liste.pdf"

    async def sign_word(self, word_id: str, child_id: str) -> None:
        self.signed.append((word_id, child_id))

    async def homework_books(self) -> list[dict[str, Any]]:
        return list(self.books)

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
    assert words.attributes["words"][0]["text"].startswith("Merci de signer")
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
    # The reload keeps the panel for a moment (an open panel must not jump to the home page), then removes it.
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=11))
    await hass.async_block_till_done()
    assert PANEL_URL_PATH not in hass.data[frontend.DATA_PANELS]


async def test_reload_keeps_the_panel(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    removed = []
    with patch.object(frontend, "async_remove_panel", side_effect=lambda *a, **k: removed.append(a)):
        await hass.config_entries.async_reload(entry.entry_id)
        await hass.async_block_till_done()
        async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=11))
        await hass.async_block_till_done()
    assert removed == []
    assert PANEL_URL_PATH in hass.data[frontend.DATA_PANELS]


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


async def test_username_and_password_from_secrets(hass: HomeAssistant, api) -> None:
    await hass.async_add_executor_job(_secrets, hass, "ent_user: parent\nent_pw: secret\n")
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    none = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: URL, "password_secret": "ent_pw"}
    )
    assert none["errors"] == {"base": "username_or_secret"}
    ok = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: URL, "username_secret": "ent_user", "password_secret": "ent_pw"}
    )
    await hass.async_block_till_done()
    assert ok["data"] == {CONF_URL: URL, "username_secret": "ent_user", "password_secret": "ent_pw"}
    entry = ok["result"]
    assert entry.state is ConfigEntryState.LOADED
    assert api["api"].username == "parent"


async def test_sign_word_is_admin_only(hass: HomeAssistant, api, entry, hass_read_only_user) -> None:
    await _setup(hass, entry)
    with pytest.raises(Unauthorized):
        await hass.services.async_call(
            DOMAIN,
            "sign_word",
            {"word_id": "11", "child_id": "c1"},
            blocking=True,
            context=Context(user_id=hass_read_only_user.id),
        )
    assert api["api"].signed == []


async def test_no_event_burst_after_a_first_failed_read(hass: HomeAssistant, entry) -> None:
    """A section failing at startup records what is there at its first good read instead of firing it all."""
    holder: dict[str, FakeApi] = {}

    def factory(*args: Any) -> FakeApi:
        holder["api"] = FakeApi(*args)
        holder["api"].words_fail = True
        return holder["api"]

    with patch("custom_components.ent_one.EntApi", side_effect=factory):
        await _setup(hass, entry)
    events = async_capture_events(hass, EVENT_NEW_WORD)
    holder["api"].words_fail = False
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()
    assert events == []
    holder["api"].words_list.append({"id": 12, "title": "Photos", "text": "", "acknowledgments": []})
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()
    assert [e.data["id"] for e in events] == ["12"]


async def test_marking_done_does_not_touch_written_states(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    sensor = _entity(hass, "sensor", "homework")
    before = hass.states.get(sensor)
    await entry.runtime_data.async_set_homework_done("b1", "e1", True)
    assert before.attributes["homework"][0]["done"] is False
    assert hass.states.get(sensor).attributes["homework"][0]["done"] is True


async def test_settings_update_checks_types(hass: HomeAssistant, api, entry, hass_ws_client) -> None:
    await _setup(hass, entry)
    client = await hass_ws_client(hass)
    await client.send_json(
        {"id": 1, "type": "ent_one/settings/update", "entry_id": entry.entry_id, "options": {"notify_services": "x"}}
    )
    msg = await client.receive_json()
    assert not msg["success"]
    assert msg["error"]["code"] == "invalid_format"


async def test_list_of_a_removed_notebook_goes(hass: HomeAssistant, api, entry) -> None:
    from homeassistant.helpers import entity_registry as er

    api_books = [{"_id": "b1", "title": "CE2 A"}, {"_id": "b9", "title": "Old"}]

    def factory(*args: Any) -> FakeApi:
        fake = FakeApi(*args)
        fake.books = list(api_books)
        api["api"] = fake
        return fake

    with patch("custom_components.ent_one.EntApi", side_effect=factory):
        await _setup(hass, entry)
    registry = er.async_get(hass)
    assert registry.async_get_entity_id("todo", DOMAIN, f"{entry.entry_id}_homework_b9")
    api["api"].books = [{"_id": "b1", "title": "CE2 A"}]
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()
    assert registry.async_get_entity_id("todo", DOMAIN, f"{entry.entry_id}_homework_b9") is None
    assert registry.async_get_entity_id("todo", DOMAIN, f"{entry.entry_id}_homework_b1")


def test_all_day_end() -> None:
    from datetime import date

    from custom_components.ent_one.calendar import school_event

    midnight = school_event(
        {"id": "x", "title": "Trip", "all_day": True, "start": "2026-12-19T00:00:00", "end": "2026-12-20T00:00:00"}
    )
    assert (midnight.start, midnight.end) == (date(2026, 12, 19), date(2026, 12, 20))
    late = school_event(
        {"id": "y", "title": "Trip", "all_day": True, "start": "2026-12-19T00:00:00", "end": "2026-12-19T23:59:00"}
    )
    assert (late.start, late.end) == (date(2026, 12, 19), date(2026, 12, 20))
    days = school_event({"id": "z", "title": "Holidays", "all_day": True, "start": "2026-12-19", "end": "2027-01-03"})
    assert (days.start, days.end) == (date(2026, 12, 19), date(2027, 1, 4))


async def test_panel_uses_the_panda_icon_set(hass: HomeAssistant, api, entry, stub_frontend) -> None:
    await _setup(hass, entry)
    assert hass.data[frontend.DATA_PANELS][PANEL_URL_PATH].sidebar_icon == "ent_one:panda"
    assert any("/ent_one_static/ent-one-icons.js?v=" in str(c.args[1]) for c in stub_frontend.call_args_list)


async def test_word_attachments_in_attributes(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    word = hass.states.get(_entity(hass, "sensor", "words_to_sign")).attributes["words"][0]
    assert word["attachments"] == [{"path": "/workspace/document/d1", "name": "Autorisation.pdf", "kind": "file"}]


async def test_message_websocket(hass: HomeAssistant, api, entry, hass_ws_client) -> None:
    await _setup(hass, entry)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "ent_one/message", "config_entry_id": entry.entry_id, "message_id": "m1"})
    msg = await client.receive_json()
    assert msg["result"]["text"] == "Bonnet obligatoire"
    assert msg["result"]["attachments"] == [
        {"path": "/conversation/message/m1/attachment/a1", "name": "liste.pdf", "size": 1200, "kind": "file"}
    ]


async def test_file_view(hass: HomeAssistant, api, entry, hass_client) -> None:
    await _setup(hass, entry)
    client = await hass_client()
    ok = await client.get(
        f"/api/ent_one/file/{entry.entry_id}", params={"path": "/conversation/message/m1/attachment/a1"}
    )
    assert ok.status == 200
    assert ok.headers["Content-Type"] == "application/pdf"
    assert ok.headers["Content-Disposition"].startswith("inline;")
    # Browsers refuse to draw a sandboxed PDF.
    assert "Content-Security-Policy" not in ok.headers
    image = await client.get(
        f"/api/ent_one/file/{entry.entry_id}",
        params={"path": "/conversation/message/m1/attachment/a2", "name": "Pool.jpg"},
    )
    assert image.headers["Content-Type"] == "image/png"
    assert image.headers["Content-Disposition"] == "inline; filename*=UTF-8''Pool.jpg"
    assert "sandbox" in image.headers["Content-Security-Policy"]
    # HTML is never served as such from Home Assistant's origin.
    html = await client.get(f"/api/ent_one/file/{entry.entry_id}", params={"path": "/workspace/document/page"})
    assert html.headers["Content-Type"] == "application/octet-stream"
    assert html.headers["Content-Disposition"].startswith("attachment;")
    assert "sandbox" in html.headers["Content-Security-Policy"]
    refused = await client.get(f"/api/ent_one/file/{entry.entry_id}", params={"path": "/auth/logout"})
    assert refused.status == 400


def test_sniff_type() -> None:
    from custom_components.ent_one import file_name, sniff_type

    assert sniff_type(b"%PDF-1.7", "application/octet-stream", "x") == "application/pdf"
    assert sniff_type(b"\xff\xd8\xff\xe0", "", "x") == "image/jpeg"
    assert sniff_type(b"RIFF\0\0\0\0WEBPVP8", "application/octet-stream", "x") == "image/webp"
    assert sniff_type(b"<html>", "text/html; charset=utf-8", "x.pdf") == "text/html"
    assert sniff_type(b"hello", "application/octet-stream", "notes.txt") == "text/plain"
    assert sniff_type(b"not a pdf", "application/octet-stream", "fake.pdf") == "application/octet-stream"
    assert file_name(None, 'a"b/c.pdf', "/workspace/document/d1") == "abc.pdf"
    assert file_name("", "", "/workspace/document/d1?thumbnail=1") == "d1"
    # An undecodable character never reaches the header (it made the view fail).
    assert file_name("agr\udce9ment.pdf", "", "/x") == "agrment.pdf"
    assert file_name("affiche.png", "d2", "/workspace/document/d2") == "affiche.png"


async def test_message_read_once_and_marked_read(hass: HomeAssistant, api, entry, hass_ws_client) -> None:
    """Opening a message marks it read in the list at once, without reading the whole ENT; a second look is cached."""
    await _setup(hass, entry)
    coordinator = entry.runtime_data
    reads = coordinator.api.calls.get("unread", 0)
    client = await hass_ws_client(hass)
    for i in (1, 2):
        await client.send_json(
            {"id": i, "type": "ent_one/message", "config_entry_id": entry.entry_id, "message_id": "m1"}
        )
        assert (await client.receive_json())["success"]
    await hass.async_block_till_done()
    assert coordinator.api.calls["message"] == 1
    assert coordinator.api.calls.get("unread", 0) == reads
    assert hass.states.get(_entity(hass, "sensor", "unread_messages")).state == "1"


async def test_files_cached(hass: HomeAssistant, api, entry, hass_client) -> None:
    await _setup(hass, entry)
    client = await hass_client()
    for _ in range(3):
        resp = await client.get(f"/api/ent_one/file/{entry.entry_id}", params={"path": "/workspace/document/d1"})
        assert resp.status == 200
    assert entry.runtime_data.api.calls["download"] == 1


async def test_blog(hass: HomeAssistant, api, entry) -> None:
    await _setup(hass, entry)
    state = hass.states.get(_entity(hass, "sensor", "blog"))
    assert state.state == "1"
    post = state.attributes["blog"][0]
    assert post["blog"] == "Blog du CE2"
    assert post["text"] == "Belle journée."
    assert post["attachments"] == [{"path": "/workspace/document/ph1", "name": "Photo", "kind": "image"}]
    assert post["author"] == "Mme Martin"
    assert post["comments"] == 2
    assert post["blog_thumbnail"] == "/workspace/document/th1?thumbnail=120x120"
    # An ENT without a blog: an empty section, not "partly updated".
    entry.runtime_data.api.blog_missing = True
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()
    state = hass.states.get(_entity(hass, "sensor", "blog"))
    assert state.state == "0"
    assert "blog" not in state.attributes["stale"]


async def test_new_blog_post_event(hass: HomeAssistant, api, entry) -> None:
    """A post seen for the first time fires ent_one_new_blog_post; the posts there at startup do not."""
    events = []
    hass.bus.async_listen("ent_one_new_blog_post", events.append)
    await _setup(hass, entry)
    assert events == []
    fake = entry.runtime_data.api
    original = fake.blog_posts

    async def more(blog_id: str) -> list[dict]:
        return [{"_id": "p2", "title": "Chorale", "author": {"username": "M. Bernard"}}, *await original(blog_id)]

    fake.blog_posts = more
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()
    assert [e.data["id"] for e in events] == ["p2"]
    assert events[0].data["blog"] == "Blog du CE2"
    assert events[0].data["author"] == "M. Bernard"
