/* ===== Page colors (match the theme tokens) ===== */
/* Page colors: every tab gets its own color, no two tabs share one.
   Home is orange, Custom Portal is pink, Find Your Home is dark teal. */
const COLORS = { home: '#E8590C', about: '#9C36B5', 'new-builds': '#F59F00', build: '#74B816', payment: '#0CA678', assumable: '#2F9E44', search: '#1971C2', 'zero-down': '#E67700', guide: '#6741D9', refinance: '#C2255C', alerts: '#8A5A3C', adu: '#495057', placer: '#9775FA', stockton: '#15AABF', cart: '#0F2E44', finder: '#0B7285', portal: '#D6336C' };
Object.keys(COLORS).forEach((k) => { PAGES[k].color = COLORS[k]; });
const NAV_ORDER = ['home', 'finder', 'portal', 'guide', 'search', 'assumable', 'zero-down', 'payment', 'new-builds', 'adu', 'refinance', 'build', 'about', 'alerts'];

/* ===== Keyword bar at the top ===== */
$('kw').innerHTML = NAV_ORDER.map((k) => '<button type="button" data-go="' + k + '">' + navThumb(k) + '' + esc(PAGES[k].nav) + (k === 'alerts' ? '<span class="n"></span>' : '') + '</button>').join('') ;
function navState() { $('kw').querySelectorAll('[data-go]').forEach((b) => { if (b.dataset.go === CURRENT) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); updateSavedChip(); updateCartCount(); }

/* ===== Search: towns, ZIP codes, topics, communities and homes ===== */
const WORDS = {
  home: ['home', 'start', 'main page'],
  guide: ['guide', 'beginner', 'first time', 'how to buy', 'steps', 'glossary', 'definition', 'what is', 'emd', 'earnest', 'escrow', 'closing costs', 'pre-approval', 'preapproval', 'pre-qualification', 'prequal', 'contingency', 'appraisal', 'inspection', 'terms', 'words'],
  search: ['map', 'map search', 'search', 'all homes', 'every home', 'homes for sale', 'mls', 'pool', 'bedrooms', 'bathrooms', 'beds', 'baths', 'listings'],
  finder: ['find', 'finder', 'find exactly', 'filter', 'filters', 'lot size', 'backyard', 'open floor plan', 'what you are looking for', 'exact'],
  portal: ['portal', 'build my portal', 'custom portal', 'custom mls', 'mls portal', 'my portal'],
  assumable: ['assumable', 'assume', 'assumption', 'take over', 'takeover', 'low rate', 'low-rate', 'existing loan', 'roots', 'fha loan', 'va loan'],
  placer: ['placer', 'loomis', '2500', '2,500', 'under 2500', 'granite bay', 'auburn', 'rocklin', 'roseville', 'lincoln'],
  payment: ['payment', 'monthly', 'budget', 'afford', 'affordability', 'how much', 'calculator', 'price range', 'mortgage'],
  'zero-down': ['zero down', '0 down', '$0', 'no money down', 'no down payment', 'down payment', 'down payment assistance', 'dpa', 'calhfa', 'myhome', 'usda', 'va', 'first time', 'first-time', 'gsfa', 'dream for all'],
  'new-builds': ['new build', 'new builds', 'new construction', 'new home', 'new homes', 'builder', 'builders', 'community', 'communities', 'model home', 'lennar', 'kb home', 'pulte', 'taylor morrison', 'century', 'lgi', 'richmond american', 'meritage', 'horton', 'woodside', 'tri pointe', 'toll', '55+', 'senior', 'active adult'],
  stockton: ['stockton', 'stockton new homes', 'stockton zero down'],
  refinance: ['refinance', 'refi', 'lower my payment', 'cash out', 'cash-out', 'streamline', 'irrrl', 'rate and term', 'recast', 'pmi', 'mortgage insurance', 'equity'],
  build: ['build', 'build a home', 'custom home', 'lot', 'land', 'construction cost', 'cost to build', 'well', 'septic', 'acre'],
  about: ['about', 'darien', 'agent', 'realtor', 'contact', 'phone', 'email', 'who'],
  cart: ['cart', 'saved homes', 'shortlist', 'my homes', 'shopping'],
  alerts: ['email', 'alerts', 'sign up', 'subscribe', 'mls', 'custom mls', 'mls page', 'notifications', 'updates', 'newsletter']
};
const ZIPS = {};
DATA.communities.forEach((c) => { if (c.zip && !ZIPS[c.zip]) ZIPS[c.zip] = c.city; });
DATA.assumables.forEach((h) => { if (h.zip && !ZIPS[h.zip]) ZIPS[h.zip] = h.city; });
PLACER.forEach((h) => { if (h.zip && !ZIPS[h.zip]) ZIPS[h.zip] = h.city; });
function suggestions(raw) {
  const q = raw.trim().toLowerCase();
  if (!q) return [];
  const out = [];
  const pages = NAV_ORDER.map((k) => {
    let score = 0;
    if (PAGES[k].nav.toLowerCase().includes(q)) score = 3;
    (WORDS[k] || []).forEach((w) => {
      const whole = new RegExp('(^|[^a-z0-9$])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').test(q);
      if (w === q) score = Math.max(score, 4);
      else if (w.startsWith(q) || whole) score = Math.max(score, w.length > 2 ? 2 : 0);
      else if (q.length > 3 && w.includes(q)) score = Math.max(score, 1);
    });
    return [k, score];
  }).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
  pages.forEach(([k]) => out.push({ grp: 'Pages', label: PAGES[k].nav, hint: PAGES[k].kicker, color: COLORS[k], act: { page: k } }));
  let place = null, viaAka = false;
  if (/^\d{5}$/.test(q) && ZIPS[q]) { const t = TOWN[ZIPS[q].toLowerCase()]; place = t ? { k: 'town', n: t.n, c: t.c } : null; }
  if (!place) {
    const county = MAIN_COUNTIES.concat(['El Dorado', 'Yolo', 'Sutter', 'Yuba', 'Merced']).find((c) => (c + ' county').toLowerCase().startsWith(q) || (q.length > 3 && (c + ' county').toLowerCase().includes(q)));
    let town = Object.values(TOWN).find((t) => t.n.toLowerCase().startsWith(q));
    if (!town) { town = Object.values(TOWN).find((t) => (t.aka || []).some((a) => a.startsWith(q))); viaAka = !!town; }
    if (!town && q.length > 3) town = Object.values(TOWN).find((t) => t.n.toLowerCase().includes(q));
    if (town && (!county || town.n.toLowerCase().startsWith(q))) place = { k: 'town', n: town.n, c: town.c };
    else if (county) { place = { k: 'county', n: county }; viaAka = false; }
  }
  // Homes and communities, including the keywords from Darien's posts. Each opens its own page, which asks
  // for a name, phone and email before showing the details. An exact keyword goes to the top.
  const homes = propSearch(q, 6);
  const homeItem = (p) => ({ grp: p.kind === 'community' ? 'New-home communities' : 'Homes', label: propTitle(p, true), hint: (p.keywords[0] ? p.keywords[0] + ' · ' : '') + propPrice(p), color: p.kind === 'community' || p.kind === 'stockton' ? COLORS['new-builds'] : COLORS.assumable, act: { prop: p.key } });
  if (homes.length && PROP_BY[slug(q)] === homes[0]) out.unshift(homeItem(homes.shift()));
  if (viaAka && homes.length) { homes.forEach((p) => out.push(homeItem(p))); homes.length = 0; }
  if (place) {
    const label = placeLabel(place);
    out.push({ grp: 'Places', label: 'Every home for sale in ' + label, hint: 'Map search with filters', color: COLORS.search, act: { map: label } });
    [['assumable', 'Assumable homes in '], ['new-builds', 'New builds in '], ['zero-down', '$0 down in '], ['payment', 'Homes by payment in ']].forEach(([k, t]) => out.push({ grp: 'Places', label: t + label, hint: place.k === 'town' ? place.c + ' County' : 'County', color: COLORS[k], act: { page: k, place } }));
  }
  // Features people search for ("pool", "single story", "acreage"...) open the map with that filter on
  const FEAT = [[/pool/, 'pool', 'Homes with a pool'], [/single.?stor|one.?stor|no stairs|ranch.?style/, '1story', 'Single-story homes'], [/new (build|construction|home)|brand new/, 'newconstruction', 'New construction'], [/horse|equestrian/, 'horse', 'Horse properties'], [/55|senior|active adult/, 'adult', '55+ communities'], [/view/, 'views', 'Homes with views'], [/water ?front|lake ?front|river ?front/, 'waterfront', 'Waterfront homes'], [/golf/, 'golf', 'Golf course homes'], [/solar|green|energy/, 'green', 'Homes with solar or green features'], [/3.?car|three car|\brv\b|boat|shop|big garage/, '3garage', 'Homes with a 3-car garage'], [/fireplace/, 'fireplace', 'Homes with a fireplace'], [/basement/, 'basement', 'Homes with a basement'], [/main.?floor|downstairs (primary|master|bedroom)|primary (down|on)/, 'master', 'Homes with a main-floor primary'], [/open house/, 'openhouses', 'Open houses'], [/reduced|price (cut|drop)/, 'reduced', 'Price-reduced homes'], [/fixer|flip|handyman/, 'fixer', 'Fixer-uppers']];
  const fplace = place || (() => { const t = Object.values(TOWN).filter((x) => q.includes(x.n.toLowerCase())).sort((a, b) => b.n.length - a.n.length)[0]; return t ? { k: 'town', n: t.n, c: t.c } : null; })();
  const where = fplace ? ' in ' + placeLabel(fplace) : '';
  FEAT.filter(([re]) => re.test(q)).slice(0, 2).reverse().forEach(([, o, t]) => out.unshift({ grp: 'Search the map', label: t + where, hint: 'Every home for sale, on the map', color: COLORS.search, act: { map: fplace ? placeLabel(fplace) : '', opts: [o], place: fplace } }));
  if (/acre|\bland\b|big lot|room for/.test(q)) out.unshift({ grp: 'Search the map', label: 'Homes on an acre or more' + where, hint: 'Every home for sale, on the map', color: COLORS.search, act: { map: fplace ? placeLabel(fplace) : '', acres: 1, place: fplace } });
  homes.slice(0, place ? 3 : 6).forEach((p) => out.push(homeItem(p)));
  return out.slice(0, 14);
}
function runAction(a) {
  if (a.map !== undefined) { if (a.place) setPlace(a.place); const F = sub('search', {}); F.acres = a.acres || 0; mapSearch(a.map, a.opts || []); return; }
  if (a.prop) { location.hash = 'p/' + a.prop; return; }
  if (a.place) setPlace(a.place);
  if (a.clear) setPlace(null);
  if (a.text) { if (a.page === 'new-builds') sub('nb', {}).text = a.text; if (a.page === 'assumable') sub('assum', {}).text = a.text; }
  save();
  go(a.page, true);
}
function bindSearch(input, box) {
  if (!input || !box) return;
  let items = [], idx = -1;
  const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); idx = -1; };
  const paint = () => {
    if (!items.length) {
      box.innerHTML = input.value.trim() ? '<div class="grp">Search the map</div><button type="button" data-i="-2"><span class="dot" style="background:' + COLORS.search + '"></span>Every home for sale in "' + esc(input.value.trim()) + '"<small>Map search with filters</small></button><div class="grp">Or ask Darien</div><button type="button" data-i="-1"><span class="dot" style="background:' + COLORS.alerts + '"></span>Ask Darien to search for "' + esc(input.value.trim()) + '"</button>' : '';
      box.hidden = !input.value.trim();
      input.setAttribute('aria-expanded', String(!box.hidden));
      return;
    }
    let last = '';
    box.innerHTML = items.map((it, i) => (it.grp !== last ? '<div class="grp">' + esc((last = it.grp)) + '</div>' : '') +
      '<button type="button" role="option" id="' + input.id + '-o' + i + '" data-i="' + i + '" aria-selected="' + (i === idx) + '"><span class="dot" style="background:' + it.color + '"></span>' + esc(it.label) + '<small>' + esc(it.hint || '') + '</small></button>').join('');
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (idx >= 0) input.setAttribute('aria-activedescendant', input.id + '-o' + idx); else input.removeAttribute('aria-activedescendant');
  };
  input.addEventListener('input', () => { items = suggestions(input.value); idx = items.length ? 0 : -1; paint(); });
  input.addEventListener('focus', () => { if (input.value.trim()) { items = suggestions(input.value); paint(); } });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); idx = (idx + 1) % items.length; paint(); }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); idx = (idx - 1 + items.length) % items.length; paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = items[idx >= 0 ? idx : 0]; if (it) { close(); input.value = ''; input.blur(); runAction(it.act); } else if (input.value.trim()) { const v = input.value.trim(); close(); input.value = ''; input.blur(); mapSearch(v); } }
    else if (e.key === 'Escape') close();
  });
  box.addEventListener('mousedown', (e) => e.preventDefault());
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const i = +b.dataset.i;
    if (i === -2) { const v = input.value.trim(); close(); input.value = ''; input.blur(); mapSearch(v); return; }
    if (i < 0) { askSearch(input.value.trim()); close(); return; }
    close(); input.value = ''; input.blur(); runAction(items[i].act);
  });
  input.addEventListener('blur', () => setTimeout(close, 120));
}
function askSearch(text) {
  const A = sub('alerts', {});
  A.towns = text;
  S.flash = 'Darien can search the MLS for "' + text + '". Send him your request below.';
  save();
  go('alerts');
}
bindSearch($('q'), $('q-sugg'));
const searchBox = (id) => '<div class="search hero-search" role="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4.2-4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
  '<label class="vh" for="' + id + '">Search a town, ZIP code or topic</label><input id="' + id + '" type="search" autocomplete="off" placeholder="Try Loomis, 95212, assumable or $0 down" role="combobox" aria-expanded="false" aria-controls="' + id + '-sugg" aria-autocomplete="list"><div class="sugg" id="' + id + '-sugg" role="listbox" hidden></div></div>';

