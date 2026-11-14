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
from urllib.parse import unquote, urljoin, urlsplit

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
# Files the integration may fetch for the user: documents and attachments of the ENT's applications only.
FILE_PREFIXES = (
    "/workspace/document/",
    "/workspace/pub/document/",
    "/conversation/message/",
    "/schoolbook/",
    "/homeworks/",
    "/actualites/",
    "/blog/",
)
_SAFE_PATH = re.compile(r"^/[A-Za-z0-9/_.~%-]+(\?[A-Za-z0-9_.~%=&-]*)?$")
# Largest file streamed through Home Assistant.
MAX_FILE_SIZE = 25 * 1024 * 1024
# Requests sent to the ENT at the same time.
MAX_PARALLEL = 4


class EntError(Exception):
    """Generic ENT error."""


class EntUnavailableError(EntError):
    """An application this ENT does not have, or that the account may not open (HTTP 403 or 404)."""


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


def file_path(path: str) -> str:
    """An ENT file path the integration may fetch, or EntError: no other route, no other host, no way out."""
    if not _SAFE_PATH.match(path or "") or ".." in path or "//" in path or not path.startswith(FILE_PREFIXES):
        raise EntError(f"Not an ENT file: {path!r}")
    return path


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


class _LinkExtractor(HTMLParser):
    """Links and images of an ENT text: the attachments of a word, a homework or a news item."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.files: list[dict[str, str]] = []
        self._link: dict[str, str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k: v or "" for k, v in attrs}
        if tag == "a" and a.get("href"):
            self._link = {"path": a["href"], "name": a.get("title") or a.get("download") or ""}
        elif tag == "img" and a.get("src"):
            self.files.append({"path": a["src"], "name": a.get("alt") or a.get("title") or "", "kind": "image"})

    def handle_data(self, data: str) -> None:
        if self._link is not None and not self._link["name"]:
            self._link["name"] = data.strip()

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._link is not None:
            self.files.append({**self._link, "kind": "file"})
            self._link = None


def disposition_name(header: str) -> str | None:
    """File name of a Content-Disposition header. The ENT writes accented names as raw bytes (UTF-8 or Latin-1),
    which reach us as undecodable characters: they are decoded again here."""
    star = re.search(r"filename\*\s*=\s*[\w-]*'[\w-]*'([^;]+)", header)
    if star:
        return unquote(star.group(1).strip().strip('"')) or None
    plain = re.search(r'filename\s*=\s*"?([^";]+)"?', header)
    if not plain:
        return None
    raw = plain.group(1).strip().encode("utf-8", "surrogateescape")
    try:
        name = raw.decode("utf-8")
    except UnicodeDecodeError:
        name = raw.decode("latin-1")
    return unquote(name) or None


def html_files(html: str | None, base_url: str) -> list[dict[str, str]]:
    """ENT files linked or shown in a text: [{path, name, kind}], only paths the integration may fetch."""
    if not html:
        return []
    parser = _LinkExtractor()
    try:
        parser.feed(html)
        parser.close()
    except Exception:  # noqa: BLE001 - malformed HTML must never break an update
        return []
    host = urlsplit(base_url).netloc
    files: list[dict[str, str]] = []
    seen: set[str] = set()
    for f in parser.files:
        parts = urlsplit(f["path"])
        if parts.netloc and parts.netloc != host:
            continue
        path = parts.path + (f"?{parts.query}" if parts.query else "")
        try:
            file_path(path)
        except EntError:
            continue
        if path in seen:
            continue
        seen.add(path)
        name = f["name"] or path.rstrip("/").rsplit("/", 1)[-1]
        files.append({"path": path, "name": name[:120], "kind": f["kind"]})
    return files


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


_ATTACHMENTS_TITLE = re.compile(
    r"^(pi[eè]ces?[ -]jointes?|fichiers? joints?|attachments?|documents? joints?)\s*:?$", re.IGNORECASE
)


def without_file_names(text: str, files: list[dict[str, Any]]) -> str:
    """The text of a word, a homework or a message without the list of its attachments: the ENT's editor writes
    their names under a "Pièces jointes" title, and the card and the panel show the attachments themselves."""
    names = {str(f.get("name") or "").strip().lower() for f in files} - {""}
    if not names:
        return text
    kept = [line for line in text.split("\n") if line.strip().lower() not in names]
    if len(kept) == text.count("\n") + 1:
        return text
    kept = [line for line in kept if not _ATTACHMENTS_TITLE.match(line.strip())]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).strip()


def html_content(html: str | None, base_url: str) -> tuple[str, list[dict[str, str]]]:
    """Text and attachments of an ENT text, the attachments' names taken out of the text."""
    files = html_files(html, base_url)
    return without_file_names(html_to_text(html), files), files


