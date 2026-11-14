// ENT ONE sidebar panel: one tab per ENT application, Settings last. It draws its own content (no Lovelace card
// inside) and reuses the card file's helpers, translations and row renderers (window.EntOne), loaded on demand.
var ENT_ONE_PANEL_TABS = ['home', 'homework', 'words', 'messages', 'news', 'settings'];
var ENT_ONE_TAB_KEYS = { home: 'tab_home', homework: 'tab_homework', words: 'tab_words', messages: 'tab_messages', news: 'tab_news', settings: 'tab_settings' };

class EntOnePanel extends HTMLElement {
  constructor() {
    super();
    this._tab = this._tabFromUrl();
    this._book = '';
    this._hideDone = false;
    this._entry = '';
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
      this._render();
    });
    window.addEventListener('popstate', this._onPop);
    if (this._hass && window.EntOne) this._render();
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._onPop);
    this._confirm = null;
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

  _setTab(tab) {
    if (tab === this._tab) return;
    this._tab = tab;
    this._confirm = null;
    var params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    window.history.pushState(null, '', `${window.location.pathname}?${params}`);
    if (tab === 'settings') this._settings = null;
    this._render();
  }

  _ensureShell() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML =
      '<style>' + EntOnePanel._styles(window.EntOne.accent) + window.EntOne.itemStyles(window.EntOne.accent) + '</style>' +
      '<div class="toolbar"><ha-menu-button></ha-menu-button><div class="logo"><ha-icon icon="mdi:school-outline"></ha-icon></div>' +
      '<div class="tb-title"></div><div class="tb-side"></div></div><div class="tabs" role="tablist"></div><div class="content"></div>';
    this._root.addEventListener('click', this._onClick.bind(this));
    this._root.addEventListener('change', this._onChange.bind(this));
  }

  _render() {
    if (!this._hass || !window.EntOne) return;
    this._ensureShell();
    var E = window.EntOne;
    var t = E.t(this._hass);
    this._lang = E.lang(this._hass);
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
    this._root.querySelector('.tabs').innerHTML = ENT_ONE_PANEL_TABS.map((tab) => {
      var count = data ? this._count(tab, data) : 0;
      return '<button role="tab" class="tab' + (tab === this._tab ? ' on' : '') + '" aria-selected="' + (tab === this._tab) + '" data-tab="' + tab + '">' +
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
    var html = { home: this._home, homework: this._homework, words: this._words, messages: this._messages, news: this._news }[this._tab].call(this, t, data);
    content.innerHTML = '<div class="page">' + (this._error ? '<div class="error-text banner">' + E.esc(this._error) + '</div>' : '') + this._popup(t, data) + html + '</div>';
  }

  _count(tab, data) {
    if (tab === 'words') return data.words.filter((w) => !w.signed).length;
    if (tab === 'homework') return data.homework.filter((h) => !h.done).length;
    if (tab === 'messages') return data.unread;
    return 0;
  }

  _time(iso) {
    var d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    var locale = window.EntOne.locale(this._hass);
    try {
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    } catch (_e) {
      return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    }
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
    var toSign = data.words.filter((w) => !w.signed);
    var todo = E.sortedHomework(data.homework, false).slice(0, 6);
    var tiles =
      '<div class="tiles">' +
      [
        [data.unread, t.tile_messages, 'mdi:email-outline', 'messages'],
        [toSign.length, t.tile_words, 'mdi:notebook-edit-outline', 'words'],
        [data.homework.filter((h) => !h.done).length, t.tile_homework, 'mdi:pencil-outline', 'homework'],
      ].map((x) => '<button class="tile' + (x[3] === 'words' && x[0] ? ' hot' : '') + '" data-tab="' + x[3] + '"><span class="v"><ha-icon icon="' + x[2] + '"></ha-icon>' + x[0] + '</span><span class="l">' + E.esc(x[1]) + '</span></button>').join('') +
      '</div>';
    return tiles + '<div class="grid">' +
      this._box(t.section_words, this._list(toSign.map((w) => R.word(w, t, locale, { canSign: E.canSign(this._hass) })), t.no_words)) +
      this._box(t.section_homework, this._list(todo.map((h) => R.homework(h, t, locale)), t.no_homework)) +
      this._box(t.section_events, this._list(E.upcomingEvents(data.events).slice(0, 6).map((e) => R.event(e, t, locale)), t.no_events)) +
      this._box(t.section_news, this._list(data.news.slice(0, 3).map((n) => R.news(n, t, locale)), t.no_news)) +
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
      ? days.map((d) => '<h3>' + E.esc(E.day(d.date, t, locale)) + '</h3>' + d.items.map((h) => E.rows.homework(h, t, locale, { full: true })).join('')).join('')
      : '<div class="empty">' + E.esc(t.no_homework) + '</div>';
    return chips + this._box('', body, true);
  }

  _words(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var words = data.words.slice().sort((a, b) => (a.signed === b.signed ? 0 : a.signed ? 1 : -1));
    var canSign = E.canSign(this._hass);
    return this._box('', this._list(words.map((w) => E.rows.word(w, t, locale, { full: true, canSign: canSign })), t.no_words), true);
  }

  _messages(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    var link = data.url ? '<button class="act" data-action="open-messages">' + E.esc(t.open_ent) + '</button>' : '';
    return '<div class="filters">' + link + '</div>' + this._box('', this._list(data.messages.map((m) => E.rows.message(m, t, locale)), t.no_messages), true);
  }

  _news(t, data) {
    var E = window.EntOne;
    var locale = E.locale(this._hass);
    return this._box('', this._list(data.news.map((n) => E.rows.news(n, t, locale, { full: true })), t.no_news), true);
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
    var dis = s.admin ? '' : ' disabled';
    content.innerHTML = '<div class="page">' + (s.admin ? '' : '<div class="empty">' + E.esc(t.admin_only) + '</div>') +
      s.accounts.map((acc) => {
        var o = acc.options;
        var notify = s.notify_services.concat(o.notify_services.filter((n) => s.notify_services.indexOf(n) === -1));
        return this._box(acc.title,
          '<form class="settings" data-entry="' + E.esc(acc.entry_id) + '">' +
          '<div class="url">' + E.esc(acc.url) + '</div>' +
          '<label>' + E.esc(t.settings_scan) + '<input type="number" name="scan_interval" min="10" max="360" step="5" value="' + E.esc(o.scan_interval) + '"' + dis + '>' +
          '<span class="hint">' + E.esc(t.settings_scan_hint) + '</span></label>' +
          '<label>' + E.esc(t.settings_days) + '<input type="number" name="homework_days" min="1" max="60" value="' + E.esc(o.homework_days) + '"' + dis + '></label>' +
          '<fieldset><legend>' + E.esc(t.settings_notify) + '</legend>' +
          (notify.length
            ? notify.map((n) => '<label class="check"><input type="checkbox" name="notify_services" value="' + E.esc(n) + '"' + (o.notify_services.indexOf(n) !== -1 ? ' checked' : '') + dis + '> ' + E.esc(n) + '</label>').join('')
            : '<span class="hint">—</span>') +
          '<span class="hint">' + E.esc(t.settings_notify_hint) + '</span></fieldset>' +
          '<label class="check"><input type="checkbox" name="show_panel"' + (o.show_panel ? ' checked' : '') + dis + '> ' + E.esc(t.settings_panel) + '</label>' +
          (s.admin ? '<div class="popup-actions"><span class="msg"></span><button class="act" data-action="save">' + E.esc(t.save) + '</button></div>' : '') +
          '</form>', true);
      }).join('') + '</div>';
  }

  _save(form) {
    var E = window.EntOne;
    var t = E.t(this._hass);
    var get = (name) => form.querySelector(`[name="${name}"]`);
    var options = {
      scan_interval: Number(get('scan_interval').value),
      homework_days: Number(get('homework_days').value),
      notify_services: Array.from(form.querySelectorAll('[name="notify_services"]:checked')).map((el) => el.value),
      show_panel: get('show_panel').checked,
    };
    var msg = form.querySelector('.msg');
    this._hass
      .callWS({ type: 'ent_one/settings/update', entry_id: form.getAttribute('data-entry'), options: options })
      .then(() => {
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
      this._render();
    }
  }

  _onClick(ev) {
    var E = window.EntOne;
    var tabEl = ev.target.closest('[data-tab]');
    if (tabEl) {
      this._setTab(tabEl.getAttribute('data-tab'));
      return;
    }
    var bookEl = ev.target.closest('[data-book]:not([data-action])');
    if (bookEl) {
      this._book = bookEl.getAttribute('data-book');
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
      this._save(el.closest('form'));
    } else if (!data) {
      return;
    } else if (action === 'refresh') this._refresh(data);
    else if (action === 'open') window.open(data.url, '_blank', 'noopener');
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
      '.logo { width: 32px; height: 32px; flex: none; border-radius: 50%; display: grid; place-items: center; color: ' + A + '; background: color-mix(in srgb, ' + A + ' 16%, transparent); --mdc-icon-size: 20px; }',
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
      '.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }',
      '.box { background: var(--card-background-color, #fff); border-radius: var(--ha-card-border-radius, 12px); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); padding: 12px 16px; min-width: 0; }',
      '.box h2 { margin: 0 0 6px; font-size: 14px; font-weight: 500; color: var(--secondary-text-color); }',
      '.box h3 { margin: 12px 0 2px; font-size: 13px; font-weight: 500; color: var(--secondary-text-color); }',
      '.box h3:first-child { margin-top: 0; }',
      '.tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }',
      '.tile { all: unset; cursor: pointer; padding: 12px 16px; border-radius: 12px; background: var(--card-background-color, #fff); border: 1px solid var(--divider-color, #e0e0e0); }',
      '.tile.hot { background: color-mix(in srgb, ' + A + ' 12%, var(--card-background-color, #fff)); }',
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
      '.settings { display: flex; flex-direction: column; gap: 12px; }',
      '.settings label { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }',
      '.settings label.check { flex-direction: row; align-items: center; gap: 8px; }',
      '.settings input[type=number] { font: inherit; width: 120px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); }',
      '.settings fieldset { border: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }',
      '.settings legend { font-size: 14px; margin-bottom: 4px; padding: 0; }',
      '.url, .hint { font-size: 12px; color: var(--secondary-text-color); }',
      '.msg { font-size: 13px; margin-right: auto; }',
      '.msg.ok { color: color-mix(in srgb, var(--success-color, #43a047) 55%, var(--primary-text-color)); }',
      '@media (max-width: 600px) { .updated { display: none; } .page { padding: 12px; } .tile .v { font-size: 22px; } }',
      '@media (prefers-reduced-motion: reduce) { .spinning ha-icon { animation: none; opacity: .5; } }',
    ].join('\n');
  }
}

if (!customElements.get('ent-one-panel')) customElements.define('ent-one-panel', EntOnePanel);
