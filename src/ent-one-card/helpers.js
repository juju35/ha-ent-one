// ── helpers (shared with the panel through window.EntOne) ─────────────────────
import { ENT_ONE_CARD_VERSION } from "./card-picker.js";
import { ENT_ONE_ACCENT, ENT_ONE_ICON } from "./header-icon.js";
import { EntOneI18n } from "./i18n/strings.js";

export function entOneEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function entOneFormat(text, values) {
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (values && values[k] != null ? values[k] : m));
}

// The card's `language` option wins over the Home Assistant language; a full code the card knows (sr-Latn) is
// kept, else its base (fr-FR gives fr), else English.
export function entOneLang(hass, config) {
  var lang = String(config?.language || (hass && (hass.locale?.language || hass.language)) || navigator.language || 'en');
  if (EntOneI18n[lang]) return lang;
  lang = lang.split('-')[0];
  return EntOneI18n[lang] ? lang : 'en';
}

// Locale for Intl: plain "pt" is European Portuguese in Home Assistant but Brazilian in Intl.
export function entOneLocale(hass, config) {
  var lang = entOneLang(hass, config);
  var full = String(config?.language || (hass && (hass.locale?.language || hass.language)) || '');
  var sameScript = /-Latn\b/i.test(full) === /-Latn\b/i.test(lang);
  var locale = full && full.split('-')[0] === lang.split('-')[0] && sameScript ? full : lang;
  return locale === 'pt' ? 'pt-PT' : locale;
}

// English key by key until the language file is loaded (the split leaves `{}` in its place).
export function entOneT(hass, config) {
  return Object.assign({}, EntOneI18n.en, EntOneI18n[entOneLang(hass, config)]);
}

// False while the release's language file is still on its way (its table is still empty): reading the table
// starts the download, and the caller draws again a moment later.
export function entOneLangReady(hass, config) {
  var lang = entOneLang(hass, config);
  return lang === 'en' || Object.keys(EntOneI18n[lang] || {}).length > 0;
}

export function entOneErrorText(hass, err) {
  var fallback = String(err?.message || err || '').replace(/^Validation error: /, '');
  var key = err?.translation_key;
  if (!key || err.translation_domain !== 'ent_one' || typeof hass?.loadBackendTranslation !== 'function') {
    return Promise.resolve(fallback);
  }
  return Promise.resolve(hass.loadBackendTranslation('exceptions', 'ent_one'))
    .then((localize) => (localize || hass.localize)(`component.ent_one.exceptions.${key}.message`, err.translation_placeholders || {}) || fallback)
    .catch(() => fallback);
}

// The ENT ONE accounts found in the states: each sensor carries config_entry_id and its own list attribute.
export var ENT_ONE_KINDS = { messages: 'messages', words: 'words', homework: 'homework', news: 'news', blog: 'blog', account: 'last' };

// Sensors of the integration. Home Assistant updates hass several times a second: scanning every state each time
// cost a lot on large installations, so the ids are taken from the entity registry, read again only when it
// changes (a new object). Without a registry (tests, screenshots), every sensor is looked at.
export var entOneIdCache = { entities: null, ids: null };

export function entOneSensorIds(hass) {
  var entities = hass?.entities;
  if (!entities || !Object.keys(entities).length) return Object.keys(hass?.states || {}).filter((id) => id.indexOf('sensor.') === 0);
  if (entOneIdCache.entities !== entities) {
    entOneIdCache.entities = entities;
    entOneIdCache.ids = Object.keys(entities).filter((id) => id.indexOf('sensor.') === 0 && entities[id].platform === 'ent_one');
  }
  return entOneIdCache.ids;
}

export function entOneAccounts(hass) {
  var accounts = {};
  var states = hass?.states || {};
  entOneSensorIds(hass).forEach((id) => {
    var st = states[id];
    var entry = st?.attributes?.config_entry_id;
    if (!entry) return;
    var kind = Object.keys(ENT_ONE_KINDS).find((k) => k in st.attributes);
    if (!kind) return;
    accounts[entry] = accounts[entry] || { entryId: entry };
    accounts[entry][ENT_ONE_KINDS[kind]] = st;
  });
  return accounts;
}

