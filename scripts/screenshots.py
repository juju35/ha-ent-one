"""Render the ENT ONE cards and panel with mock data and save the README screenshots.

Usage: python scripts/screenshots.py  (needs `pip install playwright pillow` and `playwright install chromium`;
CHROMIUM_PATH=/path/to/chrome to use another browser)
A screenshot is rewritten only when its decoded pixels change, so a re-render never commits identical images.
The clock is frozen on Monday 16 November 2026 in Paris, so relative days stay the same. Names are made up.
"""

import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "custom_components/ent_one/frontend"
CARD_JS = (FRONTEND / "ent-one-card.js").read_text()
PANEL_JS = (FRONTEND / "ent-one-panel.js").read_text()
# The panda pictogram of the sidebar entry, taken from the icon set so the mock sidebar shows the real icon.
PANDA = re.search(r"const PANDA = '([^']*)'", (FRONTEND / "ent-one-icons.js").read_text()).group(1)
NOW = "2026-11-16T09:00:00+01:00"
WIDTH = 460

THEMES = {
    "light": {
        "--primary-background-color": "#e8eaed",
        "--secondary-background-color": "#ececec",
        "--card-background-color": "#ffffff",
        "--primary-text-color": "#212121",
        "--secondary-text-color": "#727272",
        "--divider-color": "rgba(0,0,0,.12)",
    },
    "dark": {
        "--primary-background-color": "#111111",
        "--secondary-background-color": "#282828",
        "--card-background-color": "#1c1c1c",
        "--primary-text-color": "#e1e1e1",
        "--secondary-text-color": "#9b9b9b",
        "--divider-color": "rgba(225,225,225,.12)",
    },
}
COMMON = {
    "--primary-color": "#03a9f4",
    "--info-color": "#039be5",
    "--success-color": "#43a047",
    "--warning-color": "#ffa600",
    "--error-color": "#db4437",
    "--disabled-text-color": "#9e9e9e",
    "--text-primary-color": "#ffffff",
}

