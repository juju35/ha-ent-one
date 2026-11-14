# Changelog

## 1.2.0 (2026-11-14)

- Panel: the Messages and Liaison book tabs work like a mail client, the list on the left and the item chosen in a reading pane on the right (on a phone, the item replaces the list, Back returns to it); the item is kept in the address.
- Attachments are shown instead of linked: images at full width, PDFs in a viewer with an Open button, other files as a download button; the card shows image thumbnails.
- Attachments that did not open: PDFs were served with a sandbox policy browsers refuse to draw, and files the ENT serves as `application/octet-stream` were downloaded without a type or a name. Images and PDFs are now recognized by their content and keep the attachment's name.
- The panel's Messages tab no longer stays empty (its message cache hid the tab's drawing method).
- Card: a message opens in the panel's reading pane, an unfolded word shows its start with a Read link; without the panel, a message unfolds to its start only.

## 1.1.0 (2026-11-14)

- Attachments of the liaison book, homework and news, and links to the ENT's documents in their text, appear as buttons; they open through Home Assistant (signed link, PDF and images shown in the browser, other files downloaded).
- Unfolding a message loads its full text and attachments.
- Saving the settings no longer sends the panel back to the Home Assistant overview: the panel stays registered while the entry reloads.
- The panel is drawn again once the translations are loaded, so it no longer stays in English.
- The sidebar entry of the panel shows the panda (icon set `ent_one`, `ent_one:panda`) instead of a mortarboard.

## 1.0.0 (2026-11-14)

First release.

- Integration for ENT ONE, the Edifice-based digital workspace of primary schools: username and password login, silent re-login when the session expires, never retried after refused credentials.
- Username and password stored in the entry, or read from `secrets.yaml` entries at every update (a new password only needs an edit there); Reconfigure switches each one between both.
- Sensors: unread messages, words of the liaison book to sign, homework to do, news, last update (school, classes, children, school calendar).
- `School` calendar with the ENT's events and the homework due dates.
- One to-do list per homework notebook: ticking an item marks the homework done in the ENT.
- Actions `ent_one.sign_word` (administrators only) and `ent_one.refresh`; events `ent_one_new_message`, `ent_one_new_word` and `ent_one_new_homework`; optional notifications.
- Cards `ent-one-card` (dashboard: counts, liaison book, homework, messages, calendar, news) and `ent-one-mini-card`.
- Rows unfold to their text, counts open the panel tab, 40 px check boxes, times in the profile's 12 / 24 h format, empty sections hidden (`show_empty`).
- Sidebar panel with Home, Homework, Liaison book, Messages, News and Settings tabs (Home Assistant form, remembered homework filters, arrow keys).
- 22 languages.
