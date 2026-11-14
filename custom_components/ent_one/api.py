"""Async client for ENT ONE, the Edifice-based digital workspace of primary schools.

The ENT has no public API: this client calls the internal routes its web application uses, as
https://github.com/edouard-claude/ent1-mcp does (form login, session cookie, X-XSRF-TOKEN header on
writes, one silent re-login when the session expires).
"""

from __future__ import annotations

import asyncio
import json as jsonlib
import re
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urljoin, urlsplit

import aiohttp
from yarl import URL

TIMEOUT = aiohttp.ClientTimeout(total=60, connect=10)

XSRF_COOKIE = "XSRF-TOKEN"
XSRF_HEADER = "X-XSRF-TOKEN"

# Words in a login redirect meaning the ENT wants something done in a browser first.
ACTION_MARKERS = ("revalidate", "cgu", "mfa", "otp", "activation", "reset", "changePassword", "validate")
# Path fragments of an authentication page, on the ENT or on an SSO elsewhere.
AUTH_MARKERS = ("/auth", "login", "/cas", "/sso", "oauth", "saml")

_SAFE_SEGMENT = re.compile(r"^[A-Za-z0-9_-]+$")


class EntError(Exception):
    """Generic ENT error."""


class EntAuthError(EntError):
    """The ENT refused the credentials. Never retried on its own, so the account is not locked."""


class EntActionRequiredError(EntError):
    """The ENT wants an action in a browser (new terms, password change, two-factor)."""


def segment(value: Any) -> str:
    """An id placed in a URL path: refused if it could leave its segment."""
    text = str(value)
    if not _SAFE_SEGMENT.match(text):
        raise EntError(f"Invalid identifier: {text!r}")
    return text


def normalize_url(url: str) -> str:
    """https://host of the ENT, from whatever the user typed."""
    url = url.strip()
    if "://" not in url:
        url = f"https://{url}"
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.netloc:
        raise EntError(f"Invalid ENT address: {url}")
    return f"{parts.scheme}://{parts.netloc}"


