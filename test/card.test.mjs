// Unit tests for the card logic: the card file is evaluated with stubs, no browser needed.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { bundle } from '../scripts/bundle.mjs';

// West of UTC: a date-only "YYYY-MM-DD" read as UTC midnight would show the day before.
process.env.TZ = 'America/New_York';

// The card file as scripts/build-frontend.mjs assembles it from its ES modules in src/ent-one-card/.
const source = bundle('src/ent-one-card/index.js');
const context = {
  HTMLElement: class {},
  customElements: { get: () => true, define() {} },
  window: {},
  navigator: { language: 'en' },
  document: { addEventListener() {}, removeEventListener() {} },
  console,
  Date,
  Intl,
};
vm.createContext(context);
vm.runInContext(`${source}\nthis.e = { entOneEsc, entOneLang, entOneLocale, entOneT, entOneData, entOneDay, entOneDue, entOneSortedHomework, entOneSetDone, entOneSign, entOneCanSign, entOneWordRow, entOneHomeworkRow, entOneMessageRow, entOneTime, entOneSetTimeFormat, entOneFileKind, entOneFiles, EntOneI18n, EntOneCard };`, context);
const E = context.e;

const sensor = (id, state, attrs) => ({ entity_id: id, state: String(state), attributes: { config_entry_id: 'abc', stale: [], ...attrs } });
const states = {
  'sensor.ent_unread': sensor('sensor.ent_unread', 2, { messages: [{ id: 'm1', unread: true }] }),
  'sensor.ent_words': sensor('sensor.ent_words', 1, { words: [{ id: '1', child_id: 'c1', signed: false }] }),
  'sensor.ent_homework': sensor('sensor.ent_homework', 1, { homework: [{ id: 'h1', book_id: 'b1', done: false }], books: { b1: 'CE2' }, stale: ['homework'] }),
  'sensor.ent_news': sensor('sensor.ent_news', 0, { news: [] }),
  'sensor.ent_last': sensor('sensor.ent_last', '2026-11-16T08:00:00+00:00', { account: { schools: ['École'] }, children: [], events: [], url: 'https://ent' }),
  'sensor.other': { entity_id: 'sensor.other', state: '3', attributes: { config_entry_id: 'zzz', messages: [] } },
};

test('entOneEsc escapes HTML', () => {
  assert.equal(E.entOneEsc('<b a="1">\'&'), '&lt;b a=&quot;1&quot;&gt;&#39;&amp;');
  assert.equal(E.entOneEsc(null), '');
});

test('language and locale', () => {
  assert.equal(E.entOneLang({ locale: { language: 'fr-FR' } }), 'fr');
  assert.equal(E.entOneLang({ locale: { language: 'sr-Latn' } }), 'sr-Latn');
  assert.equal(E.entOneLang({ locale: { language: 'xx' } }), 'en');
  assert.equal(E.entOneLocale({ locale: { language: 'pt' } }), 'pt-PT');
});

test('every language has the English keys', () => {
  const en = Object.keys(E.EntOneI18n.en).filter((k) => k !== 'default_title').sort();
  for (const [lang, table] of Object.entries(E.EntOneI18n)) {
    if (lang === 'en') continue;
    assert.deepEqual(Object.keys(table).filter((k) => k !== 'default_title').sort(), en, lang);
    for (const [k, v] of Object.entries(table)) {
      assert.deepEqual((v.match(/\{\w+\}/g) || []).sort(), (E.EntOneI18n.en[k].match(/\{\w+\}/g) || []).sort(), `${lang}.${k}`);
    }
  }
  assert.equal(Object.keys(E.EntOneI18n).length, 22);
});

test('entOneData groups the sensors of one account', () => {
  // The registry lists every sensor; only those of the integration are read.
  const entities = { 'sensor.other': { platform: 'other' } };
  for (const id of Object.keys(states).filter((k) => k.startsWith('sensor.ent_'))) entities[id] = { platform: 'ent_one' };
  const d = E.entOneData({ states, entities }, 'abc');
  assert.equal(d.unread, 2);
  assert.equal(d.words.length, 1);
  assert.equal(d.books.b1, 'CE2');
  assert.deepEqual([...d.stale], ['homework']);
  assert.equal(d.url, 'https://ent');
  assert.equal(E.entOneData({ states, entities }, 'zzz'), null, 'a sensor of another integration is ignored');
});

