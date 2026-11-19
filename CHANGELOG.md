# Changelog

## 1.6.0 - 2026-11-19

### Features
- Panel redesign: the card's illustrated header across the page (school corner, ground bar, status in the icon's colour, ONE panda badge, round glass buttons), the account choice moved to the right of the tabs.
- Panel home: a child filter (All, then one chip per child with the words left to sign), a week strip (homework left per day, a dot for an event, a click keeps only that day), chart tiles (tinted pastille with its count, coloured state line) for the liaison book, homework, messages and calendar, then To do, To read and Calendar boxes.
- Panel Liaison book: the same child filter, remembered in the browser.
- Panel Homework: one tile per due day with its progress (done / total and a bar).
- Panel: option *Hide the panel's top bar* (No, For everyone, For non-admins), in the integration options and the Settings tab — the tabs stay, with the refresh and open-ENT buttons at their right and the menu button at their left on a phone.
- Screenshots: one GIF per header animation (unread messages, homework left) for the card and the panel, light and dark, shown in the README.

### Fixes
- Screenshots: the GIFs really move — frames were captured with animations disabled, which reset them (the refresh GIF showed a still spinner).

## 1.5.2 - 2026-11-18

### Fixes
- Illustrated header: `auto` now follows the Home Assistant theme alone — a light theme keeps the day picture after sunset, a dark theme still shows the night one.

## 1.5.1 - 2026-11-18

### Fixes
- Cards: the header's refresh and open-ENT buttons are plain 24 px round buttons again — the icon sat off-centre from its glass circle and spilled past the card's edge, and the hover ring was offset (the inner button of `ha-icon-button` overflowed the shrunk host).

## 1.5.0 - 2026-11-17

### Features
- Cards: an illustrated, animated 90 px header on the card and the mini card — a school corner on the right (schoolbag and exercise books on a shelf, the sheet with a writing pen when there is homework or a word to sign, the envelope with the count of unread messages, a ticked sheet when everything is done) above a 10 px parquet strip, with day and night variants.
- The header icon (`mdi:school`, with the ONE panda as brand badge) takes the status colour: blue when there are things to deal with, grey when everything is done, amber when partly updated, red when unavailable.
- Status pill (Up to date, Partly updated, Unavailable) right after the title on both cards, the mini card included, in the header icon's colour on the illustrated header; it stays beside the title only when the whole title and its whole label fit there, otherwise it takes a line of its own under the names (then kept to one line), and only its dot stays when even that does not fit in the banner or the card is 200 px wide or less (measured on the rendered card, so that it fits in every language). The header buttons are 24 px round glass buttons on the top line, the mini card's detail button in the corner and the others at its left.
- New options `illustration` (`false` keeps the classic header) and `illustration_theme` (`auto`: night after sunset or with the dark theme; `day` or `night` to force), in the visual editor of both cards. Animations stop with `prefers-reduced-motion`.
- Night picture with the dark theme even while the sun is up (it used to wait for sunset when `sun.sun` exists).

### Documentation
- README: screenshots of the mini card expanded to the full card, light and dark.

## 1.4.1 (2026-11-15)

### Maintenance
- Added a README screenshot of the sidebar entry with its badge (light and dark), and noted that each panel tab shows its own count.

## 1.4.0 (2026-11-15)

### Added
- A badge on the ENT ONE sidebar item showing how many things there are to deal with — words to sign, homework to do and unread messages, summed over every child account — in the accent colour, like the notifications count. It disappears when there is nothing, and is read from the account sensors for every administrator, even with the panel closed.

## 1.3.1 (2026-11-15)

- Panel: choose the tabs shown (option *Tabs shown in the panel*, in Settings or the integration options). A hidden tab also leaves the home page (its count and its box); Home and Settings always stay.
- Cards: `show_homework`, `show_words` and `show_messages` hide the matching count too (it stayed at the top of the card and the mini card); the counts left share the width.
- New blog posts fire `ent_one_new_blog_post` (`id`, `blog_id`, `blog`, `title`, `author`) and are sent to the notify actions chosen in the options, like messages, words and homework. The posts there at startup or after a reload never fire.

## 1.3.0 (2026-11-15)

- Blog: the latest 20 posts of the class and school blogs, in a **Blog** sensor (title, blog, author, date, text, pictures, comment count).
- Panel: a **Blog** tab organized like ONE's, with a filter per blog (with its picture), a feed of post cards (start of the text, pictures, comments, Read more) and the post read in full with a Back button. The chosen blog is remembered in this browser.
- Card: an optional blog section (`show_blog`), each post unfolding to its start and pictures, with a Read link to the panel.
- An application the ENT does not have (HTTP 403 or 404, a school without a blog) stays empty instead of marking the update as partial.

## 1.2.4 (2026-11-15)

- French labels: the Liaison book tab is called « Carnet de liaison » (was « Carnet ») and the Messages tab and section « Messagerie » (was « Messages »).

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
