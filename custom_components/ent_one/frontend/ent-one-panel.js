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
      window.localStorage.setItem('ent-one-panel', JSON.stringify({ book: this._book, hideDone: this._hideDone, blog: this._blogFilter }));
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
    this._root.innerHTML =
      '<style>' + EntOnePanel._styles(window.EntOne.accent) + window.EntOne.itemStyles(window.EntOne.accent) + '</style>' +
      '<div class="toolbar"><ha-menu-button></ha-menu-button><div class="logo">' + window.EntOne.icon + '</div>' +
      '<div class="tb-title"></div><div class="tb-side"></div></div><div class="tabs" role="tablist"></div><div class="content"></div>';
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
    this._root.querySelector('.tb-title').textContent = (data?.account.schools?.[0]) || t.default_title;
    var side = this._root.querySelector('.tb-side');
    side.innerHTML =
      (ids.length > 1
        ? '<select class="account" aria-label="' + E.esc(t.account) + '">' +
          ids.map((id) => {
            var d = E.data(this._hass, id);
            var name = (d.account.schools?.[0]) || d.account.name || id;
            return '<option value="' + E.esc(id) + '"' + (id === (data?.entryId) ? ' selected' : '') + '>' + E.esc(name) + '</option>';
          }).join('') + '</select>'
        : '') +
      (data?.updated ? '<span class="updated">' + E.esc(E.format(t.last_update, { time: this._time(data.updated) })) + '</span>' : '') +
      (data ? '<ha-icon-button class="' + (this._refreshing ? 'spinning' : '') + '" data-action="refresh" label="' + E.esc(t.refresh) + '"><ha-icon icon="mdi:refresh"></ha-icon></ha-icon-button>' : '') +
      (data?.url ? '<ha-icon-button data-action="open" label="' + E.esc(t.open_ent) + '"><ha-icon icon="mdi:open-in-new"></ha-icon></ha-icon-button>' : '');
    // Tabs hidden in the options are left out, with their part of the home page.
    var shown = ENT_ONE_PANEL_TABS.filter((tab) => tab === 'home' || tab === 'settings' || !data || data.panelTabs.indexOf(tab) !== -1);
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
    content.innerHTML = '<div class="page' + (mail ? ' wide' : '') + '">' + (this._error ? '<div class="error-text banner">' + E.esc(this._error) + '</div>' : '') + this._popup(t, data) + html + '</div>';
    E.hydrate(content, this._hass, data.entryId);
  }

  _count(tab, data) {
    if (tab === 'words') return data.words.filter((w) => !w.signed).length;
    if (tab === 'homework') return data.homework.filter((h) => !h.done).length;
    // The unread messages actually in the list, not the server's inbox count: an unread message older than the kept
    // window (or one the inbox endpoint does not return) must not light a badge with nothing to show for it.
    if (tab === 'messages') return this._unread(data);
    return 0;
  }

  _unread(data) {
    return data.messages.filter((m) => m.unread).length;
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

  _home(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var R = E.rows;
    var isOpen = (key) => !!this._open[key];
    var toSign = data.words.filter((w) => !w.signed);
    var todo = E.sortedHomework(data.homework, false).slice(0, 6);
    var on = (tab) => data.panelTabs.indexOf(tab) !== -1;
    var tileList = [
      [this._unread(data), t.tile_messages, 'mdi:email-outline', 'messages'],
      [toSign.length, t.tile_words, 'mdi:notebook-edit-outline', 'words'],
      [data.homework.filter((h) => !h.done).length, t.tile_homework, 'mdi:pencil-outline', 'homework'],
    ].filter((x) => on(x[3]));
    var tiles = !tileList.length
      ? ''
      : '<div class="tiles" style="grid-template-columns: repeat(' + tileList.length + ', minmax(0, 1fr))">' +
      tileList.map((x) => '<button class="tile' + (x[3] === 'words' && x[0] ? ' hot' : '') + '" data-tab="' + x[3] + '"><span class="v"><ha-icon icon="' + x[2] + '"></ha-icon>' + x[0] + '</span><span class="l">' + E.esc(x[1]) + '</span></button>').join('') +
      '</div>';
    return tiles + '<div class="grid">' +
      (on('words') ? this._box(t.section_words, this._list(toSign.map((w) => R.word(w, t, locale, { canSign: E.canSign(this._hass), isOpen: isOpen, reader: true, entryId: data.entryId })), t.no_words)) : '') +
      (on('homework') ? this._box(t.section_homework, this._list(todo.map((h) => R.homework(h, t, locale, { isOpen: isOpen, entryId: data.entryId })), t.no_homework)) : '') +
      this._box(t.section_events, this._list(E.upcomingEvents(data.events).slice(0, 6).map((e) => R.event(e, t, locale, { isOpen: isOpen })), t.no_events)) +
      (on('news') ? this._box(t.section_news, this._list(data.news.slice(0, 3).map((n) => R.news(n, t, locale, { isOpen: isOpen, entryId: data.entryId })), t.no_news)) : '') +
      '</div>';
  }

  _homework(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var books = Object.keys(data.books);
    if (this._book && books.indexOf(this._book) === -1) this._book = '';
    var chips =
      '<div class="filters">' +
      [['', t.all]].concat(books.map((b) => [b, data.books[b]])).map((b) => '<button class="filter' + (this._book === b[0] ? ' on' : '') + '" data-book="' + E.esc(b[0]) + '">' + E.esc(b[1]) + '</button>').join('') +
      '<label class="toggle"><input type="checkbox" data-action="hide-done"' + (this._hideDone ? ' checked' : '') + '> ' + E.esc(t.hide_done) + '</label></div>';
    var items = E.sortedHomework(data.homework.filter((h) => !this._book || h.book_id === this._book), !this._hideDone)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    var days = [];
    items.forEach((h) => {
      var last = days[days.length - 1];
      if (!last || last.date !== h.date) days.push({ date: h.date, items: [h] });
      else last.items.push(h);
    });
    var body = days.length
      ? days.map((d) => '<h3>' + E.esc(E.day(d.date, t, locale)) + '</h3>' + d.items.map((h) => E.rows.homework(h, t, locale, { full: true, entryId: data.entryId })).join('')).join('')
      : '<div class="empty">' + E.esc(t.no_homework) + '</div>';
    return chips + this._box('', body, true);
  }

  // Liaison book and Messages: a list on the left and a reading pane on the right, like a mail client. On a narrow
  // screen the list fills the page, and the item opened replaces it (Back returns to the list).
  _mail(list, reader, empty, placeholder, icon) {
    var E = window.EntOne;
    var t = E.t(this._hass);
    var open = !!reader;
    return '<div class="mail' + (open ? ' has-item' : '') + '">' +
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
    var words = data.words.slice().sort((a, b) => (a.signed === b.signed ? 0 : a.signed ? 1 : -1));
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
    return this._mail(list, reader, t.no_words, t.select_word, 'mdi:notebook-outline');
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
        '<div class="url">' + E.esc(acc.url) + '</div><div class="form" data-entry="' + E.esc(acc.entry_id) + '"></div>' +
        (s.admin ? '<div class="popup-actions"><span class="msg"></span><button class="act" data-action="save" data-entry="' + E.esc(acc.entry_id) + '">' + E.esc(t.save) + '</button></div>' : ''),
        true)).join('') + '</div>';
    var labels = { scan_interval: t.settings_scan, homework_days: t.settings_days, notify_services: t.settings_notify, show_panel: t.settings_panel, panel_tabs: t.settings_tabs };
    var helpers = { scan_interval: t.settings_scan_hint, notify_services: t.settings_notify_hint };
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
      if (item) E.setDone(this._hass, data.entryId, item, !item.done).catch((err) => this._fail(err));
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
      '.toolbar { display: flex; align-items: center; gap: 10px; height: 56px; padding: 0 12px; background: var(--app-header-background-color, var(--primary-background-color));' +
        ' color: var(--app-header-text-color, var(--primary-text-color)); border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.logo { width: 32px; height: 32px; flex: none; border-radius: 50%; display: grid; place-items: center; color: ' + A + '; background: color-mix(in srgb, ' + A + ' 16%, transparent); }',
      '.logo svg { width: 20px; height: 20px; }',
      '.tb-title { flex: 1; min-width: 0; font-size: 20px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.tb-side { display: flex; align-items: center; gap: 4px; flex: none; }',
      '.tb-side ha-icon-button { --mdc-icon-button-size: 40px; color: var(--secondary-text-color); }',
      '.updated { font-size: 12px; color: var(--secondary-text-color); margin-right: 4px; }',
      '.account { font: inherit; padding: 4px 8px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); }',
      '.spinning ha-icon { animation: ent-one-spin 1s linear infinite; }',
      '@keyframes ent-one-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      // Text tabs under the header bar, the active one underlined (same logic as the other panels).
      '.tabs { display: flex; gap: 4px; padding: 0 12px; overflow-x: auto; border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); background: var(--app-header-background-color, var(--primary-background-color)); }',
      '.tab { all: unset; cursor: pointer; padding: 12px 10px 10px; font-size: 14px; font-weight: 500; white-space: nowrap; color: var(--secondary-text-color); border-bottom: 2px solid transparent; }',
      '.tab.on { color: var(--primary-text-color); border-bottom-color: ' + A + '; }',
      '.tab:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }',
      '.badge { display: inline-block; min-width: 18px; padding: 1px 5px; margin-left: 4px; border-radius: 9px; font-size: 11px; text-align: center;' +
        ' color: color-mix(in srgb, ' + A + ' 60%, var(--primary-text-color)); background: color-mix(in srgb, ' + A + ' 16%, transparent); }',
      '.page { max-width: 1100px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; }',
      // Each box keeps its own height: a box with one item no longer stretches to its neighbour's.
      '.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; align-items: start; }',
      '.box { background: var(--card-background-color, #fff); border-radius: var(--ha-card-border-radius, 12px); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); padding: 12px 16px; min-width: 0; }',
      '.box h2 { margin: 0 0 6px; font-size: 14px; font-weight: 500; color: var(--secondary-text-color); }',
      '.box h3 { margin: 12px 0 2px; font-size: 13px; font-weight: 500; color: var(--secondary-text-color); }',
      '.box h3:first-child { margin-top: 0; }',
      '.tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }',
      '.tile { all: unset; cursor: pointer; padding: 12px 16px; border-radius: 12px; background: var(--card-background-color, #fff); border: 1px solid var(--divider-color, #e0e0e0); }',
      '.tile.hot { background: color-mix(in srgb, ' + A + ' 12%, var(--card-background-color, #fff)); }',
      '.tile:hover { border-color: var(--secondary-text-color); }',
      '.tile:focus-visible { outline: 2px solid var(--primary-color); }',
      '.tile .v { display: flex; align-items: center; gap: 8px; font-size: 26px; font-weight: 500; --mdc-icon-size: 20px; }',
      '.tile .v ha-icon { color: var(--secondary-text-color); }',
      '.tile.hot .v ha-icon { color: ' + A + '; }',
      '.tile .l { display: block; font-size: 13px; color: var(--secondary-text-color); }',
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
      '.banner { padding: 8px 12px; border-radius: 8px; background: color-mix(in srgb, var(--error-color, #db4437) 10%, transparent); }',
      '.url { font-size: 12px; color: var(--secondary-text-color); margin-bottom: 8px; }',
      '.msg { font-size: 13px; margin-right: auto; }',
      '.msg.ok { color: color-mix(in srgb, var(--success-color, #43a047) 55%, var(--primary-text-color)); }',
      '.page.wide { max-width: 1400px; }',
      // Mail layout: list and reading pane side by side, each scrolling on its own.
      '.mail { display: grid; grid-template-columns: minmax(260px, 360px) minmax(0, 1fr); height: calc(100vh - 56px - 46px - 32px); min-height: 360px;' +
        ' background: var(--card-background-color, #fff); border-radius: var(--ha-card-border-radius, 12px); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); overflow: hidden; }',
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
      '@media (max-width: 600px) { .updated { display: none; } .page { padding: 12px; } .tile .v { font-size: 22px; } }',
      '@media (prefers-reduced-motion: reduce) { .spinning ha-icon { animation: none; opacity: .5; } }',
    ].join('\n');
  }
}

if (!customElements.get('ent-one-panel')) customElements.define('ent-one-panel', EntOnePanel);