test('relative days and due labels', () => {
  const t = E.entOneT({ language: 'en' });
  const iso = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  assert.equal(E.entOneDay(iso(0), t, 'en'), 'Today');
  assert.equal(E.entOneDay(iso(1), t, 'en'), 'Tomorrow');
  assert.equal(E.entOneDue(iso(0), t, 'en'), 'for today');
  assert.equal(E.entOneDue(iso(1), t, 'en'), 'for tomorrow');
  assert.match(E.entOneDue(iso(3), t, 'en'), /^for \w+/);
});

test('homework order: undone first by date, done hidden on request', () => {
  const list = [
    { id: 'a', date: '2026-11-20', done: true },
    { id: 'b', date: '2026-11-21', done: false },
    { id: 'c', date: '2026-11-19', done: false },
  ];
  assert.deepEqual(E.entOneSortedHomework(list, true).map((h) => h.id), ['c', 'b', 'a']);
  assert.deepEqual(E.entOneSortedHomework(list, false).map((h) => h.id), ['c', 'b']);
});

test('actions send the account and ids', async () => {
  const calls = [];
  const hass = { callWS: (m) => calls.push(m) && Promise.resolve(), callService: (...a) => calls.push(a) && Promise.resolve() };
  await E.entOneSetDone(hass, 'abc', { id: 'h1', book_id: 'b1' }, true);
  await E.entOneSign(hass, 'abc', { id: 7, child_id: 'c1' });
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { type: 'ent_one/homework_done', config_entry_id: 'abc', book_id: 'b1', homework_id: 'h1', done: true },
    ['ent_one', 'sign_word', { config_entry_id: 'abc', word_id: '7', child_id: 'c1' }],
  ]);
});

test('only administrators get the sign button', () => {
  const t = E.entOneT({ language: 'en' });
  const word = { id: '1', child_id: 'c1', title: 'Trip', signed: false };
  assert.equal(E.entOneCanSign({ user: { is_admin: false } }), false);
  assert.equal(E.entOneCanSign({ user: { is_admin: true } }), true);
  assert.equal(E.entOneCanSign({}), true, 'unknown user: the backend still refuses non-admins');
  assert.match(E.entOneWordRow(word, t, 'en', { canSign: true }), /data-action="sign"/);
  assert.doesNotMatch(E.entOneWordRow(word, t, 'en', { canSign: false }), /data-action="sign"/);
});

test('time follows the 12 / 24 h setting of the profile', () => {
  const raw = '2026-11-20T09:05:00';
  E.entOneSetTimeFormat({ locale: { time_format: '24' } });
  assert.doesNotMatch(E.entOneTime(raw, 'en-US'), /AM|PM/);
  E.entOneSetTimeFormat({ locale: { time_format: '12' } });
  assert.match(E.entOneTime(raw, 'fr'), /AM|PM|am|pm/i);
  E.entOneSetTimeFormat({ locale: { time_format: 'language' } });
  assert.match(E.entOneTime(raw, 'en-US'), /AM/);
});

test('far dates keep the weekday', () => {
  const t = E.entOneT({ language: 'en' });
  const d = new Date();
  d.setDate(d.getDate() + 10);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekday = d.toLocaleDateString('en', { weekday: 'short' });
  assert.ok(E.entOneDay(iso, t, 'en').includes(weekday));
});

test('rows unfold on demand', () => {
  const t = E.entOneT({ language: 'en' });
  const word = { id: '1', child_id: 'c1', title: 'Trip', text: 'Bring lunch', signed: false };
  const closed = E.entOneWordRow(word, t, 'en', { isOpen: () => false });
  assert.match(closed, /data-toggle="word:1:c1"/);
  assert.match(closed, /aria-expanded="false"/);
  assert.doesNotMatch(closed, /Bring lunch/);
  assert.match(E.entOneWordRow(word, t, 'en', { isOpen: () => true }), /Bring lunch/);
  const msg = E.entOneMessageRow({ id: 'm1', subject: 'Pool', unread: true }, t, 'en', { url: 'https://ent', isOpen: () => true });
  assert.match(msg, /href="https:\/\/ent\/conversation\/conversation"/);
});

