// Unit tests for the card logic: the card file is evaluated with stubs, no browser needed.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

// West of UTC: a date-only "YYYY-MM-DD" read as UTC midnight would show the day before.
process.env.TZ = 'America/New_York';

const source = readFileSync(new URL('../custom_components/ent_one/frontend/ent-one-card.js', import.meta.url), 'utf8');
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
vm.runInContext(`${source}\nthis.e = { entOneEsc, entOneLang, entOneLocale, entOneT, entOneData, entOneDay, entOneDue, entOneSortedHomework, entOneSetDone, entOneSign, entOneCanSign, entOneWordRow, entOneMessageRow, entOneTime, entOneSetTimeFormat, entOneFileKind, entOneFiles, EntOneI18n };`, context);
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
  const entities = { 'sensor.other': { platform: 'other' } };
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
  assert.match(full, /<img alt="Map" loading="lazy" data-ent-src="\/workspace\/document\/d2"/);
  assert.match(full, /data-path="\/workspace\/document\/d3" data-name="sheet.docx"/);
  const card = E.entOneFiles(files, t, 'abc', false);
  assert.doesNotMatch(card, /<iframe/);
  assert.match(card, /<img alt="Map"/);
  assert.equal(E.entOneFiles([], t, 'abc', true), '');
});