// Quick searches under the home page search box: open the map with that filter
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-chip]');
  if (!c) return;
  let f = {};
  try { f = JSON.parse(c.dataset.chip); } catch (x) { f = {}; }
  const F = sub('search', {});
  Object.assign(F, { loc: S.place ? placeLabel(S.place) : '', min: 0, max: f.max || 0, beds: 0, baths: 0, acres: f.acres || 0, sqft: 0, year: 0, opts: f.opts || [], pool: false });
  save(); go('search', true);
});

/* ===== Routing ===== */
function parseHash() {
  let h = '';
  try { h = decodeURIComponent((location.hash || '').slice(1)).trim().toLowerCase(); } catch (e) { h = ''; }
  const pm = h.match(/^p\/(.{1,80})$/);
  if (pm) return { page: 'property', prop: pm[1], client: null, admin: false };
  let client = null;
  const m = h.match(/^(?:([a-z0-9-]+?)--)?for-([a-z][a-z0-9-]{0,39})$/);
  if (m) { client = m[2]; h = m[1] || 'home'; }
  return { page: PAGES[h] ? h : 'home', client, admin: h === 'admin' };
}
function go(page, force) {
  if (!PAGES[page]) page = 'home';
  if (location.hash.slice(1) !== page) { location.hash = page; if (force) render(page); }
  else render(page);
}

