/* ===== Page registry ===== */
const PAGES = {};
const PLACE_PAGES = ['assumable', 'new-builds', 'zero-down', 'payment'];
function def(key, o) { PAGES[key] = Object.assign({ key }, o); }
const opt = (v, t, cur) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>';
const sel = (id, opts, cur, label) => '<div class="field"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(([v, t]) => opt(v, t, cur)).join('') + '</select></div>';
const moneyField = (id, label, val, hint, ph) => '<div class="field"><label for="' + id + '">' + esc(label) + '</label><span class="money"><i>$</i><input id="' + id + '" type="text" inputmode="numeric" value="' + (val ? esc(comma(val)) : '') + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '></span>' + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</div>';
const pctField = (id, label, val, hint) => '<div class="field"><label for="' + id + '">' + esc(label) + '</label><span class="money suf"><input id="' + id + '" type="text" inputmode="decimal" value="' + esc(val) + '"><i>%</i></span>' + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</div>';
const PRICE_OPTS = [[0, 'Any price'], [400000, 'Up to $400k'], [500000, 'Up to $500k'], [600000, 'Up to $600k'], [700000, 'Up to $700k'], [800000, 'Up to $800k'], [1000000, 'Up to $1M']];
const BED_OPTS = [[0, 'Any'], [2, '2+'], [3, '3+'], [4, '4+'], [5, '5+']];
const BATH_OPTS = [[0, 'Any'], [2, '2+'], [2.5, '2.5+'], [3, '3+']];
const SIZE_OPTS = [[0, 'Any'], [1200, '1,200+ sq ft'], [1500, '1,500+ sq ft'], [1800, '1,800+ sq ft'], [2000, '2,000+ sq ft'], [2500, '2,500+ sq ft'], [3000, '3,000+ sq ft']];
function countyChips(withAll, more) {
  const cur = placeCounty();
  const items = (withAll ? [['', 'All areas']] : []).concat(MAIN_COUNTIES.concat(more || []).map((c) => [c, c + ' County']));
  return '<div class="chips" role="group" aria-label="Area"><span class="mono">Area</span>' + items.map(([v, t]) => '<button type="button" class="chip" data-county="' + esc(v) + '" aria-pressed="' + ((v || null) === (cur || null) && !(S.place && S.place.k === 'town' && v === '') ? 'true' : 'false') + '">' + esc(t) + '</button>').join('') +
    (S.place && S.place.k === 'town' ? '<span class="place-pill">' + esc(S.place.n) + '<button type="button" data-clear-place aria-label="Show all areas">×</button></span>' : '') + '</div>';
}
function bindCounty(root, after) {
  root.querySelectorAll('[data-county]').forEach((b) => b.addEventListener('click', () => {
    setPlace(b.dataset.county ? { k: 'county', n: b.dataset.county } : null);
    after();
  }));
}
function bindMoney(id, fn) {
  const el = $(id);
  if (!el) return;
  el.addEventListener('input', () => fn(parseMoney(el.value)));
  el.addEventListener('blur', () => { const v = parseMoney(el.value); if (v > 0) el.value = comma(v); });
}
function pager(listId, moreId, items, cardFn, state) {
  const list = $(listId), more = $(moreId);
  if (!items.length) { list.innerHTML = state.empty; more.hidden = true; return; }
  list.innerHTML = items.slice(0, state.shown).map(cardFn).join('');
  const left = items.length - Math.min(state.shown, items.length);
  more.hidden = left <= 0;
  more.textContent = 'Show ' + Math.min(12, left) + ' more (' + left + ' left)';
}

