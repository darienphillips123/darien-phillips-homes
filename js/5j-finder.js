/* ===== Find exactly what you are looking for: one search across every home on the site =====
   Filters use only fields the site actually publishes. Where a field is not published,
   the homes without it are left out when that filter is on, and the count line says so
   plainly instead of guessing. Prices for new builds are starting prices. The word
   search looks through listing remarks and descriptions, not a verified feature list. */
const FINDER_KEYWORDS = ['open floor plan', 'open concept', 'large backyard', 'pool', 'ADU', 'single story'];
let FD_CACHE = null;
function finderPlanCard(name, x, comm) {
  const M = MODELS[name] || {};
  const facts = [x.b != null ? rng(x.b, x.b2) + ' bd' : '', x.ba != null ? rng(x.ba, x.ba2) + ' ba' : '', x.s ? comma(x.s) + ' sq ft' : '', x.st ? (x.st === 1 ? 'Single story' : x.st + ' stories') : ''].filter(Boolean).join(' · ');
  const title = x.n + ' at ' + name;
  const info = { h: title, p: x.p ? 'From ' + money(x.p) : '', b: facts, r: comm ? comm.builder : '', city: comm ? comm.city : '',
    x: x.u || M.url || '', xs: 'Builder floor plan', m: mapFor(name + ', ' + (comm ? comm.city : '') + ', CA') };
  return '<article class="card"><div class="head"><span class="pill pa">Floor plan</span>' + (x.st === 1 ? '<span class="pill ok">Single story</span>' : '') + '</div>' +
    '<div><h3>' + esc(x.n) + '</h3><div class="sub">' + esc(name + (comm ? ' · ' + comm.city : '')) + '</div></div>' +
    '<div class="price num">' + (x.p ? '<small>From </small>' + money(x.p) : '<small>Price: ask Darien</small>') + '</div>' +
    (facts ? '<div class="facts">' + esc(facts) + '</div>' : '') +
    '<p class="note">No lot size is published for this build-to-order plan. Ask Darien for the homesites it can be built on.</p>' +
    '<div class="actions">' + details(info) + cartBtn('m:' + slug(name + ' ' + x.n), title, x.p ? 'From ' + money(x.p) : '') + askBtn('m:' + slug(name + ' ' + x.n), title, x.p ? 'From ' + money(x.p) : '') + '</div>' +
    '<div class="src">Starting price from ' + esc(M.src || 'the builder') + ', checked ' + esc(MODELS_CHECKED) + '.</div></article>';
}
function finderItems() {
  if (FD_CACHE) return FD_CACHE;
  const items = [];
  DATA.assumables.forEach((h) => items.push({ kind: 'assumable', label: 'Assumable loan', price: h.price || null,
    beds: h.beds != null ? h.beds : null, baths: h.baths != null ? h.baths : null, sqftMin: h.sqft || null, sqftMax: h.sqft || null,
    lotSqft: h.acres ? Math.round(h.acres * 43560) : null, stories: null, city: h.city, county: h.county,
    card: () => assumableCard(h),
    hay: (h.street + ' ' + h.city + ' ' + (h.zip || '') + ' ' + (h.remarks || '') + ' ' + (h.type || '') + ' ' + (h.tags || []).map((t) => t[1]).join(' ')).toLowerCase() }));
  PLACER.forEach((h) => items.push({ kind: 'placer', label: 'Assumable loan', price: h.price || null,
    beds: h.beds != null ? h.beds : null, baths: h.baths != null ? h.baths : null, sqftMin: h.sqft || null, sqftMax: h.sqft || null,
    lotSqft: h.lot || null, stories: null, city: h.city, county: 'Placer',
    card: () => { const P = sub('pl', PL_DEFAULTS); return placerCard(h, placerFigure(h, P), P); },
    hay: (h.street + ' ' + h.city + ' ' + (h.kind || '') + ' ' + (h.feats || []).join(' ') + ' ' + h.type).toLowerCase() }));
  STK.homes.forEach((h) => {
    const c = STK_COMM[h.comm];
    items.push({ kind: 'stockton', label: '$0 down', price: h.price || null,
      beds: h.bedsMax != null ? h.bedsMax : null, baths: h.bathsMax != null ? h.bathsMax : null, sqftMin: h.sqft || null, sqftMax: h.sqft || null,
      lotSqft: h.lot || null, stories: h.stories || null, city: 'Stockton', county: 'San Joaquin',
      card: () => { const K = sub('stk', STK_DEFAULTS); return stocktonCard(h, stkFig(h, K), K); },
      hay: (h.plan + ' ' + c.name + ' ' + c.builder + ' ' + c.area + ' ' + (h.note || '') + ' ' + (h.street || '') + ' ' + (c.perks || []).join(' ') + ' ' + (c.notes || []).join(' ')).toLowerCase() });
  });
  DATA.communities.forEach((c) => items.push({ kind: 'community', label: 'New build', price: c.min || null,
    beds: c.bmax != null ? c.bmax : (c.bmin != null ? c.bmin : null), baths: null, sqftMin: c.sqft || null, sqftMax: c.sqft_max || c.sqft || null,
    lotSqft: null, stories: null, city: c.city, county: c.county,
    card: () => communityCard(c, { loan: 'myhome' }),
    hay: (c.name + ' ' + (c.builder || '') + ' ' + c.city + ' ' + (c.tags || []).join(' ')).toLowerCase() }));
  Object.keys(MODELS).forEach((name) => {
    const M = MODELS[name];
    const comm = DATA.communities.find((x) => x.name === name) || null;
    (M.plans || []).forEach((x) => items.push({ kind: 'plan', label: 'New build', price: x.p || null,
      beds: x.b2 != null ? x.b2 : (x.b != null ? x.b : null), baths: x.ba2 != null ? x.ba2 : (x.ba != null ? x.ba : null),
      sqftMin: x.s || null, sqftMax: x.s || null, lotSqft: null, stories: x.st || null,
      city: comm ? comm.city : '', county: comm ? comm.county : '',
      card: () => finderPlanCard(name, x, comm),
      hay: (x.n + ' ' + name + ' ' + (comm ? comm.builder + ' ' + comm.city : '')).toLowerCase() }));
  });
  FD_CACHE = items;
  return items;
}
// Cart keys for floor plans, move-in ready homes and deal communities, so the cart page
// can link back to the home page when one of those is added from a models or deals list
if (typeof MODELS !== 'undefined' && typeof CARD_PROP !== 'undefined') {
  Object.keys(MODELS).forEach((name) => {
    const M = MODELS[name];
    (M.plans || []).forEach((x) => { if (x.key && PROP_BY[x.key] && !CARD_PROP['m:' + slug(name + ' ' + x.n)]) CARD_PROP['m:' + slug(name + ' ' + x.n)] = x.key; });
    (M.qmi || []).forEach((q) => { if (q.key && PROP_BY[q.key] && !CARD_PROP['q:' + slug(name + ' ' + q.a)]) CARD_PROP['q:' + slug(name + ' ' + q.a)] = q.key; });
  });
}
if (typeof DEALS !== 'undefined' && typeof CARD_PROP !== 'undefined') {
  DEALS.communities.forEach((c) => {
    const match = DATA.communities.find((x) => x.name === c.name);
    if (match && !CARD_PROP['d:' + c.id]) CARD_PROP['d:' + c.id] = slug(match.name);
  });
}
const FINDER_DEFAULTS = { kind: 'all', stories: 'any', min: 0, max: 0, beds: 0, baths: 0, sqMin: 0, sqMax: 0, lot: 0, city: '', q: '', sort: 'price', gstep: 1, showFull: false };
/* ===== Finder to Custom Portal: carry the visitor's picks over, then
   jump straight to the Custom Portal tab. Must-have phrases move to the
   portal's must-haves; any other search words, plus filters the portal
   has no field for (min price, home size, lot size), go into the
   portal's "Anything else?" box so nothing the visitor picked is lost. */