/* Back button: the pages and homes opened on this visit and how far down each one was scrolled.
   A home is kept as "p/<home>", a page by its name. */
const TRAIL = [];
let restoreY = null;
const routeOf = (page) => (page === 'property' ? 'p/' + PROP_KEY : page);
function noteTrail(route, y0) {
  const n = TRAIL.length;
  if (n && TRAIL[n - 1].p === route) return;
  if (n > 1 && TRAIL[n - 2].p === route) { TRAIL.pop(); restoreY = TRAIL[n - 2].y; return; }
  if (n) TRAIL[n - 1].y = y0;
  TRAIL.push({ p: route, y: 0 });
  if (TRAIL.length > 40) TRAIL.shift();
}
const routeName = (r) => (r.slice(0, 2) === 'p/' ? 'that home' : PAGES[r].nav);
function backState() {
  const prev = TRAIL.length > 1 ? TRAIL[TRAIL.length - 2].p : (CURRENT !== 'home' ? 'home' : null);
  $('back').hidden = !prev;
  if (prev) { $('back').setAttribute('aria-label', 'Back to ' + routeName(prev)); $('back').title = 'Back to ' + routeName(prev); }
}
$('back').addEventListener('click', () => {
  const prev = TRAIL.length > 1 ? TRAIL[TRAIL.length - 2].p : 'home';
  if (TRAIL.length <= 1) TRAIL.length = 0;
  if (prev.slice(0, 2) === 'p/') location.hash = prev; else go(prev);
});