class EntApi:
    """One ENT account. The session must have its own cookie jar (never Home Assistant's shared one)."""

    def __init__(self, session: aiohttp.ClientSession, url: str, username: str, password: str) -> None:
        self._session = session
        self._base = normalize_url(url)
        self._username = username
        self._password = password
        # Serializes logins: ten requests finding the session expired trigger a single login.
        self._login_lock = asyncio.Lock()
        # Requests run side by side (children, notebooks, calendars), a few at a time to spare the ENT.
        self._limit = asyncio.Semaphore(MAX_PARALLEL)
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
                async with (
                    self._limit,
                    self._session.request(
                        method,
                        self._url(path),
                        params=params,
                        json=json,
                        headers=headers,
                        allow_redirects=False,
                        timeout=TIMEOUT,
                    ) as resp,
                ):
                    if self._session_lost(resp.status, resp.headers.get("Location"), read):
                        if attempt:
                            raise EntError(f"Session expired again on {path}")
                        await self._relogin(generation)
                        continue
                    if resp.status in (403, 404):
                        raise EntUnavailableError(f"HTTP {resp.status} on {path}")
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

    async def message(self, message_id: str) -> dict[str, Any]:
        """A message in full (reading it marks it read in the ENT, as in its web page)."""
        data = await self._request("GET", f"/conversation/api/messages/{segment(message_id)}")
        return data if isinstance(data, dict) else {}

    async def download(self, path: str) -> tuple[bytes, str, str | None]:
        """Content, content type and file name of an ENT file (attachment, workspace document)."""
        path = file_path(path)
        for attempt in range(2):
            generation = self._generation
            if generation == 0:
                await self._relogin(generation)
                generation = self._generation
            try:
                # Files may be served from another host (storage): redirects are followed, cookies stay per host.
                async with (
                    self._limit,
                    self._session.get(self._url(path), timeout=TIMEOUT, allow_redirects=True) as resp,
                ):
                    landed = urlsplit(str(resp.url))
                    lost = resp.status == 401 or any(m in landed.path.lower() for m in AUTH_MARKERS)
                    if lost:
                        if attempt:
                            raise EntError(f"Session expired again on {path}")
                        await self._relogin(generation)
                        continue
                    if resp.status >= 400:
                        raise EntError(f"HTTP {resp.status} on {path}")
                    if (resp.content_length or 0) > MAX_FILE_SIZE:
                        raise EntError(f"File too large ({resp.content_length} bytes)")
                    # The whole body, chunk by chunk: content.read(n) returns what has arrived so far, which cut
                    # files short (a PDF without its end shows as a white page, an image as an empty frame).
                    chunks: list[bytes] = []
                    size = 0
                    async for chunk in resp.content.iter_chunked(64 * 1024):
                        size += len(chunk)
                        if size > MAX_FILE_SIZE:
                            raise EntError("File too large")
                        chunks.append(chunk)
                    body = b"".join(chunks)
                    return (
                        body,
                        resp.content_type or "application/octet-stream",
                        disposition_name(resp.headers.get("Content-Disposition", "")),
                    )
            except TimeoutError as err:
                raise EntError(f"Timeout on {path}") from err
            except aiohttp.ClientError as err:
                raise EntError(f"Cannot reach the ENT: {err}") from err
        raise EntError(f"Session expired on {path}")

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

    # Blogs (class and school blogs)

    async def blogs(self) -> list[dict[str, Any]]:
        return await self._get_list("/blog/list/all")

    async def blog_posts(self, blog_id: str) -> list[dict[str, Any]]:
        """Published posts of a blog, newest first, with their content."""
        return await self._get_list(
            f"/blog/post/list/all/{segment(blog_id)}",
            {"page": "0", "content": "true", "comments": "false", "nbComments": "true"},
        )

    async def calendars(self) -> list[dict[str, Any]]:
        return await self._get_list("/calendar/calendars")

    async def calendar_events(self, calendar_id: str) -> list[dict[str, Any]]:
        return await self._get_list(f"/calendar/{segment(calendar_id)}/events")
