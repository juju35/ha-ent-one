# Changelog

## 1.2.3 (2026-11-15)

- Attachments were cut short: only the first part of a file sent by the ENT was read, so a PDF showed as a white page and an image as an empty frame. The whole file is read now.
- Faster updates: the ENT's applications, and each child, homework notebook and calendar, are read side by side (four requests at a time at most) instead of one after the other.
- Opening a message no longer reads the whole ENT again: the message is marked read in the list at once, and a message opened again is not fetched a second time.
- Files are kept 15 minutes (40 MB at most): showing an attachment again asks nothing of the ENT.
- The card and the panel find their sensors through the entity registry instead of scanning every state at each Home Assistant update.

## 1.2.2 (2026-11-14)

- Images and PDFs of the reading pane are fetched by the page and drawn from the file itself: a reverse proxy or Home Assistant that forbids framing (`X-Frame-Options`) left the PDF viewer white and could leave images empty.
- An attachment that cannot be fetched or drawn says why in its place (HTTP status, or the type received) instead of an empty frame.

## 1.2.1 (2026-11-14)

- Attachments with an accented name (a PDF shown as a white page, for instance) failed with a server error: the ENT writes the name as raw bytes, now decoded again, and the name known from the message or the word comes first.
- Images are drawn on white: a transparent PNG in black (a poster, a scan) no longer shows as an empty frame on a dark theme.
- The text of a word, a homework, a news item or a message no longer repeats the list of its attachments ("Pièces jointes" and the file names written by the ENT's editor): the attachments are shown under it.

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
