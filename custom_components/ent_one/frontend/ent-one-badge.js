// ENT ONE's sidebar badge, loaded on every page: the number of things to deal with on the panel's sidebar item —
// words to sign, homework to do and unread messages, summed over every child account — in the accent colour, like
// Home Assistant's own notifications count. The counts are the states of the account sensors (words_to_sign,
// homework, unread_messages), found by their own attributes, which Home Assistant keeps up to date; the badge
// follows them. The last value is kept by the browser, so the sidebar shows it at once.
var ENT_ONE_COUNT_KEY = 'ent-one-count';
var ENT_ONE_EVERY_MS = 15000;
// The badge takes the accent colour; its text is white.
var ENT_ONE_BADGE_COLOR = 'var(--primary-color, #3f51b5)';
// A sensor counted in the badge carries one of these attributes (news and blog are left out on purpose).
var ENT_ONE_COUNT_ATTRS = ['words', 'homework', 'messages'];

function entOneBadgeSaved() {
  try {
    var n = parseInt(localStorage.getItem(ENT_ONE_COUNT_KEY), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (_err) {
    return 0;
  }
}
window.__entOneBadgeCount ??= entOneBadgeSaved();

// The ENT ONE item in Home Assistant's sidebar, or null until the sidebar is drawn. The recent sidebar gives each
// item the id `sidebar-panel-<path>` and sets its href as a property (not an attribute), so the id is the reliable
// hook; `[href]` and `[data-panel]` catch the older sidebars (an <a> wrapping a paper-icon-item).
function entOneSidebarItem() {
  var ha = document.querySelector('home-assistant')?.shadowRoot;
  var sidebar = ha?.querySelector('home-assistant-main')?.shadowRoot?.querySelector('ha-sidebar')?.shadowRoot;
  if (!sidebar) return null;
  return (
    sidebar.querySelector('#sidebar-panel-ent-one') ||
    sidebar.querySelector('[href="/ent-one"]') ||
    sidebar.querySelector('[data-panel="ent-one"]')
  );
}

// One badge span, styled as Home Assistant's own sidebar badge (class `badge`, so the sidebar's CSS places it and
// shows or hides it by slot and expanded state) but in the accent colour instead of the default.
function entOneBadgeSpan(text, slot, key) {
  var el = document.createElement('span');
  el.className = 'badge ent-one-badge';
  el.slot = slot;
  el.dataset.key = key;
  el.textContent = text;
  el.style.cssText = `min-width:18px; height:18px; box-sizing:border-box; padding:0 5px; align-items:center; border-radius:9px; font-size:11px; font-weight:500; line-height:1; color:#fff; background:${ENT_ONE_BADGE_COLOR};`;
  return el;
}

// The badge on the sidebar item: the number of things to deal with, like the notifications count; none when there is
// nothing. On the recent sidebar (ha-list-item-button / ha-md-list-item) it mirrors Home Assistant's own badge — a
// span in the start slot (shown when the sidebar is collapsed, over the icon) and one in the end slot (shown when
// expanded) — so the sidebar's CSS handles the placement and the collapsed/expanded switch. On the older sidebar (an
// <a>) a single span is placed at the right. Redrawn when Home Assistant rebuilds its items; unchanged, it writes
// nothing (so the observer below does not loop).
function entOneBadgeRedraw() {
  var item = entOneSidebarItem();
  if (!item) return false;
  var count = window.__entOneBadgeCount;
  var spans = item.querySelectorAll(':scope > .ent-one-badge');
  if (!count) {
    for (var b of spans) b.remove();
    return true;
  }
  var text = count > 99 ? '99+' : String(count);
  var key = text;
  if (item.localName === 'a') {
    var badge = spans[0];
    if (badge && badge.dataset.key === key) return true;
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'ent-one-badge';
      item.style.position = 'relative';
      item.appendChild(badge);
    }
    badge.dataset.key = key;
    badge.textContent = text;
    badge.style.cssText = `position:absolute; right:12px; top:50%; transform:translateY(-50%); min-width:18px; height:18px; box-sizing:border-box; padding:0 5px; display:inline-flex; align-items:center; justify-content:center; border-radius:9px; font-size:11px; font-weight:500; line-height:1; pointer-events:none; z-index:1; color:#fff; background:${ENT_ONE_BADGE_COLOR};`;
    return true;
  }
  if (spans.length === 2 && spans[0].dataset.key === key) return true;
  for (var old of spans) old.remove();
  // The start badge goes right after the icon, so the sidebar's `ha-svg-icon + .badge` rule places it over the icon.
  var icon = item.querySelector(':scope > ha-svg-icon[slot="start"]') || item.querySelector(':scope > ha-icon[slot="start"]');
  var start = entOneBadgeSpan(text, 'start', key);
  if (icon) item.insertBefore(start, icon.nextSibling);
  else item.appendChild(start);
  item.appendChild(entOneBadgeSpan(text, 'end', key));
  return true;
}

// Until the sidebar has drawn the item (it may come after this module): every 250 ms for 5 seconds
function entOneBadgeRedrawSoon(tries = 20) {
  if (entOneBadgeRedraw() || tries <= 1) return;
  setTimeout(() => entOneBadgeRedrawSoon(tries - 1), 250);
}

// The sidebar rebuilds its items (opened, folded, panels changed): the badge is added again when it is dropped
function entOneBadgeObserve() {
  var item = entOneSidebarItem();
  var sidebar = item?.getRootNode();
  if (!sidebar) {
    setTimeout(entOneBadgeObserve, 500);
    return;
  }
  if (sidebar.__entOneBadgeObserved) return;
  sidebar.__entOneBadgeObserved = true;
  new MutationObserver(() => {
    if (window.__entOneBadgeRaf) return;
    window.__entOneBadgeRaf = requestAnimationFrame(() => {
      window.__entOneBadgeRaf = 0;
      entOneBadgeRedraw();
    });
  }).observe(sidebar, { childList: true, subtree: true });
}

// The count: the badge drawn again when it changes, kept for the next page
function entOneSetBadge(count) {
  count = Math.max(0, parseInt(count, 10) || 0);
  if (window.__entOneBadgeCount === count) return;
  window.__entOneBadgeCount = count;
  try {
    localStorage.setItem(ENT_ONE_COUNT_KEY, String(count));
  } catch (_err) {
    // drawn anyway, not kept
  }
  entOneBadgeRedraw();
}

// The things to deal with: the sum of the ENT ONE count sensors' states (words to sign, homework to do, unread
// messages), over every child account. A sensor is one of those when it carries the matching attribute; the platform
// is checked too when the registry is loaded.
function entOneCount(hass) {
  var states = hass?.states;
  if (!states) return 0;
  var total = 0;
  for (var id in states) {
    if (!id.startsWith('sensor.')) continue;
    var st = states[id];
    var attrs = st?.attributes;
    if (!attrs || !ENT_ONE_COUNT_ATTRS.some((a) => a in attrs)) continue;
    if (hass.entities?.[id] && hass.entities[id].platform !== 'ent_one') continue;
    var n = Number(st.state);
    if (Number.isFinite(n)) total += n;
  }
  return total;
}

// The counts read from the sensors, reported for the sidebar badge
function entOneFollow() {
  var hass = document.querySelector('home-assistant')?.hass;
  if (!hass?.user?.is_admin || document.hidden) return;
  entOneSetBadge(entOneCount(hass));
}

if (!window.__entOneBadge_init) {
  window.__entOneBadge_init = true;
  entOneBadgeRedrawSoon();
  entOneBadgeObserve();
  // The counts read a few seconds after the page, once Home Assistant has drawn it, then every 15 seconds
  setTimeout(entOneFollow, 3000);
  setInterval(entOneFollow, ENT_ONE_EVERY_MS);
}
