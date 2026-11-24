// ── ent-one-mini-card: the three counts, and a button to show the full card ───
import { entOneEsc, entOneInDialog } from "./helpers.js";
import { EntOneCard } from "./card.js";

export class EntOneMiniCard extends EntOneCard {
  constructor() {
    super();
    this._zoomed = false;
    this._onOutsideMini = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !entOneInDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onOutsideMini, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onOutsideMini, true);
    if (this._zoomed) this._setZoom(false);
  }

  setConfig(config) {
    this.setAttribute?.('mini', '');
    super.setConfig(config);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 2;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 4, rows: 'auto' };
  }

  _compact() {
    return !this._zoomed;
  }

  _detailButton(t) {
    var label = this._zoomed ? t.show_compact : t.show_full;
    return '<button class="detail" data-action="detail" title="' + entOneEsc(label) + '" aria-label="' + entOneEsc(label) + '">' +
      '<ha-icon icon="mdi:' + (this._zoomed ? 'arrow-collapse' : 'arrow-expand') + '"></ha-icon></button>';
  }

  _toggleDetail(ev) {
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    if (!ev.detail) this._root.querySelector('.detail')?.focus?.({ preventScroll: true });
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    if (!zoomed) this._confirm = null;
    this._render(true);
  }
}