let lastRendered = '';
let lastView = { p: '', t: 0 }, firstView = true;
/* Homepage hero slideshow timer, Nov 9, 2026. Cleared on every
   render, so leaving the home page stops the slideshow. */
let heroTimer = null;
let heroSlides = [], heroDots = [], heroIndex = 0, heroFlipping = false, heroPaused = false, heroLastFlip = 0;
const HERO_START_KEY = 'dp-hero-last-start';
function heroSlidesHtml() {
  const slides = heroShuffleOrder(heroSlidesData());
  return '<div class="hero-stack" id="heroStack">' + slides.map((s, i) => '<div class="hero-slide' + (i === 0 ? ' active' : (i === 1 ? ' behind' : '')) + '" data-slide="' + i + '" data-homes="' + esc(s.label) + '" data-view="' + esc(s.view || 'front') + '">' +
    '<img src="' + esc(s.src) + '" alt="' + esc(s.label + ', ' + s.city + ', ' + s.tag + ', ' + (s.view || 'front') + ' view') + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '" referrerpolicy="no-referrer">' +
    '<span class="hero-slide-tag">' + esc(s.label + ', ' + s.city + ' · ' + s.tag + ' · ' + (s.view || 'front') + ' view') + '</span></div>').join('') + '</div>' +
    '<div class="hero-dots" role="group" aria-label="Hero photos">' + slides.map((s, i) => '<button type="button" data-hero-dot="' + i + '" aria-label="Show ' + esc(s.label + ', ' + s.city) + '"' + (i === 0 ? ' class="on"' : '') + '></button>').join('') + '</div>' +
    '<div class="hero-progress" id="heroProgress"></div><div class="hero-flip-hint">Top card flips away to reveal the next home</div>';
}
/* Home page only: v10 hero, mix of G and D plus dual-card pan, picked Nov 9. 3D card flip
   stack plus parallax scroll, no plain fade. Two homes visible at once, left pans left,
   right pans right over the 8 second hold, rotating with the cards. The top card flips away
   with a slight tilt to reveal the next home, and the hero photo
   moves slower than the page as you scroll. Auto-advance is slow,
   8 seconds, scroll down also flips to the next home, throttled,
   pause on hover and focus, dots are pills. All 12 slides are
   Unsplash only, 3840 pixels wide. Random start: every load starts
   on a different home, never the same start twice in a row, stored
   in sessionStorage, then it rotates in order from there. Reshuffle,
   Nov 10, 2026: every time the home page mounts, the order itself
   is reshuffled, so a click on Home never shows the same starting
   pair. Fronts shuffle among front slots and backs among back slots,
   so the front/back pattern in heroSlidesData() always holds: front,
   back, front, back, front, back, front, back, then fronts, and no 2
   back views are ever in a row. Other pages keep their own hero
   photo, untouched. */