# Material Design Icons used by the cards and the panel (@mdi/js).
ICONS = {
    "image-outline": "M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z",
    "chevron-down": "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
    "close": "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
    "school-outline": "M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3M18.82 9L12 12.72L5.18 9L12 5.28L18.82 9M17 16L12 18.72L7 16V12.27L12 15L17 12.27V16Z",
    "email-outline": "M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6M20 6L12 11L4 6H20M20 18H4V8L12 13L20 8V18Z",
    "notebook-edit-outline": "M19.07 14.88L21.12 16.93L15.06 23H13V20.94L19.07 14.88M21.04 13.13C21.18 13.13 21.31 13.19 21.42 13.3L22.7 14.58C22.92 14.79 22.92 15.14 22.7 15.35L21.7 16.35L19.65 14.3L20.65 13.3C20.76 13.19 20.9 13.13 21.04 13.13M17 4V10L15 8L13 10V4H9V20H11V22H7C5.95 22 5 21.05 5 20V19H3V17H5V13H3V11H5V7H3V5H5V4C5 2.89 5.9 2 7 2H19C20.05 2 21 2.95 21 4V10L19 12V4H17M5 5V7H7V5H5M5 11V13H7V11H5M5 17V19H7V17H5Z",
    "pencil-outline": "M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z",
    "refresh": "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
    "open-in-new": "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z",
    "check-circle-outline": "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z",
    "checkbox-marked-outline": "M19,19H5V5H15V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V11H19M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z",
    "checkbox-blank-outline": "M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z",
    "email-open-outline": "M21.03 6.29L12 .64L2.97 6.29C2.39 6.64 2 7.27 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 7.27 21.61 6.64 21.03 6.29M20 18H4V10L12 15L20 10V18M12 13L4 8L12 3L20 8L12 13Z",
    "paperclip": "M16.5,6V17.5A4,4 0 0,1 12.5,21.5A4,4 0 0,1 8.5,17.5V5A2.5,2.5 0 0,1 11,2.5A2.5,2.5 0 0,1 13.5,5V15.5A1,1 0 0,1 12.5,16.5A1,1 0 0,1 11.5,15.5V6H10V15.5A2.5,2.5 0 0,0 12.5,18A2.5,2.5 0 0,0 15,15.5V5A4,4 0 0,0 11,1A4,4 0 0,0 7,5V17.5A5.5,5.5 0 0,0 12.5,23A5.5,5.5 0 0,0 18,17.5V6H16.5Z",
    "newspaper-variant-outline": "M20 5L20 19L4 19L4 5H20M20 3H4C2.89 3 2 3.89 2 5V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V5C22 3.89 21.11 3 20 3M18 15H6V17H18V15M10 7H6V13H10V7M12 9H18V7H12V9M18 11H12V13H18V11Z",
    "calendar-blank-outline": "M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.9 20.11 3 19 3M19 19H5V9H19V19M19 7H5V5H19V7Z",
    "arrow-expand": "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
    "arrow-collapse": "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
    "menu": "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z",
    "arrow-left": "M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z",
    "file-pdf-box": "M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9.5 11.5C9.5 12.3 8.8 13 8 13H7V15H5.5V9H8C8.8 9 9.5 9.7 9.5 10.5V11.5M14.5 13.5C14.5 14.3 13.8 15 13 15H10.5V9H13C13.8 9 14.5 9.7 14.5 10.5V13.5M18.5 10.5H17V11.5H18.5V13H17V15H15.5V9H18.5V10.5M12 10.5H13V13.5H12V10.5M7 10.5H8V11.5H7V10.5Z",
    "notebook-outline": "M19 2C20.11 2 21 2.9 21 4V20C21 21.11 20.11 22 19 22H7C5.89 22 5 21.11 5 20V19H3V17H5V13H3V11H5V7H3V5H5V4C5 2.89 5.89 2 7 2H19M19 20V4H7V5H9V7H7V11H9V13H7V17H9V19H7V20H19Z",
    "download": "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
    "post-outline": "M19 5V19H5V5H19M21 3H3V21H21V3M17 17H7V16H17V17M17 15H7V14H17V15M17 12H7V7H17V12Z",
    "comment-outline": "M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M10,16V19.08L13.08,16H20V4H4V16H10Z",
}

# Generic Material icons for the other rows of the mock Home Assistant sidebar.
SIDEBAR_ICONS = {
    "home": "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
    "cog": "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.98C19.47,12.66 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.66 4.57,12.98L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.98Z",
    "bell": "M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21H14Z",
}


def _sidebar_row(icon, label, *, active=False, badge=None, badge_color="var(--primary-color)"):
    text = "var(--primary-color)" if active else "var(--secondary-text-color)"
    bg = "background:rgba(3,169,244,.12);" if active else ""
    weight = "font-weight:500;" if active else ""
    badge_html = (
        f'<span style="min-width:18px;height:18px;box-sizing:border-box;padding:0 5px;display:inline-flex;'
        f"align-items:center;justify-content:center;border-radius:9px;font-size:11px;font-weight:500;line-height:1;"
        f'color:#fff;background:{badge_color};">{badge}</span>'
        if badge is not None
        else ""
    )
    return (
        f'<div style="display:flex;align-items:center;height:48px;color:{text};{bg}'
        f'border-left:3px solid {"var(--primary-color)" if active else "transparent"};">'
        f'<svg viewBox="0 0 24 24" style="width:24px;height:24px;margin:0 12px 0 9px;fill:currentColor;flex:none;">'
        f'<path d="{icon}"/></svg>'
        f'<span style="flex:1;font-size:14px;{weight}">{label}</span>'
        f"{badge_html}"
        '<span style="width:12px;flex:none;"></span></div>'
    )


