// ENT ONE sidebar panel: one tab per ENT application, Settings last. It draws its own content (no Lovelace card
// inside) and reuses the card file's helpers, translations and row renderers (window.EntOne), loaded on demand.
var ENT_ONE_PANEL_TABS = ['home', 'homework', 'words', 'messages', 'news', 'blog', 'settings'];
var ENT_ONE_TAB_KEYS = { home: 'tab_home', homework: 'tab_homework', words: 'tab_words', messages: 'tab_messages', news: 'tab_news', blog: 'tab_blog', settings: 'tab_settings' };

class EntOnePanel extends HTMLElement {
  constructor() {
    super();
    this._tab = this._tabFromUrl();
    this._readUrl();
    // Homework filters are remembered in this browser (storage can be missing or refuse: then they are not).
    var saved = {};
    try {
      saved = JSON.parse(window.localStorage.getItem('ent-one-panel') || '{}') || {};
    } catch (_e) {
      saved = {};
    }
    this._book = typeof saved.book === 'string' ? saved.book : '';
    this._hideDone = saved.hideDone === true;
    this._blogFilter = typeof saved.blog === 'string' ? saved.blog : '';
    // Child chosen in the filter row (Home and Liaison book), '' = all of them.
    this._child = typeof saved.child === 'string' ? saved.child : '';
    // Day picked in the week strip of the home page ('' = the whole week), not remembered.
    this._day = '';
    this._entry = this._entry || '';
    this._open = {};
    // Messages read in full, by id (not `_messages`: that is the tab method).
    this._bodies = {};
  }