/* ===== Home ===== */
const TILE_TEXT = {
  guide: 'New to buying? Every step from pre-approval to keys, plus every real estate word explained.',
  assumable: 'Take over a seller\'s low-rate FHA or VA loan. Learn how, then browse homes.',
  'zero-down': 'VA, FHA with California\'s MyHome loan, USDA and builder help in every county.',
  payment: 'Tell us your monthly budget and see the prices and homes that fit it.',
  'new-builds': 'Over 450 new-home communities in every city MetroList covers, with builder deals and move-in ready homes.',
  search: 'Every home for sale on a map, with filters for pool, single story, acreage and more.',
  refinance: 'See your new payment, break-even point and the refinance options that fit your loan.',
  adu: 'Can a home add a backyard cottage or in-law suite? Your city\'s rules, free plans and homes with room.',
  build: 'Estimate what it costs to build on your own lot, from land to move-in.',
  cart: 'Homes you put in your cart, like shopping. Ask Darien for more info on all of them at once.',
  about: 'Who Darien is, how he helps buyers, and how to reach him.'
};
const POPULAR = ['Loomis', 'Roseville', 'Rocklin', 'Lincoln', 'Auburn', 'Sacramento', 'Elk Grove', 'Folsom', 'Stockton', 'Lodi', 'Manteca', 'Lathrop', 'Tracy', 'Modesto', 'Salida', 'Turlock'];
def('home', {
  nav: 'Home', scene: 'home', kicker: 'Darien Phillips · REALTOR®',
  title: 'Looking for the right home?',
  title2: 'You\'re in the right place.',
  sub: 'Every home for sale in Placer, Sacramento, San Joaquin and Stanislaus, with real monthly costs and local help.',
  heroSearch: true,
  ctas: () => '<button type="button" class="btn btn-pa" data-go="search">Search every home</button><a class="btn btn-ghost" href="sms:+12098826469">Text Darien</a><a class="btn btn-ghost" href="tel:+12098826469">Call Darien</a><a class="btn btn-ghost" href="mailto:darienphillips45@gmail.com">Email Darien</a>',
  html() {
    const tiles = Object.keys(TILE_TEXT).map((k) => '<button type="button" class="tile" data-go="' + k + '" style="--tc:' + PAGES[k].color + '">' + thumbBox(k) + '<div class="body"><b>' + esc(PAGES[k].tileTitle || PAGES[k].nav) + '</b><span>' + esc(TILE_TEXT[k]) + '</span></div></button>').join('');
    return '<section class="blk g-start"><div class="wrap"><button type="button" class="panel g-banner" data-go="guide"><span class="g-banner-k">New to buying a home?</span><b>Start with the beginner\'s guide</b><span>Every step from pre-qualification to closing, what EMD, escrow and closing costs mean, and a chart of the whole process.</span><span class="g-banner-go">Read the guide →</span></button></div></section>' + justListedHtml() + '<section class="blk"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Start here</p><h2>What are you looking for?</h2></div></div><div class="tiles">' + tiles + '</div></div></section>' +
      sellerHtml() + '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Popular places</h2><p>Pick a town to see assumable homes, new builds, $0-down options and homes by payment there.</p></div></div>' +
      '<div class="places">' + POPULAR.map((n) => '<button type="button" class="chip" data-place="' + esc(n) + '">' + esc(n) + '</button>').join('') + '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="statrow">' +
        '<div class="panel"><div class="v num">' + DATA.assumables.length + '</div><div class="k">Homes with assumable loans in Darien\'s MLS search</div></div>' +
        '<div class="panel"><div class="v num">' + DATA.communities.length + '</div><div class="k">New-home communities across four counties</div></div>' +
        '<div class="panel"><div class="v num">$0</div><div class="k">Down payment possible with VA, USDA or FHA plus CalHFA MyHome</div></div>' +
        '<div class="panel"><div class="v num">' + RATES.conv + '%</div><div class="k">Average 30-year rate on Oct 29, 2026. Assumable loans are often half that.</div></div>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>How Darien helps</h2></div></div><div class="why">' +
        '<div class="panel"><b>Your own MLS search</b><p>Darien sets up a custom MLS page with every home in your range. New matches come by email each day, and you can save or pass on each one.</p></div>' +
        '<div class="panel"><b>Low-rate and $0-down know-how</b><p>He finds homes with assumable FHA and VA loans and lines up $0-down options, then walks you through the lender\'s approval.</p></div>' +
        '<div class="panel"><b>New builds without the runaround</b><p>Builders usually need your agent at the first visit. Text Darien first and he\'ll register you and compare builder offers.</p></div>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="panel accent bar"><div><b>Get homes by email</b><p class="note">Tell Darien what you want and get new matches every day, or ask for your own MLS page.</p></div><button type="button" class="btn btn-pa" data-go="alerts">Sign up</button></div></div></section>';
  }
});

// Darien's newest homes from his Instagram posts (the Listings tab), newest first
function justListedHtml() {
  if (typeof PROPS === 'undefined') return '';
  const list = PROPS.filter((p) => p.kind === 'listing').slice(0, 6);
  if (!list.length) return LISTINGS === 'loading' ? '<section class="blk" id="just-listed"></section>' : '';
  return '<section class="blk" id="just-listed"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Just posted</p><h2>New from Darien\'s Instagram</h2><p>The homes Darien toured and posted most recently. Tap one to see it.</p></div></div>' +
    '<div class="cards">' + list.map((p) => teaserCard(p)).join('') + '</div></div></section>';
}