def sidebar_html(count):
    """A faithful mock of the Home Assistant sidebar: the ENT ONE entry shows its panda icon and the badge, at the end
    of the row like the Notifications count below it."""
    rows = [
        _sidebar_row(SIDEBAR_ICONS["home"], "Overview"),
        _sidebar_row(ICONS["calendar-blank-outline"], "Calendar"),
        _sidebar_row(PANDA, "ENT ONE", active=True, badge=count),
        _sidebar_row(SIDEBAR_ICONS["cog"], "Settings"),
        _sidebar_row(SIDEBAR_ICONS["bell"], "Notifications", badge=3, badge_color="#ff9800"),
    ]
    return (
        '<div style="width:255px;background:var(--card-background-color);'
        'border-right:1px solid var(--divider-color);padding:8px 0;">' + "".join(rows) + "</div>"
    )


# What the signed file URLs show: a drawn map for images, a page of text for PDFs (mock content).
MOCK_IMAGE = (
    "data:image/svg+xml;utf8,"
    + "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'>"
    + "<rect width='640' height='360' fill='%23e8f1e4'/><path d='M0 250 C160 200 260 300 420 230 S600 210 640 190 V360 H0Z' fill='%23b9d8f0'/>"
    + "<path d='M60 0 L120 360 M0 120 L640 80 M380 0 L330 360' stroke='%23ffffff' stroke-width='14'/>"
    + "<rect x='430' y='110' width='120' height='70' rx='6' fill='%23d9c3a5'/>"
    + "<circle cx='490' cy='145' r='14' fill='%23f39c3c'/></svg>"
)
MOCK_PDF = (
    "data:text/html;charset=utf-8,"
    + "<body style='margin:0;background:%23525659;font-family:sans-serif'><div style='margin:24px auto;width:70%;background:white;padding:32px;"
    + "box-shadow:0 2px 6px rgba(0,0,0,.4)'><h3 style='margin-top:0'>Swimming lessons: equipment</h3>"
    + "<p>Swimsuit, swim cap, towel, goggles (optional).</p><p>Please write your child's name on every item.</p></div></body>"
)

# Minimal stand-ins for Home Assistant's <ha-card>, <ha-icon> and <ha-icon-button>.
HA_ELEMENTS = """
const ICONS = %s;
customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;" +
      "border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});
customElements.define("ha-icon", class extends HTMLElement {
  connectedCallback() {
    const path = ICONS[(this.getAttribute("icon") || "").replace("mdi:", "")] || "";
    this.style.display = "inline-flex";
    this.innerHTML = '<svg viewBox="0 0 24 24" style="width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);fill:currentColor"><path d="' + path + '"/></svg>';
  }
});
customElements.define("ha-menu-button", class extends HTMLElement {
  connectedCallback() { this.style.cssText = "display:none"; }
});
customElements.define("ha-icon-button", class extends HTMLElement {
  connectedCallback() {
    this.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;color:var(--secondary-text-color)";
  }
});
""" % json.dumps(ICONS)  # noqa: UP031 - percent-format keeps the embedded JS braces un-escaped


