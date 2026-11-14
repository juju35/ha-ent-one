"""Constants for the ENT ONE integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "ent_one"

# Instance of the académie de La Réunion, the one ent1-mcp is tested on: only a placeholder in the form.
DEFAULT_URL: Final = "https://ent1d.ac-reunion.fr"

# Names of secrets.yaml entries holding the password / username, read again at every update (instead of storing them).
CONF_PASSWORD_SECRET: Final = "password_secret"
CONF_USERNAME_SECRET: Final = "username_secret"
SECRETS_FILE: Final = "secrets.yaml"

CONF_SCAN_INTERVAL: Final = "scan_interval"
CONF_HOMEWORK_DAYS: Final = "homework_days"
# Notify actions (notify.mobile_app_…) told about new messages, words of the liaison book and homework.
CONF_NOTIFY: Final = "notify_services"

# The ENT is a school server shared by many families: never poll it faster than every 10 minutes.
DEFAULT_SCAN_INTERVAL: Final = 30
MIN_SCAN_INTERVAL: Final = 10
DEFAULT_HOMEWORK_DAYS: Final = 14

# Items kept in the attributes: enough for a card, small enough for the state machine.
MESSAGES_KEPT: Final = 10
NEWS_KEPT: Final = 5
# Blog posts kept, newest first, all blogs together.
BLOG_KEPT: Final = 20

SERVICE_REFRESH: Final = "refresh"
SERVICE_SIGN_WORD: Final = "sign_word"

ATTR_CONFIG_ENTRY_ID: Final = "config_entry_id"
ATTR_WORD_ID: Final = "word_id"
ATTR_CHILD_ID: Final = "child_id"

# Fired on the bus for what appeared since the last update (never on the first one).
EVENT_NEW_MESSAGE: Final = f"{DOMAIN}_new_message"
EVENT_NEW_WORD: Final = f"{DOMAIN}_new_word"
EVENT_NEW_HOMEWORK: Final = f"{DOMAIN}_new_homework"
EVENT_NEW_BLOG_POST: Final = f"{DOMAIN}_new_blog_post"

CONF_SHOW_PANEL: Final = "show_panel"
DEFAULT_SHOW_PANEL: Final = True

FRONTEND_URL: Final = "/ent_one_static"
CARD_FILENAME: Final = "ent-one-card.js"
PANEL_FILENAME: Final = "ent-one-panel.js"
ICONS_FILENAME: Final = "ent-one-icons.js"
PANEL_ICON: Final = "ent_one:panda"
PANEL_URL_PATH: Final = "ent-one"