function heroShuffleOrder(slides) {
  const frontSlots = [0, 2, 4, 6, 8, 9, 10, 11], backSlots = [1, 3, 5, 7];
  const fronts = slides.filter((s) => (s.view || 'front') !== 'back');
  const backs = slides.filter((s) => (s.view || 'front') === 'back');
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  shuffle(fronts); shuffle(backs);
  const out = new Array(slides.length);
  frontSlots.forEach((slot, i) => { if (i < fronts.length) out[slot] = fronts[i]; });
  backSlots.forEach((slot, i) => { if (i < backs.length) out[slot] = backs[i]; });
  return out.filter(Boolean);
}
function heroPickStart(n) {
  let last = -1;
  try { last = parseInt(sessionStorage.getItem(HERO_START_KEY) || '-1', 10); } catch (e) { last = -1; }
  if (n <= 1) return 0;
  let pick = Math.floor(Math.random() * n), guard = 0;
  while (pick === last && guard < 20) { pick = Math.floor(Math.random() * n); guard++; }
  try { sessionStorage.setItem(HERO_START_KEY, String(pick)); } catch (e) { /* private mode, start is random anyway */ }
  return pick;
}
/* Pill fix, Nov 10, 2026: the old version rotated the slide DOM order so the random start
   became index 0, then relabeled the dots 0 to 11 in rotated order. The first pill was
   therefore always on no matter which home was left, and clicking pill 6 showed rotated
   slide 5, which is original slide 3 when the start was 10. This version never rotates
   anything. Slides and dots stay in original order, heroIndex is the original start index,
   the pill with that same index lights up, and a pill click shows that slide as the left
   card with the next slide on the right. */