WORDS = [
    {
        "id": "101",
        "child_id": "c1",
        "child": "Alex",
        "title": "Museum trip on Friday",
        "text": "The class visits the natural history museum on Friday.\nPlease bring a packed lunch.",
        "attachments": [
            {"path": "/workspace/document/d1", "name": "Permission slip.pdf", "kind": "file"},
            {"path": "/workspace/document/d2", "name": "Map", "kind": "image"},
        ],
        "date": "2026-11-13T16:20:00+01:00",
        "author": "Ms Martin",
        "category": "Outing",
        "reply_possible": False,
        "signed": False,
    },
    {
        "id": "98",
        "child_id": "c2",
        "child": "Sam",
        "title": "Class photos",
        "text": "Class photos are taken on Tuesday morning.",
        "date": "2026-11-09T12:00:00+01:00",
        "author": "Mr Bernard",
        "category": "Information",
        "reply_possible": False,
        "signed": True,
    },
]
HOMEWORK = [
    {
        "id": "h1",
        "book_id": "b1",
        "book": "Year 3 A",
        "date": "2026-11-16",
        "title": "Reading, chapter 3",
        "text": "Read chapter 3 aloud.",
        "done": True,
    },
    {
        "id": "h2",
        "book_id": "b1",
        "book": "Year 3 A",
        "date": "2026-11-19",
        "title": "Learn the poem, page 12",
        "text": "The first two verses.",
        "done": False,
    },
    {
        "id": "h3",
        "book_id": "b1",
        "book": "Year 3 A",
        "date": "2026-11-19",
        "title": "Times table of 7",
        "text": "",
        "done": False,
    },
    {
        "id": "h4",
        "book_id": "b2",
        "book": "Year 5 B",
        "date": "2026-11-23",
        "title": "Talk about volcanoes",
        "text": "Two minutes, with one picture.",
        "done": False,
    },
]
MESSAGES = [
    {
        "id": "m1",
        "subject": "Swimming lessons",
        "sender": "Ms Martin",
        "date": "2026-11-16T07:45:00+01:00",
        "unread": True,
        "attachment": True,
    },
    {
        "id": "m2",
        "subject": "Parents' evening",
        "sender": "Head teacher",
        "date": "2026-11-14T18:02:00+01:00",
        "unread": True,
        "attachment": False,
    },
    {
        "id": "m3",
        "subject": "Library books",
        "sender": "Mr Bernard",
        "date": "2026-11-10T10:00:00+01:00",
        "unread": False,
        "attachment": False,
    },
]
NEWS = [
    {
        "id": "5",
        "title": "Christmas fair",
        "text": "The Christmas fair takes place on Saturday 12 December in the playground.",
        "date": "2026-11-12T10:00:00+01:00",
        "author": "Head teacher",
        "headline": True,
    },
    {
        "id": "4",
        "title": "Canteen menus",
        "text": "The menus until the holidays are online.",
        "date": "2026-11-06T09:00:00+01:00",
        "author": "Town hall",
        "headline": False,
    },
]
EVENTS = [
    {
        "id": "e1",
        "calendar": "School",
        "title": "Museum trip",
        "description": "",
        "location": "Natural history museum",
        "start": "2026-11-20T09:00:00+01:00",
        "end": "2026-11-20T16:00:00+01:00",
        "all_day": False,
    },
    {
        "id": "e2",
        "calendar": "School",
        "title": "Parents' evening",
        "description": "",
        "location": None,
        "start": "2026-11-26T18:00:00+01:00",
        "end": "2026-11-26T19:30:00+01:00",
        "all_day": False,
    },
    {
        "id": "e3",
        "calendar": "School",
        "title": "Winter holidays",
        "description": "",
        "location": None,
        "start": "2026-12-19",
        "end": "2027-01-04",
        "all_day": True,
    },
]


def _sensor(entity_id, state, **attributes):
    return {
        "entity_id": entity_id,
        "state": str(state),
        "attributes": {"config_entry_id": "mock", "stale": [], **attributes},
    }


