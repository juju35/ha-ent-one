// ── ent-one-card ──────────────────────────────────────────────────────────────
import { ENT_ONE_ACCENT, ENT_ONE_ICON } from "./header-icon.js";
import { ENT_ONE_DEFAULTS } from "./i18n-helpers.js";
import { entOneAccounts, entOneBlogRow, entOneCanSign, entOneData, entOneErrorText, entOneEsc, entOneEventRow, entOneFormat, entOneHomeworkRow, entOneHydrate, entOneInDialog, entOneItemStyles, entOneLoadMessage, entOneLocale, entOneMessageRow, entOneNewsRow, entOneOpenFile, entOneRefresh, entOneSetDone, entOneSetTimeFormat, entOneSign, entOneSortedHomework, entOneT, entOneTime, entOneUpcomingEvents, entOneWordRow } from "./helpers.js";
import { ENT_ONE_BANNER_STYLES, ENT_ONE_SCHOOL_PATH, entOneHeaderState, entOneIsNight, entOneSceneSvg, entOneTextWidth } from "./illustrated-header.js";

export var entOneUid = 0;

export var ENT_ONE_PANEL_PATH = 'ent-one';

// Shadow DOM patching: a redraw updates the nodes already on the page (text, attributes, classes) instead of replacing
// them, so that a state update never re-creates the pictures (SVG scenes, logos) nor restarts their animations, and the
// card keeps its height (a re-created card is laid out again, which can move the dashboard under the reader's eyes).
// An open <dialog> keeps its `open` state: it is driven by showModal() / close().
export function entOneMorphAttrs(cur, next) {
  for (var a of Array.from(cur.attributes)) {
    if (!next.hasAttribute(a.name) && !(a.name === 'open' && cur.localName === 'dialog')) cur.removeAttribute(a.name);
  }
  for (var b of Array.from(next.attributes)) {
    if (cur.getAttribute(b.name) === b.value) continue;
    if (b.namespaceURI) cur.setAttributeNS(b.namespaceURI, b.name, b.value);
    else cur.setAttribute(b.name, b.value);
  }
}

// A Home Assistant element given no content (<ha-icon>…) draws itself: what it adds to its own node is not ours to
// remove. It is kept as long as the attributes the HTML gives it do not change, and replaced when they do.
export function entOneMorphOwnDrawn(o, n) {
  if (!n.localName.includes('-') || n.firstChild) return false;
  var key = Array.from(n.attributes, (a) => `${a.name}=${a.value}`).join('\n');
  if (o.__morphKey === undefined && Array.from(n.attributes).every((a) => o.getAttribute(a.name) === a.value)) o.__morphKey = key;
  if (o.__morphKey !== key) {
    n.__morphKey = key;
    o.parentNode.replaceChild(n, o);
  }
  return true;
}

