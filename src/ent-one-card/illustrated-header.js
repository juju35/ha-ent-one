// ── illustrated header ────────────────────────────────────────────────────────
// A school corner on the card's sky: the schoolbag and the exercise books on a shelf, then what is waiting —
// a sheet with a writing pen (homework, words to sign), the envelope of the unread messages with their count, or
// a ticked sheet when everything is done. The header icon (mdi:school) takes the status colour.
import { ENT_ONE_ACCENT } from "./header-icon.js";

export var ENT_ONE_SCHOOL_PATH = 'M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z';

// The width of an element's whole text in fractional pixels, even while it is cut with an ellipsis (0 when hidden).
export function entOneTextWidth(el) {
  if (!el?.getClientRects?.().length || typeof document.createRange !== 'function') return 0;
  var range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
}

// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
export function entOneIsNight(hass, config) {
  var theme = config?.illustration_theme;
  if (theme === 'night') return true;
  if (theme === 'day') return false;
  return !!hass?.themes?.darkMode;
}

// What the header says: `kind` picks the picture (msg | hw | done | off), `status` the icon colour.
export function entOneHeaderState(data, config) {
  if (!data || data.unavailable) return { kind: 'off', status: 'bad', unread: 0 };
  var unread = config.show_messages ? data.unread : 0;
  var todo = config.show_homework ? data.homework.filter((h) => !h.done).length : 0;
  var toSign = config.show_words ? data.words.filter((w) => !w.signed).length : 0;
  var kind = unread > 0 ? 'msg' : todo + toSign > 0 ? 'hw' : 'done';
  var status = data.stale.length ? 'warn' : kind === 'done' ? 'idle' : 'active';
  return { kind: kind, status: status, unread: unread };
}

// The scene, 200 × 80, drawn from its bottom right corner. `low` drops the floating sheet or envelope under the
// header buttons at the top right.
export function entOneSceneSvg(st, night, uid, low) {
  var g = 'eo' + uid;
  var shelf = night ? '#3c4558' : '#c9b79c';
  var paper = night ? '#e9edf3' : '#fff';
  var line = night ? '#8a94a3' : '#9aa3ae';
  var edge = night ? '#7c8696' : '#c9ced6';
  var up = low ? 18 : 0;
  var floating;
  if (st.kind === 'msg') {
    var n = st.unread > 9 ? '9+' : String(st.unread);
    floating = '<g transform="translate(' + (low ? -10 : 0) + ' ' + up + ')"><g class="eo-bob"><rect x="150" y="10" width="36" height="20" rx="4" fill="' + paper + '" stroke="' + edge + '"/>' +
      '<path d="M154 14 l14 8 l14 -8" stroke="#2f80ed" stroke-width="1.2" fill="none"/><circle class="eo-dot" cx="186" cy="10" r="' + (n.length > 1 ? 5.4 : 4.4) + '" fill="#e5484d"/>' +
      '<text x="186" y="12.2" text-anchor="middle" font-size="6" font-weight="700" fill="#fff" font-family="sans-serif">' + n + '</text></g></g>';
  } else {
    var mark = st.kind === 'hw'
      ? '<path class="eo-pen" d="M10 8 l6 -10" stroke="#f5b400" stroke-width="2" stroke-linecap="round"/>'
      : st.kind === 'done'
        ? '<circle cx="9" cy="6" r="5" fill="#43a047"/><path d="M6.6 6 l1.7 1.7 l3.2 -3.4" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        : '';
    floating = '<g transform="translate(170 ' + (22 + up) + ')"' + (st.kind === 'off' ? ' opacity=".55"' : '') + '><rect x="-12" y="-10" width="24" height="20" rx="2" fill="' + paper + '" stroke="' + edge + '"/>' +
      '<path d="M-8 -4 h16 M-8 1 h12 M-8 6 h14" stroke="' + line + '"/>' + mark + '</g>';
  }
  return '<svg class="eo-scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">' +
    '<defs><linearGradient id="' + g + 'bag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ef5a5e"/><stop offset="1" stop-color="#d93c40"/></linearGradient></defs>' +
    '<rect x="96" y="62" width="104" height="3" fill="' + shelf + '"/>' +
    '<g transform="translate(120 62)"><rect x="-16" y="-30" width="32" height="30" rx="5" fill="url(#' + g + 'bag)"/><rect x="-10" y="-22" width="20" height="10" rx="2" fill="#c43a3a"/>' +
    '<path d="M-8 -30 q0 -8 8 -8 q8 0 8 8" stroke="#c43a3a" stroke-width="2.4" fill="none"/></g>' +
    '<g transform="translate(160 62)"><rect x="-16" y="-4" width="32" height="4" fill="#2f80ed"/><rect x="-14" y="-8" width="28" height="4" fill="#f5b400"/><rect x="-15" y="-12" width="30" height="4" fill="#43a047"/></g>' +
    floating + '</svg>';
}