BLOG = [
    {
        "id": "p1",
        "blog_id": "bl1",
        "blog": "Year 3 A blog",
        "blog_thumbnail": "/workspace/document/th1",
        "title": "Our visit to the museum",
        "text": "The children discovered the dinosaur gallery and drew their favourite fossil.",
        "attachments": [{"path": "/workspace/document/ph1", "name": "Dinosaur gallery", "kind": "image"}],
        "author": "Ms Martin",
        "date": "2026-11-13T17:05:00+01:00",
        "comments": 2,
    },
    {
        "id": "p2",
        "blog_id": "bl1",
        "blog": "Year 3 A blog",
        "blog_thumbnail": "/workspace/document/th1",
        "title": "Autumn leaves",
        "text": "A collage made with the leaves gathered in the playground.",
        "attachments": [],
        "author": "Ms Martin",
        "date": "2026-11-06T16:30:00+01:00",
        "comments": 0,
    },
    {
        "id": "p3",
        "blog_id": "bl2",
        "blog": "Parents' association",
        "blog_thumbnail": "",
        "title": "Cake sale on Friday",
        "text": "Year 2 bakes for everyone at 4 pm. Bring some change or your cake card.",
        "attachments": [],
        "author": "Mrs Germain",
        "date": "2026-11-12T09:10:00+01:00",
        "comments": 0,
    },
]
STATES = {
    s["entity_id"]: s
    for s in (
        _sensor("sensor.ent_one_unread_messages", 2, messages=MESSAGES),
        _sensor("sensor.ent_one_words_to_sign", 1, words=WORDS),
        _sensor("sensor.ent_one_homework", 3, homework=HOMEWORK, books={"b1": "Year 3 A", "b2": "Year 5 B"}),
        _sensor("sensor.ent_one_news", 2, news=NEWS),
        _sensor("sensor.ent_one_blog", 3, blog=sorted(BLOG, key=lambda p: p["date"], reverse=True)),
        _sensor(
            "sensor.ent_one_last_update",
            "2026-11-16T07:58:00+00:00",
            url="https://ent.example.org",
            account={
                "user_id": "u1",
                "name": "Parent",
                "type": "PERSRELELEVE",
                "schools": ["Riverside Primary School"],
                "classes": [],
            },
            children=[
                {"id": "c1", "first_name": "Alex", "last_name": ""},
                {"id": "c2", "first_name": "Sam", "last_name": ""},
            ],
            events=EVENTS,
        ),
    )
}

# The same account with every message read: the header shows the homework sheet and its writing pen.
STATES_READ = {
    **STATES,
    "sensor.ent_one_unread_messages": _sensor(
        "sensor.ent_one_unread_messages", 0, messages=[{**m, "unread": False} for m in MESSAGES]
    ),
}

# The panel's top bar hidden (Hide the panel's top bar: For everyone): the tabs alone.
STATES_BARE = {
    **STATES,
    "sensor.ent_one_last_update": {
        **STATES["sensor.ent_one_last_update"],
        "attributes": {**STATES["sensor.ent_one_last_update"]["attributes"], "hide_header": "all"},
    },
}