function heroApplyRandomStart(scene) {
  const stack = scene.querySelector('#heroStack');
  if (!stack) return;
  const ordered = [...stack.querySelectorAll('.hero-slide')];
  if (!ordered.length) return;
  const start = heroPickStart(ordered.length);
  ordered.forEach((sl, i) => {
    sl.classList.remove('active', 'behind', 'flipping');
    if (i === start) sl.classList.add('active');
    if (i === (start + 1) % ordered.length) sl.classList.add('behind');
  });
  heroSlides = ordered;
  heroIndex = start;
  heroDots = [...scene.querySelectorAll('[data-hero-dot]')];
  heroDots.forEach((d, j) => d.classList.toggle('on', j === start));
}
function startHeroSlideshow() {
  const scene = document.querySelector('#hero .scene');
  if (!scene || typeof heroSlidesData !== 'function') return;
  scene.innerHTML = heroSlidesHtml();
  heroSlides = [...scene.querySelectorAll('.hero-slide')];
  heroDots = [...scene.querySelectorAll('[data-hero-dot]')];
  heroFlipping = false; heroPaused = false; heroLastFlip = 0;
  heroApplyRandomStart(scene);
  heroSlides = [...scene.querySelectorAll('.hero-slide')];
  heroDots = [...scene.querySelectorAll('[data-hero-dot]')];
  const show = (i) => {
    if (heroFlipping || i === heroIndex) return;
    heroFlipping = true;
    const oldIdx = heroIndex;
    const old = heroSlides[oldIdx];
    const nextIdx = (i + heroSlides.length) % heroSlides.length;
    const next = heroSlides[nextIdx];
    const behind = heroSlides[(nextIdx + 1) % heroSlides.length];
    heroIndex = nextIdx;
    old.classList.remove('active', 'behind');
    old.classList.add('flipping');
    next.classList.remove('flipping', 'behind');
    next.classList.add('active');
    behind.classList.remove('flipping', 'active');
    behind.classList.add('behind');
    heroSlides.forEach((sl, j) => { if (j !== oldIdx && j !== heroIndex && sl !== behind) sl.classList.remove('active', 'behind', 'flipping'); });
    heroDots.forEach((d, j) => d.classList.toggle('on', j === heroIndex));
    setTimeout(() => { old.classList.remove('flipping'); heroFlipping = false; }, 950);
  };
  const restart = () => { clearInterval(heroTimer); heroTimer = setInterval(() => { if (!heroPaused) show(heroIndex + 1); }, 8000); };
  heroDots.forEach((d) => d.addEventListener('click', () => { show(+d.dataset.heroDot); restart(); }));
  const heroEl = $('hero');
  heroEl.addEventListener('mouseenter', () => { heroPaused = true; });
  heroEl.addEventListener('mouseleave', () => { heroPaused = false; });
  heroEl.addEventListener('focusin', () => { heroPaused = true; });
  heroEl.addEventListener('focusout', () => { heroPaused = false; });
  if (!window.__heroParallaxBound) {
    window.__heroParallaxBound = true;
    window.addEventListener('scroll', () => {
      if (CURRENT !== 'home') return;
      const el = $('hero');
      const sc = document.querySelector('#hero .scene');
      if (!el || !sc || !sc.querySelector('.hero-slide')) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (rect.bottom < 0 || rect.top > vh) return;
      const scrolled = Math.max(0, -rect.top);
      const total = rect.height + vh;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / total));
      el.style.setProperty('--parallaxY', Math.round(scrolled * 0.25) + 'px');
      el.style.setProperty('--headlineY', Math.round(scrolled * 0.12) + 'px');
      const bar = document.getElementById('heroProgress');
      if (bar) bar.style.width = Math.round(progress * 100) + '%';
      const now = Date.now();
      if (scrolled > 120 && now - heroLastFlip > 1200 && !heroPaused) { heroLastFlip = now; show(heroIndex + 1); }
    }, { passive: true });
  }
  restart();
}
/* ===== Scroll-grow: elements marked data-grow start small and grow to
   full size as they scroll into view. render() calls this after every
   page mount, so it works on re-renders too. */