export var ENT_ONE_BANNER_STYLES = [
  '.banner { position: relative; height: 90px; overflow: hidden; margin-bottom: 10px; --eo-g: 10px; --eo-scene-w: min(200px, 56%); background: #fdf3e7; --eo-text: #0d2a45; --eo-muted: #3b5b78; }',
  '.banner.night { background: #2a2a36; --eo-text: #fff; --eo-muted: rgba(255,255,255,.78); }',
  '.eo-scene { position: absolute; right: 0; bottom: var(--eo-g); height: calc(100% - var(--eo-g)); width: var(--eo-scene-w); }',
  '.eo-ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--eo-g); background: repeating-linear-gradient(90deg, #c99a6b 0 38px, #b98a5c 38px 40px); box-shadow: inset 0 2px 0 #a97c50; }',
  '.night .eo-ground { background: repeating-linear-gradient(90deg, #4a3a2c 0 38px, #3e3024 38px 40px); box-shadow: inset 0 2px 0 #5a4634; }',
  '.htext { position: absolute; z-index: 1; left: 12px; top: 6px; bottom: calc(var(--eo-g) + 4px); right: calc(var(--eo-scene-w) * .55); display: flex; align-items: center; gap: 10px; min-width: 0; color: var(--eo-text); }',
  '.banner .logo { position: relative; --c: #2f80ed; color: var(--c); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 22%, transparent); }',
  '.banner.night .logo { --c: #8fbaff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }',
  '.banner .logo.idle { --c: #8a96a3; } .banner.night .logo.idle { --c: #9aa5b1; }',
  '.banner .logo.warn { --c: var(--warning-color, #ffa600); } .banner .logo.bad { --c: var(--error-color, #db4437); }',
  '.banner .titles { min-width: 0; }',
  '.banner .name { color: var(--eo-text); }',
  '.banner .sub { color: var(--eo-muted); }',
  '.banner .status.active { --c: #2f80ed; } .banner .status.idle { --c: #8a96a3; } .banner.night .status.idle { --c: #9aa5b1; }',
  '.banner .status { background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }',
  '.banner.night .status { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }',
  // The brand: the ONE panda on a white tile at the icon's bottom right.
  '.brand { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px; padding: 2px; box-sizing: border-box; display: grid; place-items: center;' +
    ' background: #fff; color: ' + ENT_ONE_ACCENT + '; box-shadow: 0 0 0 1px rgba(13,42,69,.16), 0 1px 3px rgba(13,42,69,.18); }',
  '.logo .brand svg { width: 14px; height: 14px; }',
  // The header buttons: 24 px round glass buttons on the top line, the detail button in the corner, the others at its left.
  '.hbtns { position: absolute; z-index: 2; top: 5px; right: 5px; display: flex; gap: 4px; }',
  '.hbtns .hbtn, .hbtns .detail { width: 24px; height: 24px; border-radius: 50%;' +
    ' color: #33506b; background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }',
  '.night .hbtns .hbtn, .night .hbtns .detail { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }',
  '.hbtns .hbtn:hover, .hbtns .detail:hover { background: rgba(255,255,255,.75); color: #33506b; }',
  '.night .hbtns .hbtn:hover, .night .hbtns .detail:hover { background: rgba(255,255,255,.22); color: #fff; }',
  '.eo-pen { animation: eo-write 1s ease-in-out infinite; }',
  '.eo-bob { animation: eo-write 2s ease-in-out infinite; }',
  '.eo-dot { animation: eo-blink 1.6s ease-in-out infinite; }',
  '@keyframes eo-write { 50% { transform: translateY(3px); } }',
  '@keyframes eo-blink { 50% { opacity: .55; } }',
  '@container (max-width: 320px) { .banner .logo { display: grid; } }',
  '@container (max-width: 220px) { .eo-scene { display: none; } .htext { right: 36px; } }',
  '@media (prefers-reduced-motion: reduce) { .eo-pen, .eo-bob, .eo-dot { animation: none; } }',
].join('\n');

// The panel draws the same illustrated header as the card.
window.EntOne.banner = { scene: entOneSceneSvg, state: entOneHeaderState, isNight: entOneIsNight, styles: ENT_ONE_BANNER_STYLES, schoolPath: ENT_ONE_SCHOOL_PATH };