test('attachments are shown: images, PDF viewer in the reading pane, other files as buttons', () => {
  const t = E.EntOneI18n.en;
  assert.equal(E.entOneFileKind({ name: 'Map', kind: 'image' }), 'image');
  assert.equal(E.entOneFileKind({ name: 'photo.JPG', kind: 'file' }), 'image');
  assert.equal(E.entOneFileKind({ name: 'list.pdf', kind: 'file' }), 'pdf');
  assert.equal(E.entOneFileKind({ name: 'sheet.docx', kind: 'file' }), 'file');
  const files = [
    { path: '/workspace/document/d1', name: 'slip.pdf', kind: 'file' },
    { path: '/workspace/document/d2', name: 'Map', kind: 'image' },
    { path: '/workspace/document/d3', name: 'sheet.docx', kind: 'file' },
  ];
  const full = E.entOneFiles(files, t, 'abc', true);
  assert.match(full, /<iframe title="slip.pdf" data-ent-src="\/workspace\/document\/d1"/);
  assert.match(full, /<img alt="Map" data-ent-src="\/workspace\/document\/d2"/);
  assert.match(full, /data-path="\/workspace\/document\/d3" data-name="sheet.docx"/);
  const card = E.entOneFiles(files, t, 'abc', false);
  assert.doesNotMatch(card, /<iframe/);
  assert.match(card, /<img alt="Map"/);
  assert.equal(E.entOneFiles([], t, 'abc', true), '');
});

test('the banner follows the theme alone: night with a dark theme, day with a light one even after sunset', () => {
  const night = vm.runInContext('entOneIsNight', context);
  const hass = (sun, darkMode) => ({ states: sun ? { 'sun.sun': { state: sun } } : {}, themes: { darkMode } });
  assert.equal(night(hass('below_horizon', false), {}), false);
  assert.equal(night(hass('above_horizon', true), {}), true);
  assert.equal(night(hass('above_horizon', false), {}), false);
  assert.equal(night(hass('unavailable', true), {}), true);
  assert.equal(night(hass(null, false), {}), false);
  assert.equal(night(hass('above_horizon', true), { illustration_theme: 'day' }), false);
  assert.equal(night(hass('below_horizon', true), { illustration_theme: 'day' }), false);
  assert.equal(night(hass('above_horizon', false), { illustration_theme: 'night' }), true);
});

// The status pill: right after the title only when the whole title and its whole label fit, else under the subtitle,
// else only its dot; decided by measure (no width threshold left in the stylesheet).
test('the status pill is placed by measure, the title whole first', () => {
  assert.doesNotMatch(source, /@container eo-titles|pill-line|max-width: 260px\) \{ \.title-row/);
  assert.match(source, /\.titles\.pill-below \.title-row \{ display: contents; \}/);
  const el = (w, extra = {}) => {
    const cls = new Set();
    return {
      _w: w,
      classList: {
        add: (...c) => {
          for (const x of c) cls.add(x);
        },
        remove: (...c) => {
          for (const x of c) cls.delete(x);
        },
        has: (c) => cls.has(c),
      },
      getClientRects: () => [1],
      getBoundingClientRect: () => ({ width: w, top: 10, bottom: 60 }),
      removeAttribute() {},
      closest: () => null,
      ...extra,
    };
  };
  const place = (titleW, pillW, blockW) => {
    const name = el(titleW);
    const chip = el(pillW, { querySelector: () => el(pillW - 20) });
    chip.parentElement = {};
    const t = el(blockW, { querySelector: (sel) => ({ '.status': chip, '.name': name, '.sub': null })[sel] });
    context.getComputedStyle = () => ({ columnGap: '8px' });
    context.document.createRange = () => ({ selectNodeContents(n) { this.n = n; }, getBoundingClientRect() { return { width: this.n._w }; } });
    const card = Object.create(E.EntOneCard.prototype);
    card._root = { querySelector: () => t };
    card._fitPill();
    return ['pill-below', 'pill-dot'].filter((c) => t.classList.has(c));
  };
  assert.deepEqual(place(100, 60, 200), [], 'whole title and pill fit: side by side');
  assert.deepEqual(place(150, 60, 200), ['pill-below'], 'the title would be cut: the pill under the subtitle');
  assert.deepEqual(place(150, 220, 200), ['pill-below', 'pill-dot'], 'the label does not fit its own line: only the dot');
});