  set panel(panel) {
    this._panel = panel;
    this._loadShared();
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._root) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!window.EntOne) {
      this._loadShared();
      return;
    }
    var E = window.EntOne;
    var data = E.data(hass, this._entry);
    var key = data ? data.states : null;
    // The settings form is not redrawn by sensor updates: that would wipe what is being typed.
    if (this._tab === 'settings' && this._root && this._lang === E.lang(hass)) return;
    if (!this._lastKey || !key || key.some((st, i) => st !== this._lastKey[i]) || this._lang !== E.lang(hass)) {
      this._lastKey = key;
      this._render();
    }
  }

  connectedCallback() {
    this._onPop = this._onPop || (() => {
      this._tab = this._tabFromUrl();
      this._readUrl();
      this._render();
    });
    window.addEventListener('popstate', this._onPop);
    if (this._hass && window.EntOne) this._render();
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._onPop);
    this._confirm = null;
  }

  // Item open in the reading pane of the Messages or Liaison book tab, and the account, from the address.
  _readUrl() {
    var params = new URLSearchParams(window.location.search);
    this._item = params.get('item') || '';
    if (params.get('entry')) this._entry = params.get('entry');
  }

  _select(item) {
    if (item === this._item) return;
    this._item = item;
    var params = new URLSearchParams(window.location.search);
    if (item) params.set('item', item);
    else params.delete('item');
    try {
      window.history.pushState(null, '', `${window.location.pathname}?${params}`);
    } catch (_e) {
      /* no history (embedded page): the pane still changes */
    }
    this._render();
    if (item) this._root.querySelector('.reader')?.scrollTo?.(0, 0);
    this._root.querySelector('.post, .tabs')?.scrollIntoView?.({ block: 'nearest' });
  }

  _tabFromUrl() {
    var tab = new URLSearchParams(window.location.search).get('tab');
    return ENT_ONE_PANEL_TABS.indexOf(tab) !== -1 ? tab : 'home';
  }

  // The card file holds the shared code: it is already there when a dashboard loaded it, else imported here.
  _loadShared() {
    if (window.EntOne || this._loading) return;
    var url = this._panel?.config?.card_url || '/ent_one_static/ent-one-card.js';
    this._loading = import(url)
      .catch(() => null)
      .then(() => {
        this._loading = null;
        if (this._hass && window.EntOne) this._render();
      });
  }

  _saveFilters() {
    try {
      window.localStorage.setItem('ent-one-panel', JSON.stringify({ book: this._book, hideDone: this._hideDone, blog: this._blogFilter, child: this._child }));
    } catch (_e) {
      /* private mode, quota: not remembered */
    }
  }

  _setTab(tab) {
    if (tab === this._tab) return;
    this._tab = tab;
    this._confirm = null;
    var params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    params.delete('item');
    this._item = '';
    window.history.pushState(null, '', `${window.location.pathname}?${params}`);
    if (tab === 'settings') this._settings = null;
    this._render();
  }

  _ensureShell() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: 'open' });
    var E = window.EntOne;
    // The illustrated header of the card (school corner, ground bar, status in the icon's colour), across the page.
    this._root.innerHTML =
      '<style>' + (E.banner ? E.banner.styles : '') + EntOnePanel._styles(E.accent) + E.itemStyles(E.accent) + '</style>' +
      '<div class="banner"><div class="scene"></div><div class="eo-ground"></div><div class="htext"><ha-menu-button></ha-menu-button><div class="hinfo"></div></div>' +
      '<div class="hbtns"></div></div><div class="tabbar"><div class="tabs" role="tablist"></div><div class="tb-side"></div></div><div class="content"></div>';
    this._root.addEventListener('click', this._onClick.bind(this));
    this._root.addEventListener('change', this._onChange.bind(this));
    this._root.addEventListener('keydown', (ev) => {
      if ((ev.key === 'Enter' || ev.key === ' ') && (ev.target.hasAttribute?.('data-toggle') || ev.target.hasAttribute?.('data-select') || ev.target.getAttribute?.('data-action') === 'read')) {
        ev.preventDefault();
        ev.target.click();
      } else if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && ev.target.hasAttribute?.('data-select')) {
        ev.preventDefault();
        var next = ev.key === 'ArrowDown' ? ev.target.nextElementSibling : ev.target.previousElementSibling;
        if (next?.hasAttribute('data-select')) {
          this._select(next.getAttribute('data-select'));
          this._root.querySelector(`[data-select="${CSS.escape(next.getAttribute('data-select'))}"]`)?.focus();
        }
      }
    });
    // Tabs: arrows, Home and End move between them (WAI-ARIA tabs pattern).
    this._root.querySelector('.tabs').addEventListener('keydown', (ev) => {
      var tabs = this._shownTabs || ENT_ONE_PANEL_TABS;
      var i = tabs.indexOf(this._tab);
      var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[ev.key];
      if (next === undefined) return;
      ev.preventDefault();
      this._setTab(tabs[(next + tabs.length) % tabs.length]);
      this._root.querySelector('.tab.on')?.focus();
    });
  }

  _render() {
    if (!this._hass || !window.EntOne) return;
    this._ensureShell();
    var E = window.EntOne;
    E.setTimeFormat(this._hass);
    var t = E.t(this._hass);
    this._lang = E.lang(this._hass);
    // The panel is not among the cards the language loader redraws: draw again once the language file is in.
    if (!E.langReady(this._hass) && !this._langRetry) {
      this._langRetry = setTimeout(() => {
        this._langRetry = null;
        if (this._tab === 'settings') this._settings = null;
        this._render();
      }, 250);
    }
    var menu = this._root.querySelector('ha-menu-button');
    menu.hass = this._hass;
    menu.narrow = this._narrow;
    var accounts = E.accounts(this._hass);
    var ids = Object.keys(accounts);
    if (this._entry && ids.indexOf(this._entry) === -1) this._entry = '';
    var data = E.data(this._hass, this._entry || ids[0]);
    this._data = data;
    // Tabs hidden in the options are left out, with their part of the home page.
    var shown = ENT_ONE_PANEL_TABS.filter((tab) => tab === 'home' || tab === 'settings' || !data || data.panelTabs.indexOf(tab) !== -1);
    // The top bar hidden (option): the tabs stay, with the menu button at their left and the buttons at their right.
    var mode = data?.hideHeader || 'off';
    var bare = mode === 'all' || (mode === 'non_admin' && this._hass.user?.is_admin === false);
    this._root.host.toggleAttribute('bare', bare);
    var tabbar = this._root.querySelector('.tabbar');
    if (bare && menu.parentElement !== tabbar) tabbar.prepend(menu);
    else if (!bare && menu.parentElement === tabbar) this._root.querySelector('.htext').prepend(menu);
    this._renderHeader(t, data, shown);
    var hbtns = this._root.querySelector('.hbtns');
    this._root.querySelector('.tb-side').innerHTML = (bare ? hbtns.innerHTML : '') + (ids.length > 1
      ? '<select class="account" aria-label="' + E.esc(t.account) + '">' +
        ids.map((id) => {
          var d = E.data(this._hass, id);
          var name = (d.account.schools?.[0]) || d.account.name || id;
          return '<option value="' + E.esc(id) + '"' + (id === (data?.entryId) ? ' selected' : '') + '>' + E.esc(name) + '</option>';
        }).join('') + '</select>'
      : '');
    if (bare) hbtns.innerHTML = '';
    this._shownTabs = shown;
    if (shown.indexOf(this._tab) === -1) this._tab = 'home';
    this._root.querySelector('.tabs').innerHTML = shown.map((tab) => {
      var count = data ? this._count(tab, data) : 0;
      var on = tab === this._tab;
      return '<button role="tab" class="tab' + (on ? ' on' : '') + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-tab="' + tab + '">' +
        E.esc(t[ENT_ONE_TAB_KEYS[tab]]) + (count ? ' <span class="badge">' + count + '</span>' : '') + '</button>';
    }).join('');
    var content = this._root.querySelector('.content');
    if (this._tab === 'settings') {
      this._renderSettings(content, t);
      return;
    }
    if (!data) {
      content.innerHTML = '<div class="page"><div class="empty">' + E.esc(t.no_account) + '</div></div>';
      return;
    }
    if (data.unavailable) {
      content.innerHTML = '<div class="page"><div class="empty">' + E.esc(t.unavailable) + '</div></div>';
      return;
    }
    var html = { home: this._home, homework: this._homework, words: this._words, messages: this._messages, news: this._news, blog: this._blog }[this._tab].call(this, t, data);
    var mail = this._tab === 'messages' || this._tab === 'words';
    content.innerHTML = '<div class="page' + (mail ? ' wide' : '') + '">' + (this._error ? '<div class="error-text errbar">' + E.esc(this._error) + '</div>' : '') + this._popup(t, data) + html + '</div>';
    E.hydrate(content, this._hass, data.entryId);
  }

  _count(tab, data) {
    if (tab === 'words') return data.words.filter((w) => !w.signed).length;
    if (tab === 'homework') return data.homework.filter((h) => !h.done).length;
    if (tab === 'messages') return data.unread;
    return 0;
  }

  _time(iso) {
    return window.EntOne.time(iso, window.EntOne.locale(this._hass));
  }

  _box(title, body, wide) {
    return '<section class="box' + (wide ? ' wide' : '') + '">' + (title ? '<h2>' + window.EntOne.esc(title) + '</h2>' : '') + body + '</section>';
  }

  _list(rows, empty) {
    return rows.length ? rows.join('') : '<div class="empty">' + window.EntOne.esc(empty) + '</div>';
  }

  // The card's illustrated header: the school corner and its ground bar, the school icon in the status colour with
  // the ONE panda as badge, the title with its status pill, the children's names, and round glass buttons.
  _renderHeader(t, data, shown) {
    var E = window.EntOne;
    var B = E.banner;
    var banner = this._root.querySelector('.banner');
    var night = B ? B.isNight(this._hass, {}) : false;
    banner.classList.toggle('night', night);
    var on = (tab) => shown.indexOf(tab) !== -1;
    var st = B ? B.state(data, { show_messages: on('messages'), show_homework: on('homework'), show_words: on('words') }) : { status: 'idle', kind: 'done', unread: 0 };
    this._uid = this._uid || 'p' + Math.floor(Math.random() * 1e6);
    banner.querySelector('.scene').innerHTML = B ? B.scene(st, night, this._uid, false) : '';
    var title = (data?.account.schools?.[0]) || t.default_title;
    var updated = data?.updated ? E.format(t.last_update, { time: this._time(data.updated) }) : '';
    var names = data ? data.children.map((ch) => ch.first_name).filter(Boolean) : [];
    var who = names.length ? names.join(' · ') : (data?.account.classes || []).join(', ');
    var pill = '';
    if (data) {
      var text = data.unavailable ? t.offline : data.stale.length ? t.partial : t.up_to_date;
      pill = '<span class="status ' + st.status + '" title="' + E.esc(updated || text) + '"><span class="dot"></span>' + E.esc(text) + '</span>';
    }
    banner.querySelector('.hinfo').innerHTML =
      '<div class="logo ' + st.status + '" title="' + E.esc(updated || title) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' + (B ? B.schoolPath : '') + '"/></svg>' +
      '<span class="brand" aria-hidden="true">' + E.icon + '</span></div>' +
      '<div class="titles"><div class="title-row"><div class="name">' + E.esc(title) + '</div>' + pill + '</div>' +
      '<div class="sub">' + E.esc([who, updated].filter(Boolean).join(' · ')) + '</div></div>';
    banner.querySelector('.hbtns').innerHTML =
      (data ? '<button class="hbtn' + (this._refreshing ? ' spinning' : '') + '" data-action="refresh" aria-label="' + E.esc(t.refresh) + '" title="' + E.esc(t.refresh) + '"><ha-icon icon="mdi:refresh"></ha-icon></button>' : '') +
      (data?.url ? '<button class="hbtn" data-action="open" aria-label="' + E.esc(t.open_ent) + '" title="' + E.esc(t.open_ent) + '"><ha-icon icon="mdi:open-in-new"></ha-icon></button>' : '');
  }

  // Children of the account, the chosen one dropped when it is gone.
  _children(data) {
    var kids = data.children.filter((ch) => ch.id || ch.first_name);
    if (this._child && !kids.some((ch) => String(ch.id) === this._child)) this._child = '';
    return kids;
  }

  // The filter row: All, then one chip per child (initial, first name, words left to sign). Only with 2+ children.
  _childChips(t, data) {
    var E = window.EntOne;
    var kids = this._children(data);
    if (kids.length < 2) return '';
    var left = (id) => data.words.filter((w) => !w.signed && (!id || String(w.child_id) === id)).length;
    var chip = (id, label, i) => {
      var n = left(id);
      return '<button class="kid' + (this._child === id ? ' on' : '') + '" data-child="' + E.esc(id) + '" aria-pressed="' + (this._child === id) + '">' +
        (id ? '<span class="avatar c' + (i % 4) + '">' + E.esc((label || '?').charAt(0).toUpperCase()) + '</span>' : '') +
        E.esc(label) + (n ? '<span class="badge">' + n + '</span>' : '') + '</button>';
    };
    return '<div class="kids">' + chip('', t.all, 0) + kids.map((ch, i) => chip(String(ch.id), ch.first_name || ch.last_name, i)).join('') + '</div>';
  }

  _myWords(data) {
    return data.words.filter((w) => !this._child || String(w.child_id) === this._child);
  }

  // The school week: Monday to Friday (Saturday and Sunday when something falls on them), the next week from
  // Saturday on. Each day carries the homework left for it and a dot for an event; a click keeps only that day.
  _week(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var now = new Date();
    var today = iso(now);
    var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + (now.getDay() === 6 || now.getDay() === 0 ? 7 : 0));
    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      var key = iso(d);
      var hw = data.homework.filter((h) => !h.done && String(h.date).slice(0, 10) === key).length;
      var ev = data.events.some((e) => String(e.start || '').slice(0, 10) === key);
      if (i < 5 || hw || ev) days.push({ key: key, d: d, hw: hw, ev: ev });
    }
    if (this._day && !days.some((x) => x.key === this._day)) this._day = '';
    var label = (d) => {
      try {
        return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
      } catch (_e) {
        return d.toDateString().slice(0, 10);
      }
    };
    return '<div class="week" role="group" aria-label="' + E.esc(t.this_week) + '">' + days.map((x) =>
      '<button class="wday' + (x.hw ? ' hw' : '') + (x.key === today ? ' today' : '') + (x.key === this._day ? ' on' : '') + (x.key < today ? ' past' : '') + '" data-day="' + x.key + '" aria-pressed="' + (x.key === this._day) + '">' +
      '<span class="wl">' + E.esc(label(x.d)) + '</span>' + (x.hw ? '<span class="wn">' + x.hw + '</span>' : '') + (x.ev ? '<span class="wev" aria-hidden="true"></span>' : '') + '</button>').join('') + '</div>';
  }

  // A tile of the chart: neutral surface, round tinted pastille (count as badge), name and a coloured state line.
  _tile(tab, icon, color, name, state, count) {
    var E = window.EntOne;
    return '<button class="tile ' + (count ? color : 'rest') + '" data-tab="' + tab + '"><span class="pastille"><ha-icon icon="' + icon + '"></ha-icon>' +
      (count ? '<span class="pbadge">' + (count > 99 ? '99+' : count) + '</span>' : '') + '</span>' +
      '<span class="tl"><span class="tn">' + E.esc(name) + '</span><span class="ts">' + E.esc(state) + '</span></span></button>';
  }

  _home(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var R = E.rows;
    var isOpen = (key) => !!this._open[key];
    var on = (tab) => data.panelTabs.indexOf(tab) !== -1;
    // The week strip counts homework: left out with the Homework tab, its day filter cleared.
    if (!on('homework')) this._day = '';
    var day = this._day;
    var toSign = this._myWords(data).filter((w) => !w.signed);
    var todo = E.sortedHomework(data.homework, false).filter((h) => !day || String(h.date).slice(0, 10) === day);
    var events = E.upcomingEvents(data.events).filter((e) => !day || String(e.start || '').slice(0, 10) === day);
    var unread = data.messages.filter((m) => m.unread);
    var next = events[0];
    var tiles = [
      on('words') ? this._tile('words', 'mdi:notebook-edit-outline', 'red', t.section_words, toSign.length ? toSign.length + ' ' + t.tile_words : t.no_words, toSign.length) : '',
      on('homework') ? this._tile('homework', 'mdi:pencil-outline', 'amber', t.section_homework, todo.length ? todo.length + ' ' + t.tile_homework : t.no_homework, todo.length) : '',
      on('messages') ? this._tile('messages', 'mdi:email-outline', 'blue', t.section_messages, data.unread ? data.unread + ' ' + t.tile_messages : t.no_messages, data.unread) : '',
      '<div class="tile rest static"><span class="pastille"><ha-icon icon="mdi:calendar-blank-outline"></ha-icon></span><span class="tl"><span class="tn">' + E.esc(t.section_events) + '</span>' +
        '<span class="ts">' + E.esc(next ? [next.title, E.day(next.start, t, locale)].filter(Boolean).join(' · ') : t.no_events) + '</span></span></div>',
    ].filter(Boolean);
    var see = (tab) => (on(tab) ? '<button class="see" data-tab="' + tab + '">' + E.esc(t.see_all) + ' ›</button>' : '');
    var todoRows = (on('words') ? toSign.map((w) => R.word(w, t, locale, { canSign: E.canSign(this._hass), isOpen: isOpen, reader: true, entryId: data.entryId })) : [])
      .concat(on('homework') ? todo.slice(0, 6).map((h) => R.homework(h, t, locale, { isOpen: isOpen, entryId: data.entryId, canEdit: E.canSign(this._hass) })) : []);
    var readRows = (on('messages') ? unread.slice(0, 4).map((m) => R.message(m, t, locale, { reader: true, entryId: data.entryId })) : [])
      .concat(on('news') ? data.news.slice(0, 3).map((n) => R.news(n, t, locale, { isOpen: isOpen, entryId: data.entryId })) : []);
    var box = (cls, title, side, rows, empty) =>
      '<section class="box ' + cls + '"><div class="bh"><h2>' + E.esc(title) + '</h2>' + side + '</div>' + this._list(rows, empty) + '</section>';
    return this._childChips(t, data) + (on('homework') ? this._week(t, data) : '') +
      '<div class="tiles" style="grid-template-columns: repeat(' + tiles.length + ', minmax(0, 1fr))">' + tiles.join('') + '</div>' +
      '<div class="dgrid">' +
      (on('words') || on('homework') ? box('todo-box', t.section_todo, see(on('homework') ? 'homework' : 'words'), todoRows, t.nothing_to_do) : '') +
      (on('messages') || on('news') ? box('read-box', t.section_to_read, see(on('messages') ? 'messages' : 'news'), readRows, t.nothing_to_read) : '') +
      box('agenda-box', t.section_events, '', events.slice(0, 6).map((e) => R.event(e, t, locale, { isOpen: isOpen })), t.no_events) +
      '</div>';
  }

  // Homework: the notebook chips, then one tile per due day with how much of it is done.
  _homework(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var books = Object.keys(data.books);
    if (this._book && books.indexOf(this._book) === -1) this._book = '';
    var chips =
      '<div class="filters">' +
      [['', t.all]].concat(books.map((b) => [b, data.books[b]])).map((b) => '<button class="filter' + (this._book === b[0] ? ' on' : '') + '" data-book="' + E.esc(b[0]) + '">' + E.esc(b[1]) + '</button>').join('') +
      '<label class="toggle"><input type="checkbox" data-action="hide-done"' + (this._hideDone ? ' checked' : '') + '> ' + E.esc(t.hide_done) + '</label></div>';
    var mine = data.homework.filter((h) => !this._book || h.book_id === this._book);
    var days = [];
    mine.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach((h) => {
      var last = days[days.length - 1];
      if (!last || last.date !== h.date) days.push({ date: h.date, all: [h] });
      else last.all.push(h);
    });
    var tiles = days.map((d) => {
      var done = d.all.filter((h) => h.done).length;
      var items = E.sortedHomework(d.all, !this._hideDone);
      if (!items.length) return '';
      var full = done === d.all.length;
      return '<section class="box day' + (full ? ' full' : '') + '"><div class="bh"><h2>' + E.esc(E.day(d.date, t, locale)) + '</h2><span class="ratio">' + done + ' / ' + d.all.length + '</span></div>' +
        '<div class="bar"><span style="width:' + Math.round((done / d.all.length) * 100) + '%"></span></div>' +
        items.map((h) => E.rows.homework(h, t, locale, { full: true, entryId: data.entryId, canEdit: E.canSign(this._hass) })).join('') + '</section>';
    }).join('');
    return chips + (tiles ? '<div class="days">' + tiles + '</div>' : this._box('', '<div class="empty">' + E.esc(t.no_homework) + '</div>', true));
  }

  // Liaison book and Messages: a list on the left and a reading pane on the right, like a mail client. On a narrow
  // screen the list fills the page, and the item opened replaces it (Back returns to the list).
  _mail(list, reader, empty, placeholder, icon, short) {
    var E = window.EntOne;
    var t = E.t(this._hass);
    var open = !!reader;
    return '<div class="mail' + (open ? ' has-item' : '') + (short ? ' short' : '') + '">' +
      '<div class="mlist" role="listbox">' + (list.length ? list.join('') : '<div class="empty pad">' + E.esc(empty) + '</div>') + '</div>' +
      '<div class="reader">' + (open
        ? '<button class="back" data-action="back"><ha-icon icon="mdi:arrow-left"></ha-icon>' + E.esc(t.back) + '</button>' + reader
        : '<div class="placeholder"><ha-icon icon="' + icon + '"></ha-icon><span>' + E.esc(placeholder) + '</span></div>') +
      '</div></div>';
  }

  _mrow(id, on, unread, icon, title, meta, side) {
    var E = window.EntOne;
    return '<div class="mrow' + (on ? ' on' : '') + (unread ? ' unread' : '') + '" role="option" tabindex="0" aria-selected="' + on + '" data-select="' + E.esc(id) + '">' +
      '<ha-icon class="mrow-icon" icon="' + icon + '"></ha-icon><div class="mrow-main"><div class="mrow-title">' + E.esc(title) + '</div>' +
      '<div class="mrow-meta">' + E.esc(meta) + '</div></div>' + (side || '') + '</div>';
  }

  _readerHead(title, meta, side) {
    var E = window.EntOne;
    return '<div class="rhead"><div class="rhead-main"><h2 class="rtitle">' + E.esc(title) + '</h2><div class="rmeta">' + E.esc(meta) + '</div></div>' + (side || '') + '</div>';
  }

  _when(raw, t, locale) {
    var E = window.EntOne;
    var time = raw && String(raw).length > 10 ? E.time(raw, locale) : '';
    return [E.day(raw, t, locale), time].filter(Boolean).join(' · ');
  }

  _words(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var words = this._myWords(data).slice().sort((a, b) => (a.signed === b.signed ? 0 : a.signed ? 1 : -1));
    var canSign = E.canSign(this._hass);
    var key = (w) => w.id + ':' + w.child_id;
    var sel = words.find((w) => key(w) === this._item);
    var list = words.map((w) =>
      this._mrow(key(w), w === sel, !w.signed, w.signed ? 'mdi:check-circle-outline' : 'mdi:notebook-edit-outline', w.title || w.category || '—',
        [w.child, E.day(w.date, t, locale)].filter(Boolean).join(' · '),
        (w.attachments || []).length ? '<ha-icon class="mrow-side" icon="mdi:paperclip"></ha-icon>' : ''));
    var reader = '';
    if (sel) {
      var side = sel.signed
        ? '<span class="chip ok">' + E.esc(t.signed) + '</span>'
        : canSign
          ? '<button class="act" data-action="sign" data-id="' + E.esc(sel.id) + '" data-child="' + E.esc(sel.child_id) + '">' + E.esc(t.sign) + '</button>'
          : '<span class="chip">' + E.esc(t.tile_words) + '</span>';
      reader = this._readerHead(sel.title || sel.category || '—', [sel.child, sel.author, this._when(sel.date, t, locale)].filter(Boolean).join(' · '), side) +
        (sel.text ? '<div class="rbody">' + E.esc(sel.text) + '</div>' : '') + E.files(sel.attachments, t, data.entryId, true);
    }
    var chips = this._childChips(t, data);
    return chips + this._mail(list, reader, t.no_words, t.select_word, 'mdi:notebook-outline', !!chips);
  }

  _messages(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var sel = data.messages.find((m) => String(m.id) === this._item);
    // Opening a message reads it in the ENT (which marks it read): only the one chosen is fetched.
    if (sel && !this._bodies[sel.id]) E.loadMessage(this._hass, data.entryId, sel.id, this._bodies, () => this._render());
    var list = data.messages.map((m) =>
      this._mrow(String(m.id), m === sel, m.unread, m.unread ? 'mdi:email-outline' : 'mdi:email-open-outline', m.subject || '—',
        [m.sender, E.day(m.date, t, locale)].filter(Boolean).join(' · '),
        m.attachment ? '<ha-icon class="mrow-side" icon="mdi:paperclip"></ha-icon>' : ''));
    var reader = '';
    if (sel) {
      var detail = this._bodies[sel.id];
      var link = data.url ? '<button class="act ghost" data-action="open-messages">' + E.esc(t.open_ent) + '</button>' : '';
      reader = this._readerHead(sel.subject || '—', [detail?.data?.sender || sel.sender, this._when(detail?.data?.date || sel.date, t, locale)].filter(Boolean).join(' · '), link);
      if (!detail || detail.loading) reader += '<div class="rbody muted">' + E.esc(t.loading) + '</div>';
      else if (detail.error) reader += '<div class="rbody error-text">' + E.esc(t.message_failed + ' ' + detail.error) + '</div>';
      else reader += (detail.data.text ? '<div class="rbody">' + E.esc(detail.data.text) + '</div>' : '') + E.files(detail.data.attachments, t, data.entryId, true);
    }
    return this._mail(list, reader, t.no_messages, t.select_message, 'mdi:email-open-outline');
  }

  // Blog, organized like ONE's: a filter per blog, a feed of post cards (start of the text, pictures, comments,
  // Read more), and the post chosen in full in place of the feed (Back returns to it).
  _blog(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var key = (b) => b.blog_id + ':' + b.id;
    var sel = data.blog.find((b) => key(b) === this._item);
    var back = '<button class="back show" data-action="back"><ha-icon icon="mdi:arrow-left"></ha-icon>' + E.esc(t.back) + '</button>';
    if (sel) {
      return '<article class="post">' + back + this._readerHead(sel.title || '—', [sel.blog, sel.author, this._when(sel.date, t, locale)].filter(Boolean).join(' · ')) +
        (sel.text ? '<div class="rbody">' + E.esc(sel.text) + '</div>' : '') + E.files(sel.attachments, t, data.entryId, true) + '</article>';
    }
    var blogs = [];
    data.blog.forEach((b) => {
      if (!blogs.some((x) => x.id === b.blog_id)) blogs.push({ id: b.blog_id, title: b.blog, thumb: b.blog_thumbnail });
    });
    if (this._blogFilter && !blogs.some((b) => b.id === this._blogFilter)) this._blogFilter = '';
    var dot = (thumb) => '<span class="bdot">' + (thumb ? '<img alt="" data-ent-src="' + E.esc(thumb) + '" data-name="">' : '<ha-icon icon="mdi:post-outline"></ha-icon>') + '</span>';
    var chips = '<div class="filters">' +
      '<button class="filter' + (this._blogFilter ? '' : ' on') + '" data-blog="">' + E.esc(t.all) + '</button>' +
      blogs.map((b) => '<button class="filter bfilter' + (this._blogFilter === b.id ? ' on' : '') + '" data-blog="' + E.esc(b.id) + '">' + dot(b.thumb) + E.esc(b.title) + '</button>').join('') + '</div>';
    var posts = data.blog.filter((b) => !this._blogFilter || b.blog_id === this._blogFilter);
    var cards = posts.map((b) => {
      var images = (b.attachments || []).filter((f) => E.fileKind(f) === 'image').slice(0, 3);
      return '<div class="pcard" role="button" tabindex="0" data-select="' + E.esc(key(b)) + '">' +
        '<div class="pmeta">' + E.esc([b.blog, b.author, E.day(b.date, t, locale)].filter(Boolean).join(' · ')) + '</div>' +
        '<div class="ptitle">' + E.esc(b.title || '—') + '</div>' +
        (b.text ? '<div class="ptext">' + E.esc(b.text) + '</div>' : '') +
        (images.length ? E.files(images, t, data.entryId) : '') +
        '<div class="pfoot"><span><ha-icon icon="mdi:comment-outline"></ha-icon>' + (Number(b.comments) || 0) + '</span><span class="link">' + E.esc(t.read_more) + ' →</span></div></div>';
    }).join('');
    return '<div class="feed">' + chips + (cards || '<div class="box"><div class="empty">' + E.esc(t.no_blog) + '</div></div>') + '</div>';
  }

  _news(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    return this._box('', this._list(data.news.map((n) => E.rows.news(n, t, locale, { full: true, entryId: data.entryId })), t.no_news), true);
  }

  _popup(t, data) {
    var E = window.EntOne;
    var w = this._confirm ? data.words.find((x) => String(x.id) === this._confirm.id && String(x.child_id) === this._confirm.child) : null;
    if (!w) return '';
    return '<div class="popup"><div class="popup-title">' + E.esc(t.sign_title) + '</div>' +
      '<div class="popup-text">' + E.esc(E.format(t.sign_text, { title: w.title || '—', child: w.child || '' })) + '</div>' +
      '<div class="popup-actions"><button class="act ghost" data-action="cancel">' + E.esc(t.cancel) + '</button>' +
      '<button class="act" data-action="confirm"' + (this._confirm.busy ? ' disabled' : '') + '>' + E.esc(this._confirm.busy ? t.signing : t.confirm) + '</button></div></div>';
  }

  _renderSettings(content, t) {
    var E = window.EntOne;
    if (!this._settings) {
      this._settings = { loading: true };
      content.innerHTML = '<div class="page"><ha-circular-progress indeterminate></ha-circular-progress></div>';
      this._hass
        .callWS({ type: 'ent_one/settings' })
        .then((res) => {
          this._settings = res;
          this._drafts = {};
          this._render();
        })
        .catch((err) => {
          this._settings = { error: String(err?.message || err) };
          this._render();
        });
      return;
    }
    if (this._settings.loading) return;
    if (this._settings.error) {
      content.innerHTML = '<div class="page"><div class="error-text">' + E.esc(this._settings.error) + '</div></div>';
      return;
    }
    var s = this._settings;
    if (!s.accounts.length) {
      content.innerHTML = '<div class="page"><div class="empty">' + E.esc(t.no_account) + '</div></div>';
      return;
    }
    // Home Assistant's own form, with the selectors of the options flow: same look and checks as everywhere else.
    content.innerHTML = '<div class="page">' + (s.admin ? '' : '<div class="empty">' + E.esc(t.admin_only) + '</div>') +
      s.accounts.map((acc) => this._box(acc.title,
        (acc.url ? '<div class="url">' + E.esc(acc.url) + '</div>' : '') + '<div class="form" data-entry="' + E.esc(acc.entry_id) + '"></div>' +
        (s.admin ? '<div class="popup-actions"><span class="msg"></span><button class="act" data-action="save" data-entry="' + E.esc(acc.entry_id) + '">' + E.esc(t.save) + '</button></div>' : ''),
        true)).join('') + '</div>';
    var labels = { scan_interval: t.settings_scan, homework_days: t.settings_days, notify_services: t.settings_notify, show_panel: t.settings_panel, panel_tabs: t.settings_tabs, hide_header: t.settings_hide_header };
    var helpers = { scan_interval: t.settings_scan_hint, notify_services: t.settings_notify_hint, hide_header: t.settings_hide_header_hint };
    s.accounts.forEach((acc) => {
      var form = document.createElement('ha-form');
      var notify = s.notify_services.concat(acc.options.notify_services.filter((n) => s.notify_services.indexOf(n) === -1));
      form.hass = this._hass;
      form.disabled = !s.admin;
      form.schema = [
        { name: 'scan_interval', selector: { number: { min: 10, max: 360, step: 5, mode: 'box', unit_of_measurement: 'min' } } },
        { name: 'homework_days', selector: { number: { min: 1, max: 60, step: 1, mode: 'box', unit_of_measurement: 'd' } } },
        { name: 'notify_services', selector: { select: { multiple: true, custom_value: true, mode: 'dropdown', options: notify } } },
        { name: 'show_panel', selector: { boolean: {} } },
        {
          name: 'panel_tabs',
          selector: {
            select: {
              multiple: true,
              mode: 'list',
              options: ['homework', 'words', 'messages', 'news', 'blog'].map((tab) => ({ value: tab, label: t[ENT_ONE_TAB_KEYS[tab]] })),
            },
          },
        },
        {
          name: 'hide_header',
          selector: { select: { mode: 'list', options: ['off', 'all', 'non_admin'].map((v) => ({ value: v, label: t['hide_header_' + v] })) } },
        },
      ];
      form.data = this._drafts[acc.entry_id] || acc.options;
      form.computeLabel = (field) => labels[field.name] || field.name;
      form.computeHelper = (field) => helpers[field.name] || '';
      form.addEventListener('value-changed', (ev) => {
        this._drafts[acc.entry_id] = ev.detail.value;
        form.data = ev.detail.value;
      });
      content.querySelector(`.form[data-entry="${CSS.escape(acc.entry_id)}"]`).appendChild(form);
    });
  }

  _save(button) {
    var E = window.EntOne;
    var t = E.t(this._hass);
    var entry = button.getAttribute('data-entry');
    var acc = this._settings.accounts.find((a) => a.entry_id === entry);
    var options = Object.assign({}, acc.options, this._drafts[entry] || {});
    var msg = button.parentElement.querySelector('.msg');
    this._hass
      .callWS({
        type: 'ent_one/settings/update',
        entry_id: entry,
        options: {
          scan_interval: Number(options.scan_interval),
          homework_days: Number(options.homework_days),
          notify_services: options.notify_services || [],
          show_panel: !!options.show_panel,
          panel_tabs: options.panel_tabs || [],
          hide_header: options.hide_header || 'off',
        },
      })
      .then((res) => {
        acc.options = res.options;
        delete this._drafts[entry];
        msg.className = 'msg ok';
        msg.textContent = t.saved;
      })
      .catch((err) => {
        msg.className = 'msg error-text';
        msg.textContent = String(err?.message || err);
      });
  }

  _onChange(ev) {
    var el = ev.target;
    if (el.classList?.contains('account')) {
      this._entry = el.value;
      this._render();
    } else if (el.getAttribute?.('data-action') === 'hide-done') {
      this._hideDone = el.checked;
      this._saveFilters();
      this._render();
    }
  }

  _onClick(ev) {
    var E = window.EntOne;
    var toggle = ev.target.closest('[data-toggle]');
    if (toggle && !ev.target.closest('[data-action], a')) {
      var key = toggle.getAttribute('data-toggle');
      if (this._open[key]) delete this._open[key];
      else {
        this._open[key] = true;
        if (key.indexOf('message:') === 0 && this._data) {
          E.loadMessage(this._hass, this._data.entryId, key.slice(8), this._bodies, () => this._render());
        }
      }
      this._render();
      return;
    }
    var selEl = ev.target.closest('[data-select]');
    if (selEl && !ev.target.closest('[data-action]')) {
      this._select(selEl.getAttribute('data-select'));
      return;
    }
    var readEl = ev.target.closest('[data-action="read"]');
    if (readEl) {
      this._setTab(readEl.getAttribute('data-tab'));
      this._select(readEl.getAttribute('data-item'));
      return;
    }
    var childEl = ev.target.closest('[data-child]:not([data-action])');
    if (childEl) {
      this._child = childEl.getAttribute('data-child');
      this._item = '';
      this._saveFilters();
      this._render();
      return;
    }
    var dayEl = ev.target.closest('[data-day]');
    if (dayEl) {
      var picked = dayEl.getAttribute('data-day');
      this._day = this._day === picked ? '' : picked;
      this._render();
      return;
    }
    var tabEl = ev.target.closest('[data-tab]');
    if (tabEl) {
      this._setTab(tabEl.getAttribute('data-tab'));
      return;
    }
    var blogEl = ev.target.closest('[data-blog]');
    if (blogEl) {
      this._blogFilter = blogEl.getAttribute('data-blog');
      this._saveFilters();
      this._render();
      return;
    }
    var bookEl = ev.target.closest('[data-book]:not([data-action])');
    if (bookEl) {
      this._book = bookEl.getAttribute('data-book');
      this._saveFilters();
      this._render();
      return;
    }
    var el = ev.target.closest('[data-action]');
    if (!el) {
      if (this._confirm && !ev.target.closest('.popup')) {
        this._confirm = null;
        this._render();
      }
      return;
    }
    var data = this._data;
    var action = el.getAttribute('data-action');
    if (action === 'save') {
      ev.preventDefault();
      this._save(el);
    } else if (!data) {
      return;
    } else if (action === 'refresh') this._refresh(data);
    else if (action === 'open') window.open(data.url, '_blank', 'noopener');
    else if (action === 'back') this._select('');
    else if (action === 'file') E.openFile(this._hass, data.entryId, el.getAttribute('data-path'), el.getAttribute('data-name')).catch((err) => this._fail(err));
    else if (action === 'open-messages') window.open(`${data.url}/conversation/conversation`, '_blank', 'noopener');
    else if (action === 'sign' && E.canSign(this._hass)) {
      this._confirm = { id: el.getAttribute('data-id'), child: el.getAttribute('data-child') };
      this._render();
      this._root.querySelector('.popup')?.scrollIntoView({ block: 'nearest' });
    } else if (action === 'cancel') {
      this._confirm = null;
      this._render();
    } else if (action === 'confirm') this._doSign(data);
    else if (action === 'homework') {
      var item = data.homework.find((h) => String(h.id) === el.getAttribute('data-id') && String(h.book_id) === el.getAttribute('data-book'));
      if (item && E.canSign(this._hass)) E.setDone(this._hass, data.entryId, item, !item.done).catch((err) => this._fail(err));
    }
  }

  _fail(err) {
    var E = window.EntOne;
    E.errorText(this._hass, err).then((text) => {
      this._error = `${E.t(this._hass).action_failed} ${text}`;
      this._render();
    });
  }

  _doSign(data) {
    var E = window.EntOne;
    var w = data.words.find((x) => String(x.id) === this._confirm.id && String(x.child_id) === this._confirm.child);
    if (!w || this._confirm.busy) return;
    this._confirm.busy = true;
    this._error = '';
    this._render();
    E.sign(this._hass, data.entryId, w)
      .catch((err) => this._fail(err))
      .finally(() => {
        this._confirm = null;
        this._render();
      });
  }

  _refresh(data) {
    var E = window.EntOne;
    if (this._refreshing) return;
    this._refreshing = true;
    this._error = '';
    this._render();
    E.refresh(this._hass, data.entryId)
      .catch((err) =>
        E.errorText(this._hass, err).then((text) => {
          this._error = `${E.t(this._hass).refresh_failed} ${text}`;
        }),
      )
      .finally(() => {
        this._refreshing = false;
        this._render();
      });
  }

  static _styles(A) {
    return [
      ':host { display: block; min-height: 100vh; background: var(--primary-background-color); color: var(--primary-text-color); font-family: var(--paper-font-body1_-_font-family, inherit); }',
      // Illustrated header (the card's banner, see window.EntOne.banner.styles), across the page.
      // The round buttons at the right edge, as on the other ha-* panels; the school corner just left of them.
      '.banner { margin: 0; --eo-scene-w: min(260px, 38%); --eo-btns: 0px; }',
      '.banner:has(.hbtns .hbtn) { --eo-btns: 54px; }',
      '.banner:has(.hbtns .hbtn + .hbtn) { --eo-btns: 94px; }',
      '.banner .eo-scene { right: var(--eo-btns); }',
      '.scene { display: contents; }',
      '.htext { left: 8px; right: calc(var(--eo-scene-w) + var(--eo-btns) + 16px); top: 0; gap: 8px; }',
      '.hinfo { display: flex; align-items: center; gap: 16px; min-width: 0; }',
      'ha-menu-button { flex: none; color: var(--eo-text); }',
      '.banner .logo { width: 44px; height: 44px; flex: none; border-radius: 50%; display: grid; place-items: center; margin-left: 4px; }',
      '.banner .logo > svg { width: 26px; height: 26px; }',
      '.titles { min-width: 0; }',
      '.title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }',
      '.name { font-size: 20px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }',
      '.sub { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }',
      '.status { --c: var(--success-color, #43a047); flex: none; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; border-radius: 12px; padding: 1px 8px; }',
      '.status .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c); }',
      '.banner .status.warn { --c: var(--warning-color, #ffa600); } .banner .status.bad { --c: var(--error-color, #db4437); }',
      // Glass round buttons at the right edge, centred on the sky (the card's glass, at the panels' 34 px)
      '.hbtns { top: calc((100% - var(--eo-g)) / 2 - 17px); right: 12px; gap: 6px; }',
      '.hbtn { all: unset; box-sizing: border-box; cursor: pointer; display: grid; place-items: center; --mdc-icon-size: 20px; }',
      '.hbtns .hbtn { width: 34px; height: 34px; }',
      '.hbtns .hbtn:hover { background: rgba(255,255,255,.82); }',
      '.night .hbtns .hbtn:hover { background: rgba(255,255,255,.22); }',
      '.hbtn ha-icon { display: flex; }',
      '.hbtn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }',
      '.spinning ha-icon { animation: ent-one-spin 1s linear infinite; }',
      '@keyframes ent-one-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      // Text tabs under the header, the active one underlined; the account choice at their right.
      // Top bar hidden: the tabs alone, the menu button at their left (shown by Home Assistant on a narrow screen).
      ':host([bare]) .banner { display: none; }',
      '.tabbar ha-menu-button { flex: none; margin-left: -8px; color: var(--primary-text-color); }',
      '.tb-side { display: flex; align-items: center; gap: 4px; }',
      '.tb-side .hbtn { width: 36px; height: 36px; border-radius: 50%; color: var(--secondary-text-color); }',
      '.tb-side .hbtn:hover { background: color-mix(in srgb, var(--secondary-text-color) 14%, transparent); color: var(--primary-text-color); }',
      // The page's own background: the theme's header colour (blue in the default light theme) would put grey tab text on blue.
      '.tabbar { display: flex; align-items: center; gap: 8px; padding: 0 12px; border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); background: var(--primary-background-color); position: sticky; top: 0; z-index: 2; }',
      '.tabs { flex: 1; min-width: 0; display: flex; gap: 4px; overflow-x: auto; }',
      '.tb-side { flex: none; }',
      '.account { font: inherit; font-size: 13px; padding: 4px 8px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); }',
      '.tab { all: unset; cursor: pointer; padding: 12px 10px 10px; font-size: 14px; font-weight: 500; white-space: nowrap; color: var(--secondary-text-color); border-bottom: 2px solid transparent; }',
      '.tab.on { color: var(--primary-text-color); border-bottom-color: ' + A + '; }',
      '.tab:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }',
      '.badge { display: inline-block; min-width: 18px; padding: 1px 5px; margin-left: 4px; border-radius: 9px; font-size: 11px; text-align: center; box-sizing: border-box;' +
        ' color: color-mix(in srgb, ' + A + ' 60%, var(--primary-text-color)); background: color-mix(in srgb, ' + A + ' 16%, transparent); }',
      '.page { max-width: 1100px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }',
      '.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; align-items: start; }',
      '.box { background: var(--card-background-color, #fff); border-radius: var(--ha-card-border-radius, 12px); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); padding: 12px 16px; min-width: 0; }',
      '.box h2 { margin: 0 0 6px; font-size: 14px; font-weight: 500; color: var(--secondary-text-color); }',
      '.box h3 { margin: 12px 0 2px; font-size: 13px; font-weight: 500; color: var(--secondary-text-color); }',
      '.box h3:first-child { margin-top: 0; }',
      '.bh { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }',
      '.see { all: unset; cursor: pointer; font-size: 12px; color: var(--secondary-text-color); }',
      '.see:hover { color: var(--primary-text-color); } .see:focus-visible { outline: 2px solid var(--primary-color); }',
      // Child filter: All, then a chip per child with its initial.
      '.kids { display: flex; flex-wrap: wrap; gap: 8px; }',
      '.kid { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 0 12px; border-radius: 18px; font-size: 13px;' +
        ' color: var(--secondary-text-color); background: var(--card-background-color, #fff); border: 1px solid var(--divider-color, #e0e0e0); box-sizing: border-box; }',
      '.kid:has(.avatar) { padding-left: 3px; }',
      '.kid.on { color: var(--primary-text-color); border: 1.5px solid ' + A + '; }',
      '.kid:focus-visible { outline: 2px solid var(--primary-color); }',
      '.kid .badge { margin-left: 0; }',
      '.avatar { --c: ' + A + '; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 500;' +
        ' color: color-mix(in srgb, var(--c) 60%, var(--primary-text-color)); background: color-mix(in srgb, var(--c) 18%, transparent); }',
      '.avatar.c1 { --c: #8e6bd8; } .avatar.c2 { --c: #1d9e75; } .avatar.c3 { --c: #2f80ed; }',
      // Week strip: Monday to Friday, homework left in amber, a dot for an event, today outlined.
      '.week { display: flex; gap: 6px; }',
      '.wday { all: unset; cursor: pointer; flex: 1; min-width: 0; position: relative; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 7px 4px; border-radius: 10px;' +
        ' font-size: 12px; color: var(--secondary-text-color); background: var(--card-background-color, #fff); border: 1px solid var(--divider-color, #e0e0e0); box-sizing: border-box; }',
      '.wday .wl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.wday.past { opacity: .6; }',
      '.wday.today { color: var(--primary-text-color); border: 1.5px solid ' + A + '; }',
      '.wday.hw { --c: #f5a623; color: color-mix(in srgb, var(--c) 55%, var(--primary-text-color)); background: color-mix(in srgb, var(--c) 14%, var(--card-background-color, #fff)); }',
      '.wday .wn { font-weight: 500; }',
      '.wday .wev { position: absolute; top: 4px; right: 5px; width: 5px; height: 5px; border-radius: 50%; background: #2f80ed; }',
      '.wday.on { box-shadow: 0 0 0 2px ' + A + '; }',
      '.wday:focus-visible { outline: 2px solid var(--primary-color); }',
      // Tiles of the chart: neutral surface, round tinted pastille with the count as badge, name + coloured state line.
      '.tiles { display: grid; gap: 12px; }',
      '.tile { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; gap: 12px; min-width: 0; padding: 12px 14px; border-radius: 12px;' +
        ' background: var(--card-background-color, #fff); border: 1px solid var(--divider-color, #e0e0e0); --c: #8a96a3; }',
      '.tile:not(.static):hover { border-color: color-mix(in srgb, var(--c) 55%, var(--divider-color, #e0e0e0)); }',
      '.tile:focus-visible { outline: 2px solid var(--primary-color); }',
      '.tile.static { cursor: default; }',
      '.tile.red { --c: var(--error-color, #e5484d); } .tile.amber { --c: #f5a623; } .tile.blue { --c: #2f80ed; }',
      '.pastille { position: relative; flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; --mdc-icon-size: 22px;' +
        ' color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); }',
      '.pbadge { position: absolute; top: -3px; right: -5px; min-width: 18px; height: 18px; padding: 0 4px; box-sizing: border-box; border-radius: 9px; font-size: 11px; font-weight: 600;' +
        ' line-height: 18px; text-align: center; color: #fff; background: var(--c); box-shadow: 0 0 0 2px var(--card-background-color, #fff); }',
      '.tl { display: flex; flex-direction: column; min-width: 0; }',
      '.tn { font-size: 14px; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.ts { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: color-mix(in srgb, var(--c) 65%, var(--primary-text-color)); }',
      '.tile.rest .ts { color: var(--secondary-text-color); }',
      // Home: To do (two columns wide) and To read, the calendar under them.
      '.dgrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; }',
      '.dgrid .todo-box { grid-column: span 2; } .dgrid .agenda-box { grid-column: 1 / -1; }',
      // Homework: one tile per day, its progress under the title.
      '.days { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; align-items: start; }',
      '.ratio { font-size: 12px; font-weight: 500; color: color-mix(in srgb, #f5a623 60%, var(--primary-text-color)); }',
      '.day.full .ratio { color: color-mix(in srgb, var(--success-color, #43a047) 60%, var(--primary-text-color)); }',
      '.bar { height: 4px; border-radius: 2px; margin: 2px 0 6px; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); overflow: hidden; }',
      '.bar span { display: block; height: 100%; border-radius: 2px; background: #f5a623; }',
      '.day.full .bar span { background: var(--success-color, #43a047); }',
      '.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }',
      '.filter { all: unset; cursor: pointer; font-size: 13px; padding: 4px 12px; border-radius: 14px; border: 1px solid var(--divider-color, #e0e0e0); color: var(--secondary-text-color); }',
      '.filter.on { color: color-mix(in srgb, ' + A + ' 60%, var(--primary-text-color)); border-color: color-mix(in srgb, ' + A + ' 50%, transparent); background: color-mix(in srgb, ' + A + ' 10%, transparent); }',
      '.toggle { margin-left: auto; font-size: 13px; color: var(--secondary-text-color); display: flex; align-items: center; gap: 6px; }',
      '.item-title { white-space: normal; }',
      '.popup { padding: 12px 16px; border-radius: 12px; border: 1px solid color-mix(in srgb, ' + A + ' 40%, transparent); background: color-mix(in srgb, ' + A + ' 6%, var(--card-background-color, #fff)); }',
      '.popup-title { font-weight: 500; }',
      '.popup-text { font-size: 13px; color: var(--secondary-text-color); margin-top: 2px; }',
      '.popup-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 8px; }',
      '.act.ghost { color: var(--secondary-text-color); border-color: var(--divider-color, rgba(0,0,0,.2)); }',
      '.errbar { padding: 8px 12px; border-radius: 8px; background: color-mix(in srgb, var(--error-color, #db4437) 10%, transparent); }',
      '.url { font-size: 12px; color: var(--secondary-text-color); margin-bottom: 8px; }',
      '.msg { font-size: 13px; margin-right: auto; }',
      '.msg.ok { color: color-mix(in srgb, var(--success-color, #43a047) 55%, var(--primary-text-color)); }',
      '.page.wide { max-width: 1400px; }',
      // Mail layout: list and reading pane side by side, each scrolling on its own.
      '.mail { display: grid; grid-template-columns: minmax(260px, 360px) minmax(0, 1fr); height: calc(100vh - 90px - 46px - 32px); min-height: 360px;' +
        ' background: var(--card-background-color, #fff); border-radius: var(--ha-card-border-radius, 12px); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); overflow: hidden; }',
      '.mail.short { height: calc(100vh - 90px - 46px - 32px - 46px); }',
      ':host([bare]) .mail { height: calc(100vh - 46px - 32px); } :host([bare]) .mail.short { height: calc(100vh - 46px - 32px - 46px); }',
      '.mlist { overflow-y: auto; border-right: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.mrow { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.08)); border-left: 3px solid transparent; }',
      '.mrow:hover { background: color-mix(in srgb, var(--primary-text-color) 4%, transparent); }',
      '.mrow.on { background: color-mix(in srgb, ' + A + ' 10%, transparent); border-left-color: ' + A + '; }',
      '.mrow:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }',
      '.mrow-icon, .mrow-side { flex: none; --mdc-icon-size: 20px; color: var(--secondary-text-color); margin-top: 1px; }',
      '.mrow.unread .mrow-icon { color: ' + A + '; }',
      '.mrow-main { flex: 1; min-width: 0; }',
      '.mrow-title { font-size: 14px; color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
      '.mrow.unread .mrow-title { font-weight: 600; }',
      '.mrow-meta { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
      '.reader { overflow-y: auto; padding: 16px 20px; min-width: 0; }',
      '.rhead { display: flex; align-items: flex-start; gap: 12px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.rhead-main { flex: 1; min-width: 0; }',
      '.rtitle { margin: 0; font-size: 20px; font-weight: 500; overflow-wrap: anywhere; }',
      '.rmeta { font-size: 13px; color: var(--secondary-text-color); margin-top: 2px; }',
      '.rbody { font-size: 14px; line-height: 1.5; white-space: pre-line; overflow-wrap: anywhere; margin-bottom: 12px; }',
      '.reader .atts { margin-top: 0; gap: 12px; }',
      '.reader .att-images { gap: 12px; }',
      '.placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--secondary-text-color); font-size: 14px; text-align: center; --mdc-icon-size: 48px; }',
      '.placeholder ha-icon { opacity: .4; }',
      '.back { all: unset; cursor: pointer; display: none; align-items: center; gap: 6px; margin-bottom: 12px; font-size: 14px; color: var(--secondary-text-color); --mdc-icon-size: 20px; }',
      '.back:focus-visible { outline: 2px solid var(--primary-color); }',
      '.pad { padding: 12px; }',
      // Blog: feed of post cards like ONE's, the post read in full in its place.
      '.feed { display: flex; flex-direction: column; gap: 12px; max-width: 760px; width: 100%; margin: 0 auto; }',
      '.pcard { cursor: pointer; background: var(--card-background-color, #fff); border-radius: var(--ha-card-border-radius, 12px); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); padding: 12px 16px; }',
      '.pcard:hover { border-color: var(--secondary-text-color); }',
      '.pcard:focus-visible { outline: 2px solid var(--primary-color); }',
      '.pmeta { font-size: 12px; color: var(--secondary-text-color); }',
      '.ptitle { font-size: 16px; font-weight: 500; margin-top: 2px; overflow-wrap: anywhere; }',
      '.ptext { font-size: 14px; line-height: 1.5; margin-top: 4px; white-space: pre-line; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden; }',
      '.pcard .att-img img { height: 120px; max-width: 220px; }',
      '.pfoot { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 13px; color: var(--secondary-text-color); --mdc-icon-size: 16px; }',
      '.pfoot ha-icon { margin-right: 4px; vertical-align: -3px; }',
      '.post { max-width: 860px; width: 100%; margin: 0 auto; box-sizing: border-box; background: var(--card-background-color, #fff); border-radius: var(--ha-card-border-radius, 12px); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); padding: 16px 20px; }',
      '.back.show { display: inline-flex; }',
      '.bfilter { display: inline-flex; align-items: center; gap: 6px; padding-left: 4px; }',
      '.bdot { width: 20px; height: 20px; border-radius: 50%; overflow: hidden; display: inline-grid; place-items: center; flex: none; color: ' + A + '; background: color-mix(in srgb, ' + A + ' 14%, transparent); --mdc-icon-size: 13px; }',
      '.bdot img { width: 100%; height: 100%; object-fit: cover; }',
      '@media (max-width: 800px) { .mail { grid-template-columns: 1fr; height: auto; min-height: 0; } .mlist { border-right: none; } .mail.has-item .mlist { display: none; }' +
        ' .mail:not(.has-item) .reader { display: none; } .back { display: inline-flex; } .reader { padding: 12px 14px; } }',
      '@media (max-width: 900px) { .dgrid { grid-template-columns: 1fr; } .dgrid .todo-box { grid-column: auto; } .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }',
      '@media (max-width: 600px) { .page { padding: 12px; } .banner { --eo-scene-w: 0px; } .eo-scene { display: none; } .htext { right: calc(var(--eo-btns) + 12px); } .name { font-size: 17px; }' +
        ' .hbtns { right: 12px; } .status { display: none; } .wday .wl { font-size: 11px; } .week { gap: 4px; } }',
      '@media (prefers-reduced-motion: reduce) { .spinning ha-icon { animation: none; opacity: .5; } }',
    ].join('\n');
  }
}

if (!customElements.get('ent-one-panel')) customElements.define('ent-one-panel', EntOnePanel);
