# ENT ONE Integration — Agent Context

## Purpose
Home Assistant custom integration for ENT ONE, the Edifice-based (ex Open Digital Education) digital workspace of French
primary schools. Ships its card (`frontend/ent-one-card.js`: `ent-one-card`, `ent-one-mini-card`) and a sidebar panel
(`frontend/ent-one-panel.js`), both served by the integration. The ENT's routes were learnt from
https://github.com/edouard-claude/ent1-mcp (Rust MCP server).

## Architecture

```
custom_components/ent_one/
├── __init__.py      # Setup, card resource, panel (panel_custom, config.card_url), services, websockets ent_one/settings, ent_one/settings/update (admin), ent_one/homework_done
├── api.py           # aiohttp client: form login, own cookie jar, XSRF header on writes, one silent re-login, never retries refused credentials
├── coordinator.py   # EntData (account, children, unread, messages, words, homework, books, news, events, stale); per-section failures keep the previous content; ent_one_new_* events + notify (a kind is followed from its first successful read; ids kept = those of the last read)
├── sensor.py        # unread_messages, words_to_sign, homework, news (count + list attribute), last_update (account, children, events, url)
├── calendar.py      # School: ENT calendar events + homework on its due date (all-day)
├── todo.py          # One to-do list per homework notebook (added when a new notebook shows up); ticking calls PUT /homeworks/{book}/entry/status
├── secret.py        # async_credentials(): username / password stored, or the secrets.yaml entries named by username_secret / password_secret (read at every update)
├── config_flow.py   # URL + username or username_secret + password or password_secret, reauth (password, or reauth_secret: just confirm), reconfigure, options (scan_interval ≥ 10, homework_days, notify_services, show_panel)
├── diagnostics.py   # Counts only: no names, no contents
└── frontend/        # Vanilla JS, no dependencies; header pastille = the MDI-style panda pictogram supplied by the user (ENT_ONE_ICON_PATH); brand/icon.png = the panda of the ONE logo file on the orange tile with a blue backpack badge. The panel imports the card file and reuses window.EntOne (helpers, i18n, row renderers)
```

## ENT routes
- With a secret, the coordinator calls api.update_credentials() before each update: an edited secret clears the refusal flag, and a success after a refusal aborts the pending reauth flow.
- Login `POST /auth/login` form `email`, `password`, `callBack`, `details`, no redirect follow. Redirect to `/auth/login` or a 200 = refused credentials (flag set, no retry until reauth). A redirect containing revalidate/cgu/mfa/… = action required in a browser. The `XSRF-TOKEN` cookie comes with `/timeline/timeline`.
- Session lost: 401, or on a read any redirect to the ENT itself or to an auth page; on a write only 401 or an auth page.
- `GET /auth/oauth2/userinfo` (userId, username, type, children {id: {firstName, lastName}}, structureNames, classNames — may be null).
- `GET /conversation/api/count/inbox?unread=true` → {count}; `GET /conversation/api/folders/inbox/messages?page=0&page_size=N`.
- `GET /schoolbook/list/0/{childId}` (acknowledgments[].owner = signer); `POST /schoolbook/relation/acknowledge/{wordId}/{childId}`.
- `GET /homeworks/list`, `GET /homeworks/get/{id}` (data[].date, entries[]._id/title/value), `GET /homeworks/{id}/entry/status` ([{entryId, finished}]), `PUT` same path `{entryid, finished}`.
- `GET /actualites/api/v1/infos?page=0&pageSize=N`; `GET /calendar/calendars`, `GET /calendar/{id}/events` (startMoment/endMoment, allday).
- Ids placed in a path are checked against `[A-Za-z0-9_-]+`.

## Card and panel
- frontend/ent-one-icons.js registers the icon set `ent_one` (window.customIcons / customIconsets) on every page (add_extra_js_url); the sidebar entry uses `ent_one:panda`.
- Sensors are found by their `config_entry_id` attribute and list attribute (messages / words / homework / news / account), filtered on `platform: ent_one` when the registry is there.
- sign_word is an admin service; the card and the panel show the Sign button only when hass.user.is_admin isn't false.
- Rows with more to read carry data-toggle (chevron right / down); the card and the panel keep their open keys, folded by a click outside. Tiles: data-action=goto → /ent-one?tab=… when hass.panels has the panel. entOneSetTimeFormat(hass) follows hass.locale.time_format.
- Popups (sign confirmation) at the top of the card, closed on a click outside and when the card leaves the page. No filled button.
- Panel header = the card's illustrated banner (window.EntOne.banner: scene, state, isNight, styles, schoolPath); account select at the right of the tab bar. Option hide_header (off | all | non_admin, sensor attribute `hide_header`): host attribute `bare` hides the banner, ha-menu-button moves to the tab bar, refresh/open buttons to .tb-side. Home: child chips (2+ children, filter words, localStorage `child`), week strip (Mon–Fri, `_day` filter not remembered; only with the Homework tab), chart tiles, To do / To read / Calendar. Homework: one box per due day with done/total bar.
- Panel tabs: home, homework, words, messages, news, settings (last), `?tab=` in the URL. The Settings tab (ha-form, options flow selectors) isn't redrawn by sensor updates. Homework filters in localStorage `ent-one-panel`.
- One translation table (`EntOneI18n`, flat keys) for card and panel; the release splits it (scripts/split-frontend.mjs).

## Release
Bump manifest.json version and `ENT_ONE_CARD_VERSION`, add the CHANGELOG section; merging to main publishes `vX.Y.Z` with `ent_one.zip`.

## Tests
`pytest` (tests/test_api.py runs a fake ENT on aiohttp; tests/test_init.py patches EntApi), `node --test test/*.test.mjs`, `python scripts/screenshots.py`.