function finderToPortal() {
  const F = sub('finder', FINDER_DEFAULTS);
  const P = sub('portal', PORTAL_DEFAULTS);
  const words = (F.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const must = [];
  let rest = words.slice();
  PORTAL_MUST.forEach((m) => {
    const mw = m.toLowerCase().split(/\s+/);
    if (mw.every((w) => rest.includes(w))) { must.push(m); rest = rest.filter((w) => !mw.includes(w)); }
  });
  const extraBits = [];
  if (rest.length) extraBits.push(rest.join(' '));
  if (F.min) extraBits.push('Min price ' + money(F.min) + '.');
  if (F.sqMin) extraBits.push('At least ' + comma(F.sqMin) + ' sq ft.');
  if (F.sqMax) extraBits.push('Up to ' + comma(F.sqMax) + ' sq ft.');
  if (F.lot) extraBits.push('Lot at least ' + comma(F.lot) + ' sq ft.');
  if (F.stories === '1' && !must.includes('single story')) extraBits.push('Single story.');
  Object.assign(P, { kind: F.kind, city: F.city, beds: F.beds, baths: F.baths, max: F.max, pay: 0, must, extra: extraBits.join(' ') });
  save();
  go('portal', true);
}
/* ===== v5: Finder homes with photos, Nov 9, 2026 =====
   The toured homes as Finder examples, each with a photo, price,
   city, beds, baths, sq ft, Click to get the details and Add to cart.
   The live Finder has 1,423 items; this section shows the toured set
   so visitors can see the photo layout. */
function finderPhotoHtml() {
  if (typeof touredSimList !== 'function') return '';
  const list = touredSimList().slice(0, 6);
  if (!list.length) return '';
  return '<section class="blk" style="padding-top:0"><div class="wrap"><div class="shead"><div><h2>Homes with photos</h2><p>Every home here has a photo, price, city, beds, baths and sq ft. These are the toured homes as Finder examples.</p></div></div>' +
    '<div class="cards">' + list.map((o) => '<article class="card">' +
      '<img src="' + esc(o.img || TOUR_STOCK_IMG) + '" alt="' + esc((o.img ? o.imgTag : 'STOCK PHOTO, not a toured home') + ', ' + o.title) + '" loading="lazy" referrerpolicy="no-referrer" style="width:100%;height:180px;object-fit:cover;border-radius:14px">' +
      '<div><h3>' + esc(o.title) + '</h3><div class="sub">' + esc(o.city) + '</div></div>' +
      '<div class="price num">' + esc(o.price) + '</div><div class="facts">' + esc(o.beds + ' bd, ' + o.baths + ' ba, ' + comma(o.sqft) + ' sq ft') + '</div>' +
      '<span class="note">' + esc(o.img ? o.imgTag : 'STOCK PHOTO, not a toured home') + '</span>' +
      '<div class="actions">' + details(o.info) + ' ' + cartBtn(o.cartKey, o.title, o.price) + '</div></article>').join('') +
    '</div></div></section>';
}
def('finder', {
  nav: 'Find your home', scene: 'home', kicker: 'Find exactly what you are looking for', tileTitle: 'Find exactly what you are looking for',
  title: 'Find exactly what you are looking for',
  sub: 'Filter every home on this site at once: assumable loans, Placer homes, new builds and Stockton $0-down homes. Every filter uses only information published on this site.',
  photoKey: () => 'shopping-cart',
  html() {
    const F = sub('finder', FINDER_DEFAULTS);
    const cities = Array.from(new Set(finderItems().map((it) => it.city).filter(Boolean))).sort();
    return finderPhotoHtml() + '<section class="blk"><div class="wrap">' +
      '<p class="fd-intro">Answer four quick questions and see the homes that match. Change any answer, skip a step, or use Show all filters instead. You can look around without signing up.</p>' +
      '<p class="note">Want Darien to turn these filters into your own custom MLS portal, emailed to you? <button type="button" class="btn btn-line btn-sm" data-go="portal">Custom Portal</button></p>' +
      '<div class="panel accent guide-panel" id="fd-guide">' +
        '<div class="bar"><div><p class="mono eyebrow">Find your home</p><h2>Answer four questions, see your homes</h2></div><button type="button" class="btn btn-line btn-sm" id="fd-startover">Start over</button></div>' +
        '<div class="gz-steps" id="fd-steps" aria-label="Progress"></div>' +
        '<div id="fd-step"></div>' +
        '<div class="gz-nav" id="fd-nav"></div>' +
      '</div>' +
      '<div style="margin-top:14px"><button type="button" class="btn btn-line" id="fd-toggle-full">' + (F.showFull ? 'Hide all filters' : 'Show all filters') + '</button></div>' +
      '<div class="panel" id="fd-full" style="display:grid;gap:12px;margin-top:14px"' + (F.showFull ? '' : ' hidden') + '>' +
      '<div class="fields">' +
        sel('fd-kind', [['all', 'Every home'], ['assumable', 'Assumable loans'], ['newbuild', 'New builds'], ['zerodown', '$0-down homes']], F.kind, 'Home type') +
        sel('fd-stories', [['any', 'Any'], ['1', 'Single story'], ['2', 'Two story']], F.stories, 'Stories') +
        sel('fd-city', [['', 'Every city or area']].concat(cities.map((c) => [c, c])), F.city, 'City or area') +
        sel('fd-beds', BED_OPTS, F.beds, 'Bedrooms') + sel('fd-baths', BATH_OPTS, F.baths, 'Bathrooms') +
        sel('fd-sqmin', SIZE_OPTS, F.sqMin, 'Home size from') +
        sel('fd-sqmax', [[0, 'Any'], [1500, 'Up to 1,500 sq ft'], [1800, 'Up to 1,800 sq ft'], [2000, 'Up to 2,000 sq ft'], [2500, 'Up to 2,500 sq ft'], [3000, 'Up to 3,000 sq ft'], [3500, 'Up to 3,500 sq ft']], F.sqMax, 'Home size up to') +
        sel('fd-lot', LOT_SQFT_OPTS, F.lot, 'Lot or backyard size') +
        sel('fd-sort', [['price', 'Lowest price'], ['high', 'Highest price'], ['size', 'Biggest home'], ['beds', 'Most bedrooms']], F.sort, 'Sort') + '</div>' +
      '<div class="fields">' + moneyField('fd-min', 'Min price', F.min, '', 'No min') + moneyField('fd-max', 'Max price', F.max, '', 'No max') +
        '<div class="field wide"><label for="fd-q">Search the descriptions</label><input id="fd-q" type="search" autocomplete="off" value="' + esc(F.q) + '" placeholder="Try pool, open floor plan, ADU, single story"></div></div>' +
      '<div class="chips" role="group" aria-label="Try a word"><span class="mono">Try a word</span><span id="fd-chips"></span></div>' +
      '<p class="note">The word search looks through the listing remarks and descriptions on this site. It is not a verified feature list, so a feature only shows up if the listing mentions it. Prices for new builds are starting prices. Builders do not publish a lot size for new-build communities or build-to-order plans, so those are not shown when a lot size is picked. Use the map search on the New builds page to search new construction by lot size.</p>' +
      '<p class="count" id="fd-count" aria-live="polite"></p>' +
      '<div class="ctas" style="margin:0"><button type="button" class="btn btn-line btn-sm" id="fd-reset">Reset all filters</button>' +
      '<button type="button" class="btn btn-line btn-sm" data-go="search">Search every home on the map instead</button></div>' +
      '<p style="margin-top:10px"><label class="check"><input type="checkbox" id="fd-portal"> Build me a custom portal for this search</label></p>' +
      '</div>' +
      '<div class="cards" id="fd-list" style="margin-top:22px"></div><div class="more-row"><button type="button" class="btn btn-line" id="fd-more" hidden></button></div>' +
      '</div></section>';
  },
  mount(root) {
    const F = S.finder;
    const st = { shown: 12, empty: '<div class="empty"><h3>No homes match all of these filters</h3><p>Try a higher price, a bigger size range, another city, or reset the filters below. Darien can also search the whole MLS for you.</p></div>' };
    const matchKind = (it) => {
      if (F.kind === 'assumable') return it.kind === 'assumable' || it.kind === 'placer';
      if (F.kind === 'newbuild') return it.kind === 'community' || it.kind === 'plan' || it.kind === 'stockton';
      if (F.kind === 'zerodown') {
        if (it.kind === 'stockton') return true;
        if (it.kind !== 'community' || !it.price) return false;
        const lim = (LIMITS[it.county] || {}).fha;
        return !!lim && it.price * 0.965 <= lim;
      }
      return true;
    };
    // Returns 'in', 'out', or the name of the missing field that kept this home out
    const match = (it, useQ) => {
      if (!matchKind(it)) return 'out';
      if (F.city && it.city !== F.city) return 'out';
      if (F.stories !== 'any') { if (it.stories == null) return 'stories'; if (String(it.stories) !== F.stories) return 'out'; }
      if (F.min) { if (it.price == null) return 'price'; if (it.price < F.min) return 'out'; }
      if (F.max) { if (it.price == null) return 'price'; if (it.price > F.max) return 'out'; }
      if (F.beds) { if (it.beds == null) return 'beds'; if (it.beds < F.beds) return 'out'; }
      if (F.baths) { if (it.baths == null) return 'baths'; if (it.baths < F.baths) return 'out'; }
      if (F.sqMin) { if (it.sqftMax == null) return 'sqft'; if (it.sqftMax < F.sqMin) return 'out'; }
      if (F.sqMax) { if (it.sqftMin == null) return 'sqft'; if (it.sqftMin > F.sqMax) return 'out'; }
      if (F.lot) { if (it.lotSqft == null) return 'lot'; if (it.lotSqft < F.lot) return 'out'; }
      if (useQ && F.q) { const words = F.q.toLowerCase().split(/\s+/); if (!words.every((w) => it.hay.includes(w))) return 'out'; }
      return 'in';
    };
    const draw = () => {
      const all = finderItems();
      const base = all.filter((it) => match(it, false) === 'in');
      const missing = {};
      const items = [];
      all.forEach((it) => {
        const m = match(it, true);
        if (m === 'in') items.push(it);
        else if (m !== 'out') missing[m] = (missing[m] || 0) + 1;
      });
      const sorts = {
        price: (a, b) => (a.price == null ? 1e12 : a.price) - (b.price == null ? 1e12 : b.price),
        high: (a, b) => (b.price || 0) - (a.price || 0),
        size: (a, b) => (b.sqftMax || 0) - (a.sqftMax || 0),
        beds: (a, b) => (b.beds || 0) - (a.beds || 0)
      };
      items.sort(sorts[F.sort] || sorts.price);
      const byLabel = {};
      items.forEach((it) => { byLabel[it.label] = (byLabel[it.label] || 0) + 1; });
      const breakdown = ['Assumable loan', 'New build', '$0 down'].map((l) => byLabel[l] ? plural(byLabel[l], l === 'New build' ? 'new build' : l === '$0 down' ? '$0-down home' : 'assumable home') : '').filter(Boolean).join(' · ');
      const missLabel = { lot: 'no lot size published', stories: 'no stories published', beds: 'no bedroom count published', baths: 'no bathroom count published', sqft: 'no home size published', price: 'no price published' };
      const missText = Object.keys(missing).map((k) => plural(missing[k], 'home') + ' with ' + missLabel[k]).join(', ');
      $('fd-count').innerHTML = plural(items.length, 'home or community', 'homes and communities') + ' match' +
        (breakdown ? ' <span class="sub">· ' + esc(breakdown) + '</span>' : '') +
        (missText ? ' <span class="sub">Not shown: ' + esc(missText) + '.</span>' : '') +
        (F.lot && missing.lot ? ' <span class="sub">New-build communities and build-to-order plans are not shown with a lot size picked, because builders do not publish a lot size for them.</span>' : '');
      const gz = $('fd-gz-count');
      if (gz) gz.textContent = plural(items.length, 'home or community', 'homes and communities') + ' match your answers';
      $('fd-chips').innerHTML = FINDER_KEYWORDS.map((kw) => {
        const n = base.filter((it) => kw.toLowerCase().split(/\s+/).every((w) => it.hay.includes(w))).length;
        return '<button type="button" class="chip" data-fdkw="' + esc(kw) + '" aria-pressed="' + (F.q === kw) + '">' + esc(kw) + ' (' + n + ')</button>';
      }).join('');
      root.querySelectorAll('[data-fdkw]').forEach((b) => b.addEventListener('click', () => {
        F.q = F.q === b.dataset.fdkw ? '' : b.dataset.fdkw;
        const q = $('fd-q'); if (q) q.value = F.q;
        save(); draw(); paintStep();
      }));
      pager('fd-list', 'fd-more', items, (it) => it.card(), st);
    };
    const change = () => { st.shown = 12; save(); draw(); };
    [['fd-kind', 'kind'], ['fd-stories', 'stories'], ['fd-city', 'city'], ['fd-sort', 'sort']].forEach(([id, k]) => $(id).addEventListener('change', () => { F[k] = $(id).value; change(); }));
    [['fd-beds', 'beds'], ['fd-baths', 'baths'], ['fd-sqmin', 'sqMin'], ['fd-sqmax', 'sqMax'], ['fd-lot', 'lot']].forEach(([id, k]) => $(id).addEventListener('change', () => { F[k] = parseFloat($(id).value) || 0; change(); }));
    bindMoney('fd-min', (v) => { F.min = isNaN(v) ? 0 : v; change(); });
    bindMoney('fd-max', (v) => { F.max = isNaN(v) ? 0 : v; change(); });
    $('fd-q').addEventListener('input', () => { F.q = $('fd-q').value.trim(); st.shown = 12; save(); draw(); paintStep(); });
    $('fd-portal').addEventListener('change', () => { if ($('fd-portal').checked) finderToPortal(); });
    $('fd-more').addEventListener('click', () => { st.shown += 12; draw(); });
    $('fd-reset').addEventListener('click', () => {
      const keepFull = F.showFull;
      Object.assign(F, FINDER_DEFAULTS, { showFull: keepFull });
      save(); render(CURRENT, true);
    });

    /* ===== Guided flow: one question at a time. It writes the same filters
       the full panel uses, so the answers, the full filters and the results
       always agree. Must-haves use the description word search, not a
       verified feature list, and step 4 says so. ===== */
    const GZ_KINDS = [['all', 'Any home', 'New builds, assumable loans, $0-down homes, everything'], ['newbuild', 'New build', 'Brand new homes and floor plans from builders'], ['assumable', 'Assumable loan', 'Take over a seller\'s low-rate FHA or VA loan'], ['zerodown', '$0 down', 'VA, USDA and FHA with CalHFA MyHome help']];
    const GZ_MUST = ['open floor plan', 'large backyard', 'pool', 'ADU', 'single story'];
    const GZ_MAX = [[0, 'Any price'], [500000, 'Up to $500k'], [700000, 'Up to $700k'], [1000000, 'Up to $1M'], [1500000, 'Up to $1.5M']];
    const GZ_STEPS = ['Home type', 'City or area', 'Rooms and price', 'Must-haves', 'Your homes'];
    const qWords = () => F.q.toLowerCase().split(/\s+/).filter(Boolean);
    const hasPhrase = (ph) => ph.toLowerCase().split(/\s+/).every((w) => qWords().includes(w));
    const togglePhrase = (ph) => {
      const pw = ph.toLowerCase().split(/\s+/);
      let words = qWords();
      words = pw.every((w) => words.includes(w)) ? words.filter((w) => !pw.includes(w)) : words.concat(pw);
      F.q = words.join(' ');
      const q = $('fd-q'); if (q) q.value = F.q;
      st.shown = 12; save(); draw(); paintStep();
    };
    const goStep = (n) => { F.gstep = Math.min(Math.max(n, 1), 5); save(); paintStep(); };
    const kindLabel = (k) => (GZ_KINDS.find(([v]) => v === k) || GZ_KINDS[0])[1];
    const gzChips = (list, cur, attr) => list.map(([v, t]) => '<button type="button" class="chip" ' + attr + '="' + esc(v) + '" aria-pressed="' + (String(v) === String(cur)) + '">' + esc(t) + '</button>').join('');
    const paintStep = () => {
      const stepEl = $('fd-step'), navEl = $('fd-nav'), stepsEl = $('fd-steps');
      if (!stepEl) return;
      stepsEl.innerHTML = GZ_STEPS.map((t, i) => '<span class="gz-step' + (i + 1 === F.gstep ? ' here' : (i + 1 < F.gstep ? ' done' : '')) + '">' + (i + 1) + '. ' + esc(t) + '</span>').join('');
      if (F.gstep === 1) {
        stepEl.innerHTML = '<p class="gz-q">What kind of home are you looking for?</p><p class="gz-help">Pick how you want to buy. Not sure yet? Pick Any home and narrow it down later.</p><div class="gz-opts">' +
          GZ_KINDS.map(([v, t, d]) => '<button type="button" class="gz-opt" data-gz-kind="' + v + '" aria-pressed="' + (F.kind === v) + '"><b>' + esc(t) + '</b><span>' + esc(d) + '</span></button>').join('') + '</div>';
        navEl.innerHTML = '<span class="sp"></span><button type="button" class="btn btn-line" data-gz-nav="2">Skip</button>';
      } else if (F.gstep === 2) {
        const cities = Array.from(new Set(finderItems().map((it) => it.city).filter(Boolean))).sort();
        const counts = {};
        finderItems().forEach((it) => { if (it.city) counts[it.city] = (counts[it.city] || 0) + 1; });
        const top = cities.slice().sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, 10);
        stepEl.innerHTML = '<p class="gz-q">Where do you want to live?</p><p class="gz-sub">Pick a city or area, or leave it open and see everywhere.</p>' +
          '<div class="chips" role="group" aria-label="City or area"><button type="button" class="chip" data-gz-city="" aria-pressed="' + (F.city === '') + '">Anywhere</button>' +
          top.map((c) => '<button type="button" class="chip" data-gz-city="' + esc(c) + '" aria-pressed="' + (F.city === c) + '">' + esc(c) + '</button>').join('') + '</div>' +
          '<div class="gz-group"><label class="lbl" for="gz-city-sel">Or pick any city or area on the site</label><select id="gz-city-sel"><option value="">Every city or area</option>' + cities.map((c) => '<option value="' + esc(c) + '"' + (F.city === c ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></div>';
        navEl.innerHTML = '<button type="button" class="btn btn-line" data-gz-nav="1">Back</button><span class="sp"></span><button type="button" class="btn btn-line" data-gz-nav="3">Skip</button>';
      } else if (F.gstep === 3) {
        stepEl.innerHTML = '<p class="gz-q">How much room do you need?</p><p class="gz-sub">Leave anything open if you are not sure yet. The exact price range is in Show all filters.</p>' +
          '<div class="gz-group"><span class="lbl">Bedrooms</span><div class="chips" role="group" aria-label="Bedrooms">' + gzChips(BED_OPTS, F.beds, 'data-gz-beds') + '</div></div>' +
          '<div class="gz-group"><span class="lbl">Bathrooms</span><div class="chips" role="group" aria-label="Bathrooms">' + gzChips(BATH_OPTS, F.baths, 'data-gz-baths') + '</div></div>' +
          '<div class="gz-group"><span class="lbl">Top price</span><div class="chips" role="group" aria-label="Top price">' + gzChips(GZ_MAX, F.max, 'data-gz-max') + '</div></div>';
        navEl.innerHTML = '<button type="button" class="btn btn-line" data-gz-nav="2">Back</button><span class="sp"></span><button type="button" class="btn btn-line" data-gz-nav="4">Skip</button><button type="button" class="btn btn-pa" data-gz-nav="4">Next</button>';
      } else if (F.gstep === 4) {
        stepEl.innerHTML = '<p class="gz-q">Any must-haves?</p><p class="gz-sub">These search the words in the listings, not a verified feature list, so a home only shows up if the listing mentions it. Pick as many as you like.</p>' +
          '<div class="chips" role="group" aria-label="Must-haves">' + GZ_MUST.map((m) => '<button type="button" class="chip" data-gz-must="' + esc(m) + '" aria-pressed="' + hasPhrase(m) + '">' + esc(m) + '</button>').join('') + '</div>' +
          '<p class="count" id="fd-gz-count" aria-live="polite"></p>';
        navEl.innerHTML = '<button type="button" class="btn btn-line" data-gz-nav="3">Back</button><span class="sp"></span><button type="button" class="btn btn-pa" data-gz-nav="5">See results</button>';
        draw();
      } else {
        const picked = GZ_MUST.filter((m) => hasPhrase(m));
        stepEl.innerHTML = '<p class="gz-q">Your homes are ready</p><p class="gz-help">This is what you picked. Tap See the homes to look through them, or Change answers to start again.</p><ul class="gz-sum">' +
          '<li><span>Home type</span><b>' + esc(kindLabel(F.kind)) + '</b></li>' +
          '<li><span>City or area</span><b>' + esc(F.city || 'Anywhere') + '</b></li>' +
          '<li><span>Rooms</span><b>' + esc((F.beds ? F.beds + '+ beds' : 'Any beds') + ' · ' + (F.baths ? F.baths + '+ baths' : 'Any baths')) + '</b></li>' +
          '<li><span>Top price</span><b>' + esc(F.max ? 'Up to ' + money(F.max) : 'Any price') + '</b></li>' +
          '<li><span>Must-haves</span><b>' + esc(picked.length ? picked.join(', ') : 'None') + '</b></li></ul>' +
          '<p class="count" id="fd-gz-count" aria-live="polite"></p>' +
          '<p style="margin-top:10px"><label class="check"><input type="checkbox" id="fd-gz-portal"> Build me a custom portal for this search</label></p>' +
          '<div class="gz-nav" style="margin-top:10px"><button type="button" class="btn btn-pa" data-gz-see>See the homes</button><button type="button" class="btn btn-line" data-gz-nav="1">Change answers</button></div>';
        navEl.innerHTML = '';
        draw();
      }
    };
    $('fd-startover').addEventListener('click', () => { Object.assign(F, FINDER_DEFAULTS); save(); render(CURRENT, true); });
    $('fd-toggle-full').addEventListener('click', () => { F.showFull = !F.showFull; save(); render(CURRENT, true); });
    $('fd-guide').addEventListener('click', (e) => {
      const k = e.target.closest('[data-gz-kind]');
      if (k) { F.kind = k.dataset.gzKind; st.shown = 12; save(); draw(); goStep(2); return; }
      const c = e.target.closest('[data-gz-city]');
      if (c) { F.city = c.dataset.gzCity; st.shown = 12; save(); draw(); goStep(3); return; }
      const b = e.target.closest('[data-gz-beds]');
      if (b) { F.beds = parseFloat(b.dataset.gzBeds) || 0; st.shown = 12; save(); draw(); paintStep(); return; }
      const ba = e.target.closest('[data-gz-baths]');
      if (ba) { F.baths = parseFloat(ba.dataset.gzBaths) || 0; st.shown = 12; save(); draw(); paintStep(); return; }
      const mx = e.target.closest('[data-gz-max]');
      if (mx) { F.max = parseFloat(mx.dataset.gzMax) || 0; st.shown = 12; save(); draw(); paintStep(); return; }
      const m = e.target.closest('[data-gz-must]');
      if (m) { togglePhrase(m.dataset.gzMust); return; }
      const n = e.target.closest('[data-gz-nav]');
      if (n) { goStep(+n.dataset.gzNav); return; }
      const s = e.target.closest('[data-gz-see]');
      if (s) { const l = $('fd-list'); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    $('fd-guide').addEventListener('change', (e) => {
      if (e.target.id === 'fd-gz-portal' && e.target.checked) { finderToPortal(); return; }
      if (e.target.id === 'gz-city-sel') { F.city = e.target.value; st.shown = 12; save(); draw(); goStep(3); }
    });
    draw();
    paintStep();
  }
});