/* ===== Assumable homes ===== */
def('assumable', {
  nav: 'Assumable', scene: 'assumable', kicker: 'Assumable loans', tileTitle: 'Assumable homes',
  title: 'Take over a seller\'s low-rate loan',
  sub: 'Some FHA, VA and USDA loans can move to the next buyer, rate and all. Here is how to find them, and the homes that have them now.',
  html() {
    const A = sub('assum', { type: 'all', max: 0, beds: 0, baths: 0, sqft: 0, sort: 'rate', text: '' });
    return '<section class="blk"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">How it works</p><h2>How to find an assumable home</h2></div></div>' +
      '<ol class="steps">' +
        '<li><b>Look for FHA, VA or USDA loans</b><span>Most conventional loans can\'t be taken over. FHA, VA and USDA loans usually can, with the lender\'s approval.</span></li>' +
        '<li><b>Search listings for "assumable"</b><span>Agents mention it in the listing remarks. This page, Roots and Darien\'s MLS search pull those homes for you.</span></li>' +
        '<li><b>Get the loan details</b><span>Ask for the rate, balance, payment and years left. The listing agent can get them from the seller\'s statement.</span></li>' +
        '<li><b>Cover the gap</b><span>Pay the difference between the price and the loan balance in cash, or with a second loan on top.</span></li>' +
        '<li><b>Apply with the seller\'s lender</b><span>The loan servicer approves you, so closing often takes 45 to 90 days.</span></li>' +
      '</ol>' +
      '<div class="scroll" style="margin-top:14px"><table class="tbl"><thead><tr><th>Loan</th><th>Who can take it over</th><th>Good to know</th></tr></thead><tbody>' +
        '<tr><td><b>FHA</b></td><td>Buyers who qualify and will live in the home</td><td>The servicer charges a processing fee. FHA mortgage insurance stays with the loan.</td></tr>' +
        '<tr><td><b>VA</b></td><td>Anyone who qualifies, veteran or not</td><td>VA charges a 0.5% funding fee on an assumption. The seller\'s VA entitlement stays with the loan unless a veteran buyer swaps in their own.</td></tr>' +
        '<tr><td><b>USDA</b></td><td>Buyers who meet USDA income limits and will live in the home</td><td>The home must be in a USDA-eligible area.</td></tr>' +
      '</tbody></table></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Homes now</p><h2>Homes with assumable loans</h2><p>From Darien\'s MLS search of listings that mention an assumable loan, checked ' + esc(DATA.assumablesChecked) + '. Ask for the full loan details on any of them.</p></div></div>' +
      '<div class="panel" style="display:grid;gap:12px">' + countyChips(true) +
        '<div class="chips" role="group" aria-label="Loan type"><span class="mono">Loan</span>' + [['all', 'All'], ['FHA', 'FHA'], ['VA', 'VA'], ['', 'Not listed']].map(([v, t]) => '<button type="button" class="chip" data-type="' + v + '" aria-pressed="' + (A.type === v) + '">' + t + '</button>').join('') + '</div>' +
        '<div class="fields">' + sel('as-max', PRICE_OPTS, A.max, 'Price') + sel('as-beds', BED_OPTS, A.beds, 'Bedrooms') + sel('as-baths', BATH_OPTS, A.baths, 'Bathrooms') + sel('as-sqft', SIZE_OPTS, A.sqft, 'Home size') +
          sel('as-sort', [['rate', 'Lowest rate'], ['price', 'Lowest price'], ['gap', 'Least cash to take over'], ['new', 'Newest listing']], A.sort, 'Sort') + '</div>' +
        (A.text ? '<div><span class="place-pill">Matching "' + esc(A.text) + '"<button type="button" id="as-clear" aria-label="Clear the search">×</button></span></div>' : '') +
        '<p class="count" id="as-count" aria-live="polite"></p></div>' +
      '<div class="cards" id="as-list"></div><div class="more-row"><button type="button" class="btn btn-line" id="as-more" hidden></button></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Search live assumable listings</h2><p>These open Roots, which estimates each seller\'s rate and balance from public records, and include homes listed after Darien\'s last MLS check.</p></div></div><div class="tiles" id="as-live"></div></div></section>';
  },
  mount(root) {
    const A = S.assum;
    const st = { shown: 12, empty: '<div class="empty"><h3>No homes match these filters</h3><p>Try another area, a higher price or fewer bedrooms. Darien\'s MLS search finds new assumable listings every day.</p></div>' };
    const draw = () => {
      root.querySelectorAll('[data-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === A.type)));
      const q = A.text.toLowerCase();
      const items = DATA.assumables.filter((h) => inPlace(h) &&
        (A.type === 'all' || h.type === A.type) && (!A.max || h.price <= A.max) && (!A.beds || (h.beds || 0) >= A.beds) &&
        (!A.baths || (h.baths || 0) >= A.baths) && (!A.sqft || (h.sqft || 0) >= A.sqft) &&
        (!q || (h.street + ' ' + h.city + ' ' + (h.zip || '')).toLowerCase().includes(q)));
      const sorts = {
        rate: (a, b) => (a.rate || 99) - (b.rate || 99) || a.price - b.price,
        price: (a, b) => a.price - b.price,
        gap: (a, b) => (a.gap == null ? 1e9 : a.gap) - (b.gap == null ? 1e9 : b.gap) || a.price - b.price,
        new: (a, b) => (a.dom || 999) - (b.dom || 999)
      };
      items.sort(sorts[A.sort] || sorts.rate);
      $('as-count').innerHTML = plural(items.length, 'home') + ' <span class="sub">in ' + esc(placeLabel(S.place)) + ' · ' + items.filter((h) => h.rate).length + ' with the rate listed</span>';
      pager('as-list', 'as-more', items, assumableCard, st);
      const towns = S.place && S.place.k === 'town' ? [S.place.n] : TOWNS.filter((t) => !S.place || t.c === S.place.n).filter((t) => MAIN_COUNTIES.includes(t.c)).slice(0, 8).map((t) => t.n);
      $('as-live').innerHTML = towns.map((n) => '<a class="tile" style="--tc:' + PAGES.assumable.color + ';grid-template-rows:auto" target="_blank" rel="noopener" href="' + esc(track(rootsFor(n), { h: 'Assumable search: ' + n, s: 'Roots' })) + '"><div class="body"><b>' + esc(n) + ' assumable homes</b><span>Live on Roots ↗</span></div></a>').join('');
    };
    const change = () => { st.shown = 12; save(); draw(); };
    bindCounty(root, () => { render(CURRENT, true); });
    root.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => { A.type = b.dataset.type; change(); }));
    [['as-max', 'max'], ['as-beds', 'beds'], ['as-baths', 'baths'], ['as-sqft', 'sqft']].forEach(([id, k]) => $(id).addEventListener('change', () => { A[k] = parseFloat($(id).value) || 0; change(); }));
    $('as-sort').addEventListener('change', () => { A.sort = $('as-sort').value; change(); });
    if ($('as-clear')) $('as-clear').addEventListener('click', () => { A.text = ''; save(); render(CURRENT, true); });
    $('as-more').addEventListener('click', () => { st.shown += 12; draw(); });
    draw();
  }
});
function assumableCard(h) {
  const title = h.street + ', ' + h.city;
  const loan = (h.type ? h.type + ' ' : '') + (h.rate ? h.rate + '%' : h.rateText || 'Rate: ask');
  const pillCls = h.type === 'VA' ? 'va' : h.type === 'FHA' ? 'fha' : 'pa';
  const facts = [h.beds != null ? h.beds + ' bd' : '', h.baths != null ? h.baths + ' ba' : '', h.sqft ? comma(h.sqft) + ' sq ft' : '', h.acres ? (h.acres >= 0.5 ? h.acres + ' acres' : comma(h.acres * 43560) + ' sq ft lot') : '', h.year ? 'Built ' + h.year : ''].filter(Boolean).join(' · ');
  const tags = (h.tags || []).map(([k, t]) => '<span class="tag ' + (k === 'ok' ? 'ok' : k === 'credit' ? 'pa' : '') + '">' + esc(t) + '</span>').join('');
  const info = { h: title, p: money(h.price), b: facts, l: loan + ' assumable', r: h.mls ? 'MLS# ' + h.mls : '', city: h.city,
    z: zillowFor(h.street, h.city, h.zip), m: mapFor(h.street.replace(/#.*$/, '') + ', ' + h.city + ', CA ' + (h.zip || '')), x: rootsFor(h.city), xs: 'Assumable homes nearby on Roots' };
  return '<article class="card"><div class="head"><span class="pill ' + pillCls + '">' + esc(loan) + '</span>' + heart('a:' + h.id, title, money(h.price)) + '</div>' +
    '<div><h3>' + esc(h.street) + '</h3><div class="sub">' + esc(h.city + ' ' + (h.zip || '') + ' · ' + (h.county || '') + ' County') + '</div></div>' +
    '<div class="price num">' + money(h.price) + '</div><div class="facts">' + esc(facts) + '</div>' +
    '<div class="stats3"><div><span>Rate</span><b>' + esc(h.rate ? h.rate + '%' : h.rateText || 'Ask') + '</b><small>' + esc(h.type || 'Loan type not listed') + '</small></div>' +
      '<div><span>Loan balance</span><b>' + (h.balance ? short(h.balance) : 'Ask') + '</b><small>' + (h.matures ? 'Paid off ' + esc(h.matures) : h.balance ? 'Per the listing' : 'Not in the listing') + '</small></div>' +
      '<div><span>Cash to take over</span><b>' + (h.gap != null ? money(h.gap) : 'Ask') + '</b><small>' + (h.gap != null ? 'Price minus balance' : 'Price minus balance') + '</small></div></div>' +
    (tags ? '<div class="tags">' + tags + '</div>' : '') +
    '<div class="actions">' + details(info) + simBtn(slug(h.street)) + cartBtn('a:' + h.id, title, money(h.price)) + askBtn('a:' + h.id, title, money(h.price)) + '</div>' +
    '<div class="src">' + (h.src === 'pick' ? 'Darien\'s pick' : 'MLS# ' + esc(h.mls || '')) + ' · ' + (h.dom != null ? plural(h.dom, 'day') + ' on market · ' : '') + 'checked ' + esc(DATA.assumablesChecked) + '</div></article>';
}

/* ===== Placer and Loomis under $2,500 ===== */
const PLACER = DATA.placer.homes;
const PL_DEFAULTS = { budget: 2500, cash: null, r2: 9.5, town: 'all', band: 'all', sort: 'pay' };
function placerFigure(h, P) {
  const ti = Math.max(h.price * 0.0145 / 12, h.rootsTI || 0);
  const mip = h.type === 'FHA' ? h.balance * 0.0055 / 12 : 0;
  const gap = h.price - h.balance;
  let cash = gap, second = 0, p2 = 0;
  if (P.cash != null && P.cash < gap) { cash = Math.max(P.cash, 0); second = gap - cash; p2 = pmt(second, P.r2, 360); }
  return { ti, mip, gap, cash, second, p2, total: h.pi + ti + mip + (h.hoa || 0) + p2 };
}
def('placer', {
  nav: 'Placer under $2,500', scene: 'placer', kicker: 'Loomis · Rocklin · Roseville · Lincoln', tileTitle: 'Placer under $2,500',
  title: 'Placer homes around $2,500 a month',
  sub: 'Homes in Loomis and Placer County where you can take over the seller\'s low-rate FHA or VA loan. Change the budget to see what fits you.',
  html() {
    const P = sub('pl', PL_DEFAULTS);
    const towns = ['all'].concat(Array.from(new Set(PLACER.map((h) => h.city))).sort());
    return '<section class="blk"><div class="wrap"><div class="panel accent" style="display:grid;gap:12px">' +
      '<div class="fields">' + moneyField('pl-budget', 'Monthly budget', P.budget, 'Loan, taxes, insurance, mortgage insurance and HOA') +
        moneyField('pl-cash', 'Cash you can bring', P.cash, 'Blank means you pay the whole gap in cash', 'Optional') +
        pctField('pl-r2', '2nd loan rate', P.r2, 'Used when your cash doesn\'t cover the gap') +
        sel('pl-sort', [['pay', 'Lowest monthly payment'], ['price', 'Lowest price'], ['cash', 'Least cash needed'], ['rate', 'Lowest rate']], P.sort, 'Sort') + '</div>' +
      '<div class="chips" role="group" aria-label="Town"><span class="mono">Town</span>' + towns.map((t) => '<button type="button" class="chip" data-pltown="' + esc(t) + '" aria-pressed="' + (P.town === t) + '">' + esc(t === 'all' ? 'All Placer' : t) + '<span class="n"></span></button>').join('') + '</div>' +
      '<p class="count" id="pl-count" aria-live="polite"></p></div>' +
      '<div class="shead" style="margin-top:22px"><div><h2 id="pl-fit-h">Homes that fit your budget</h2></div></div><div class="cards" id="pl-fit"></div>' +
      '<div id="pl-over-wrap"><div class="shead" style="margin-top:22px"><div><h2>Just over your budget</h2><p>Worth a look if you can stretch or bring more cash.</p></div></div><div class="cards" id="pl-over"></div></div>' +
      '<div class="shead" style="margin-top:26px"><div><h2>Search for more in Placer</h2><p>Live on Roots, filtered to your monthly budget. Roots uses the seller\'s current tax bill, so the real payment can run a little higher.</p></div></div><div class="tiles" id="pl-live"></div>' +
      '<p class="src" style="margin-top:14px">Homes checked ' + esc(DATA.placer.checked) + ' from MetroList listings shown on Roots.homes. Rates and balances are Roots estimates from public records unless marked verified. Payments add property tax at 1.1% of the price, insurance at 0.35% a year and FHA mortgage insurance at 0.55% a year.</p></div></section>';
  },
  mount(root) {
    const P = S.pl;
    const draw = () => {
      const all = PLACER.map((h) => ({ h, f: placerFigure(h, P) }));
      root.querySelectorAll('[data-pltown]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.pltown === P.town));
        b.querySelector('.n').textContent = all.filter((x) => (b.dataset.pltown === 'all' || x.h.city === b.dataset.pltown) && x.f.total <= P.budget).length;
      });
      const sorts = { pay: (a, b) => a.f.total - b.f.total, price: (a, b) => a.h.price - b.h.price, cash: (a, b) => a.f.cash - b.f.cash, rate: (a, b) => a.h.rate - b.h.rate };
      const scoped = all.filter((x) => P.town === 'all' || x.h.city === P.town).sort(sorts[P.sort] || sorts.pay);
      const fit = scoped.filter((x) => x.f.total <= P.budget), over = scoped.filter((x) => x.f.total > P.budget);
      $('pl-count').innerHTML = plural(fit.length, 'home') + ' fit ' + money(P.budget) + ' a month <span class="sub">in ' + esc(P.town === 'all' ? 'Placer County' : P.town) + (P.cash != null ? ' with ' + money(P.cash) + ' cash' : ' paying the gap in cash') + '</span>';
      $('pl-fit-h').textContent = 'Homes that fit ' + money(P.budget) + ' a month';
      $('pl-fit').innerHTML = fit.length ? fit.map((x) => placerCard(x.h, x.f, P)).join('') : '<div class="empty"><h3>No homes here fit ' + esc(money(P.budget)) + ' right now</h3><p>Try a higher budget, more cash, or All Placer.</p></div>';
      $('pl-over').innerHTML = over.map((x) => placerCard(x.h, x.f, P)).join('');
      $('pl-over-wrap').hidden = !over.length;
      const places = [['West Placer', 'Placer County', 38.84, -121.2, 10.5], ['Loomis', 'Loomis', 38.8213, -121.193, 13], ['Rocklin', 'Rocklin', 38.7907, -121.2358, 12], ['Roseville', 'Roseville', 38.7521, -121.288, 11.5], ['Lincoln', 'Lincoln', 38.8916, -121.293, 12], ['Granite Bay', 'Granite Bay', 38.7632, -121.1638, 12.5], ['Auburn', 'Auburn', 38.8966, -121.0769, 12], ['Colfax and foothills', 'Colfax', 39.05, -120.98, 11.5]];
      $('pl-live').innerHTML = places.map(([n, place, lat, lng, z]) => {
        const url = 'https://www.roots.homes/listings?' + new URLSearchParams({ lat, lng, zoom: z, place: place + ', CA', isAssumable: 'true', view: 'list', monthlyPaymentMax: Math.round(P.budget) }).toString();
        return '<a class="tile" style="--tc:' + PAGES.placer.color + ';grid-template-rows:auto" target="_blank" rel="noopener" href="' + esc(track(url, { h: n + ' under ' + money(P.budget) + '/mo', s: 'Roots' })) + '"><div class="body"><b>' + esc(n) + ' under ' + money(P.budget) + '/mo</b><span>Live on Roots ↗</span></div></a>';
      }).join('');
    };
    bindMoney('pl-budget', (v) => { if (v > 0) { P.budget = v; save(); draw(); } });
    bindMoney('pl-cash', (v) => { P.cash = isNaN(v) ? null : Math.max(v, 0); save(); draw(); });
    $('pl-r2').addEventListener('input', () => { const v = parseNum($('pl-r2').value); if (v >= 0) { P.r2 = v; save(); draw(); } });
    $('pl-sort').addEventListener('change', () => { P.sort = $('pl-sort').value; save(); draw(); });
    root.querySelectorAll('[data-pltown]').forEach((b) => b.addEventListener('click', () => { P.town = b.dataset.pltown; save(); draw(); }));
    draw();
  }
});
function placerCard(h, f, P) {
  const fits = f.total <= P.budget;
  const title = h.street + ', ' + h.city;
  const facts = [h.beds + ' bd', h.baths + ' ba', comma(h.sqft) + ' sq ft', h.kind === 'Single family' ? (h.lot >= 21780 ? (Math.round(h.lot / 43560 * 10) / 10) + ' acres' : comma(h.lot) + ' sq ft lot') : h.kind, 'Built ' + h.year].join(' · ');
  const tags = [];
  if (h.dom <= 7) tags.push('<span class="tag pa">New this week</span>');
  if (h.verified) tags.push('<span class="tag ok">Rate verified</span>');
  if (h.nonvet) tags.push('<span class="tag va">Non-veterans can assume</span>');
  if (h.note) tags.push('<span class="tag warn">' + esc(h.note) + '</span>');
  (h.feats || []).slice(0, 3).forEach((t) => tags.push('<span class="tag">' + esc(t) + '</span>'));
  const info = { h: title, p: money(h.price), b: facts, l: h.type + ' ' + h.rate + '% assumable', r: 'MLS# ' + h.id, city: h.city,
    z: zillowFor(h.street, h.city, h.zip), x: h.roots, xs: 'Loan details on Roots', m: mapFor(h.street.replace(/#.*$/, '') + ', ' + h.city + ', CA ' + h.zip) };
  const extra = [f.p2 ? ['2nd loan (' + short(f.second) + ' at ' + P.r2 + '%)', f.p2] : null];
  const base = { pi: h.pi, mi: f.mip, tax: f.ti * (0.011 / 0.0145), ins: f.ti * (0.0035 / 0.0145), hoa: h.hoa || 0, special: 0, total: h.pi + f.mip + f.ti + (h.hoa || 0) };
  return '<article class="card"' + (fits ? '' : ' style="border-style:dashed"') + '><div class="head"><span class="pill ' + (h.type === 'VA' ? 'va' : 'fha') + '">' + esc(h.type + ' ' + h.rate + '%') + '</span>' + heart('p:' + h.id, title, money(h.price)) + '</div>' +
    '<div><h3>' + esc(h.street) + '</h3><div class="sub">' + esc(h.city + ' ' + h.zip) + '</div></div><div class="price num">' + money(h.price) + '</div><div class="facts">' + esc(facts) + '</div>' +
    '<div class="stats3"><div><span>Est. monthly</span><b class="' + (fits ? 'fit' : 'over') + '">' + money(f.total) + '</b><small>' + (fits ? money(P.budget - f.total) + ' under budget' : money(f.total - P.budget) + ' over') + '</small></div>' +
      '<div><span>Cash needed</span><b>' + money(f.cash) + '</b><small>' + (f.second ? '+ ' + short(f.second) + ' 2nd loan' : 'Price minus loan') + '</small></div>' +
      '<div><span>Seller\'s loan</span><b>' + short(h.balance) + '</b><small>' + h.years + ' years left</small></div></div>' +
    (tags.length ? '<div class="tags">' + tags.join('') + '</div>' : '') +
    '<details class="more"><summary>Monthly payment breakdown</summary>' + breakdown(base, extra) + '</details>' +
    '<div class="actions">' + details(info) + simBtn(slug(h.street)) + cartBtn('p:' + h.id, title, money(h.price)) + askBtn('p:' + h.id, title, money(h.price)) + '</div>' +
    '<div class="src">Listing by ' + esc(h.office) + ' · MLS# ' + esc(h.id) + ' · ' + plural(h.dom, 'day') + ' on market</div></article>';
}

/* ===== Shop by monthly payment ===== */
def('payment', {
  nav: 'By payment', scene: 'payment', kicker: 'Shop by monthly payment', tileTitle: 'Shop by payment',
  title: 'Start with the payment, then find the home',
  sub: 'Enter what you want to pay each month. See the price you can shop up to with each loan, and the homes in that range.',
  html() {
    const Y = sub('pay', { budget: 3000, cash: 20000, loan: 'fha', rate: '', county: 'Sacramento', hoa: 0, price: 450000 });
    if (placeCounty() && MAIN_COUNTIES.includes(placeCounty())) Y.county = placeCounty();
    return '<section class="blk"><div class="wrap"><div class="calc">' +
      '<div class="panel accent" style="display:grid;gap:12px"><div class="fields">' +
        moneyField('py-budget', 'Monthly budget', Y.budget, 'Everything: loan, tax, insurance, HOA') +
        moneyField('py-cash', 'Cash for the down payment', Y.cash, 'Keep closing costs aside, often 2% to 3%') +
        sel('py-loan', Object.keys(LOANS).map((k) => [k, LOANS[k].label + (k === 'va' || k === 'usda' || k === 'myhome' ? ' ($0 down)' : k === 'fha' ? ' (3.5% down)' : ' (3% down)')]), Y.loan, 'Loan') +
        pctField('py-rate', 'Interest rate', Y.rate || LOANS[Y.loan].rate, 'Recent average for this loan') +
        sel('py-county', MAIN_COUNTIES.map((c) => [c, c + ' County']), Y.county, 'County') +
        moneyField('py-hoa', 'HOA per month', Y.hoa, 'Leave 0 if none') +
      '</div><p class="note" id="py-loan-note"></p></div>' +
      '<div class="result" aria-live="polite"><span class="lbl">You can shop up to</span><div class="big num" id="py-max">$0</div><div id="py-break"></div><p class="note" id="py-note"></p></div>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2 id="py-homes-h">Homes in your range</h2><p>New builds, assumable homes and the Placer and Stockton picks that fit the price you can shop up to.</p></div></div><div id="py-groups"></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Check a specific price</h2></div></div><div class="calc"><div class="panel"><div class="fields">' + moneyField('py-price', 'Home price', Y.price) + '</div></div><div class="result"><span class="lbl">Monthly payment</span><div class="big num" id="py-p-total">$0</div><div id="py-p-break"></div></div></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Search every home in your range</h2><p>Opens Zillow with your top price set, or ask Darien for your own MLS page with every match.</p></div></div><div class="tiles" id="py-live"></div></div></section>';
  },
  mount() {
    const Y = S.pay;
    const opts = () => ({ loan: Y.loan, cash: Y.loan === 'va' || Y.loan === 'usda' || Y.loan === 'myhome' ? 0 : Y.cash, rate: parseNum(Y.rate) || LOANS[Y.loan].rate, county: Y.county, hoa: Y.hoa || 0 });
    const draw = () => {
      const o = opts();
      const max = maxPrice(Y.budget, o);
      $('py-max').textContent = max ? money(max) : 'Raise the budget or cash';
      $('py-loan-note').textContent = Y.loan === 'myhome' ? 'For first-time buyers with income under $' + comma(LIMITS[Y.county].calhfa) + ' in ' + Y.county + ' County. MyHome covers the 3.5% down payment.' :
        Y.loan === 'usda' ? 'USDA is only for eligible rural areas, not most city addresses.' : Y.loan === 'va' ? 'For veterans and service members. Includes the 2.15% funding fee, added to the loan.' :
        Y.loan === 'fha' ? 'FHA loans go up to ' + money(LIMITS[Y.county].fha) + ' in ' + Y.county + ' County.' : 'Mortgage insurance applies with less than 20% down.';
      if (max) {
        const f = payment(Object.assign({}, o, { price: max }));
        $('py-break').innerHTML = breakdown(f);
        $('py-note').textContent = 'Search roughly ' + short(max * 0.85) + ' to ' + short(max) + '. ' + (f.note || (cashNeeded(max, Y.loan) > 0 ? 'Down payment: ' + money(Math.max(f.down, cashNeeded(max, Y.loan))) + '.' : 'Down payment: $0.'));
      } else { $('py-break').innerHTML = ''; $('py-note').textContent = 'At this budget, add more cash or pick a loan with a lower down payment.'; }
      $('py-homes-h').textContent = max ? 'Homes up to ' + money(max) + ' in ' + Y.county + ' County' : 'Homes in your range';
      const groups = [];
      const nb = DATA.communities.filter((c) => c.county === Y.county && c.min && c.min <= max).sort((a, b) => b.min - a.min);
      groups.push(['New-build communities', nb.length, nb.slice(0, 6).map((c) => communityCard(c, { loan: Y.loan, rate: o.rate, cash: o.cash })).join(''), () => { setPlace({ k: 'county', n: Y.county }); sub('nb', {}).max = max; S.nb.max = max; }, 'new-builds']);
      const as = DATA.assumables.filter((h) => h.county === Y.county && h.price <= max).sort((a, b) => (a.rate || 99) - (b.rate || 99));
      groups.push(['Assumable homes', as.length, as.slice(0, 6).map(assumableCard).join(''), () => { setPlace({ k: 'county', n: Y.county }); sub('assum', {}); S.assum.max = 0; }, 'assumable']);
      if (Y.county === 'Placer') {
        const P = sub('pl', PL_DEFAULTS);
        const pl = PLACER.map((h) => ({ h, f: placerFigure(h, { cash: Y.cash, r2: P.r2 }) })).filter((x) => x.f.total <= Y.budget);
        groups.push(['Placer homes with assumable loans that fit ' + money(Y.budget) + '/mo', pl.length, pl.slice(0, 6).map((x) => placerCard(x.h, x.f, { budget: Y.budget, r2: P.r2 })).join(''), () => { P.budget = Y.budget; P.cash = Y.cash; }, 'assumable']);
      }
      if (Y.county === 'San Joaquin') {
        const sk = STK.homes.filter((h) => h.price <= max);
        groups.push(['Stockton new homes and plans', sk.length, '', () => { const K = sub('stk', {}); K.price = String(Math.floor(max / 50000) * 50000 || 'any'); }, 'new-builds']);
      }
      $('py-groups').innerHTML = groups.map(([t, n, cards, , page], i) => '<div class="panel" style="margin-top:12px"><div class="bar"><div><b>' + esc(t) + '</b><p class="note">' + plural(n, 'match', 'matches') + '</p></div>' + (n ? '<button type="button" class="btn btn-line btn-sm" data-group="' + i + '">See all on the ' + esc(PAGES[page].nav) + ' page</button>' : '') + '</div>' + (cards ? '<div class="cards">' + cards + '</div>' : '') + '</div>').join('');
      $('py-groups').querySelectorAll('[data-group]').forEach((b) => b.addEventListener('click', () => { const g = groups[+b.dataset.group]; g[3](); save(); go(g[4]); }));
      const towns = TOWNS.filter((t) => t.c === Y.county).slice(0, 8);
      $('py-live').innerHTML = towns.map((t) => '<a class="tile" style="--tc:' + PAGES.payment.color + ';grid-template-rows:auto" target="_blank" rel="noopener" href="' + esc(track(zillowCity(t.n, { max }), { h: t.n + ' homes up to ' + short(max), s: 'Zillow' })) + '"><div class="body"><b>' + esc(t.n) + ' up to ' + short(max) + '</b><span>On Zillow ↗</span></div></a>').join('') +
        '<button type="button" class="tile" style="--tc:' + PAGES.payment.color + ';grid-template-rows:auto" data-go="alerts"><div class="body"><b>Your own MLS page</b><span>Every home in your range, emailed daily</span></div></button>';
      const pf = payment(Object.assign({}, opts(), { price: Y.price || 0 }));
      $('py-p-total').textContent = Y.price ? money(pf.total) : '$0';
      $('py-p-break').innerHTML = Y.price ? breakdown(pf) + (pf.note ? '<p class="note">' + esc(pf.note) + '</p>' : '') : '';
    };
    bindMoney('py-budget', (v) => { if (v > 0) { Y.budget = v; save(); draw(); } });
    bindMoney('py-cash', (v) => { Y.cash = isNaN(v) ? 0 : v; save(); draw(); });
    bindMoney('py-hoa', (v) => { Y.hoa = isNaN(v) ? 0 : v; save(); draw(); });
    bindMoney('py-price', (v) => { Y.price = isNaN(v) ? 0 : v; save(); draw(); });
    $('py-loan').addEventListener('change', () => { Y.loan = $('py-loan').value; Y.rate = ''; $('py-rate').value = LOANS[Y.loan].rate; save(); draw(); });
    $('py-rate').addEventListener('input', () => { Y.rate = $('py-rate').value; save(); draw(); });
    $('py-county').addEventListener('change', () => { Y.county = $('py-county').value; setPlace({ k: 'county', n: Y.county }); save(); draw(); });
    draw();
  }
});
