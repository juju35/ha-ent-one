# Changelog

## 1.0.0 (2026-11-14)

First release.

- Integration for ENT ONE, the Edifice-based digital workspace of primary schools: username and password login, silent re-login when the session expires, never retried after refused credentials.
- Username and password stored in the entry, or read from `secrets.yaml` entries at every update (a new password only needs an edit there); Reconfigure switches each one between both.
- Sensors: unread messages, words of the liaison book to sign, homework to do, news, last update (school, classes, children, school calendar).
- `School` calendar with the ENT's events and the homework due dates.
- One to-do list per homework notebook: ticking an item marks the homework done in the ENT.
- Actions `ent_one.sign_word` and `ent_one.refresh`; events `ent_one_new_message`, `ent_one_new_word` and `ent_one_new_homework`; optional notifications.
- Cards `ent-one-card` (dashboard: counts, liaison book, homework, messages, calendar, news) and `ent-one-mini-card`.
- Sidebar panel with Home, Homework, Liaison book, Messages, News and Settings tabs.
- 22 languages.