SHOTS = [
    {"file": "card", "theme": "light", "config": {"show_news": True}},
    {"file": "card-dark", "theme": "dark", "config": {"show_news": True}},
    # The confirmation popup at the top of the card, before signing a word of the liaison book.
    {"file": "card-sign", "theme": "light", "config": {}, "click": '[data-action="sign"]'},
    {"file": "card-sign-dark", "theme": "dark", "config": {}, "click": '[data-action="sign"]'},
    # A word unfolded to its text, by a click on its row.
    {"file": "card-unfolded", "theme": "light", "config": {}, "click": '[data-toggle^="word:"]'},
    {"file": "card-unfolded-dark", "theme": "dark", "config": {}, "click": '[data-toggle^="word:"]'},
    # A message unfolded: its text and attachments, read on demand.
    {"file": "card-message", "theme": "light", "config": {}, "click": '[data-toggle="message:m1"]'},
    {"file": "card-message-dark", "theme": "dark", "config": {}, "click": '[data-toggle="message:m1"]'},
    {"file": "mini-card", "theme": "light", "element": "ent-one-mini-card", "width": 300, "config": {}},
    {"file": "mini-card-dark", "theme": "dark", "element": "ent-one-mini-card", "width": 300, "config": {}},
    # The mini card expanded by its detail button: the full card, at the full card's width.
    {"file": "mini-card-zoom", "theme": "light", "element": "ent-one-mini-card", "config": {}, "click": ".detail"},
    {"file": "mini-card-zoom-dark", "theme": "dark", "element": "ent-one-mini-card", "config": {}, "click": ".detail"},
    {"file": "panel", "theme": "light", "panel": "home", "width": 960},
    {"file": "panel-dark", "theme": "dark", "panel": "home", "width": 960},
    {"file": "panel-bare", "theme": "light", "panel": "home", "width": 960, "states": STATES_BARE},
    {"file": "panel-bare-dark", "theme": "dark", "panel": "home", "width": 960, "states": STATES_BARE},
    {"file": "panel-homework", "theme": "light", "panel": "homework", "width": 960},
    {"file": "panel-homework-dark", "theme": "dark", "panel": "homework", "width": 960},
    # Messages and liaison book read like a mail client: the list, and the item chosen in the reading pane with
    # its attachments shown (images, PDF viewer).
    {"file": "panel-messages", "theme": "light", "panel": "messages", "item": "m1", "width": 1100},
    {"file": "panel-messages-dark", "theme": "dark", "panel": "messages", "item": "m1", "width": 1100},
    {"file": "panel-words", "theme": "light", "panel": "words", "item": "101:c1", "width": 1100},
    {"file": "panel-words-dark", "theme": "dark", "panel": "words", "item": "101:c1", "width": 1100},
    # Blog like ONE's: the feed of posts with a filter per blog, and a post read in full.
    {"file": "panel-blog", "theme": "light", "panel": "blog", "width": 1100},
    {"file": "panel-blog-dark", "theme": "dark", "panel": "blog", "width": 1100},
    {"file": "panel-blog-post", "theme": "light", "panel": "blog", "item": "bl1:p1", "width": 1100},
    {"file": "panel-blog-post-dark", "theme": "dark", "panel": "blog", "item": "bl1:p1", "width": 1100},
    # The sidebar entry with its badge: 1 word to sign + 3 homework + 2 unread = 6, like the mock sensors.
    {"file": "sidebar", "theme": "light", "sidebar": True, "count": 6, "width": 256},
    {"file": "sidebar-dark", "theme": "dark", "sidebar": True, "count": 6, "width": 256},
]


def _frames(path):
    """Decoded RGBA pixels of every frame, with each frame's duration: what the image looks like, not its bytes."""
    from PIL import Image, ImageSequence

    with Image.open(path) as image:
        return [
            (frame.info.get("duration"), frame.convert("RGBA").size, frame.convert("RGBA").tobytes())
            for frame in ImageSequence.Iterator(image)
        ]


def replace_if_changed(new, out):
    """Move the fresh render `new` onto `out` only when its pixels differ (or `out` is missing); return whether
    `out` changed. Encoders do not give the same bytes twice for the same image, which made the screenshots
    workflow commit images that looked exactly the same."""
    new, out = Path(new), Path(out)
    if out.exists() and _frames(new) == _frames(out):
        new.unlink()
        return False
    shutil.move(str(new), str(out))
    return True


# Pauses every animation at `t` ms and returns how many it paused. document.getAnimations() leaves out shadow trees,
# where the card's spinner lives: it kept turning in real time and each run gave other GIF frames.
PAUSE_ANIMATIONS = """(t) => {
  const all = (root) => [
    ...root.getAnimations(),
    ...[...root.querySelectorAll("*")].filter((el) => el.shadowRoot).flatMap((el) => all(el.shadowRoot)),
  ];
  const animations = all(document);
  for (const a of animations) { a.pause(); a.currentTime = t; }
  return animations.length;
}"""


def page_html(theme, width=WIDTH, panel=False):
    variables = "".join(f"{k}:{v};" for k, v in {**THEMES[theme], **COMMON}.items())
    padding = 0 if panel else 16
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
  :root {{ {variables} }}
  body {{ margin: 0; padding: {padding}px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: {width}px; }}
  ent-one-panel {{ min-height: 0 !important; }}