// ── DOM patching (layout shift): a redraw keeps the nodes on the page ───────────────────────────────────────────
// A tiny DOM, enough for the patch helper: elements with attributes and children, and text nodes.
class FakeNode {
  constructor(type, name, value = null) {
    this.nodeType = type;
    this.nodeName = name.toUpperCase();
    this.localName = name.toLowerCase();
    this.nodeValue = value;
    this.childNodes = [];
    this.parentNode = null;
    this.attrs = new Map();
  }
  get attributes() {
    return [...this.attrs].map(([name, value]) => ({ name, value, namespaceURI: null }));
  }
  hasAttribute(n) {
    return this.attrs.has(n);
  }
  getAttribute(n) {
    return this.attrs.has(n) ? this.attrs.get(n) : null;
  }
  setAttribute(n, v) {
    this.attrs.set(n, String(v));
  }
  removeAttribute(n) {
    this.attrs.delete(n);
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }
  insertBefore(n, ref) {
    if (n.parentNode) n.parentNode.removeChild(n);
    const i = ref ? this.childNodes.indexOf(ref) : this.childNodes.length;
    this.childNodes.splice(i, 0, n);
    n.parentNode = this;
    return n;
  }
  removeChild(n) {
    this.childNodes.splice(this.childNodes.indexOf(n), 1);
    n.parentNode = null;
    return n;
  }
  replaceChild(n, o) {
    this.insertBefore(n, o);
    return this.removeChild(o);
  }
  get firstChild() {
    return this.childNodes[0] || null;
  }
}
const fakeEl = (name, attrs = {}, ...kids) => {
  const e = new FakeNode(1, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const k of kids) e.insertBefore(typeof k === "string" ? new FakeNode(3, "#text", k) : k, null);
  return e;
};

test("a redraw patches the card in place: pictures, images and texts keep their nodes", () => {
  const patch = vm.runInContext("entOneMorphChildren", context);
  const img = fakeEl("img", { src: "logo.svg", alt: "" });
  const svg = fakeEl("svg", { class: "scene" }, fakeEl("path", { d: "M0 0" }));
  const label = fakeEl("span", { class: "t" }, "3 min");
  const root = fakeEl("div", {}, fakeEl("div", { class: "banner st-ok", "data-wrap": "" }, svg, img), label, fakeEl("p", {}, "gone"));
  const next = fakeEl("div", {}, fakeEl("div", { class: "banner st-late" }, fakeEl("svg", { class: "scene" }, fakeEl("path", { d: "M0 0" })), fakeEl("img", { src: "logo.svg", alt: "" })), fakeEl("span", { class: "t" }, "2 min"));
  const banner = root.childNodes[0];
  const text = label.childNodes[0];
  patch(root, next);
  // The same nodes, updated: no picture or image is re-created (they would be laid out again)
  assert.equal(root.childNodes[0], banner);
  assert.equal(banner.childNodes[0], svg);
  assert.equal(banner.childNodes[1], img);
  assert.equal(root.childNodes[1], label);
  assert.equal(label.childNodes[0], text);
  assert.equal(text.nodeValue, "2 min");
  assert.equal(banner.getAttribute("class"), "banner st-late");
  assert.equal(banner.hasAttribute("data-wrap"), false);
  // What the new HTML no longer has is removed
  assert.equal(root.childNodes.length, 2);
});

test("a redraw replaces only the nodes whose element changed, and keeps an open dialog open", () => {
  const patch = vm.runInContext("entOneMorphChildren", context);
  const dlg = fakeEl("dialog", { id: "zoom", open: "" });
  const keep = fakeEl("div", { class: "a" });
  const root = fakeEl("div", {}, keep, fakeEl("span", {}, "x"), dlg);
  const fresh = fakeEl("button", { class: "b" });
  patch(root, fakeEl("div", {}, fakeEl("div", { class: "a" }), fresh, fakeEl("dialog", { id: "zoom" })));
  assert.deepEqual(root.childNodes.map((n) => n.localName), ["div", "button", "dialog"]);
  assert.equal(root.childNodes[0], keep);
  assert.equal(root.childNodes[1], fresh);
  assert.equal(root.childNodes[2], dlg);
  // `open` belongs to showModal() / close(), not to the HTML
  assert.equal(dlg.hasAttribute("open"), true);
});