class _TextExtractor(HTMLParser):
    BLOCKS = frozenset({"p", "div", "br", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "table"})

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.BLOCKS:
            self.parts.append("\n")
        if tag == "li":
            self.parts.append("• ")

    def handle_endtag(self, tag: str) -> None:
        if tag in self.BLOCKS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def html_to_text(html: str | None) -> str:
    """The ENT stores messages, words and homework as HTML: plain text for the attributes and the card."""
    if not html:
        return ""
    parser = _TextExtractor()
    try:
        parser.feed(html)
        parser.close()
        text = "".join(parser.parts)
    except Exception:  # noqa: BLE001 - malformed HTML must never break an update
        text = re.sub(r"<[^>]+>", " ", html)
    lines = [re.sub(r"[ \t ]+", " ", line).strip() for line in text.splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


class EntApi:
    """One ENT account. The session must have its own cookie jar (never Home Assistant's shared one)."""

    def __init__(self, session: aiohttp.ClientSession, url: str, username: str, password: str) -> None:
        self._session = session
        self._base = normalize_url(url)
        self._username = username
        self._password = password
        # Serializes logins: ten requests finding the session expired trigger a single login.
        self._login_lock = asyncio.Lock()
        self._generation = 0
        # Set once the ENT refused the credentials: no automatic retry until new ones (reauth).
        self._refused = False

    def update_credentials(self, username: str, password: str) -> None:
        """New credentials (secret edited in secrets.yaml): logging in is allowed again after a refusal."""
        if (username, password) != (self._username, self._password):
            self._username, self._password = username, password
            self._refused = False

    @property
    def base_url(self) -> str:
        return self._base

    def _url(self, path: str) -> str:
        return urljoin(self._base + "/", path.lstrip("/"))

    def _xsrf(self) -> str | None:
        cookie = self._session.cookie_jar.filter_cookies(URL(self._base)).get(XSRF_COOKIE)
        return cookie.value if cookie else None

    async def login(self) -> None:
        """Open a session. Raises EntAuthError on refused credentials."""
        await self._relogin(self._generation)

    async def _relogin(self, seen: int) -> None:
        async with self._login_lock:
            if self._generation != seen:
                return  # Another request logged in meanwhile.
            if self._refused:
                raise EntAuthError("The ENT refused the credentials")
            form = {"email": self._username, "password": self._password, "callBack": "", "details": ""}
            try:
                async with self._session.post(
                    self._url("/auth/login"), data=form, allow_redirects=False, timeout=TIMEOUT
                ) as resp:
                    status, location = resp.status, resp.headers.get("Location", "")
                if 300 <= status < 400:
                    if "/auth/login" in location:
                        self._refused = True
                        raise EntAuthError("The ENT refused the credentials")
                    if any(marker in location for marker in ACTION_MARKERS):
                        raise EntActionRequiredError(f"The ENT asks for an action in a browser: {location}")
                elif status == 200:
                    # The login page again, with an error message.
                    self._refused = True
                    raise EntAuthError("The ENT refused the credentials")
                else:
                    raise EntError(f"Login failed (HTTP {status})")
                if self._xsrf() is None:
                    # The anti-CSRF cookie is set by the first page rendered.
                    async with self._session.get(
                        self._url("/timeline/timeline"), allow_redirects=False, timeout=TIMEOUT
                    ) as resp:
                        await resp.read()
            except TimeoutError as err:
                raise EntError("Timeout while logging in to the ENT") from err
            except aiohttp.ClientError as err:
                raise EntError(f"Cannot reach the ENT: {err}") from err
            self._generation += 1

    def _session_lost(self, status: int, location: str | None, read: bool) -> bool:
        """401, or a redirect that doesn't serve content.

        On a read, any redirect to the ENT itself (an API never redirects to another of its pages while the
        session holds) or to an authentication page. On a write, only a 401 or an authentication page: the
        redirect following a successful POST must not replay it.
        """
        if status == 401:
            return True
        if not 300 <= status < 400:
            return False
        if not location:
            return read
        target = urlsplit(urljoin(self._base + "/", location))
        auth = any(marker in target.path.lower() for marker in AUTH_MARKERS)
        return auth or (read and target.netloc == urlsplit(self._base).netloc)

    async def _request(self, method: str, path: str, *, params: Any = None, json: Any = None) -> Any:
        read = method in ("GET", "HEAD")
        for attempt in range(2):
            generation = self._generation
            if generation == 0:
                await self._relogin(generation)
                generation = self._generation
            headers = {"Accept": "application/json"}
            if not read and (token := self._xsrf()):
                headers[XSRF_HEADER] = token
            try:
                async with self._session.request(
                    method,
                    self._url(path),
                    params=params,
                    json=json,
                    headers=headers,
                    allow_redirects=False,
                    timeout=TIMEOUT,
                ) as resp:
                    if self._session_lost(resp.status, resp.headers.get("Location"), read):
                        if attempt:
                            raise EntError(f"Session expired again on {path}")
                        await self._relogin(generation)
                        continue
                    if resp.status >= 400 or (read and resp.status >= 300):
                        raise EntError(f"HTTP {resp.status} on {path}")
                    body = await resp.read()
            except TimeoutError as err:
                raise EntError(f"Timeout on {path}") from err
            except aiohttp.ClientError as err:
                raise EntError(f"Cannot reach the ENT: {err}") from err
            # Some write routes answer an empty body.
            if not body.strip():
                return None
            try:
                return jsonlib.loads(body)
            except ValueError as err:
                raise EntError(f"Invalid answer on {path}") from err
        raise EntError(f"Session expired on {path}")

    async def _get_list(self, path: str, params: Any = None) -> list[dict[str, Any]]:
        data = await self._request("GET", path, params=params)
        return [item for item in data if isinstance(item, dict)] if isinstance(data, list) else []

    # Account

    async def user_info(self) -> dict[str, Any]:
        data = await self._request("GET", "/auth/oauth2/userinfo")
        if not isinstance(data, dict) or not data.get("userId"):
            raise EntError("Unexpected user info")
        return data

    # Messaging

    async def unread_count(self) -> int:
        data = await self._request("GET", "/conversation/api/count/inbox", params={"unread": "true"})
        return int(data.get("count") or 0) if isinstance(data, dict) else 0

    async def inbox(self, size: int) -> list[dict[str, Any]]:
        return await self._get_list("/conversation/api/folders/inbox/messages", {"page": "0", "page_size": str(size)})

    # Liaison book (schoolbook)

    async def words(self, child_id: str) -> list[dict[str, Any]]:
        return await self._get_list(f"/schoolbook/list/0/{segment(child_id)}")

    async def sign_word(self, word_id: Any, child_id: str) -> None:
        await self._request("POST", f"/schoolbook/relation/acknowledge/{segment(word_id)}/{segment(child_id)}")

    # Homework notebooks

    async def homework_books(self) -> list[dict[str, Any]]:
        return await self._get_list("/homeworks/list")

    async def homework_book(self, book_id: str) -> dict[str, Any]:
        data = await self._request("GET", f"/homeworks/get/{segment(book_id)}")
        return data if isinstance(data, dict) else {}

    async def homework_done(self, book_id: str) -> set[str]:
        statuses = await self._get_list(f"/homeworks/{segment(book_id)}/entry/status")
        return {str(s.get("entryId")) for s in statuses if s.get("finished") and s.get("entryId")}

    async def set_homework_done(self, book_id: str, entry_id: str, done: bool) -> None:
        await self._request(
            "PUT", f"/homeworks/{segment(book_id)}/entry/status", json={"entryid": entry_id, "finished": done}
        )

    # News and calendars

    async def news(self, size: int) -> list[dict[str, Any]]:
        return await self._get_list("/actualites/api/v1/infos", {"page": "0", "pageSize": str(size)})

    async def calendars(self) -> list[dict[str, Any]]:
        return await self._get_list("/calendar/calendars")

    async def calendar_events(self, calendar_id: str) -> list[dict[str, Any]]:
        return await self._get_list(f"/calendar/{segment(calendar_id)}/events")