</style></head><body><div id="root"></div></body></html>"""


def mount(context, shot):
    # A new page per capture: the files' top-level declarations would clash in a reused page.
    page = context.new_page()
    page.on("pageerror", lambda err, name=shot["file"]: print(f"{name}: page error: {err}"))
    page.clock.set_fixed_time(NOW)
    if shot.get("sidebar"):
        # A static mock of the sidebar: no Home Assistant element, just the rows drawn with the theme's colours.
        page.set_content(page_html(shot["theme"], shot["width"], panel=True))
        page.evaluate("(h) => { document.getElementById('root').innerHTML = h; }", sidebar_html(shot["count"]))
        page.wait_for_timeout(100)
        return page
    if shot.get("panel"):
        # The panel fills the window: as wide as the shot, and the mail layout as high as the window.
        page.set_viewport_size({"width": shot["width"], "height": 800 if shot.get("item") else 2400})
    page.set_content(page_html(shot["theme"], shot.get("width", WIDTH), bool(shot.get("panel"))))
    page.add_script_tag(content=HA_ELEMENTS)
    page.add_script_tag(content=CARD_JS)
    if shot.get("panel"):
        page.add_script_tag(content=PANEL_JS)
    page.evaluate(
        """({config, states, element, tab, item, mockImage, mockPdf, dark}) => {
          const hass = {states, themes: {darkMode: dark}, language: "en", locale: {language: "en", time_format: "24"}, user: {is_admin: true},
                        callService: () => Promise.resolve(),
                        callWS: (msg) => Promise.resolve(msg.type === "ent_one/message" ? {
                          id: msg.message_id, sender: "Ms Martin", date: "2026-11-16T07:45:00+01:00",
                          text: "Swimming lessons start on Monday 30 November.\\nA swim cap is required.",
                          attachments: [{path: "/conversation/message/m1/attachment/a1", name: "Equipment list.pdf", kind: "file"},
                                        {path: "/conversation/message/m1/attachment/a2", name: "Pool.jpg", kind: "file"}],
                        } : msg.type === "auth/sign_path" ? {path: decodeURIComponent(msg.path).includes(".pdf") ? mockPdf : mockImage} : {})};
          const el = document.createElement(element);
          if (tab) {
            el._tab = tab;
            el._item = item || "";
            el.panel = {config: {}};
            el.narrow = false;
          } else {
            el.setConfig({type: `custom:${element}`, ...config});
          }
          el.hass = hass;
          document.getElementById("root").appendChild(el);
        }""",
        {
            "config": shot.get("config", {}),
            "states": shot.get("states", STATES),
            "element": "ent-one-panel" if shot.get("panel") else shot.get("element", "ent-one-card"),
            "tab": shot.get("panel"),
            "item": shot.get("item"),
            "mockImage": MOCK_IMAGE,
            "mockPdf": MOCK_PDF,
            # The illustrated header follows the dark theme alone, so dark twins show the night.
            "dark": shot["theme"] == "dark",
        },
    )
    if shot.get("click"):
        page.locator(shot["click"]).first.click()
        page.mouse.move(0, 0)
    # Signed sources and the frames they load.
    page.wait_for_timeout(300)
    return page


def capture(page, shot, out, animations="disabled"):
    # Stills disable the animations; a GIF frame keeps them as paused at its time (disabled would reset them).
    width = shot.get("width", WIDTH)
    pad = 0 if shot.get("panel") or shot.get("sidebar") else 32
    if shot.get("crop"):
        # Only one element (the illustrated header), with the page's margin at the top and sides of a card's.
        box = page.locator(shot["crop"]).first.bounding_box()
        m = pad // 2
        # Nothing under it: the card's content starts right below the header.
        clip = {
            "x": box["x"] - m,
            "y": box["y"] - m,
            "width": box["width"] + 2 * m,
            "height": int(box["height"] + 0.999) + m,
        }
        page.screenshot(path=str(out), clip=clip, animations=animations)
        return clip
    box = page.locator("#root").bounding_box()
    clip = {"x": 0, "y": 0, "width": width + pad, "height": int(box["height"] + 0.999) + pad}
    page.screenshot(path=str(out), clip=clip, animations=animations)
    return clip


def animate(context, shot, *, fps=20, seconds=2, refreshing=True):
    """Record an animation as a looping screenshots/<file>.gif (needs ffmpeg): the refresh spinner, or with
    refreshing=False what the page plays by itself (the header's envelope, pen). Every animation is paused and
    stepped frame by frame, so the GIF is identical whatever the machine's speed."""
    page = mount(context, shot)
    if refreshing:
        page.evaluate(
            """() => { const el = document.getElementById("root").firstElementChild; el._refreshing = true; el._render(); }"""
        )
    page.wait_for_timeout(200)
    frames = round(fps * seconds)
    with tempfile.TemporaryDirectory() as frame_dir:
        clip = None
        for i in range(frames):
            page.evaluate(f"(t) => ({PAUSE_ANIMATIONS})(t)", (i * 1000) / fps)
            clip = capture(page, shot, f"{frame_dir}/f{i:03d}.png", animations="allow")
        page.close()
        out = f"{frame_dir}/{shot['file']}.gif"
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-loglevel",
                "error",
                "-framerate",
                str(fps),
                "-i",
                f"{frame_dir}/f%03d.png",
                "-vf",
                f"scale={clip['width']}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
                "-loop",
                "0",
                out,
            ],
            check=True,
        )
        changed = replace_if_changed(out, ROOT / "screenshots" / f"{shot['file']}.gif")
    print(f"screenshots/{shot['file']}.gif" + ("" if changed else " (unchanged)"))