export function entOneData(hass, entryId) {
  var accounts = entOneAccounts(hass);
  var acc = entryId ? accounts[entryId] : accounts[Object.keys(accounts)[0]];
  if (!acc) return null;
  var a = (st, key, fallback) => (st && Array.isArray(st.attributes?.[key]) ? st.attributes[key] : fallback);
  var down = (st) => !st || st.state === 'unavailable' || st.state === 'unknown';
  var last = acc.last;
  var stale = [];
  [acc.messages, acc.words, acc.homework, acc.news].forEach((st) => {
    (st?.attributes?.stale || []).forEach((s) => {
      if (stale.indexOf(s) === -1) stale.push(s);
    });
  });
  return {
    entryId: acc.entryId,
    unavailable: down(acc.messages) && down(acc.words) && down(acc.homework),
    unread: down(acc.messages) ? 0 : Number(acc.messages.state) || 0,
    messages: a(acc.messages, 'messages', []),
    words: a(acc.words, 'words', []),
    homework: a(acc.homework, 'homework', []),
    books: acc.homework?.attributes?.books || {},
    news: a(acc.news, 'news', []),
    blog: a(acc.blog, 'blog', []),
    events: a(last, 'events', []),
    children: a(last, 'children', []),
    account: last?.attributes?.account || {},
    url: last?.attributes?.url || '',
    // Tabs of the panel shown (integration option); all of them before the option exists.
    panelTabs: Array.isArray(last?.attributes?.panel_tabs) ? last.attributes.panel_tabs : ['homework', 'words', 'messages', 'news', 'blog'],
    // Who the panel's top bar is hidden for (integration option): off, all or non_admin.
    hideHeader: last?.attributes?.hide_header || 'off',
    updated: last && !down(last) ? last.state : null,
    stale: stale,
    states: [acc.messages, acc.words, acc.homework, acc.news, acc.blog, last],
  };
}

