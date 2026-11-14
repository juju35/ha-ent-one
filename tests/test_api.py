"""Tests of the ENT client against a small fake ENT (form login, session cookie, XSRF, redirects)."""

from __future__ import annotations

import aiohttp
import pytest
from aiohttp import web
from aiohttp.test_utils import TestServer

from custom_components.ent_one.api import (
    EntActionRequiredError,
    EntApi,
    EntAuthError,
    EntError,
    file_path,
    html_files,
    html_to_text,
    normalize_url,
    segment,
)


class FakeEnt:
    """Just enough of an Edifice ENT: sessions can be dropped to test the silent re-login."""

    def __init__(self) -> None:
        self.logins = 0
        self.sessions: set[str] = set()
        self.password = "secret"
        self.action: str | None = None
        self.writes: list[dict] = []

    def app(self) -> web.Application:
        app = web.Application()
        app.router.add_post("/auth/login", self.login)
        app.router.add_get("/timeline/timeline", self.timeline)
        app.router.add_get("/auth/oauth2/userinfo", self.userinfo)
        app.router.add_put("/homeworks/{book}/entry/status", self.status)
        app.router.add_get("/workspace/document/{doc}", self.document)
        return app

    async def login(self, request: web.Request) -> web.StreamResponse:
        form = await request.post()
        self.logins += 1
        if form.get("password") != self.password:
            raise web.HTTPFound("/auth/login?error=auth.notfound")
        if self.action:
            raise web.HTTPFound(self.action)
        token = f"s{self.logins}"
        self.sessions.add(token)
        resp = web.HTTPFound("/timeline/timeline")
        resp.set_cookie("oneSessionId", token)
        raise resp

    async def timeline(self, request: web.Request) -> web.StreamResponse:
        resp = web.Response(text="<html></html>")
        resp.set_cookie("XSRF-TOKEN", "xsrf-value")
        return resp

    def _check(self, request: web.Request) -> None:
        if request.cookies.get("oneSessionId") not in self.sessions:
            raise web.HTTPFound("/auth/login?callback=%2F")

    async def userinfo(self, request: web.Request) -> web.StreamResponse:
        self._check(request)
        return web.json_response({"userId": "u1", "username": "Parent", "children": {}})

    async def document(self, request: web.Request) -> web.StreamResponse:
        self._check(request)
        return web.Response(
            body=b"%PDF-1.4",
            content_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="sortie.pdf"'},
        )

    async def status(self, request: web.Request) -> web.StreamResponse:
        self._check(request)
        if request.headers.get("X-XSRF-TOKEN") != "xsrf-value":
            raise web.HTTPForbidden()
        self.writes.append(await request.json())
        return web.Response(text="")


@pytest.fixture
async def ent(socket_enabled):
    fake = FakeEnt()
    server = TestServer(fake.app())
    await server.start_server()
    session = aiohttp.ClientSession(cookie_jar=aiohttp.CookieJar(unsafe=True))
    yield fake, session, str(server.make_url("/")).rstrip("/")
    await session.close()
    await server.close()


async def test_login_and_read(ent) -> None:
    fake, session, url = ent
    api = EntApi(session, url, "parent", "secret")
    assert (await api.user_info())["userId"] == "u1"
    assert fake.logins == 1


async def test_silent_relogin_when_session_dropped(ent) -> None:
    fake, session, url = ent
    api = EntApi(session, url, "parent", "secret")
    await api.user_info()
    fake.sessions.clear()
    assert (await api.user_info())["userId"] == "u1"
    assert fake.logins == 2


async def test_refused_credentials_never_retried(ent) -> None:
    fake, session, url = ent
    api = EntApi(session, url, "parent", "wrong")
    with pytest.raises(EntAuthError):
        await api.user_info()
    with pytest.raises(EntAuthError):
        await api.user_info()
    assert fake.logins == 1


async def test_action_required(ent) -> None:
    fake, session, url = ent
    fake.action = "/auth/revalidate-terms"
    api = EntApi(session, url, "parent", "secret")
    with pytest.raises(EntActionRequiredError):
        await api.login()


async def test_write_sends_xsrf(ent) -> None:
    fake, session, url = ent
    api = EntApi(session, url, "parent", "secret")
    await api.set_homework_done("book1", "e1", True)
    assert fake.writes == [{"entryid": "e1", "finished": True}]


def test_helpers() -> None:
    assert (
        html_to_text("<p>Bonjour&nbsp;<b>Léa</b></p><ul><li>un</li><li>deux</li></ul>")
        == "Bonjour Léa\n\n• un\n\n• deux"
    )
    assert html_to_text(None) == ""
    assert normalize_url("ent1d.ac-reunion.fr/auth/login") == "https://ent1d.ac-reunion.fr"
    assert segment("abc-123_X") == "abc-123_X"
    with pytest.raises(EntError):
        segment("../auth/logout")


async def test_download_relogs_and_names_the_file(ent) -> None:
    fake, session, url = ent
    api = EntApi(session, url, "parent", "secret")
    await api.login()
    fake.sessions.clear()
    body, kind, name = await api.download("/workspace/document/abc-1")
    assert (body, kind, name) == (b"%PDF-1.4", "application/pdf", "sortie.pdf")
    assert fake.logins == 2


def test_file_paths_and_attachments() -> None:
    assert file_path("/workspace/document/abc?thumbnail=120x120") == "/workspace/document/abc?thumbnail=120x120"
    for bad in ("/auth/logout", "/workspace/document/../../auth", "//evil.com/workspace/document/x", "https://x/y", ""):
        with pytest.raises(EntError):
            file_path(bad)
    html = (
        '<p>Voir <a href="/workspace/document/d1">Sortie.pdf</a> et '
        '<a href="https://ent.example.fr/workspace/document/d2" title="Menu">ici</a>, '
        '<img src="/workspace/document/d3?thumbnail=1" alt="Photo"> '
        '<a href="https://autre.site/x">ailleurs</a> <a href="/auth/logout">piège</a></p>'
    )
    assert html_files(html, "https://ent.example.fr") == [
        {"path": "/workspace/document/d1", "name": "Sortie.pdf", "kind": "file"},
        {"path": "/workspace/document/d2", "name": "Menu", "kind": "file"},
        {"path": "/workspace/document/d3?thumbnail=1", "name": "Photo", "kind": "image"},
    ]