test("a hass update that changes no sensor of the account does not redraw the card; one of its sensors does", () => {
  const entities = { 'sensor.other': { platform: 'other' } };
  for (const id of Object.keys(states).filter((k) => k.startsWith('sensor.ent_'))) entities[id] = { platform: 'ent_one' };
  const card = Object.create(E.EntOneCard.prototype);
  card._config = {};
  let renders = 0;
  card._render = () => renders++;
  card.hass = { states, entities };
  assert.equal(renders, 1);
  // Another entity changes: the card is not touched (no DOM change, nothing laid out again)
  card.hass = { states: { ...states, 'sensor.other': { ...states['sensor.other'], state: '4' } }, entities };
  assert.equal(renders, 1);
  card.hass = { states: { ...states, 'sensor.ent_unread': sensor('sensor.ent_unread', 3, { messages: [] }) }, entities };
  assert.equal(renders, 2);
});

test("a redraw keeps what a Home Assistant element drew in itself, and replaces it when its attributes change", () => {
  const patch = vm.runInContext("entOneMorphChildren", context);
  // <ha-icon> draws its own content (and may style its own node): the redraw leaves it alone
  const icon = fakeEl("ha-icon", { icon: "mdi:refresh", style: "display: inline-flex" }, fakeEl("svg"));
  const root = fakeEl("div", {}, icon);
  patch(root, fakeEl("div", {}, fakeEl("ha-icon", { icon: "mdi:refresh" })));
  assert.equal(root.childNodes[0], icon);
  assert.equal(icon.childNodes.length, 1);
  assert.equal(icon.getAttribute("style"), "display: inline-flex");
  // Another icon: a new element, which draws the new icon
  patch(root, fakeEl("div", {}, fakeEl("ha-icon", { icon: "mdi:check" })));
  assert.notEqual(root.childNodes[0], icon);
  assert.equal(root.childNodes[0].getAttribute("icon"), "mdi:check");
  // An element we fill ourselves (<ha-card>) is patched like any other
  const card = fakeEl("ha-card", { class: "mini" }, fakeEl("div", {}, "a"));
  const host = fakeEl("div", {}, card);
  patch(host, fakeEl("div", {}, fakeEl("ha-card", {}, fakeEl("div", {}, "b"))));
  assert.equal(host.childNodes[0], card);
  assert.equal(card.hasAttribute("class"), false);
  assert.equal(card.childNodes[0].childNodes[0].nodeValue, "b");
});

// Home Assistant's <ha-card> is a Lit element: it lays out its content from its first update only, a microtask after it
// is connected. Measured before, the title and the pill are 0 px wide and the pill lands on the wrong line for a frame:
// the card waits for that update (updateComplete), then measures once.
test("the status pill is measured only once <ha-card> has drawn its content", async () => {
  const card = Object.create(E.EntOneCard.prototype);
  const asked = [];
  let drawn;
  const haCard = { hasUpdated: false, updateComplete: new Promise((done) => (drawn = done)) };
  const root = {
    querySelector: (sel) => (sel === "ha-card" ? haCard : (asked.push(sel), null)),
    querySelectorAll: (sel) => (asked.push(sel), []),
  };
  card._root = root;
  card._fitPill();
  card._fitPill();
  await null;
  assert.deepEqual(asked, [], "nothing measured before <ha-card>'s first update");
  haCard.hasUpdated = true;
  drawn(true);
  await haCard.updateComplete;
  await null;
  assert.ok(asked.length > 0, "measured once it is drawn");
  const once = asked.length;
  card._fitPill();
  assert.equal(asked.length, once * 2, "then measured right away, with no wait");
});

test('only administrators can tick homework (the server refuses the others)', () => {
  const t = E.entOneT({ language: 'en' });
  const h = { id: 'h1', book_id: 'b1', title: 'Lire', done: false };
  assert.doesNotMatch(E.entOneHomeworkRow(h, t, 'en', { canEdit: true }), /data-action="homework"[^>]*disabled/);
  assert.doesNotMatch(E.entOneHomeworkRow(h, t, 'en', {}), /data-action="homework"[^>]*disabled/);
  assert.match(E.entOneHomeworkRow(h, t, 'en', { canEdit: E.entOneCanSign({ user: { is_admin: false } }) }), /data-action="homework"[^>]*disabled/);
});