let growObs = null;
function bindGrow(root) {
  const scope = root || document;
  const els = [...scope.querySelectorAll('[data-grow]:not(.grow-start)')];
  if (!els.length) return;
  els.forEach((el) => el.classList.add('grow-start'));
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
  if (!growObs) growObs = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); growObs.unobserve(en.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((el) => growObs.observe(el));
}
function render(page, keep) {
  const y0 = window.scrollY;
  if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
  CURRENT = page;
  const P = PAGES[page];
  const V = (k) => (typeof P[k] === 'function' ? P[k]() : P[k]);
  const route = routeOf(page);
  document.documentElement.dataset.page = page;
  // A real title and description for each page, for Google and for link previews
  try {
    const t = page === 'home' ? 'Darien Phillips, REALTOR® | Homes in Placer, Sacramento, San Joaquin and Stanislaus' : (page === 'property' && P.cur && P.cur() ? propTitle(P.cur(), false) + (signedIn() || (typeof detailsShown === 'function' && detailsShown(P.cur().key)) ? ' · ' + propPrice(P.cur()) : '') : V('title')) + ' | Darien Phillips, REALTOR®';
    document.title = t;
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', String(V('sub') || '').slice(0, 300));
  } catch (x) { /* keep the old title */ }
  GATES.clear();
  noteTrail(route, y0);
  const ctas = P.ctas ? P.ctas() : page === 'home' ? '<button type="button" class="btn btn-pa" data-go="search">Search every home</button><button type="button" class="btn btn-ghost" data-go="assumable">See assumable homes</button><button type="button" class="btn btn-ghost" data-go="zero-down">$0-down options</button>' :
    page === 'alerts' ? '<a class="btn btn-ghost" href="sms:+12098826469">Text Darien</a><a class="btn btn-ghost" href="tel:+12098826469">Call Darien</a><a class="btn btn-ghost" href="mailto:darienphillips45@gmail.com">Email Darien</a>' :
    page === 'about' ? '<a class="btn btn-pa" href="sms:+12098826469">Text Darien</a><a class="btn btn-ghost" href="tel:+12098826469">Call 209.882.6469</a><a class="btn btn-ghost" href="mailto:darienphillips45@gmail.com">Email Darien</a>' :
    '<button type="button" class="btn btn-pa" data-go="alerts">Get homes by email</button><a class="btn btn-ghost" href="sms:+12098826469">Text Darien</a><a class="btn btn-ghost" href="tel:+12098826469">Call Darien</a><a class="btn btn-ghost" href="mailto:darienphillips45@gmail.com">Email Darien</a>';
  const portrait = P.portrait ? '<figure class="hero-portrait"><img src="img/darien-card.jpg' + PV + '" alt="Darien Phillips" decoding="async"></figure>' : '';
  const photoKey = P.photoKey ? P.photoKey() : page;
  $('hero').innerHTML = '<div class="scene">' + scene(P.scene) + photoImg(photoKey, false, P.photoUrl ? P.photoUrl() : '') + '</div><div class="wrap hero-in' + (portrait ? ' hero-split' : '') + '"><div class="hero-text"><p class="kicker">' + esc(V('kicker')) + (clientName() ? '<span class="forwho">Picked for ' + esc(clientName()) + '</span>' : '') + '</p>' +
    '<h1 id="page-title" tabindex="-1">' + esc(V('title')) + (V('title2') ? '<span class="t2">' + esc(V('title2')) + '</span>' : '') + '</h1><p class="sub">' + esc(V('sub')) + '</p>' + (P.heroSearch ? searchBox('q2') + '<div class="hero-chips">' + [['Pool', { opts: ['pool'] }], ['Single story', { opts: ['1story'] }], ['Under $600k', { max: 600000 }], ['New builds', { opts: ['newconstruction'] }], ['1+ acre', { acres: 1 }], ['55+', { opts: ['adult'] }]].map(([t, f]) => '<button type="button" class="chip" data-chip=\'' + esc(JSON.stringify(f)) + '\'>' + esc(t) + '</button>').join('') + '</div>' : '') + '<div class="ctas">' + ctas + '</div>' + (P.heroNote ? '<p class="hero-note">' + esc(P.heroNote()) + '</p>' : '') + '</div>' + portrait + '</div>';
  if (page === 'home') {
    const sc = document.createElement('button');
    sc.type = 'button'; sc.className = 'hero-scroll';
    sc.setAttribute('aria-label', 'Scroll to how Darien can help you');
    sc.innerHTML = 'SCROLL<span aria-hidden="true">↓</span>';
    sc.addEventListener('click', () => { const t = document.getElementById('help') || document.getElementById('toured'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('hero').appendChild(sc);
    startHeroSlideshow();
  }
  const pimg = $('hero').querySelector('.hero-portrait img');
  if (pimg) pimg.addEventListener('error', () => { pimg.closest('figure').remove(); $('hero').querySelector('.hero-in').classList.remove('hero-split'); }, { once: true });
  $('view').innerHTML = (page === 'home' || page === 'search' ? picksHtml() : '') + P.html();
  if (P.mount) P.mount($('view'));
  bindGrow($('view'));
  wirePhotos($('hero'));
  wirePhotos($('view'));
  $('foot-photo').innerHTML = photoCredit(photoKey);
  if (P.heroSearch) bindSearch($('q2'), $('q2-sugg'));
  navState();
  backState();
  if (ADMIN) drawAdmin();
  const moved = lastRendered !== route;
  lastRendered = route;
  if (moved && !keep) {
    const y = restoreY;
    restoreY = null;
    window.scrollTo(0, y || 0);
    const h = $('page-title');
    if (h && document.activeElement !== $('q')) h.focus({ preventScroll: true });
  }
  if (moved && (lastView.p !== route || Date.now() - lastView.t > 30 * 60 * 1000)) {
    const locked = page === 'property' && P.cur() && !signedIn();
    beacon('pv', { pg: navName(), p: page, t: V('title'), key: page === 'property' ? PROP_KEY : '', locked: locked ? 'yes' : '',
      ref: firstView ? String(document.referrer || '').slice(0, 200) : '', dev: window.innerWidth < 720 ? 'Phone' : 'Computer' });
    logStep('Viewed ' + navName() + (locked ? ' (preview, before signing in)' : ''));
    lastView = { p: route, t: Date.now() };
    firstView = false;
  }
}
function adminHash() { openAdmin(); try { history.replaceState(null, '', '#' + routeOf(CURRENT)); } catch (e) { /* address bar keeps #admin */ } }
window.addEventListener('hashchange', () => {
  const { page, prop, client, admin } = parseHash();
  if (admin) { adminHash(); return; }
  if (client) { CLIENT = client; store.set('dp-client', client); }
  if (page === 'property') { if (prop !== PROP_KEY || CURRENT !== 'property') { PROP_KEY = prop; render('property'); } return; }
  /* v10, Nov 10, 2026: going to Home always re-renders, even when
     already on Home. Clicking Home from a fresh load only changes
     the hash from empty to home, so without this the click did
     nothing and the hero showed the same starting pair. A re-render
     reshuffles the hero order and picks a new random start. */
  if (page !== CURRENT || page === 'home' || !$('view').innerHTML) render(page);
});

/* ===== Footer and start ===== */
if (TRACKER) $('foot-track').hidden = false;
$('foot-src').textContent = 'Sources: assumable homes from Darien\'s MetroList search (' + DATA.assumablesChecked + '); Placer loan estimates from Roots.homes (' + DATA.placer.checked + '); Stockton homes and plans from builder websites (' + STK.checked + '); other new-home communities from Homes.com, HomeFinder and builder sites (' + DATA.checked + '). Rates: Freddie Mac weekly averages for Oct 29, 2026, and FHA and VA averages from The Mortgage Reports for Oct 23, 2026. 2026 FHA limits from homebuyer.com; CalHFA income limits effective June 30, 2026; build costs from a 2026 Sacramento cost guide.';
const first = parseHash();
if (first.client) { CLIENT = first.client; store.set('dp-client', first.client); }
if (first.prop) PROP_KEY = first.prop;
if (SOURCE()) logStep('Arrived from ' + SOURCE_NAME(SOURCE()) + (sess.get('dp-landed', '') ? ' (link to /p/' + sess.get('dp-landed', '') + ')' : ''));
adminInit();
render(first.page);
if (first.admin) adminHash();
loadListings();
