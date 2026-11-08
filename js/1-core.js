/* ===== Basics ===== */
// MODE is 'web' for the public website and 'artifact' for the preview on Claude. TRACKER is Darien's Google tracker (web only; blank = off).
const MODE = '__MODE__';
const ON_WEB = MODE === 'web';
const TRACKER = '__TRACKER__';
let ADMIN = false;
const $ = (id) => document.getElementById(id);
const DATA = JSON.parse($('site-data').textContent);
const PHOTO = $('photo-src').getAttribute('src');
document.querySelectorAll('img[data-photo]').forEach((i) => { i.src = PHOTO; });
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
};
// This visit only (cleared when the tab closes): where the visitor came from and what they did
const sess = {
  get(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
};

/* ===== Arriving from a post or DM: darienphillips.com/p/<home>?from=instagram =====
   The public site serves every /p/ link from this page, so it switches to #p/<home> before anything loads. */
(function landing() {
  let q = null;
  try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
  const src = q ? (q.get('from') || q.get('utm_source') || '') : '';
  if (src) sess.set('dp-src', String(src).toLowerCase().replace(/[^a-z0-9 _-]/g, '').slice(0, 30));
  const m = location.pathname.match(/^\/p\/([^\/]+)\/?$/i);
  if (!m) return;
  let key = m[1];
  try { key = decodeURIComponent(key); } catch (e) { /* keep it as typed */ }
  sess.set('dp-landed', key);
  try { history.replaceState(null, '', '/#p/' + encodeURIComponent(key)); } catch (e) { location.hash = 'p/' + key; }
})();
const SOURCE = () => sess.get('dp-src', '');
const SOURCE_NAME = (s) => ({ instagram: 'Instagram', ig: 'Instagram', facebook: 'Facebook', fb: 'Facebook', tiktok: 'TikTok', manychat: 'ManyChat', youtube: 'YouTube', google: 'Google', email: 'Email', text: 'Text message' }[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : ''));
// A short log of this visit, sent with a sign-in so Darien sees how they got there
function logStep(text) {
  const t = sess.get('dp-steps', []);
  const last = t[t.length - 1];
  if (last && last.x === text && Date.now() - last.t < 60000) return;
  t.push({ t: Date.now(), x: String(text).slice(0, 160) });
  sess.set('dp-steps', t.slice(-60));
}
const stepsText = () => sess.get('dp-steps', []).map((e) => new Date(e.t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + '  ' + e.x);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const short = (n) => (n >= 1e6 ? '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : '$' + Math.round(n / 1e3) + 'k');
const comma = (n) => Math.round(n).toLocaleString('en-US');
const parseMoney = (s) => {
  let t = String(s == null ? '' : s).trim().toLowerCase().replace(/[$,\s]/g, '');
  if (!t) return NaN;
  let m = 1;
  if (t.endsWith('k')) { m = 1e3; t = t.slice(0, -1); } else if (t.endsWith('m')) { m = 1e6; t = t.slice(0, -1); }
  const v = parseFloat(t);
  return isFinite(v) ? v * m : NaN;
};
const parseNum = (s) => { const v = parseFloat(String(s == null ? '' : s).replace(/[%,\s$]/g, '')); return isFinite(v) ? v : NaN; };
const pmt = (P, ratePct, months) => {
  if (!(P > 0) || !(months > 0)) return 0;
  const r = ratePct / 100 / 12;
  if (!(r > 0)) return P / months;
  return P * r / (1 - Math.pow(1 + r, -months));
};
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const plural = (n, one, many) => comma(n) + ' ' + (n === 1 ? one : (many || one + 's'));
const calm = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const range = (a, b) => (a === b || b == null ? String(a) : a + '–' + b);

/* ===== Saved state ===== */
const S = Object.assign({ place: null }, store.get('dp-site', {}) || {});
const save = () => store.set('dp-site', S);
function sub(key, defaults) {
  // Keep the same object, so a page that holds it always sees (and saves) the latest values
  const cur = S[key] && typeof S[key] === 'object' ? S[key] : {};
  Object.keys(defaults || {}).forEach((k) => { if (!(k in cur)) cur[k] = defaults[k]; });
  S[key] = cur;
  return cur;
}

/* ===== Places ===== */
const TOWNS = DATA.towns;
const MAIN_COUNTIES = ['Placer', 'Sacramento', 'San Joaquin', 'Stanislaus'];
const TOWN = {};
TOWNS.forEach((t) => { TOWN[t.n.toLowerCase()] = t; });
['Mountain House', 'Hughson', 'Waterford', 'Newman', 'Denair'].forEach((n) => {
  if (!TOWN[n.toLowerCase()]) {
    const c = DATA.communities.find((x) => x.city === n);
    if (c) TOWN[n.toLowerCase()] = { n, c: c.county, aka: [] };
  }
});
const countyOf = (city) => (TOWN[String(city || '').toLowerCase()] || {}).c || null;
function placeLabel(p) { return !p ? 'All areas' : p.k === 'county' ? p.n + ' County' : p.n; }
function inPlace(item, p) {
  p = p === undefined ? S.place : p;
  if (!p) return true;
  if (p.k === 'county') return item.county === p.n;
  return String(item.city || '').toLowerCase() === p.n.toLowerCase();
}
// Picking a new area starts a fresh search, so a community or street name typed earlier no longer filters the lists.
function setPlace(p) {
  S.place = p;
  if (p) ['nb', 'assum'].forEach((k) => { if (S[k]) S[k].text = ''; });
  save();
}
function placeCounty() { return !S.place ? null : S.place.k === 'county' ? S.place.n : S.place.c; }

/* ===== Visitor and client code ===== */
let CLIENT = String(store.get('dp-client', '') || '');
function clientName() {
  return CLIENT ? CLIENT.split('-').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}
let VISITOR = String(store.get('dp-visitor-code', '') || '');
if (!/^[A-Z0-9]{4}$/.test(VISITOR)) { VISITOR = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X'); store.set('dp-visitor-code', VISITOR); }
const WHO = () => clientName() || ('Visitor ' + VISITOR);

/* ===== Activity sent to Darien's Google tracker (public website only) ===== */
const me = () => store.get('dp-me', null) || {};
// "Signed in" means the visitor gave their name, mobile number and email on this device
const signedIn = () => { const m = me(); return !!(m.name && m.email && String(m.phone || '').replace(/\D/g, '').length >= 10); };
function trackBody(type, data) {
  return JSON.stringify(Object.assign({ type, v: VISITOR, c: clientName(), n: me().name || '', src: SOURCE() }, data || {}));
}
// Fire-and-forget: page views and link opens
function beacon(type, data) {
  if (!TRACKER || ADMIN) return;
  const body = trackBody(type, data);
  try { if (navigator.sendBeacon && navigator.sendBeacon(TRACKER, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return; } catch (e) { /* use fetch below */ }
  try { fetch(TRACKER, { method: 'POST', body, mode: 'no-cors', keepalive: true }).catch(() => {}); } catch (e) { /* offline */ }
}
// Requests that need an answer: details, sign-ups, messages and the admin numbers
async function post(type, data) {
  const res = await fetch(TRACKER, { method: 'POST', body: trackBody(type, data) });
  let out = null;
  try { out = await res.json(); } catch (e) { out = null; }
  if (!out || !out.ok) throw new Error((out && out.error) || 'failed');
  return out;
}
/* ===== Analytics-gap events, Nov 2026 =====
   One helper for the events the tracker did not record before: tab
   clicks, Click to get the details, info-request and agent-form
   completions. Every event goes through the existing beacon('click', ...)
   path, so it lands in the Clicks sheet right away with no Apps Script
   redeploy. The optional future 'event' type in
   Darien-Website-Tracker.gs is not used here and the client does not
   depend on it. No new analytics account, no cookies. */
function trackEvent(label, source, extra) {
  beacon('click', Object.assign({ h: label, s: source, pg: navName() }, extra || {}));
  logStep(label);
}
// The home behind a Click to get the details tap, for the event label
function detailsHome(k) {
  try {
    const p = (typeof PROP_BY !== 'undefined' && PROP_BY[k]) || (typeof PAGES !== 'undefined' && PAGES.property && PAGES.property.cur && PAGES.property.cur());
    if (!p) return null;
    return { label: propTitle(p, true), p: propPrice(p), b: propFacts(p), r: '' };
  } catch (e) { return null; }
}

/* ===== Money engine ===== */
const RATES = DATA.rates;
const LIMITS = DATA.counties;
const TAX = 0.011, INS = 0.0035;
const LOANS = {
  conv: { label: 'Conventional', min: 0.03, rate: RATES.conv },
  fha: { label: 'FHA', min: 0.035, rate: RATES.fha },
  va: { label: 'VA', min: 0, rate: RATES.va },
  usda: { label: 'USDA', min: 0, rate: RATES.usda },
  myhome: { label: 'FHA + CalHFA MyHome', min: 0, rate: RATES.fha }
};
function fhaMip(base, ltv) {
  const big = base > 726200;
  if (ltv > 0.95) return big ? 0.0075 : 0.0055;
  return big ? 0.0070 : 0.0050;
}
function vaFee(downPct) { return downPct >= 0.10 ? 0.0125 : downPct >= 0.05 ? 0.015 : 0.0215; }
/* price, loan, cash (money toward the down payment), rate, years, county, hoa, tax (rate), special (per year) */
function payment(o) {
  const price = o.price;
  const L = LOANS[o.loan] || LOANS.conv;
  const lim = (LIMITS[o.county] || {}).fha || null;
  let down = Math.max(0, Math.min(o.cash || 0, price));
  let base, fee = 0, mi = 0, help = 0, ok = true, note = '';
  if (o.loan === 'va') {
    base = price - down; fee = base * vaFee(down / price);
  } else if (o.loan === 'usda') {
    base = price - down; fee = base * 0.01; mi = (base + fee) * 0.0035 / 12;
  } else if (o.loan === 'myhome') {
    down = 0; help = price * 0.035; base = price - help; fee = base * 0.0175; mi = base * fhaMip(base, 0.965) / 12;
    if (lim && base > lim) { ok = false; note = 'Over the ' + money(lim) + ' FHA limit for ' + o.county + ' County'; }
  } else if (o.loan === 'fha') {
    down = Math.max(down, price * 0.035); base = price - down; fee = base * 0.0175; mi = base * fhaMip(base, base / price) / 12;
    if (lim && base > lim) { ok = false; note = 'Over the ' + money(lim) + ' FHA limit for ' + o.county + ' County'; }
  } else {
    down = Math.max(down, price * L.min); base = price - down;
    if (base / price > 0.8) mi = base * 0.005 / 12;
    if (base > DATA.conforming) note = 'Above the ' + money(DATA.conforming) + ' conforming limit, so this is a jumbo loan';
  }
  const loan = base + fee;
  const pi = pmt(loan, o.rate == null ? L.rate : o.rate, (o.years || 30) * 12);
  const tax = price * (o.tax == null ? TAX : o.tax) / 12;
  const ins = price * INS / 12;
  const hoa = o.hoa || 0;
  const special = (o.special || 0) / 12;
  return { price, down, help, base, fee, loan, pi, mi, tax, ins, hoa, special, ok, note, total: pi + mi + tax + ins + hoa + special };
}
function cashNeeded(price, loan) { return price * ((LOANS[loan] || LOANS.conv).min); }
function maxPrice(budget, o) {
  const feasible = (price) => {
    if (cashNeeded(price, o.loan) > (o.cash || 0) + 0.5) return false;
    const f = payment(Object.assign({}, o, { price }));
    return f.ok && f.total <= budget;
  };
  let lo = 0, hi = 5000000;
  if (!feasible(20000)) return 0;
  lo = 20000;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (feasible(mid)) lo = mid; else hi = mid; }
  return Math.floor(lo / 1000) * 1000;
}
function breakdown(f, extra) {
  const rows = [
    ['Loan payment (principal and interest)', f.pi],
    f.mi ? ['Mortgage insurance', f.mi] : null,
    ['Property tax', f.tax],
    ['Home insurance (estimate)', f.ins],
    f.hoa ? ['HOA', f.hoa] : null,
    f.special ? ['Special tax / Mello-Roos', f.special] : null
  ].concat(extra || []).filter(Boolean);
  return '<ul class="break">' + rows.map(([k, v]) => '<li><span>' + esc(k) + '</span><span>' + money(v) + '</span></li>').join('') +
    '<li class="strong"><span>Total each month</span><span>' + money(f.total + (extra || []).filter(Boolean).reduce((a, r) => a + r[1], 0)) + '</span></li></ul>';
}

/* ===== Links that tell Darien what was opened ===== */
let CURRENT = 'home';
const navName = () => { const P = PAGES[CURRENT] || {}; return (P.navName && P.navName()) || P.nav || 'Website'; };
// Remembers what each outside link is about, so opening it can be logged with the home's name
const TRACK_INFO = new Map();
function track(url, info) {
  if (TRACKER) TRACK_INFO.set(url, info || {});
  return url;
}
const hostLabel = (u) => { const m = String(u).match(/^https?:\/\/(?:www\.)?([^\/?#:]+)/i); return m ? m[1] : ''; };
const zillowFor = (street, city, zip) => 'https://www.zillow.com/homes/' + encodeURIComponent((street + ', ' + city + ', CA ' + (zip || '')).replace(/#/g, '').trim()).replace(/%20/g, '-') + '_rb/';
const mapFor = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const googleFor = (q) => 'https://www.google.com/search?q=' + encodeURIComponent(q);
function rootsFor(townName, extra) {
  const t = TOWN[String(townName || '').toLowerCase()];
  const p = new URLSearchParams(Object.assign(t ? { lat: t.lat, lng: t.lng, zoom: t.z, place: t.n + ', CA' } : { lat: 38.2, lng: -121.15, zoom: 8.2, place: 'Sacramento Region' }, { isAssumable: 'true', view: 'list' }, extra || {}));
  return 'https://www.roots.homes/listings?' + p.toString();
}
function zillowCity(townName, filters) {
  const fs = {};
  if (filters && filters.max) fs.price = { max: Math.round(filters.max) };
  if (filters && filters.beds) fs.beds = { min: filters.beds };
  if (filters && filters.keyword) fs.att = { value: filters.keyword };
  return 'https://www.zillow.com/' + slug(townName) + '-ca/?searchQueryState=' + encodeURIComponent(JSON.stringify({ filterState: fs, isListVisible: true }));
}

/* ===== Full-details gate: click to get the details =====
   Home info is never shown openly on landing. Every entry point shows a
   "Click to get the details" button instead, and clicking it shows the
   details first, then the agent question at the end (see openRealtorCheck). */
const GATES = new Map();
let gateSeq = 0;
// One tap per home, this visit only: the property page remembers that the
// visitor tapped Click to get the details, so the details stay visible
// while they look at that home, but a fresh visit starts gated again.
function detailsShown(k) { return !!sess.get('dp-details-' + (k || ''), false); }
function markDetailsShown(k) { if (k) sess.set('dp-details-' + k, true); }
function details(info, label, cls) {
  const id = 'g' + (++gateSeq);
  GATES.set(id, Object.assign({ pg: navName() }, info));
  return '<button type="button" class="btn ' + (cls || 'btn-pa') + ' btn-sm" data-gate="' + id + '">' + esc(label || 'Click to get the details') + '</button>';
}

/* ===== Saved homes ===== */
const saved = new Map(((store.get('dp-saved', []) || [])).filter((x) => x && x.k).map((x) => [x.k, x]));/* ===== Shopping cart: homes the visitor wants more info on, on every tab =====
   Separate from Save/like (dp-saved): the cart is the shortlist to ask Darien about,
   saved in localStorage as dp-cart so it survives closing the tab. */
const cart = new Map(((store.get('dp-cart', []) || [])).filter((x) => x && x.k).map((x) => [x.k, x]));
function cartBtn(k, title, price) {
  const on = cart.has(k);
  return '<button type="button" class="btn btn-line btn-sm" data-cart="' + esc(k) + '" data-t="' + esc(title) + '" data-p="' + esc(price) + '" aria-pressed="' + on + '">' + (on ? '✓ In cart' : 'Add to cart') + '</button>';
}
function persistCart() { store.set('dp-cart', [...cart.values()]); updateCartCount(); }
function updateCartCount() {
  if (typeof cartDrawerOpen !== 'undefined' && cartDrawerOpen && typeof renderCartDrawer === 'function') renderCartDrawer();
  document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = cart.size ? String(cart.size) : ''; el.hidden = !cart.size; });
  const b = document.querySelector('#kw [data-go="cart"] .n');
  if (b) b.textContent = cart.size ? ' · ' + cart.size + ' in cart' : '';
}
/* ===== Cart drawer, Squarespace style =====
   A panel that slides in from the right side of the page to the left.
   Pan shows the carted homes in a horizontal row of square boxes that
   scrolls sideways. All shows every carted home lined up; Next steps
   through them one at a time, so the visitor can see which ones they
   want more info on. The full cart page and the click-to-get-details
   agent flow are untouched: Text and Email in the drawer still run the
   details-first, agent-question-at-the-end flow. */
let cartDrawerMode = 'all', cartDrawerIdx = 0, cartDrawerOpen = false;
function cartDrawerItems() { return [...cart.values()]; }
function cartDrawerLink(x) {
  try { const p = (typeof propOfCard === 'function') ? propOfCard(x.k) : null; return p ? '#p/' + p.key : ''; } catch (e) { return ''; }
}
function renderCartDrawer() {
  const body = $('cart-drawer-body'), title = $('cart-drawer-title');
  if (!body || !title) return;
  const items = cartDrawerItems();
  title.textContent = 'Your cart' + (items.length ? ' (' + items.length + (items.length === 1 ? ' home' : ' homes') + ')' : '');
  const allBtn = $('cart-view-all'), nextBtn = $('cart-view-next'), panBtn = $('cart-view-pan');
  if (allBtn) allBtn.setAttribute('aria-pressed', String(cartDrawerMode === 'all'));
  if (nextBtn) nextBtn.setAttribute('aria-pressed', String(cartDrawerMode === 'next'));
  if (panBtn) panBtn.setAttribute('aria-pressed', String(cartDrawerMode === 'pan'));
  if (!items.length) {
    body.innerHTML = '<p class="note">Your cart is empty. Tap Add to cart on any home or new-build community, on any tab, and it will show up here.</p><p><button type="button" class="btn btn-pa" data-go="assumable">Browse assumable homes</button></p>';
    return;
  }
  if (cartDrawerIdx >= items.length) cartDrawerIdx = items.length - 1;
  if (cartDrawerIdx < 0) cartDrawerIdx = 0;
  const itemHtml = (x) => {
    const link = cartDrawerLink(x);
    const inner = '<b>' + esc(x.t) + '</b>' + (x.p ? '<span class="cart-list-facts">' + esc(x.p) + '</span>' : '');
    return '<li>' + (link ? '<a href="' + esc(link) + '">' + inner + '</a>' : inner) +
      '<div class="cart-drawer-acts"><button type="button" class="btn btn-line btn-sm" data-remove-cart="' + esc(x.k) + '">Remove</button></div></li>';
  };
  if (cartDrawerMode === 'pan') {
    body.innerHTML = '<div class="cart-pan-bar"><button type="button" class="btn btn-line btn-sm" data-drawer-pan-prev>← Prev</button><p class="cart-pan-hint">Swipe or scroll sideways.</p><button type="button" class="btn btn-line btn-sm" data-drawer-pan-next>Next →</button></div>' +
      '<div class="cart-pan-viewport" data-drawer-pan tabindex="0"><div class="cart-pan-track">' + items.map((x) => {
        const link = cartDrawerLink(x);
        return '<article class="card cart-pan-card">' + (link ? '<h3><a href="' + esc(link) + '">' + esc(x.t) + '</a></h3>' : '<h3>' + esc(x.t) + '</h3>') +
          (x.p ? '<div class="price num">' + esc(x.p) + '</div>' : '') +
          '<div class="cart-pan-acts"><button type="button" class="btn btn-line btn-sm" data-remove-cart="' + esc(x.k) + '">Remove</button></div></article>';
      }).join('') + '</div></div>';
    const vp = body.querySelector('[data-drawer-pan]');
    const pv = body.querySelector('[data-drawer-pan-prev]'), nx = body.querySelector('[data-drawer-pan-next]');
    if (pv) pv.addEventListener('click', () => vp.scrollBy({ left: -280, behavior: 'smooth' }));
    if (nx) nx.addEventListener('click', () => vp.scrollBy({ left: 280, behavior: 'smooth' }));
    return;
  }
  if (cartDrawerMode === 'next') {
    const x = items[cartDrawerIdx];
    body.innerHTML = '<div class="cart-drawer-step"><button type="button" class="btn btn-line btn-sm" id="cart-prev">← Prev</button><span>' + (cartDrawerIdx + 1) + ' of ' + items.length + '</span><button type="button" class="btn btn-line btn-sm" id="cart-next">Next →</button></div>' +
      '<ul class="cart-drawer-list">' + itemHtml(x) + '</ul>';
    const prev = $('cart-prev'), next = $('cart-next');
    if (prev) prev.addEventListener('click', () => { cartDrawerIdx = (cartDrawerIdx - 1 + items.length) % items.length; renderCartDrawer(); });
    if (next) next.addEventListener('click', () => { cartDrawerIdx = (cartDrawerIdx + 1) % items.length; renderCartDrawer(); });
    return;
  }
  body.innerHTML = '<ul class="cart-drawer-list">' + items.map(itemHtml).join('') + '</ul>';
}
function openCartDrawer() {
  const d = $('cart-drawer'), o = $('cart-overlay');
  if (!d || !o) return;
  cartDrawerOpen = true;
  d.hidden = false; o.hidden = false;
  d.classList.remove('closing');
  renderCartDrawer();
  const c = $('cart-drawer-close');
  if (c) c.focus();
  if (typeof trackEvent === 'function') trackEvent('Opened cart drawer', 'Tab');
}
function closeCartDrawer() {
  const d = $('cart-drawer'), o = $('cart-overlay');
  if (!d || !o) return;
  cartDrawerOpen = false;
  d.classList.add('closing');
  setTimeout(() => { d.hidden = true; o.hidden = true; d.classList.remove('closing'); }, 280);
}
document.addEventListener('click', (e) => {
  if (e.target.closest && e.target.closest('#cart-drawer-close, #cart-overlay')) { closeCartDrawer(); return; }
  if (e.target.closest && e.target.closest('#cart-view-pan')) { cartDrawerMode = 'pan'; renderCartDrawer(); return; }
  if (e.target.closest && e.target.closest('#cart-view-all')) { cartDrawerMode = 'all'; renderCartDrawer(); return; }
  if (e.target.closest && e.target.closest('#cart-view-next')) { cartDrawerMode = 'next'; renderCartDrawer(); return; }
  if (e.target.closest && e.target.closest('#cart-drawer-full')) { closeCartDrawer(); go('cart'); return; }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cartDrawerOpen) closeCartDrawer(); });
const cartText = () => [...cart.values()].map((x) => x.t + (x.p ? ' (' + x.p + ')' : '')).join('; ');
// The text or email body for asking about the whole cart. With an agent,
// it says so and carries the agent's info, so Darien sends the home
// information to the agent instead of the visitor.
function cartMsg(agent) {
  const lines = ['Hi Darien,', '', 'I\'d like more info on these homes from your website:'];
  [...cart.values()].forEach((x) => lines.push('- ' + x.t + (x.p ? ' (' + x.p + ')' : '')));
  if (agent) lines.push('', realtorAgentText(agent, ''));
  lines.push('', 'Thanks!');
  return lines.join('\n');
}
/* New-builds map view: remember where the visitor was looking, so going back
   from a pin or a home restores that view instead of zooming in again. */
const saveNbMapView = (v) => { try { if (v && v.lat != null) sess.set('dp-nbmap-view', v); } catch (e) { /* ignore */ } };
const nbMapView = () => sess.get('dp-nbmap-view', null);
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.3C19.5 16.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
function heart(k, title, price) {
  const on = saved.has(k);
  return '<button type="button" class="heart" data-save="' + esc(k) + '" data-t="' + esc(title) + '" data-p="' + esc(price) + '" aria-pressed="' + on + '" aria-label="Save ' + esc(title) + '">' + HEART + '<span>' + (on ? 'Saved' : 'Save') + '</span></button>' + (typeof nopeBtn === 'function' ? nopeBtn(k, title) : '');
}
const askBtn = (k, title, price) => '<button type="button" class="btn btn-line btn-sm" data-ask="' + esc(k) + '" data-t="' + esc(title) + '" data-p="' + esc(price) + '">Ask Darien</button>';
function persistSaved() { store.set('dp-saved', [...saved.values()]); updateSavedChip(); }
function updateSavedChip() {
  const b = document.querySelector('#kw [data-go="alerts"] .n');
  if (b) b.textContent = saved.size ? ' · ' + saved.size + ' saved' : '';
}

/* ===== Modal ===== */
let lastFocus = null;
function openModal(html, onMount) {
  lastFocus = document.activeElement;
  $('dialog').innerHTML = '<button type="button" class="x" aria-label="Close">×</button>' + html;
  $('modal').hidden = false;
  if (onMount) onMount($('dialog'));
  const f = $('dialog').querySelector('input, select, textarea, a.btn, button:not(.x)');
  if (f) f.focus();
}
function closeModal() {
  $('modal').hidden = true;
  $('dialog').innerHTML = '';
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
$('modal').addEventListener('click', (e) => { if (e.target === $('modal') || e.target.closest('.x')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });

/* ===== Agent question: details first, agent question at the end =====
   RIO ManyChat style, Nov 7, 2026. This replaces the old realtor-first
   order (ask first, then info). When a visitor asks for home
   information, show the home details and link FIRST, then at the end
   ask "Are you working with an agent?" No: they already have the
   details, so just confirm and offer Text/Call/Email Darien, no extra
   gate. Yes: collect the agent's info, send the request to Darien for
   the agent, and show the thanks message. Note: on the Yes path the
   visitor has already seen the details shown in the first step, which
   is the change Darien approved. The full address, payment and loan
   figures behind a property-page sign-in are still not shown to a
   Yes visitor, they go to the agent instead. */
const REALTOR_MSG = 'Thanks, Darien will be in contact with you soon to send all home info to your agent to share with you.';
const REALTOR_QUESTION = 'Are you working with an agent?';
function agentLines(a) {
  return ['Agent: ' + a.name, 'Brokerage: ' + (a.brokerage || 'Not given'), 'Agent contact: ' + a.contact];
}
// A one-time pass set by the chatbot, so a visitor who already answered
// there is not asked again on the next home-info form. It expires in
// 10 minutes and is used once.
function setRealtorPass(hasAgent, agent) { sess.set('dp-realtor-pass', { hasAgent: !!hasAgent, agent: agent || null, at: Date.now() }); }
function realtorPass() {
  const p = sess.get('dp-realtor-pass', null);
  if (!p || Date.now() - (p.at || 0) > 600000) return null;
  sess.del('dp-realtor-pass');
  return p;
}
function realtorAgentText(a, homeLabel) {
  return 'I am working with a realtor.\n\n' + agentLines(a).join('\n') + (homeLabel ? '\n\nHome: ' + homeLabel : '') + '\n\nPlease send all home info to my agent to share with me.';
}
function openAgentForm(onYes) {
  $('dialog').innerHTML = '<button type="button" class="x" aria-label="Close">×</button>' +
    '<p class="mono eyebrow">Your agent</p><h2 id="modal-title">Your agent\'s info</h2>' +
    '<p class="note">Please put your agent\'s info in, so Darien can send all home info to your agent to share with you.</p>' +
    '<form id="rt-form" class="fields" novalidate>' +
      '<div class="field wide"><label for="rt-name">Agent name</label><input id="rt-name" autocomplete="name"></div>' +
      '<div class="field wide"><label for="rt-brokerage">Brokerage (if you know it)</label><input id="rt-brokerage"></div>' +
      '<div class="field"><label for="rt-phone">Agent phone</label><input id="rt-phone" type="tel" inputmode="tel" autocomplete="tel"></div>' +
      '<div class="field"><label for="rt-email">Agent email</label><input id="rt-email" type="email" autocomplete="email"></div>' +
      '<p class="fine field wide">Your agent\'s name and one way to reach them, phone or email, is all Darien needs.</p>' +
      '<div class="field wide"><button class="btn btn-pa" type="submit">Send to my agent</button><p class="toast err" id="rt-err" role="alert"></p></div>' +
    '</form>';
  $('dialog').querySelector('#rt-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const a = { name: $('rt-name').value.trim(), brokerage: $('rt-brokerage').value.trim(), phone: $('rt-phone').value.trim(), email: $('rt-email').value.trim() };
    const err = (t, el) => { $('rt-err').textContent = t; el.focus(); };
    if (!a.name) return err('Please add your agent\'s name.', $('rt-name'));
    const phoneOk = a.phone.replace(/\D/g, '').length >= 10;
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email);
    if (!phoneOk && !emailOk) return err('Please add your agent\'s phone or email, so Darien can reach them.', a.phone ? $('rt-phone') : $('rt-email'));
    a.contact = phoneOk ? a.phone : a.email;
    onYes(a);
  });
  const f = $('dialog').querySelector('#rt-name');
  if (f) f.focus();
}
// Details first, agent question at the end. opts: { home, detailsHtml,
// onNo, onYes }. detailsHtml is shown first in the modal, then the
// question. If the visitor already answered in the chatbot, the pass
// is used once and the question is skipped, the details were already
// shown to them in chat.
function openRealtorCheck(opts) {
  const pass = realtorPass();
  if (pass) { if (pass.hasAgent) opts.onYes(pass.agent); else opts.onNo(); return; }
  const homeLabel = opts.home || 'this home';
  const details = opts.detailsHtml || '';
  openModal(
    '<p class="mono eyebrow">Here are the details</p><h2 id="modal-title">' + esc(homeLabel) + '</h2>' +
    details +
    '<p class="note" style="margin-top:14px"><b>' + esc(REALTOR_QUESTION) + '</b></p>' +
    '<p class="note">Darien does not want to step on anyones toes, so he asks at the end, after you have seen the details.</p>' +
    '<div class="optlist"><button type="button" class="btn btn-pa" id="rt-yes">Yes, I have an agent</button><button type="button" class="btn btn-line" id="rt-no">No, I do not</button></div>',
    (d) => {
      d.querySelector('#rt-no').addEventListener('click', () => { opts.onNo(); });
      d.querySelector('#rt-yes').addEventListener('click', () => { openAgentForm((a) => opts.onYes(a)); });
    });
}
// The message the visitor sees when they have an agent, plus the agent
// summary. The home details were already shown to them in the first
// step, before they answered.
function realtorThanksHtml(agent, homeLabel) {
  return '<p class="mono eyebrow">Home details</p><h2 id="modal-title">Thanks</h2>' +
    '<p class="toast">' + esc(REALTOR_MSG) + '</p>' +
    '<p class="note">Your agent: ' + esc(agent.name) + (agent.brokerage ? ' · ' + esc(agent.brokerage) : '') + ' · ' + esc(agent.contact) + '</p>' +
    (homeLabel ? '<p class="note">Home: ' + esc(homeLabel) + '</p>' : '');
}

/* "Click to get the details": details and link FIRST, agent question at the end.
   RIO ManyChat style. The visitor sees the home details and every link
   before they answer anything. No: confirm and offer Text/Call/Email,
   no extra gate, no name form. Yes: collect the agent's info and send
   the request to Darien for the agent. */
function gateLinksHtml(info) {
  const opts = [
    info.z ? ['See photos and details on Zillow', info.z, 'Zillow', 'btn-pa'] : null,
    info.x ? [info.xs || 'More details', info.x, info.xs || 'Website', 'btn-line'] : null,
    info.m ? ['Map', info.m, 'Google Maps', 'btn-line'] : null
  ].filter(Boolean);
  return opts.map(([label, url, site, cls]) => '<a class="btn ' + cls + '" href="' + esc(track(url, { h: info.h, s: site, p: info.p, b: info.b, r: info.r })) + '" target="_blank" rel="noopener">' + esc(label) + '</a>').join('') +
    '<a class="btn btn-line" href="https://darien-phillips-homes.pages.dev" target="_blank" rel="noopener">See more homes on Darien\'s website</a>';
}
function gateDetailsHtml(info) {
  return '<p class="note">' + esc([info.p, info.b, info.l].filter(Boolean).join(' · ')) + '</p>' +
    '<div class="optlist">' + gateLinksHtml(info) + '</div>';
}
function openGate(info) {
  // Admin view: Darien sees every option for a property directly, without signing in.
  if (ADMIN) {
    openModal('<p class="mono eyebrow">Admin view · only you see this</p><h2 id="modal-title">' + esc(info.h) + '</h2>' +
      '<p class="note">' + esc([info.p, info.b, info.l].filter(Boolean).join(' · ')) + '</p>' +
      '<p class="toast">You are signed in as admin, so no name, phone or email is needed to see this home.</p>' +
      '<div class="optlist">' + gateLinksHtml(info) +
      '<a class="btn btn-line" href="sms:+12098826469">Text Darien</a><a class="btn btn-line" href="tel:+12098826469">Call Darien</a></div>');
    return;
  }
  openRealtorCheck({
    home: info.h,
    detailsHtml: gateDetailsHtml(info),
    onNo: () => showGateDetails(info),
    onYes: (agent) => submitGateAgent(info, agent)
  });
  return;
}
// No path: the visitor already has the details and link, so just confirm
// and offer Text/Call/Email Darien. No extra gate, no name form.
function showGateDetails(info) {
  trackEvent('Got details (no agent): ' + info.h, 'Info request', { p: info.p || '', b: info.b || '', r: info.r || '' });
  openModal('<p class="mono eyebrow">Here are the details</p><h2 id="modal-title">' + esc(info.h) + '</h2>' +
    gateDetailsHtml(info) +
    '<p class="toast" style="margin-top:14px">You have the details. Questions, or want a tour? Text, call or email Darien.</p>' +
    '<div class="optlist"><a class="btn btn-pa" href="sms:+12098826469">Text Darien</a><a class="btn btn-line" href="tel:+12098826469">Call Darien</a><a class="btn btn-line" href="mailto:darienphillips45@gmail.com">Email Darien</a></div>');
}
async function submitGateAgent(info, agent) {
  let sent = false;
  if (TRACKER) {
    try {
      await post('lead', Object.assign({}, info, { hasAgent: 'yes', agentName: agent.name, agentBrokerage: agent.brokerage, agentContact: agent.contact, agentPhone: agent.phone || '', agentEmail: agent.email || '', note: realtorAgentText(agent, info.h) }));
      sent = true;
    } catch (x) { sent = false; }
  }
  // Counted even if the lead post failed, so the completion is not lost.
  trackEvent('Sent details to agent: ' + info.h, 'Agent form', { p: info.p || '', b: info.b || '', r: info.r || '' });
  const body = 'Hi Darien, I would like the full details on ' + info.h + (info.p ? ' (' + info.p + ')' : '') + '.\n\n' + realtorAgentText(agent, info.h);
  openModal(realtorThanksHtml(agent, info.h) +
    '<div class="optlist">' + (sent
      ? '<a class="btn btn-line" href="sms:+12098826469">Text Darien</a>'
      : '<a class="btn btn-line" href="' + esc('mailto:darienphillips45@gmail.com?subject=' + encodeURIComponent('Details on ' + info.h + ' for my agent') + '&body=' + encodeURIComponent(body)) + '">Email this to Darien</a>' +
        '<a class="btn btn-line" href="' + esc('sms:+12098826469?&body=' + encodeURIComponent(body)) + '">Text this to Darien</a>') + '</div>' +
    (sent ? '' : '<p class="fine">Darien gets your agent\'s info when you tap Email or Text. Nothing you type here is stored by the website.'));
}
/* ===== Global clicks ===== */
document.addEventListener('click', (e) => {
  const cartBtnEl = e.target.closest('#cart-btn');
  if (cartBtnEl) { e.preventDefault(); openCartDrawer(); return; }
  const g = e.target.closest('[data-go]');
  if (g) {
    e.preventDefault();
    const dest = g.dataset.go;
    const label = (typeof PAGES !== 'undefined' && PAGES[dest] && PAGES[dest].nav) || dest;
    trackEvent('Tab: ' + label, 'Tab');
    go(dest);
    return;
  }
  const gate = e.target.closest('[data-gate]');
  if (gate) { const info = GATES.get(gate.dataset.gate); if (info) { trackEvent('Clicked to get details: ' + info.h, 'Details', { p: info.p || '', b: info.b || '', r: info.r || '' }); openGate(info); } return; }
  // "Click to get the details" on a property page: reveal that home's
  // details and sign-in form in place, then scroll to them.
  const pd = e.target.closest('[data-prop-details]');
  if (pd) {
    const k = pd.dataset.propDetails || '';
    if (k) {
      markDetailsShown(k);
      const dh = detailsHome(k);
      trackEvent('Clicked to get details: ' + (dh ? dh.label : k), 'Details', dh ? { p: dh.p, b: dh.b } : {});
      logStep('Tapped Click to get the details');
    }
    if (CURRENT === 'property') {
      render('property', true);
      const g = document.querySelector('.prop-grid');
      if (g) g.scrollIntoView({ block: 'start' });
    }
    return;
  }
  const s = e.target.closest('[data-save]');
  if (s) {
    const k = s.dataset.save;
    if (saved.has(k)) saved.delete(k); else saved.set(k, { k, t: s.dataset.t, p: s.dataset.p });
    document.querySelectorAll('[data-save="' + k + '"]').forEach((b) => { b.setAttribute('aria-pressed', String(saved.has(k))); b.querySelector('span').textContent = saved.has(k) ? 'Saved' : 'Save'; });
    persistSaved();
    return;
  }
  const cb = e.target.closest('[data-cart]');
  if (cb) {
    const k = cb.dataset.cart;
    const added = !cart.has(k);
    if (cart.has(k)) cart.delete(k); else cart.set(k, { k, t: cb.dataset.t, p: cb.dataset.p });
    document.querySelectorAll('[data-cart="' + k + '"]').forEach((b) => { b.setAttribute('aria-pressed', String(cart.has(k))); b.textContent = cart.has(k) ? '✓ In cart' : 'Add to cart'; });
    persistCart();
    if (CURRENT === 'cart') render('cart');
    if (added) openCartDrawer(); else if (cartDrawerOpen) renderCartDrawer();
    return;
  }
  const rb = e.target.closest('[data-remove-cart]');
  if (rb) {
    cart.delete(rb.dataset.removeCart);
    persistCart();
    if (CURRENT === 'cart') render('cart');
    if (cartDrawerOpen) renderCartDrawer();
    return;
  }
  const cc = e.target.closest('[data-cart-contact]');
  if (cc) {
    const kind = cc.dataset.cartContact;
    const homes = cartText();
    openRealtorCheck({
      home: 'your cart (' + cart.size + (cart.size === 1 ? ' home' : ' homes') + ')',
      detailsHtml: '<p class="note">Here are the homes in your cart:</p><ul class="unlock-list">' + [...cart.values()].map((x) => '<li>' + esc(x.t + (x.p ? ' (' + x.p + ')' : '')) + '</li>').join('') + '</ul><p class="note">See them on this website, or tap Text or Email below and the list goes to Darien filled in.</p>',
      onNo: () => {
        trackEvent('Got details (no agent): your cart (' + cart.size + (cart.size === 1 ? ' home' : ' homes') + ')', 'Info request');
        const body = cartMsg(null);
        closeModal();
        location.href = kind === 'sms'
          ? 'sms:+12098826469?&body=' + encodeURIComponent(body)
          : 'mailto:darienphillips45@gmail.com?subject=' + encodeURIComponent('More info on homes in my cart') + '&body=' + encodeURIComponent(body);
      },
      onYes: (agent) => {
        trackEvent('Sent details to agent: your cart (' + cart.size + (cart.size === 1 ? ' home' : ' homes') + ')', 'Agent form');
        const body = cartMsg(agent);
        openModal(realtorThanksHtml(agent, homes) +
          '<div class="optlist"><a class="btn btn-line" href="' + esc('sms:+12098826469?&body=' + encodeURIComponent(body)) + '">Text this to Darien</a>' +
          '<a class="btn btn-line" href="' + esc('mailto:darienphillips45@gmail.com?subject=' + encodeURIComponent('More info on homes in my cart, for my agent') + '&body=' + encodeURIComponent(body)) + '">Email this to Darien</a></div>' +
          '<p class="fine">Darien gets your agent\'s info when you tap Text or Email. Nothing you type here is stored by the website.');
      }
    });
    return;
  }
  const a = e.target.closest('[data-ask]');
  if (a) {
    saved.set(a.dataset.ask, { k: a.dataset.ask, t: a.dataset.t, p: a.dataset.p });
    persistSaved();
    S.flash = 'Added ' + a.dataset.t + ' to your list. Tell Darien what you\'re looking for and he\'ll send it with homes like it.';
    go('alerts');
    return;
  }
  const pl = e.target.closest('[data-place]');
  if (pl) { choosePlace(pl.dataset.place); return; }
  const fk = e.target.closest('[data-finder-kind]');
  if (fk) { Object.assign(sub('finder', FINDER_DEFAULTS), { kind: fk.dataset.finderKind }); go('finder', true); return; }
  const sk = e.target.closest('[data-skip-to]');
  if (sk) { const t = document.getElementById(sk.dataset.skipTo); if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
  const clr = e.target.closest('[data-clear-place]');
  if (clr) { setPlace(null); render(CURRENT, true); }
});

/* Links people open (public website only): which home, which site and from which page; texts and calls too */
document.addEventListener('click', (e) => {
  if (!TRACKER) return;
  const a = e.target.closest('a[href]');
  if (!a) return;
  const raw = a.getAttribute('href') || '';
  if (/^https?:/i.test(raw)) {
    const info = TRACK_INFO.get(raw) || {};
    const box = a.closest('.card, .tile, .goal-card');
    const title = info.h || (box && (box.querySelector('h3, b') || {}).textContent) || a.textContent;
    const h = String(title || '').trim().slice(0, 140), s = info.s || hostLabel(raw);
    beacon('click', { h, s, p: info.p || '', b: info.b || '', r: info.r || '', pg: info.pg || navName(), u: raw.slice(0, 500) });
    logStep('Opened ' + h + (s ? ' on ' + s : ''));
  } else if (/^(sms|tel|mailto):/i.test(raw)) {
    const how = { sms: 'Texted', tel: 'Called', mai: 'Emailed' }[raw.slice(0, 3).toLowerCase()];
    beacon('click', { h: how + ' Darien', s: { Texted: 'Text', Called: 'Phone', Emailed: 'Email' }[how], pg: navName(), u: '' });
    logStep('Tapped to ' + { Texted: 'text', Called: 'call', Emailed: 'email' }[how] + ' Darien');
  }
}, true);

function choosePlace(name) {
  const t = TOWN[name.toLowerCase()];
  const p = t ? { k: 'town', n: t.n, c: t.c } : { k: 'county', n: name };
  openModal('<p class="mono eyebrow">' + esc(placeLabel(p)) + '</p><h2 id="modal-title">What would you like to see in ' + esc(placeLabel(p)) + '?</h2>' +
    '<div class="optlist">' + PLACE_PAGES.map((k) => '<button type="button" class="btn btn-line" data-pick="' + k + '">' + esc(PAGES[k].nav) + '</button>').join('') + '</div>',
  (d) => d.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => { setPlace(p); closeModal(); go(b.dataset.pick, true); })));
}