def main():
    out_dir = ROOT / "screenshots"
    out_dir.mkdir(exist_ok=True)
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        chromium = os.environ.get("CHROMIUM_PATH")
        browser = p.chromium.launch(executable_path=chromium) if chromium else p.chromium.launch()
        context = browser.new_context(
            device_scale_factor=2, viewport={"width": 1000, "height": 2400}, timezone_id="Europe/Paris", locale="en-GB"
        )
        for shot in SHOTS:
            page = mount(context, shot)
            page.wait_for_timeout(300)
            with tempfile.TemporaryDirectory() as tmp:
                fresh = Path(tmp) / f"{shot['file']}.png"
                capture(page, shot, fresh)
                changed = replace_if_changed(fresh, out_dir / f"{shot['file']}.png")
            print(f"screenshots/{shot['file']}.png" + ("" if changed else " (unchanged)"))
            page.close()
        # The refresh spinner in both themes: the light GIF gets a -dark twin with the exact same setup.
        for theme, suffix in (("light", ""), ("dark", "-dark")):
            animate(context, {"file": f"refreshing{suffix}", "theme": theme, "config": {}})
        # The illustrated header, one GIF per animation, card and panel, day and night: unread messages (the
        # envelope bobs, its count blinks: 2 s and 1.6 s, looped over 8 s) and homework left (the pen writes, 1 s).
        headers = (
            ("card-header", {"config": {}, "crop": ".banner"}),
            ("panel-header", {"panel": "home", "width": 960, "crop": ".banner"}),
        )
        for name, base in headers:
            for theme, suffix in (("light", ""), ("dark", "-dark")):
                animate(
                    context,
                    {**base, "file": f"{name}-messages{suffix}", "theme": theme},
                    fps=12.5,
                    seconds=8,
                    refreshing=False,
                )
                animate(
                    context,
                    {**base, "file": f"{name}-homework{suffix}", "theme": theme, "states": STATES_READ},
                    seconds=2,
                    refreshing=False,
                )
        browser.close()


if __name__ == "__main__":
    main()
