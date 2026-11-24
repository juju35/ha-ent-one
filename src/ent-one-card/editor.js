// ── editor ────────────────────────────────────────────────────────────────────
import { ENT_ONE_CARD_VERSION, pickerDefine } from "./card-picker.js";
import { ENT_ONE_DEFAULTS, ENT_ONE_LANGUAGES } from "./i18n-helpers.js";
import { entOneLang, entOneT } from "./helpers.js";
import { EntOneCard } from "./card.js";
import { EntOneMiniCard } from "./mini-card.js";

export var ENT_ONE_EDITOR_KEYS = {
  config_entry_id: 'editor_entry',
  title: 'editor_title',
  show_title: 'editor_show_title',
  show_refresh: 'editor_show_refresh',
  show_words: 'editor_show_words',
  show_homework: 'editor_show_homework',
  show_done: 'editor_show_done',
  show_messages: 'editor_show_messages',
  show_news: 'editor_show_news',
  show_blog: 'editor_show_blog',
  show_events: 'editor_show_events',
  show_empty: 'editor_show_empty',
  max_items: 'editor_max_items',
  language: 'editor_language',
  illustration: 'editor_illustration',
  illustration_theme: 'editor_illustration_theme',
};

export function entOneEditorSchema(t) {
  var bool = (name) => ({ name: name, selector: { boolean: {} } });
  return [
    { name: 'config_entry_id', selector: { config_entry: { integration: 'ent_one' } } },
    { name: 'title', selector: { text: {} } },
    {
      type: 'grid',
      name: '',
      schema: ['show_title', 'show_refresh', 'show_words', 'show_homework', 'show_done', 'show_messages', 'show_events', 'show_news', 'show_blog', 'show_empty'].map(bool),
    },
    { name: 'max_items', selector: { number: { min: 1, max: 20, mode: 'box' } } },
    {
      type: 'grid',
      name: '',
      schema: [
        bool('illustration'),
        { name: 'illustration_theme', selector: { select: { mode: 'dropdown', options: ['auto', 'day', 'night'].map((v) => ({ value: v, label: t['theme_' + v] })) } } },
      ],
    },
    {
      name: 'language',
      selector: { select: { mode: 'dropdown', options: [{ value: '', label: t.editor_lang_auto }].concat(ENT_ONE_LANGUAGES.map((l) => ({ value: l[0], label: l[1] }))) } },
    },
  ];
}

export class EntOneCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({}, config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    else this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.addEventListener('value-changed', this._valueChanged.bind(this));
      this.appendChild(this._form);
    }
    var lang = entOneLang(this._hass, this._config);
    if (lang !== this._lang) {
      this._lang = lang;
      var t = entOneT(this._hass, this._config);
      this._form.schema = entOneEditorSchema(t);
      this._form.computeLabel = (field) => t[ENT_ONE_EDITOR_KEYS[field.name]] || field.name;
    }
    this._form.hass = this._hass;
    this._form.data = Object.assign({}, ENT_ONE_DEFAULTS, this._config);
  }

  _valueChanged(ev) {
    var value = Object.assign({}, ev.detail.value);
    Object.keys(ENT_ONE_DEFAULTS).forEach((key) => {
      if (value[key] === ENT_ONE_DEFAULTS[key]) delete value[key];
    });
    ['title', 'config_entry_id', 'language'].forEach((key) => {
      if (!value[key]) delete value[key];
    });
    this._config = value;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: value }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('ent-one-card-editor')) pickerDefine('ent-one-card-editor', EntOneCardEditor);

export var entOneDefined = false;
if (!customElements.get('ent-one-card')) {
  pickerDefine('ent-one-card', EntOneCard);
  entOneDefined = true;
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'ent-one-card',
    name: 'ENT ONE',
    description: 'Liaison book, homework, messages, calendar and news of an ENT ONE account.',
    preview: true,
    documentationURL: 'https://github.com/juju35/ha-ent-one',
  });
}
if (!customElements.get('ent-one-mini-card')) {
  pickerDefine('ent-one-mini-card', EntOneMiniCard);
  entOneDefined = true;
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'ent-one-mini-card',
    name: 'ENT ONE mini',
    description: 'Unread messages, words to sign and homework, with a button to show the full ENT ONE card.',
    preview: true,
    documentationURL: 'https://github.com/juju35/ha-ent-one',
  });
}
if (entOneDefined) {
  console.info(`%c ENT-ONE-CARD %c v${ENT_ONE_CARD_VERSION} `, 'color:#fff;background:#f39c3c;font-weight:700', 'color:#f39c3c;background:#fff');
}