// "YYYY-MM-DD" is read as UTC midnight by Date.parse: give a date alone a local midnight.
export function entOneParse(raw) {
  var s = String(raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00';
  return new Date(s);
}

export function entOneDayDiff(raw) {
  var d = entOneParse(raw);
  if (Number.isNaN(d.getTime())) return null;
  var a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var now = new Date();
  var b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

// Today / Tomorrow / Yesterday, else the short weekday within a week, else the date.
export function entOneDay(raw, t, locale) {
  var diff = entOneDayDiff(raw);
  if (diff === null) return '';
  if (diff === 0) return t.today;
  if (diff === 1) return t.tomorrow;
  if (diff === -1) return t.yesterday;
  var d = entOneParse(raw);
  // Within a week the weekday is enough; further away the weekday stays, with the date (Thu 26 Nov).
  var opts = Math.abs(diff) < 7 ? { weekday: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' };
  try {
    return d.toLocaleDateString(locale, opts);
  } catch (_e) {
    return d.toLocaleDateString('en', opts);
  }
}

// "for today", "for tomorrow", else "for" and the day.
export function entOneDue(raw, t, locale) {
  var diff = entOneDayDiff(raw);
  if (diff === 0) return t.due_today;
  if (diff === 1) return t.due_tomorrow;
  return entOneFormat(t.due, { day: entOneDay(raw, t, locale) });
}

// The time format of the user's Home Assistant profile: '12', '24', or the language's ('language' / 'system').
export var entOneHour12;

export function entOneSetTimeFormat(hass) {
  var f = hass?.locale?.time_format;
  entOneHour12 = f === '12' ? true : f === '24' ? false : undefined;
}

export function entOneTime(raw, locale) {
  var d = entOneParse(raw);
  if (Number.isNaN(d.getTime())) return '';
  var opts = { hour: '2-digit', minute: '2-digit' };
  if (entOneHour12 !== undefined) opts.hour12 = entOneHour12;
  try {
    return d.toLocaleTimeString(locale, opts);
  } catch (_e) {
    return d.toLocaleTimeString('en', opts);
  }
}

// Signing, ticking homework, reading a message in full and fetching files are admin-only actions (a child's Home
// Assistant account must not do them): true while hass.user is unknown.
export function entOneCanSign(hass) {
  return hass?.user?.is_admin !== false;
}

export function entOneSign(hass, entryId, word) {
  return hass.callService('ent_one', 'sign_word', { config_entry_id: entryId, word_id: String(word.id), child_id: String(word.child_id) });
}

export function entOneSetDone(hass, entryId, item, done) {
  return hass.callWS({
    type: 'ent_one/homework_done',
    config_entry_id: entryId,
    book_id: String(item.book_id),
    homework_id: String(item.id),
    done: !!done,
  });
}

export function entOneRefresh(hass, entryId) {
  return hass.callService('ent_one', 'refresh', { config_entry_id: entryId });
}

// A click inside a Home Assistant dialog (more-info, editor) is not a click outside the card.
export function entOneInDialog(ev) {
  return ev.composedPath().some((el) => el?.tagName && /^(HA-DIALOG|HA-MORE-INFO-DIALOG|HUI-DIALOG-EDIT-CARD)$/.test(el.tagName));
}

// Undone homework first by due date, done homework after (when shown).
export function entOneSortedHomework(items, showDone) {
  return items
    .filter((h) => showDone || !h.done)
    .slice()
    .sort((x, y) => (x.done === y.done ? String(x.date).localeCompare(String(y.date)) : x.done ? 1 : -1));
}

export function entOneUpcomingEvents(events) {
  var now = Date.now();
  return events.filter((e) => {
    var end = entOneParse(e.end || e.start).getTime();
    return Number.isNaN(end) || end >= now - (e.all_day ? 86400000 : 0);
  });
}

// Attachments are fetched through Home Assistant (the browser has no ENT session) with a signed URL, signed for an
// hour and reused for 50 minutes: a redraw shows the same image or PDF from the browser cache.
export var entOneSigned = {};
export var ENT_ONE_SIGN_REUSE = 50 * 60 * 1000;

export function entOneFileUrl(hass, entryId, path, name) {
  var key = entryId + ' ' + path;
  var hit = entOneSigned[key];
  if (hit && Date.now() - hit.at < ENT_ONE_SIGN_REUSE) return hit.promise;
  var url = `/api/ent_one/file/${entryId}?path=${encodeURIComponent(path)}` + (name ? `&name=${encodeURIComponent(name)}` : '');
  var entry = { at: Date.now(), url: '' };
  entry.promise = hass.callWS({ type: 'auth/sign_path', path: url, expires: 3600 }).then((res) => {
    entry.url = res.path;
    return res.path;
  });
  entry.promise.catch(() => {
    if (entOneSigned[key] === entry) delete entOneSigned[key];
  });
  entOneSigned[key] = entry;
  return entry.promise;
}

export function entOneCachedUrl(entryId, path) {
  var hit = entOneSigned[entryId + ' ' + path];
  return hit?.url && Date.now() - hit.at < ENT_ONE_SIGN_REUSE ? hit.url : '';
}

// Images and PDFs shown in the page are fetched here and drawn from a blob: URL. A frame of the file view itself
// stays blank when a reverse proxy or Home Assistant forbids framing (X-Frame-Options), and a failed fetch can say
// why. Kept for the page's life, so a redraw shows them at once.
export var entOneBlobs = {};

export function entOneFileBlob(hass, entryId, path, name) {
  var key = entryId + ' ' + path;
  if (entOneBlobs[key]) return entOneBlobs[key].promise;
  var entry = { url: '' };
  entry.promise = entOneFileUrl(hass, entryId, path, name)
    .then((url) => fetch(url, { credentials: 'same-origin' }))
    .then((res) => {
      if (!res.ok) return res.text().then((text) => Promise.reject(new Error(`HTTP ${res.status} ${text.slice(0, 200)}`.trim())));
      return res.blob();
    })
    .then((blob) => {
      entry.type = blob.type;
      entry.url = URL.createObjectURL(blob);
      return entry.url;
    });
  entry.promise.catch(() => {
    if (entOneBlobs[key] === entry) delete entOneBlobs[key];
  });
  entOneBlobs[key] = entry;
  return entry.promise;
}

export function entOneBlobUrl(entryId, path) {
  return entOneBlobs[entryId + ' ' + path]?.url || '';
}

// How an attachment is shown: an image, a PDF, or a file to download.
export function entOneFileKind(f) {
  var name = String(f.name || f.path || '').split('?')[0].toLowerCase();
  if (f.kind === 'image' || /\.(png|jpe?g|gif|webp)$/.test(name)) return 'image';
  if (/\.pdf$/.test(name)) return 'pdf';
  return 'file';
}

// Attachments shown, not linked. 'full' (panel reading pane): images at width, PDFs in a viewer, other files as a
// download button. Otherwise (card): image thumbnails and buttons. Sources are set by entOneHydrate after drawing.
export function entOneFiles(files, t, entryId, full) {
  if (!files?.length) return '';
  var src = (f) => ' data-ent-src="' + entOneEsc(f.path) + '" data-name="' + entOneEsc(f.name) + '"' + (entOneBlobUrl(entryId, f.path) ? ' src="' + entOneEsc(entOneBlobUrl(entryId, f.path)) + '"' : '');
  var open = (f, label, icon) => '<button class="file" data-action="file" data-path="' + entOneEsc(f.path) + '" data-name="' + entOneEsc(f.name) + '" title="' + entOneEsc(f.name) + '">' +
    '<ha-icon icon="' + icon + '"></ha-icon><span>' + entOneEsc(label) + '</span></button>';
  var images = files.filter((f) => entOneFileKind(f) === 'image');
  var others = files.filter((f) => entOneFileKind(f) !== 'image');
  var html = '<div class="atts' + (full ? ' full' : '') + '" role="group" aria-label="' + entOneEsc(t.attachments) + '">';
  if (images.length) {
    html += '<div class="att-images">' + images.map((f) =>
      '<button class="att-img" data-action="file" data-path="' + entOneEsc(f.path) + '" data-name="' + entOneEsc(f.name) + '" title="' + entOneEsc(f.name) + '">' +
      '<img alt="' + entOneEsc(f.name) + '"' + src(f) + '></button>').join('') + '</div>';
  }
  others.forEach((f) => {
    var pdf = entOneFileKind(f) === 'pdf';
    if (full && pdf) {
      html += '<div class="att-pdf"><div class="att-head"><ha-icon icon="mdi:file-pdf-box"></ha-icon><span class="att-name">' + entOneEsc(f.name) + '</span>' +
        open(f, t.open_file, 'mdi:open-in-new') + '</div><iframe title="' + entOneEsc(f.name) + '"' + src(f) + '></iframe></div>';
    } else {
      html += '<div class="files">' + open(f, f.name, pdf ? 'mdi:file-pdf-box' : full ? 'mdi:download' : 'mdi:paperclip') + '</div>';
    }
  });
  return html + '</div>';
}

// Gives the drawn images and PDF viewers their sources; a file that cannot be fetched says why in its place.
export function entOneHydrate(root, hass, entryId) {
  root.querySelectorAll('[data-ent-src]:not([src])').forEach((el) => {
    entOneFileBlob(hass, entryId, el.getAttribute('data-ent-src'), el.getAttribute('data-name'))
      .then((url) => {
        // Fetched but not an image (a sign-in page from a proxy, a format the browser cannot draw): say what came.
        if (el.tagName === 'IMG') el.onerror = () => entOneBroken(el, entOneBlobs[`${entryId} ${el.getAttribute('data-ent-src')}`]?.type || '?');
        if (!el.getAttribute('src')) el.setAttribute('src', url);
      })
      .catch((err) => entOneBroken(el, err?.message || err));
  });
}

export function entOneBroken(el, why) {
  var box = el.closest('.att-img, .att-pdf');
  if (!box || box.classList.contains('broken')) return;
  box.classList.add('broken');
  var note = document.createElement('span');
  note.className = 'att-error';
  note.textContent = `${el.getAttribute('data-name') || ''} — ${why}`;
  box.appendChild(note);
}

// Opens a file in a new tab (PDF and images shown by the browser, other files downloaded).
export function entOneOpenFile(hass, entryId, path, name) {
  var cached = entOneCachedUrl(entryId, path);
  if (cached) {
    window.open(cached, '_blank', 'noopener');
    return Promise.resolve();
  }
  var tab = window.open('', '_blank');
  // The file opens in that tab later: cut its link back to this page (reverse tabnabbing).
  if (tab) tab.opener = null;
  return entOneFileUrl(hass, entryId, path, name)
    .then((url) => {
      if (tab) tab.location.href = url;
      else window.location.href = url;
    })
    .catch((err) => {
      if (tab) tab.close();
      throw err;
    });
}

// A message in full, fetched once when unfolded (the ENT then marks it read). `cache` maps ids to
// { loading } / { data } / { error }; `done` redraws.
export function entOneLoadMessage(hass, entryId, id, cache, done) {
  if (cache[id] && !cache[id].error) return;
  cache[id] = { loading: true };
  hass
    .callWS({ type: 'ent_one/message', config_entry_id: entryId, message_id: String(id) })
    .then((data) => {
      cache[id] = { data: data };
    })
    .catch((err) => {
      cache[id] = { error: String(err?.message || err) };
    })
    .finally(done);
}

// Shared row renderers: the card and the panel draw the same rows. A row with more to read (text, description,
// link) gets a chevron and data-toggle; opts.open shows that part (the panel always does with opts.full).
export function entOneToggle(key, open, hasMore) {
  if (!hasMore) return { attrs: '', chevron: '' };
  return {
    attrs: ' data-toggle="' + entOneEsc(key) + '" role="button" tabindex="0" aria-expanded="' + !!open + '"',
    chevron: '<ha-icon class="chevron' + (open ? '' : ' closed') + '" icon="mdi:chevron-down"></ha-icon>',
  };
}

// Open when the panel shows everything (full), or when the caller's isOpen(key) says so (rows unfolded by a click).
export function entOneOpen(opts, key) {
  return !!(opts && (opts.full || opts.isOpen?.(key)));
}

export function entOneWordRow(w, t, locale, opts) {
  var meta = [w.child, w.author, entOneDay(w.date, t, locale)].filter(Boolean).join(' · ');
  var key = 'word:' + w.id + ':' + w.child_id;
  var open = entOneOpen(opts, key);
  var files = w.attachments || [];
  var tg = opts?.full ? { attrs: '', chevron: '' } : entOneToggle(key, open, !!w.text || files.length > 0);
  return '<div class="item word' + (w.signed ? ' done' : '') + '">' +
    '<ha-icon class="item-icon" icon="' + (w.signed ? 'mdi:check-circle-outline' : 'mdi:notebook-edit-outline') + '"></ha-icon>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(w.title || w.category || '—') + '</div>' +
    '<div class="item-meta">' + entOneEsc(meta) + '</div>' +
    (open && w.text ? '<div class="item-text clamp">' + entOneEsc(w.text) + '</div>' : '') + (open ? entOneFiles(files, t, opts?.entryId) : '') +
    (open && opts?.reader ? '<button class="link read" data-action="read" data-tab="words" data-item="' + entOneEsc(w.id + ':' + w.child_id) + '">' + entOneEsc(t.read) + '</button>' : '') + '</div>' + tg.chevron +
    (w.signed
      ? '<span class="chip ok">' + entOneEsc(t.signed) + '</span>'
      : opts?.canSign
        ? '<button class="act" data-action="sign" data-id="' + entOneEsc(w.id) + '" data-child="' + entOneEsc(w.child_id) + '">' + entOneEsc(t.sign) + '</button>'
        : '<span class="chip">' + entOneEsc(t.tile_words) + '</span>') +
    '</div>';
}

export function entOneHomeworkRow(h, t, locale, opts) {
  var label = h.done ? t.mark_todo : t.mark_done;
  var key = 'homework:' + h.book_id + ':' + h.id;
  var open = entOneOpen(opts, key);
  var files = h.attachments || [];
  var more = !!(h.text && h.title) || files.length > 0;
  var tg = opts?.full ? { attrs: '', chevron: '' } : entOneToggle(key, open, more);
  return '<div class="item hw' + (h.done ? ' done' : '') + '">' +
    '<button class="check" role="checkbox" aria-checked="' + !!h.done + '" aria-label="' + entOneEsc(label) + '" title="' + entOneEsc(label) + '"' +
    ' data-action="homework" data-id="' + entOneEsc(h.id) + '" data-book="' + entOneEsc(h.book_id) + '"' + (opts?.canEdit === false ? ' disabled' : '') + '>' +
    '<ha-icon icon="' + (h.done ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline') + '"></ha-icon></button>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(h.title || (h.text || '').split('\n')[0] || h.book) + '</div>' +
    '<div class="item-meta">' + entOneEsc([h.book, entOneDue(h.date, t, locale)].filter(Boolean).join(' · ')) + '</div>' +
    (open && h.text && h.title ? '<div class="item-text">' + entOneEsc(h.text) + '</div>' : '') + (open ? entOneFiles(files, t, opts?.entryId, opts?.full) : '') + '</div>' + tg.chevron + '</div>';
}

// In the card, a message opens in the panel's reading pane (opts.reader); without the panel it unfolds to the
// start of its text and its attachments, fetched on demand (opts.detail: the cache entry of entOneLoadMessage).
export function entOneMessageRow(m, t, locale, opts) {
  var key = 'message:' + m.id;
  var open = !opts?.reader && entOneOpen(opts, key);
  var tg = opts?.reader
    ? { attrs: ' data-action="read" data-tab="messages" data-item="' + entOneEsc(m.id) + '" role="button" tabindex="0"', chevron: '<ha-icon class="chevron closed" icon="mdi:chevron-down"></ha-icon>' }
    : entOneToggle(key, open, true);
  var detail = opts?.detail;
  var body = '';
  if (open) {
    if (!detail || detail.loading) body = '<div class="item-text muted">' + entOneEsc(t.loading) + '</div>';
    else if (detail.error) body = '<div class="item-text error-text">' + entOneEsc(t.message_failed + ' ' + detail.error) + '</div>';
    else body = (detail.data.text ? '<div class="item-text clamp">' + entOneEsc(detail.data.text) + '</div>' : '') + entOneFiles(detail.data.attachments, t, opts?.entryId);
    if (opts?.url) {
      body += '<div class="item-text"><a class="link" href="' + entOneEsc(opts.url + '/conversation/conversation') + '" target="_blank" rel="noopener">' + entOneEsc(t.open_ent) + '</a></div>';
    }
  }
  return '<div class="item msg' + (m.unread ? ' unread' : ' done') + '">' +
    '<ha-icon class="item-icon" icon="' + (m.unread ? 'mdi:email-outline' : 'mdi:email-open-outline') + '"></ha-icon>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(m.subject || '—') + '</div>' +
    '<div class="item-meta">' + entOneEsc([m.sender, entOneDay(m.date, t, locale)].filter(Boolean).join(' · ')) + '</div>' + body + '</div>' +
    (m.attachment ? '<ha-icon class="item-side" icon="mdi:paperclip" title="' + entOneEsc(t.attachment) + '"></ha-icon>' : '') + tg.chevron +
    '</div>';
}

export function entOneNewsRow(n, t, locale, opts) {
  var key = 'news:' + n.id;
  var open = entOneOpen(opts, key);
  var files = n.attachments || [];
  var tg = opts?.full ? { attrs: '', chevron: '' } : entOneToggle(key, open, !!n.text || files.length > 0);
  return '<div class="item news">' +
    '<ha-icon class="item-icon" icon="mdi:newspaper-variant-outline"></ha-icon>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(n.title || '—') + '</div>' +
    '<div class="item-meta">' + entOneEsc([n.author, entOneDay(n.date, t, locale)].filter(Boolean).join(' · ')) + '</div>' +
    (open && n.text ? '<div class="item-text">' + entOneEsc(n.text) + '</div>' : '') + (open ? entOneFiles(files, t, opts?.entryId, opts?.full) : '') + '</div>' + tg.chevron + '</div>';
}

// A blog post unfolds to its first lines and its images; with the panel, a Read link opens it in the reading pane.
export function entOneBlogRow(b, t, locale, opts) {
  var key = 'blog:' + b.blog_id + ':' + b.id;
  var open = entOneOpen(opts, key);
  var files = b.attachments || [];
  var tg = entOneToggle(key, open, !!b.text || files.length > 0);
  return '<div class="item blog">' +
    '<ha-icon class="item-icon" icon="mdi:post-outline"></ha-icon>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(b.title || '—') + '</div>' +
    '<div class="item-meta">' + entOneEsc([b.blog, entOneDay(b.date, t, locale)].filter(Boolean).join(' · ')) + '</div>' +
    (open && b.text ? '<div class="item-text clamp">' + entOneEsc(b.text) + '</div>' : '') + (open ? entOneFiles(files, t, opts?.entryId) : '') +
    (open && opts?.reader ? '<button class="link read" data-action="read" data-tab="blog" data-item="' + entOneEsc(b.blog_id + ':' + b.id) + '">' + entOneEsc(t.read) + '</button>' : '') +
    '</div>' + tg.chevron + '</div>';
}

export function entOneEventRow(e, t, locale, opts) {
  var when = entOneDay(e.start, t, locale) + ' · ' + (e.all_day ? t.all_day : entOneTime(e.start, locale));
  var key = 'event:' + e.id;
  var open = entOneOpen(opts, key);
  var tg = opts?.full ? { attrs: '', chevron: '' } : entOneToggle(key, open, !!e.description);
  return '<div class="item event">' +
    '<ha-icon class="item-icon" icon="mdi:calendar-blank-outline"></ha-icon>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(e.title || '—') + '</div>' +
    '<div class="item-meta">' + entOneEsc([when, e.location].filter(Boolean).join(' · ')) + '</div>' +
    (open && e.description ? '<div class="item-text">' + entOneEsc(e.description) + '</div>' : '') + '</div>' + tg.chevron + '</div>';
}

// Styles of the rows, chips and buttons, shared by the card and the panel.
export function entOneItemStyles(accent) {
  return [
    '.item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-top: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
    '.item:first-child, .section-title + .item, h2 + .item, h3 + .item { border-top: none; }',
    '.item-icon, .item-side { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; margin-top: 1px; }',
    '.item.unread .item-icon, .word:not(.done) .item-icon { color: ' + accent + '; }',
    '.item-main { flex: 1; min-width: 0; }',
    '.item-title { font-weight: 500; color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.item.done .item-title { color: var(--secondary-text-color); font-weight: 400; }',
    '.hw.done .item-title { text-decoration: line-through; }',
    '.item-meta { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.item-text { font-size: 13px; color: var(--primary-text-color); white-space: pre-line; margin-top: 4px; overflow-wrap: anywhere; }',
    // 40 px touch target around the 20 px box, without moving the row's text.
    '.check { all: unset; cursor: pointer; flex: none; display: grid; place-items: center; width: 40px; height: 40px; margin: -8px -8px -8px -10px; border-radius: 10px; color: var(--secondary-text-color); --mdc-icon-size: 20px; }',
    '.check:hover { background: color-mix(in srgb, var(--primary-text-color) 6%, transparent); }',
    '.check:disabled { cursor: default; background: none; opacity: .6; }',
    '[data-toggle] { cursor: pointer; }',
    '[data-toggle]:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }',
    // Collapsed: chevron to the right; open: down (like the other cards).
    '.chevron { flex: none; align-self: flex-start; margin-top: 10px; color: var(--secondary-text-color); --mdc-icon-size: 20px; transition: transform .2s ease; }',
    '.chevron.closed { transform: rotate(-90deg); }',
    '.link { color: color-mix(in srgb, ' + accent + ' 65%, var(--primary-text-color)); font-weight: 500; text-decoration: none; }',
    '.link:hover { text-decoration: underline; }',
    '.item-text.clamp { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; line-clamp: 4; overflow: hidden; }',
    '.read { all: unset; cursor: pointer; display: inline-block; margin-top: 6px; font-size: 13px; color: color-mix(in srgb, ' + accent + ' 65%, var(--primary-text-color)); font-weight: 500; }',
    '.read:hover { text-decoration: underline; }',
    '.atts { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }',
    '.att-images { display: flex; flex-wrap: wrap; gap: 6px; }',
    // White under the image: a transparent PNG drawn in black (a poster, a scan) disappears on a dark theme.
    '.att-img { all: unset; cursor: zoom-in; display: block; border-radius: 8px; overflow: hidden; border: 1px solid var(--divider-color, rgba(0,0,0,.12)); background: #fff; }',
    '.att-img img { display: block; height: 72px; width: auto; max-width: 160px; object-fit: cover; }',
    '.atts.full .att-img { cursor: zoom-in; }',
    '.atts.full .att-img img { height: auto; max-width: min(100%, 720px); max-height: 60vh; object-fit: contain; }',
    '.att-img.broken img, .att-pdf.broken iframe { display: none; }',
    '.att-error { display: block; padding: 8px 10px; font-size: 12px; color: color-mix(in srgb, var(--error-color, #db4437) 55%, var(--primary-text-color)); background: var(--card-background-color, #fff); }',
    '.att-pdf { border: 1px solid var(--divider-color, rgba(0,0,0,.12)); border-radius: 8px; overflow: hidden; }',
    '.att-head { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 10px; font-size: 13px; --mdc-icon-size: 18px; border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
    '.att-head > ha-icon { color: ' + accent + '; flex: none; }',
    '.att-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.att-pdf iframe { display: block; width: 100%; height: 70vh; border: 0; background: #fff; }',
    '.att-img:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }',
    '.files { display: flex; flex-wrap: wrap; gap: 6px; }',
    '.file { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; max-width: 100%; font-size: 12px; padding: 3px 10px 3px 6px; border-radius: 12px;' +
      ' border: 1px solid var(--divider-color, rgba(0,0,0,.2)); color: var(--primary-text-color); --mdc-icon-size: 16px; }',
    '.file span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.file ha-icon { color: ' + accent + '; flex: none; }',
    '.file:hover { background: color-mix(in srgb, ' + accent + ' 10%, transparent); }',
    '.file:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }',
    '.muted { color: var(--secondary-text-color); }',
    '@media (prefers-reduced-motion: reduce) { .chevron { transition: none; } }',
    '.hw.done .check { color: var(--success-color, #43a047); }',
    '.check:focus-visible, .act:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }',
    // Outlined, never filled (card convention): accent text on an accent hairline.
    '.act { flex: none; font: inherit; font-size: 12px; font-weight: 500; cursor: pointer; padding: 3px 10px; border-radius: 10px; background: transparent;' +
      ' color: color-mix(in srgb, ' + accent + ' 60%, var(--primary-text-color)); border: 1px solid color-mix(in srgb, ' + accent + ' 50%, transparent); }',
    '.act:hover { background: color-mix(in srgb, ' + accent + ' 10%, transparent); }',
    '.act:disabled { opacity: .6; cursor: default; }',
    '.chip { flex: none; font-size: 11px; font-weight: 500; border-radius: 12px; padding: 2px 8px; white-space: nowrap;' +
      ' color: color-mix(in srgb, ' + accent + ' 55%, var(--primary-text-color)); background: color-mix(in srgb, ' + accent + ' 15%, transparent); }',
    '.chip.ok { color: color-mix(in srgb, var(--success-color, #43a047) 55%, var(--primary-text-color)); background: color-mix(in srgb, var(--success-color, #43a047) 15%, transparent); }',
    '.empty { padding: 4px 0; font-size: 13px; color: var(--secondary-text-color); }',
    '.error-text { color: color-mix(in srgb, var(--error-color, #db4437) 55%, var(--primary-text-color)); font-size: 13px; }',
  ].join('\n');
}

window.EntOne = {
  version: ENT_ONE_CARD_VERSION,
  accent: ENT_ONE_ACCENT,
  icon: ENT_ONE_ICON,
  i18n: EntOneI18n,
  t: entOneT,
  langReady: entOneLangReady,
  lang: entOneLang,
  locale: entOneLocale,
  esc: entOneEsc,
  format: entOneFormat,
  errorText: entOneErrorText,
  accounts: entOneAccounts,
  data: entOneData,
  day: entOneDay,
  time: entOneTime,
  setTimeFormat: entOneSetTimeFormat,
  sign: entOneSign,
  openFile: entOneOpenFile,
  files: entOneFiles,
  fileKind: entOneFileKind,
  hydrate: entOneHydrate,
  loadMessage: entOneLoadMessage,
  canSign: entOneCanSign,
  setDone: entOneSetDone,
  refresh: entOneRefresh,
  sortedHomework: entOneSortedHomework,
  upcomingEvents: entOneUpcomingEvents,
  rows: { word: entOneWordRow, homework: entOneHomeworkRow, message: entOneMessageRow, news: entOneNewsRow, blog: entOneBlogRow, event: entOneEventRow },
  itemStyles: entOneItemStyles,
};