export function entOneMorphChildren(cur, next) {
  var old = Array.from(cur.childNodes);
  var fresh = Array.from(next.childNodes);
  fresh.forEach((n, i) => {
    var o = old[i];
    var ref = cur.childNodes[i] || null;
    if (!o || o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) {
      cur.insertBefore(n, ref);
      return;
    }
    if (o !== ref) cur.insertBefore(o, ref);
    if (n.nodeType !== 1) {
      if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
    } else if (!entOneMorphOwnDrawn(o, n)) {
      entOneMorphAttrs(o, n);
      entOneMorphChildren(o, n);
    }
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
}

// Gives `root` (a shadow root or an element) the content of `html`, patching what is already there (a plain
// innerHTML where there is no DOM to patch, as in the unit tests' stubs).
export function entOneMorph(root, html) {
  var tpl = root.childNodes && typeof document !== 'undefined' && document.createElement?.('template');
  if (!tpl?.content) {
    root.innerHTML = html;
    return;
  }
  tpl.innerHTML = html;
  entOneMorphChildren(root, tpl.content);
}

export class EntOneCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('ent-one-card-editor');
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = Object.assign({}, ENT_ONE_DEFAULTS, config || {});
    this.toggleAttribute?.('hide-title', config?.show_title === false);
    this._open = this._open || {};
    this._messages = this._messages || {};
    if (this._hass) this._render(true);
  }

  set hass(hass) {
    var first = !this._hass;
    this._hass = hass;
    var data = entOneData(hass, this._config?.config_entry_id);
    var key = data ? data.states : null;
    // Only redraw when one of the account's sensors changed.
    var changed = first || !key !== !this._lastKey || (key?.some((st, i) => st !== this._lastKey[i]));
    if (changed) {
      this._lastKey = key;
      // A new successful update clears the error shown since the one before.
      if (this._error && data?.updated && data.updated !== this._errorAt) this._error = '';
      this._render();
    }
  }

  connectedCallback() {
    this._onOutside = this._onOutside || ((ev) => {
      var anyOpen = Object.keys(this._open || {}).length > 0;
      if ((!this._confirm && !anyOpen) || ev.composedPath().indexOf(this) !== -1 || entOneInDialog(ev)) return;
      // Like the other cards: a click elsewhere closes the popup and folds the open rows.
      this._confirm = null;
      this._open = {};
      this._render(true);
    });
    document.addEventListener('click', this._onOutside, true);
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === 'function') {
      this._pillResize = this._pillResize || new ResizeObserver((entries) => {
        var w = Math.round(entries[entries.length - 1].contentRect.width);
        if (w === this._pillWidth) return;
        this._pillWidth = w;
        cancelAnimationFrame(this._pillFrame);
        this._pillFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._pillResize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onOutside, true);
    this._pillResize?.disconnect();
    this._pillWidth = null;
    // Leaving the page (view change, conditional card hidden) closes the popup without doing anything.
    if (this._confirm || Object.keys(this._open || {}).length) {
      this._confirm = null;
      this._open = {};
      this._render(true);
    }
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: 'auto' };
  }

  _t() {
    return entOneT(this._hass, this._config);
  }

  _locale() {
    return entOneLocale(this._hass, this._config);
  }

  _compact() {
    return false;
  }

  _detailButton() {
    return '';
  }

  _ensureShell() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = '<style>' + EntOneCard._styles() + '</style><ha-card><div class="header" data-head></div><div class="popup" hidden></div><div class="body"></div></ha-card>';
    var card = this._root.querySelector('ha-card');
    card.addEventListener('click', this._onClick.bind(this));
    card.addEventListener('keydown', (ev) => {
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.hasAttribute?.('data-toggle')) {
        ev.preventDefault();
        this._toggleRow(ev.target.getAttribute('data-toggle'));
      } else if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.getAttribute?.('data-action') === 'read') {
        ev.preventDefault();
        ev.target.click();
      }
    });
  }

  _render() {
    if (!this._config || !this._hass) return;
    this._ensureShell();
    entOneSetTimeFormat(this._hass);
    var t = this._t();
    var data = entOneData(this._hass, this._config.config_entry_id);
    this._data = data;
    this._root.querySelector('ha-card').classList.toggle('mini', this._compact());
    this._renderHeader(t, data);
    this._fitPill();
    this._renderPopup(t, data);
    var body = this._root.querySelector('.body');
    if (!data) {
      entOneMorph(body, '<div class="pad empty">' + entOneEsc(t.no_entity) + '</div>');
      return;
    }
    if (data.unavailable) {
      entOneMorph(body, '<div class="pad empty">' + entOneEsc(t.unavailable) + '</div>');
      return;
    }
    // The rows are patched in place (entOneMorph): the focused toggle keeps the focus, or gets it back if replaced.
    var focused = this._root.activeElement?.getAttribute?.('data-toggle');
    entOneMorph(body, this._renderTiles(t, data) + (this._compact() ? '' : this._renderSections(t, data)));
    if (focused && this._root.activeElement?.getAttribute?.('data-toggle') !== focused) body.querySelector(`[data-toggle="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
    entOneHydrate(body, this._hass, data.entryId);
  }

  _time(iso) {
    return entOneTime(iso, this._locale());
  }

  // The status pill goes on the title row, right after the title, only when the whole title and the pill's whole
  // label fit there; otherwise it takes its own line under the subtitle (.pill-below) and the title keeps its row
  // (cut only when it does not fit alone). The subtitle then keeps one line (its whole text in its tooltip), and when
  // the block still runs out of the banner or into its ground strip, or the label does not fit its own line, the pill
  // keeps its dot alone (.pill-dot, the label in its tooltip and aria-label). Measured after each render and on each
  // new width, never by a fixed width, so that every language fits.
  _fitPill() {
    // Home Assistant's <ha-card> (a Lit element) shows its content only from its first update, a microtask after it
    // is connected: measured before, everything is 0 px wide and the pill lands on the wrong line. Fitted then.
    var haCard = this._root?.querySelector?.('ha-card');
    if (haCard && haCard.hasUpdated === false) {
      this._pillWait ??= (haCard.updateComplete?.then ? haCard.updateComplete : new Promise((r) => requestAnimationFrame(r))).then(() => {
        this._pillWait = null;
        this._fitPill();
      });
      return;
    }
    var t = this._root?.querySelector?.('.titles');
    var chip = t?.querySelector('.status');
    if (!chip?.getBoundingClientRect) return;
    t.classList.remove('pill-below', 'pill-dot');
    var sub = t.querySelector('.sub');
    sub?.removeAttribute('title');
    if (!chip.querySelector('.status-text')?.getClientRects().length) return;
    var avail = t.getBoundingClientRect().width;
    var gap = parseFloat(getComputedStyle(chip.parentElement).columnGap) || 0;
    var width = chip.getBoundingClientRect().width;
    if (entOneTextWidth(t.querySelector('.name')) + gap + width <= avail + 0.01) return;
    t.classList.add('pill-below');
    if (sub && sub.scrollWidth > sub.clientWidth) sub.title = sub.textContent.trim();
    var banner = t.closest('.banner');
    var box = banner?.getBoundingClientRect();
    var floor = banner?.querySelector('.eo-ground')?.getBoundingClientRect().top ?? box?.bottom;
    var r = t.getBoundingClientRect();
    var out = box && (r.top < box.top - 0.5 || r.bottom > floor + 0.5);
    if (out || width > avail + 0.01) t.classList.add('pill-dot');
  }

  _renderHeader(t, data) {
    var c = this._config;
    var header = this._root.querySelector('[data-head]');
    var title = c.title || (data?.account.schools?.[0]) || t.default_title;
    // The children's first names (or the classes of a staff account) say whose ENT this is.
    var who = '';
    if (data) {
      var names = data.children.map((ch) => ch.first_name).filter(Boolean);
      who = names.length ? names.join(' · ') : (data.account.classes || []).join(', ');
    }
    var updated = data?.updated ? entOneFormat(t.last_update, { time: this._time(data.updated) }) : '';
    // The status pill, right after the title: green (classic header) or in the header icon's colour (banner). It goes
    // on a line of its own under the subtitle when the whole title and its label do not fit side by side (see
    // _fitPill), and on a very narrow card only its dot stays (its text stays in its title and aria-label).
    var st = entOneHeaderState(data, c);
    var pill = '';
    if (data) {
      var kind = c.illustration === false ? (data.unavailable ? 'bad' : data.stale.length ? 'warn' : 'ok') : st.status;
      var text = data.unavailable ? t.offline : data.stale.length ? t.partial : t.up_to_date;
      pill = '<span class="status ' + kind + '" title="' + entOneEsc(updated || text) + '" aria-label="' + entOneEsc(text) + '"><span class="dot"></span><span class="status-text">' + entOneEsc(text) + '</span></span>';
    }
    var titles = (s) => '<div class="titles"><div class="title-row"><div class="name">' + entOneEsc(title) + '</div>' + pill + '</div>' + s + '</div>';
    var buttons = '';
    if (data && !this._compact()) {
      if (c.show_refresh) {
        buttons += '<button class="hbtn refresh-btn' + (this._refreshing ? ' spinning' : '') + '" data-action="refresh" aria-label="' + entOneEsc(t.refresh) + '" title="' + entOneEsc(t.refresh) + '"><ha-icon icon="mdi:refresh"></ha-icon></button>';
      }
      if (data.url) {
        buttons += '<button class="hbtn" data-action="open" aria-label="' + entOneEsc(t.open_ent) + '" title="' + entOneEsc(t.open_ent) + '"><ha-icon icon="mdi:open-in-new"></ha-icon></button>';
      }
    }
    var sub = this._error
      ? '<div class="sub error"><span>' + entOneEsc(this._error) + '</span><button class="dismiss" data-action="dismiss" aria-label="' + entOneEsc(t.close) + '" title="' + entOneEsc(t.close) + '"><ha-icon icon="mdi:close"></ha-icon></button></div>'
      : who ? '<div class="sub">' + entOneEsc(who) + '</div>' : '';
    if (c.illustration === false) {
      header.className = 'header';
      entOneMorph(header,
        '<div class="title"><div class="logo" aria-hidden="true">' + ENT_ONE_ICON + '</div>' +
        titles(sub) + '</div>' +
        (buttons ? '<div class="buttons">' + buttons + '</div>' : '') + this._detailButton(t));
      return;
    }
    // The illustrated header: the school corner at the right, the status in the icon's colour (and in the pill), the
    // buttons at the top right.
    this._uid = this._uid || ++entOneUid;
    var tools = buttons + this._detailButton(t);
    header.className = 'banner' + (entOneIsNight(this._hass, c) ? ' night' : '');
    entOneMorph(header,
      entOneSceneSvg(st, header.classList.contains('night'), this._uid, !!tools) + '<div class="eo-ground"></div>' +
      '<div class="htext"><div class="logo ' + st.status + '" title="' + entOneEsc(updated || title) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' + ENT_ONE_SCHOOL_PATH + '"/></svg>' +
      '<span class="brand" aria-hidden="true">' + ENT_ONE_ICON + '</span></div>' +
      titles(sub) + '</div>' +
      (tools ? '<div class="hbtns">' + tools + '</div>' : ''));
  }

  // Confirmation popup at the top of the card (card convention), never centered on the screen.
  _renderPopup(t, data) {
    var popup = this._root.querySelector('.popup');
    var w = this._confirm && data ? data.words.find((x) => String(x.id) === this._confirm.id && String(x.child_id) === this._confirm.child) : null;
    if (!w) {
      this._confirm = null;
      popup.hidden = true;
      entOneMorph(popup, '');
      return;
    }
    popup.hidden = false;
    entOneMorph(popup,
      '<div class="popup-title">' + entOneEsc(t.sign_title) + '</div>' +
      '<div class="popup-text">' + entOneEsc(entOneFormat(t.sign_text, { title: w.title || '—', child: w.child || '' })) + '</div>' +
      (w.text ? '<div class="item-text quote">' + entOneEsc(w.text) + '</div>' : '') +
      '<div class="popup-actions"><button class="act ghost" data-action="cancel">' + entOneEsc(t.cancel) + '</button>' +
      '<button class="act" data-action="confirm"' + (this._confirm.busy ? ' disabled' : '') + '>' + entOneEsc(this._confirm.busy ? t.signing : t.confirm) + '</button></div>');
  }

  _renderTiles(t, data) {
    var toSign = data.words.filter((w) => !w.signed).length;
    var todo = data.homework.filter((h) => !h.done).length;
    var tile = (value, label, icon, hot, tab) =>
      '<button class="tile' + (hot ? ' hot' : '') + '" data-action="goto" data-tab="' + tab + '" aria-label="' + entOneEsc(value + ' ' + label) + '">' +
      '<span class="v"><ha-icon icon="' + icon + '"></ha-icon>' + value + '</span><span class="l">' + entOneEsc(label) + '</span></button>';
    // A count follows its section's option: hiding the homework hides its count too.
    var c = this._config;
    var tiles = [
      c.show_messages ? tile(data.unread, t.tile_messages, 'mdi:email-outline', false, 'messages') : '',
      c.show_words ? tile(toSign, t.tile_words, 'mdi:notebook-edit-outline', toSign > 0, 'words') : '',
      c.show_homework ? tile(todo, t.tile_homework, 'mdi:pencil-outline', false, 'homework') : '',
    ].filter(Boolean);
    if (!tiles.length) return '';
    return '<div class="tiles" style="grid-template-columns: repeat(' + tiles.length + ', minmax(0, 1fr))">' + tiles.join('') + '</div>';
  }

  _section(key, title, rows, empty, extra) {
    // An empty section is left out (but homework, which says "nothing to do"), unless show_empty.
    if (!rows.length && !this._config.show_empty && key !== 'homework') return '';
    return '<div class="section" data-section="' + key + '"><div class="section-title">' + entOneEsc(title) + '</div>' +
      (rows.length ? rows.join('') : '<div class="empty">' + entOneEsc(empty) + '</div>') +
      (extra ? '<div class="more">' + entOneEsc(extra) + '</div>' : '') + '</div>';
  }

  _renderSections(t, data) {
    var c = this._config;
    var max = Math.max(1, Number(c.max_items) || ENT_ONE_DEFAULTS.max_items);
    var locale = this._locale();
    var isOpen = (key) => !!this._open[key];
    // With the panel, words and messages are read in its reading pane.
    var reader = !!this._hass?.panels?.[ENT_ONE_PANEL_PATH];
    var entryId = data.entryId;
    var limit = (list) => ({ shown: list.slice(0, max), rest: Math.max(0, list.length - max) });
    var more = (n) => (n ? entOneFormat(t.more, { n: n }) : '');
    var html = '';
    if (c.show_words) {
      var canSign = entOneCanSign(this._hass);
      var words = limit(data.words.filter((w) => !w.signed));
      html += this._section('words', t.section_words, words.shown.map((w) => entOneWordRow(w, t, locale, { canSign: canSign, isOpen: isOpen, reader: reader, entryId: entryId })), t.no_words, more(words.rest));
    }
    if (c.show_homework) {
      var hw = limit(entOneSortedHomework(data.homework, c.show_done));
      html += this._section('homework', t.section_homework, hw.shown.map((h) => entOneHomeworkRow(h, t, locale, { isOpen: isOpen, entryId: entryId, canEdit: entOneCanSign(this._hass) })), t.no_homework, more(hw.rest));
    }
    if (c.show_messages) {
      var msgs = limit(data.messages.filter((m) => m.unread || this._open['message:' + m.id]));
      html += this._section('messages', t.section_messages, msgs.shown.map((m) => entOneMessageRow(m, t, locale, { url: data.url, isOpen: isOpen, detail: this._messages[m.id], reader: reader, entryId: entryId })), t.no_messages, more(msgs.rest));
    }
    if (c.show_events) {
      var events = limit(entOneUpcomingEvents(data.events));
      html += this._section('events', t.section_events, events.shown.map((e) => entOneEventRow(e, t, locale, { isOpen: isOpen })), t.no_events, more(events.rest));
    }
    if (c.show_news) {
      var news = limit(data.news);
      html += this._section('news', t.section_news, news.shown.map((n) => entOneNewsRow(n, t, locale, { isOpen: isOpen, entryId: entryId })), t.no_news, more(news.rest));
    }
    if (c.show_blog) {
      var posts = limit(data.blog);
      html += this._section('blog', t.section_blog, posts.shown.map((b) => entOneBlogRow(b, t, locale, { isOpen: isOpen, entryId: entryId, reader: reader })), t.no_blog, more(posts.rest));
    }
    return html;
  }

  _toggleRow(key) {
    if (this._open[key]) delete this._open[key];
    else {
      this._open[key] = true;
      if (key.indexOf('message:') === 0 && this._data) {
        entOneLoadMessage(this._hass, this._data.entryId, key.slice(8), this._messages, () => this._render(true));
      }
    }
    this._render(true);
  }

  // A count opens the panel on its tab; without the panel, the card scrolls to the section (the mini card opens).
  _goto(tab, item) {
    if (this._hass?.panels?.[ENT_ONE_PANEL_PATH]) {
      var params = new URLSearchParams({ tab: tab });
      if (item) params.set('item', item);
      if (this._data && Object.keys(entOneAccounts(this._hass)).length > 1) params.set('entry', this._data.entryId);
      window.history.pushState(null, '', `/${ENT_ONE_PANEL_PATH}?${params}`);
      window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
      return;
    }
    if (this._compact()) this._setZoom?.(true);
    var section = { messages: 'messages', words: 'words', homework: 'homework' }[tab];
    this._root.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  _onClick(ev) {
    var toggle = ev.target.closest ? ev.target.closest('[data-toggle]') : null;
    var el = ev.target.closest ? ev.target.closest('[data-action]') : null;
    if (toggle && !el && !ev.target.closest('a')) {
      ev.stopPropagation();
      this._toggleRow(toggle.getAttribute('data-toggle'));
      return;
    }
    if (!el || !this._data) return;
    var action = el.getAttribute('data-action');
    var data = this._data;
    if (action === 'refresh') this._refresh();
    else if (action === 'open') window.open(data.url, '_blank', 'noopener');
    else if (action === 'detail') this._toggleDetail(ev);
    else if (action === 'goto') {
      ev.stopPropagation();
      this._goto(el.getAttribute('data-tab'));
    } else if (action === 'read') {
      ev.stopPropagation();
      this._goto(el.getAttribute('data-tab'), el.getAttribute('data-item'));
    } else if (action === 'file') {
      ev.stopPropagation();
      entOneOpenFile(this._hass, data.entryId, el.getAttribute('data-path'), el.getAttribute('data-name')).catch((err) => this._fail(err));
    } else if (action === 'dismiss') {
      this._error = '';
      this._render(true);
    } else if (action === 'sign' && entOneCanSign(this._hass)) {
      ev.stopPropagation();
      this._confirm = { id: el.getAttribute('data-id'), child: el.getAttribute('data-child') };
      this._render(true);
    } else if (action === 'cancel') {
      this._confirm = null;
      this._render(true);
    } else if (action === 'confirm') this._doSign();
    else if (action === 'homework') {
      var item = data.homework.find((h) => String(h.id) === el.getAttribute('data-id') && String(h.book_id) === el.getAttribute('data-book'));
      if (item) this._toggleHomework(item);
    }
  }

  _fail(err, prefix) {
    entOneErrorText(this._hass, err).then((text) => {
      this._error = `${prefix || this._t().action_failed} ${text}`;
      this._errorAt = this._data?.updated;
      this._render(true);
    });
  }

  _doSign() {
    var w = this._data.words.find((x) => String(x.id) === this._confirm.id && String(x.child_id) === this._confirm.child);
    if (!w || this._confirm.busy) return;
    this._confirm.busy = true;
    this._error = '';
    this._render(true);
    entOneSign(this._hass, this._data.entryId, w)
      .then(() => {
        this._confirm = null;
        this._render(true);
      })
      .catch((err) => {
        this._confirm = null;
        this._fail(err);
      });
  }

  _toggleHomework(item) {
    if (!entOneCanSign(this._hass)) return;
    this._error = '';
    entOneSetDone(this._hass, this._data.entryId, item, !item.done).catch((err) => this._fail(err));
  }

  _refresh() {
    if (this._refreshing) return;
    this._refreshing = true;
    this._error = '';
    this._render(true);
    entOneRefresh(this._hass, this._data.entryId)
      .catch((err) => this._fail(err, this._t().refresh_failed))
      .finally(() => {
        this._refreshing = false;
        this._render(true);
      });
  }

  static _styles() {
    var A = ENT_ONE_ACCENT;
    return [
      ':host { display: block; }',
      ':host::before { content: ""; display: grid; grid-template-columns: minmax(0, 360px); height: 0; }',
      'ha-card { padding: 0 0 10px; overflow: hidden; container: eo-card / inline-size; }',
      '.header { display: flex; align-items: center; gap: 10px; padding: 12px 10px 8px 12px; min-height: 40px; }',
      '.title { flex: 1 1 0; min-width: calc(5ch + 50px); display: flex; align-items: center; gap: 10px; }',
      '.logo { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; color: ' + A + '; background: color-mix(in srgb, ' + A + ' 16%, transparent); }',
      '.logo > svg { width: 24px; height: 24px; }',
      '.titles { flex: 1 1 0; min-width: 5ch; overflow: hidden; container: eo-titles / inline-size; }',
      ':host([hide-title]) .title-row > .name { display: none; }',
      // The title line: the title, then the status pill, when the whole title and its whole label fit there; otherwise
      // the pill goes on its own line under the subtitle (kept to one line), and when even that is too tight only its
      // dot is left (its text stays in its title and aria-label). Decided by measure (see _fitPill).
      '.title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }',
      '.title-row .name { flex: 0 1 auto; min-width: 0; }',
      '.title-row .status { flex: none; max-width: none; }',
      '.titles.pill-below { display: flex; flex-direction: column; }',
      '.titles.pill-below .title-row { display: contents; }',
      '.titles.pill-below .title-row .status { order: 3; align-self: flex-start; margin-top: 3px; max-width: 100%; }',
      '.titles.pill-below .sub.error { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.titles.pill-dot .title-row .status { padding: 4px; } .titles.pill-dot .status-text { display: none; }',
      '.name { font-size: 16px; font-weight: 500; line-height: 1.25; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.sub.error { display: flex; align-items: flex-start; gap: 4px; white-space: normal; color: color-mix(in srgb, var(--error-color, #db4437) 55%, var(--primary-text-color)); }',
      '.dismiss { all: unset; cursor: pointer; flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; --mdc-icon-size: 14px; }',
      '.dismiss:hover { background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent); }',
      '.dismiss:focus-visible { outline: 2px solid var(--primary-color); }',
      '.status { --c: var(--success-color, #43a047); display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; overflow: hidden; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap;' +
        ' border-radius: 12px; padding: 1px 8px; color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); background: color-mix(in srgb, var(--c) 15%, transparent); }',
      '.status .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c); flex: none; }',
      '.status.warn { --c: var(--warning-color, #ffa600); }',
      '.status.bad { --c: var(--error-color, #db4437); }',
      '.status-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }',
      '.buttons { display: flex; align-items: center; flex: none; }',
      // Plain round buttons (not ha-icon-button, whose inner 40 px button overflows a shrunk host and offsets the icon
      // and its hover ring).
      '.hbtn { all: unset; box-sizing: border-box; cursor: pointer; flex: none; display: grid; place-items: center; width: 28px; height: 28px;' +
        ' border-radius: 50%; color: var(--secondary-text-color); --mdc-icon-size: 16px; transition: background-color .15s, color .15s; }',
      '.hbtn ha-icon { display: flex; }',
      '.buttons .hbtn:hover { background: color-mix(in srgb, var(--secondary-text-color) 14%, transparent); color: var(--primary-text-color); }',
      '.hbtn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }',
      '.spinning ha-icon { animation: ent-one-spin 1s linear infinite; }',
      '@keyframes ent-one-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      '@container (max-width: 320px) { .header { gap: 4px; } .logo { display: none; } }',
      // Very narrow card: only the pill's dot stays, on the title line.
      '@container eo-card (max-width: 200px) { .title-row .status { padding: 4px; } .status-text { display: none; } }',
      '.pad { padding: 4px 16px; }',
      '.tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 0 12px; }',
      '.tile { all: unset; box-sizing: border-box; cursor: pointer; display: block; min-width: 0; padding: 8px 10px; border-radius: 12px; background: color-mix(in srgb, var(--primary-text-color) 5%, transparent); }',
      '.tile:hover { background: color-mix(in srgb, var(--primary-text-color) 9%, transparent); }',
      '.tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }',
      '.tile.hot:hover { background: color-mix(in srgb, ' + A + ' 20%, transparent); }',
      '.tile.hot { background: color-mix(in srgb, ' + A + ' 14%, transparent); }',
      '.tile .v { display: flex; align-items: center; gap: 6px; font-size: 22px; font-weight: 500; line-height: 1.1; color: var(--primary-text-color); --mdc-icon-size: 18px; }',
      '.tile .v ha-icon { color: var(--secondary-text-color); }',
      '.tile.hot .v ha-icon { color: ' + A + '; }',
      '.tile .l { display: block; font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.section { padding: 10px 12px 0; }',
      '.section-title { font-size: 12px; font-weight: 500; color: var(--secondary-text-color); margin-bottom: 2px; }',
      '.more { font-size: 12px; color: var(--secondary-text-color); padding-top: 2px; }',
      entOneItemStyles(A),
      '.popup { margin: 0 12px 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid color-mix(in srgb, ' + A + ' 40%, transparent); background: color-mix(in srgb, ' + A + ' 6%, var(--card-background-color, #fff)); }',
      '.popup[hidden] { display: none; }',
      '.popup-title { font-weight: 500; color: var(--primary-text-color); }',
      '.popup-text { font-size: 13px; color: var(--secondary-text-color); margin-top: 2px; }',
      '.quote { max-height: 8em; overflow: auto; padding: 6px 8px; border-radius: 8px; background: color-mix(in srgb, var(--primary-text-color) 5%, transparent); }',
      '.popup-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }',
      '.act.ghost { color: var(--secondary-text-color); border-color: var(--divider-color, rgba(0,0,0,.2)); }',
      ':host([mini])::before { grid-template-columns: minmax(0, 260px); }',
      '.header { position: relative; }',
      '.header:has(> .detail) { padding-right: 34px; }',
      '.detail { all: unset; position: absolute; z-index: 2; top: 5px; right: 5px; cursor: pointer; width: 24px; height: 24px; border-radius: 50%;' +
        ' display: grid; place-items: center; color: var(--secondary-text-color); --mdc-icon-size: 16px; box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); }',
      '.hbtns .detail { position: static; }',
      '.detail:hover { background: color-mix(in srgb, var(--secondary-text-color) 14%, transparent); color: var(--primary-text-color); }',
      '.detail:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }',
      '@container (max-width: 320px) { ha-card.mini .logo { display: grid; } }',
      '@container (max-width: 200px) { .tiles { grid-template-columns: minmax(0, 1fr); } }',
      '@media (prefers-reduced-motion: reduce) { .spinning ha-icon { animation: none; opacity: .5; } }',
      ENT_ONE_BANNER_STYLES,
    ].join('\n');
  }
}
