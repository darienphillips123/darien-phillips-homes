/* ===== New-build communities (shared card) ===== */
const STK = DATA.stockton;
const STK_COMM = {};
STK.communities.forEach((c) => { STK_COMM[c.key] = c; });
const STK_DEFAULTS = { route: 'myhome', rate: 7.0, maxPay: null, price: 'any', beds: 0, baths: 0, sqMin: 0, sqMax: 0, stories: 'any', show: 'all', areas: [], fits: true, sort: 'price' };
// Monthly cost of a Stockton home or plan with $0 down, using the community's tax rate, HOA and special tax
function stkFig(h, K) {
  const c = STK_COMM[h.comm];
  return payment({ price: h.price, loan: K.route, rate: K.rate, county: 'San Joaquin', tax: c.tax / 100, hoa: c.hoa || 0, special: c.special || 0 });
}
function communityCard(c, o) {
  const price = c.min;
  const title = c.name + ', ' + c.city;
  const loan = o && o.loan ? o.loan : 'myhome';
  let monthly = '', down = '', sub2 = '';
  if (price) {
    const f = payment({ price, loan, cash: o && o.cash ? o.cash : 0, rate: o && o.rate ? o.rate : LOANS[loan].rate, county: c.county, tax: 0.0115 });
    if (f.ok) {
      monthly = money(f.total);
      down = loan === 'myhome' ? '$0' : money(f.down);
      sub2 = loan === 'myhome' ? 'MyHome covers ' + short(f.help) : loan === 'va' ? 'VA loan' : LOANS[loan].label;
    } else {
      monthly = 'VA only';
      down = '$0 with VA';
      sub2 = 'Over the FHA limit';
    }
  }
  const tags = (c.tags || []).map((t) => '<span class="tag ' + (t === '55+' ? 'va' : 'pa') + '">' + esc(t === '55+' ? 'Age 55+' : t) + '</span>').join('');
  const facts = [c.bmin ? range(c.bmin, c.bmax) + ' bd' : '', c.sqft ? comma(c.sqft) + (c.sqft_max && c.sqft_max > c.sqft ? '–' + comma(c.sqft_max) : '+') + ' sq ft' : ''].filter(Boolean).join(' · ') || 'Beds and sizes: ask Darien';
  const builder = c.builder || 'Builder not listed';
  const info = { h: title, p: price ? 'From ' + money(price) : 'Price to be set', b: facts + ' · ' + builder, r: builder, city: c.city,
    x: c.url || googleFor(c.name + ' ' + (c.builder || '') + ' ' + c.city + ' CA new homes'), xs: c.url ? builder + ' website' : 'Find the builder\'s page', m: mapFor(c.name + ', ' + c.city + ', CA') };
  return '<article class="card"><div class="head"><span class="pill pa">' + esc(c.city + ' · ' + c.county) + '</span>' + (c.status === 'coming soon' ? '<span class="pill fha">Coming soon</span>' : c.status === 'quick move-in only' ? '<span class="pill ok">Final homes</span>' : '') + (typeof toursFor === 'function' && toursFor(c.name).length ? '<span class="pill ok">▶ Video tour</span>' : '') + heart('c:' + c.id, title, price ? 'From ' + money(price) : '') + '</div>' +
    '<div><h3>' + esc(c.name) + '</h3><div class="sub">' + esc(builder + ' · ' + c.city + ' ' + c.zip) + '</div></div>' +
    '<div class="price num">' + (price ? '<small>From </small>' + money(price) + (c.max ? ' <small>to ' + money(c.max) + '</small>' : '') : '<small>Price to be set</small>') + '</div>' +
    '<div class="facts">' + esc(facts) + '</div>' +
    (price ? '<div class="stats3"><div><span>Down payment</span><b class="fit">' + esc(down) + '</b><small>' + esc(sub2) + '</small></div><div><span>Est. monthly</span><b>' + esc(monthly) + '</b><small>At the starting price</small></div><div><span>Loan</span><b>' + esc(LOANS[loan].label.replace('FHA + CalHFA MyHome', 'FHA + MyHome')) + '</b><small>At ' + (o && o.rate ? o.rate : LOANS[loan].rate) + '%</small></div></div>' : '') +
    (tags ? '<div class="tags">' + tags + '</div>' : '') +
    '<div class="actions">' + details(info) + simBtn(slug(c.name)) + cartBtn('c:' + c.id, title, price ? 'From ' + money(price) : '') + (c.stockton ? '<a class="btn btn-line btn-sm" href="#p/' + esc(slug(c.name)) + '">Every home and plan</a>' : '') + askBtn('c:' + c.id, title, price ? 'From ' + money(price) : '') + '</div>' +
    '<div class="src">Prices from ' + esc(c.src) + ', checked ' + esc(c.stockton ? STK.checked : DATA.checked) + '. Text Darien before you visit so he can register you.</div></article>';
}

/* ===== $0 down, every market ===== */
def('zero-down', {
  nav: '$0 down', scene: 'zero-down', kicker: '$0 down in every market', tileTitle: '$0-down homes',
  title: 'Buy a home with $0 down',
  sub: 'VA loans, USDA loans and FHA with California\'s MyHome loan can all cover the down payment. Pick your county to see the limits and the homes that work.',
  html() {
    const Z = sub('zero', { county: 'Sacramento', price: 450000, city: '' });
    if (placeCounty() && MAIN_COUNTIES.includes(placeCounty())) Z.county = placeCounty();
    return '<section class="blk"><div class="wrap"><div class="panel accent" style="display:grid;gap:12px">' +
      '<div class="chips" role="group" aria-label="County"><span class="mono">County</span>' + MAIN_COUNTIES.map((c) => '<button type="button" class="chip" data-zc="' + esc(c) + '" aria-pressed="' + (Z.county === c) + '">' + esc(c) + '</button>').join('') + '</div>' +
      '<div class="field wide"><label for="zd-city">Find $0-down homes in a city</label><input id="zd-city" type="search" autocomplete="off" value="' + esc(Z.city || '') + '" placeholder="Type any city, like Modesto, Folsom or Lodi"></div>' +
      '<p class="note" id="zd-city-note"></p>' +
      '<div class="compare" id="zd-limits"></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Ways to get to $0 down</h2><p>Two loans cover the whole down payment. Builder offers and other programs can help with closing costs.</p></div></div><div class="opts" id="zd-opts"></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Compare $0-down payments</h2></div></div><div class="calc"><div class="panel"><div class="fields">' + moneyField('zd-price', 'Home price', Z.price) + '</div><p class="note" style="margin-top:8px">Uses about 7% rates, property tax at 1.1% and insurance at 0.35% of the price. Builder rate specials can be lower.</p></div><div class="compare" id="zd-compare"></div></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2 id="zd-nb-h">New builds that work with $0 down</h2><p>Communities whose starting price fits under the county\'s FHA limit, priced with FHA plus MyHome. A VA loan can go higher.</p></div></div>' +
      '<div class="cards" id="zd-nb"></div><div class="more-row"><button type="button" class="btn btn-line" id="zd-more" hidden></button></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Search every $0-down-friendly home</h2><p>Resale homes qualify too. These open Zillow up to the most a $0-down FHA loan covers in each town.</p></div></div><div class="tiles" id="zd-live"></div></div></section>';
  },
  mount(root) {
    const Z = S.zero;
    const st = { shown: 12, empty: '<div class="empty"><h3>No new-build communities start under the FHA limit here</h3><p>A VA loan has no limit with full entitlement. Darien can also search resale homes for you.</p></div>' };
    const draw = () => {
      // A typed city wins over the county chips: if it is a real town, switch to its county.
      const cityQ = (Z.city || '').trim().toLowerCase();
      let cityTown = cityQ ? (TOWN[cityQ] || Object.values(TOWN).find((t) => t.n.toLowerCase().startsWith(cityQ))) : null;
      const cityNote = $('zd-city-note');
      if (cityQ && !cityTown) { if (cityNote) cityNote.textContent = 'We don\'t have a town called "' + Z.city.trim() + '" in Darien\'s area. Try a nearby city, or pick a county above.'; }
      else if (cityTown) { if (cityTown.c && MAIN_COUNTIES.includes(cityTown.c)) Z.county = cityTown.c; if (cityNote) cityNote.textContent = 'Showing $0-down homes in ' + cityTown.n + ', ' + (cityTown.c || '') + ' County.'; }
      else if (cityNote) cityNote.textContent = '';
      const L = LIMITS[Z.county];
      const fhaMax = L.fha / 0.965;
      root.querySelectorAll('[data-zc]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.zc === Z.county)));
      $('zd-limits').innerHTML =
        '<div class="panel"><span>FHA loan limit, 2026</span><b class="num">' + money(L.fha) + '</b><span>Covers homes up to about ' + short(fhaMax) + ' with $0 down</span></div>' +
        '<div class="panel"><span>CalHFA income limit</span><b class="num">' + money(L.calhfa) + '</b><span>Household income for MyHome</span></div>' +
        '<div class="panel"><span>VA loan</span><b>No limit</b><span>With full VA entitlement</span></div>' +
        '<div class="panel"><span>USDA loan</span><b>Rural areas</b><span>Check the exact address</span></div>';
      $('zd-opts').innerHTML =
        '<article class="opt va"><span class="mono">Veterans and service members</span><h3>VA loan</h3><ul><li>$0 down and no monthly mortgage insurance.</li><li>A 2.15% funding fee on a first VA loan, which can be added to the loan. It\'s waived with a 10% or higher service-connected disability rating.</li><li>No loan limit with full entitlement.</li></ul><a href="' + esc(track('https://www.va.gov/housing-assistance/home-loans/', { h: 'VA home loans', s: 'VA.gov' })) + '" target="_blank" rel="noopener">VA home loans on VA.gov</a></article>' +
        '<article class="opt fha"><span class="mono">First-time buyers</span><h3>FHA + CalHFA MyHome</h3><ul><li>FHA needs 3.5% down. MyHome lends it to you, up to 3.5% of the price, with no payment until you sell or refinance.</li><li>Income up to ' + money(L.calhfa) + ' in ' + esc(Z.county) + ' County. A homebuyer class is required.</li><li>FHA loans here go up to ' + money(L.fha) + '.</li></ul><a href="' + esc(track('https://www.calhfa.ca.gov/homebuyer/programs/myhome.htm', { h: 'CalHFA MyHome program', s: 'CalHFA' })) + '" target="_blank" rel="noopener">CalHFA MyHome details</a></article>' +
        '<article class="opt"><span class="mono">Rural areas</span><h3>USDA loan</h3><ul><li>$0 down in eligible rural areas, with a 1% upfront fee and 0.35% a year.</li><li>Income limits apply, and eligibility depends on the exact address. Most homes inside city limits don\'t qualify.</li></ul><a href="' + esc(track('https://eligibility.sc.egov.usda.gov/eligibility/welcomeAction.do', { h: 'USDA address map', s: 'USDA' })) + '" target="_blank" rel="noopener">Check an address on USDA\'s map</a></article>' +
        '<article class="opt fha"><span class="mono">First-time and repeat buyers</span><h3>GSFA Platinum</h3><ul><li>Up to 5% of the loan for down payment and closing costs, with FHA, VA, USDA or conventional loans.</li><li>Credit scores from 640 can qualify. Most of the help is a second loan with a monthly payment.</li></ul><a href="' + esc(track('https://gsfahome.org/programs/dpa/platinum.shtml', { h: 'GSFA Platinum', s: 'GSFA' })) + '" target="_blank" rel="noopener">GSFA Platinum details</a></article>' +
        '<article class="opt"><span class="mono">Closing costs</span><h3>Builder offers</h3><ul><li>Many builders pay closing costs or buy down the rate when you use their lender.</li><li>Those perks may not work with CalHFA. Darien can help you compare.</li></ul></article>' +
        '<article class="opt off"><span class="mono">Closed for 2026</span><h3>Dream For All</h3><ul><li>California\'s shared-appreciation loan pays up to 20% of the price for first-generation buyers.</li><li>The 2026 window ran February 24 to March 16. Watch for the next round.</li></ul></article>';
      const p = Z.price || 0;
      const card = (label, loan) => { const f = payment({ price: p, loan, county: Z.county }); return '<div class="panel"><span>' + esc(label) + '</span><b class="num">' + (f.ok ? money(f.total) : 'Over limit') + '</b><span>' + (f.ok ? 'Loan ' + short(f.loan) + ' · ' + (loan === 'myhome' ? 'MyHome covers ' + short(f.help) : '$0 down') : esc(f.note)) + '</span></div>'; };
      $('zd-compare').innerHTML = p ? card('VA loan', 'va') + card('FHA + CalHFA MyHome', 'myhome') + card('USDA (rural areas)', 'usda') : '<div class="panel"><span>Enter a price to compare.</span></div>';
      const list = DATA.communities.filter((c) => c.county === Z.county && c.min && c.min * 0.965 <= L.fha && (!cityTown || String(c.city || '').toLowerCase() === cityTown.n.toLowerCase())).sort((a, b) => a.min - b.min);
      $('zd-nb-h').textContent = plural(list.length, 'new-build community', 'new-build communities') + ' in ' + (cityTown ? cityTown.n : Z.county + ' County') + ' that work with $0 down';
      pager('zd-nb', 'zd-more', list, (c) => communityCard(c, { loan: 'myhome' }), st);
      const towns = cityTown ? [cityTown] : TOWNS.filter((t) => t.c === Z.county).slice(0, 8);
      $('zd-live').innerHTML = towns.map((t) => '<a class="tile" style="--tc:' + PAGES['zero-down'].color + ';grid-template-rows:auto" target="_blank" rel="noopener" href="' + esc(track(zillowCity(t.n, { max: fhaMax }), { h: t.n + ' homes up to ' + short(fhaMax), s: 'Zillow' })) + '"><div class="body"><b>' + esc(t.n) + ' up to ' + short(fhaMax) + '</b><span>On Zillow ↗</span></div></a>').join('');
    };
    root.querySelectorAll('[data-zc]').forEach((b) => b.addEventListener('click', () => { Z.county = b.dataset.zc; Z.city = ''; const ci = $('zd-city'); if (ci) ci.value = ''; setPlace({ k: 'county', n: Z.county }); st.shown = 12; save(); draw(); }));
    $('zd-city').addEventListener('input', () => { Z.city = $('zd-city').value; st.shown = 12; save(); draw(); });
    bindMoney('zd-price', (v) => { Z.price = isNaN(v) ? 0 : v; save(); draw(); });
    $('zd-more').addEventListener('click', () => { st.shown += 12; draw(); });
    draw();
  }
});

/* ===== New builds everywhere ===== */
// Every county and town that has new-home communities, so buyers can jump straight to one
const NB_MORE_COUNTIES = (() => { const n = {}; DATA.communities.forEach((c) => { if (c.county && !MAIN_COUNTIES.includes(c.county)) n[c.county] = (n[c.county] || 0) + 1; }); return Object.keys(n).sort((a, b) => n[b] - n[a]); })();
const NB_TOWNS = (() => { const n = {}; DATA.communities.forEach((c) => { if (c.city) { const k = c.city; n[k] = n[k] || [k, c.county, 0]; n[k][2]++; } }); return Object.values(n).sort((a, b) => a[0].localeCompare(b[0])); })();
def('new-builds', {
  nav: 'New builds', scene: 'new-builds', kicker: 'New construction', tileTitle: 'New builds anywhere',
  title: 'New builds across Northern California',
  sub: 'Over 450 new-home communities in every city MetroList covers, the best builder deals in each city with the date they end, and move-in ready homes. Filter by price, home size and lot size.',
  html() {
    const N = sub('nb', { max: 0, beds: 0, sqft: 0, sqftMax: 0, lot: 0, builder: '', age: 'any', loan: 'myhome', rate: '', sort: 'price', text: '' });
    const county = placeCounty();
    const pool = DATA.communities.filter((c) => !county || c.county === county);
    const builders = Array.from(new Set(pool.map((c) => c.builder).filter(Boolean))).sort();
    const loomis = (S.place && S.place.k === 'town' && S.place.n === 'Loomis') || county === 'Placer';
    return '<section class="blk"><div class="wrap">' +
      '<div class="callout" role="note"><b>Text Darien before you visit a model home</b><p>Most builders only work with your agent if he\'s with you on your first visit or registers you before it. Text 209.882.6469 first.</p></div>' +
      (loomis ? '<div class="panel bar" style="margin-top:12px"><div><b>Looking in Loomis?</b><p class="note">Loomis has no large new-home communities right now. New homes there are mostly custom builds on bigger lots, and Rocklin, Lincoln and west Roseville have the nearest communities.</p></div><button type="button" class="btn btn-line" data-go="build">Cost to build</button></div>' : '') +
      '<div class="panel" style="display:grid;gap:12px;margin-top:12px">' + countyChips(true, NB_MORE_COUNTIES) +
        '<div class="fields">' + sel('nb-town', [['', 'Every city and town']].concat(NB_TOWNS.filter((t) => !county || t[1] === county).map((t) => [t[0], t[0] + ' (' + t[2] + ')'])), S.place && S.place.k === 'town' ? S.place.n : '', 'City or town') + '</div>' +
        '<div class="fields">' + sel('nb-max', PRICE_OPTS, N.max, 'Price') + sel('nb-beds', BED_OPTS, N.beds, 'Bedrooms') + sel('nb-sqft', SIZE_OPTS, N.sqft, 'Home size (min)') + sel('nb-sqftmax', nbMaxSizeOpts, N.sqftMax, 'Home size (max)') + sel('nb-lot', nbLotOpts, N.lot, 'Lot size') +
          sel('nb-builder', [['', 'Any builder']].concat(builders.map((b) => [b, b])), N.builder, 'Builder') +
          sel('nb-age', [['any', 'All communities'], ['no55', 'Not age-restricted'], ['55', 'Age 55+ only']], N.age, 'Community type') +
          sel('nb-sort', [['price', 'Lowest price'], ['high', 'Highest price'], ['size', 'Biggest homes'], ['name', 'Name']], N.sort, 'Sort') + '</div>' +
        '<div class="fields">' + sel('nb-loan', [['myhome', 'FHA + CalHFA MyHome ($0 down)'], ['va', 'VA ($0 down)'], ['fha', 'FHA (3.5% down)'], ['conv', 'Conventional (3% down)']], N.loan, 'Payment shown with') +
          pctField('nb-rate', 'Interest rate', N.rate || LOANS[N.loan].rate, 'Builder specials can be lower') + '</div>' +
        (N.text ? '<div><span class="place-pill">Matching "' + esc(N.text) + '"<button type="button" id="nb-clear" aria-label="Clear the search">×</button></span></div>' : '') +
        '<div class="ctas" style="margin:0"><button type="button" class="btn btn-line btn-sm" id="nb-map">See new builds with this lot size and home size on the map</button></div>' +
        '<p class="note">Builders rarely post lot sizes, so the map searches every new-construction home on the MLS by lot size.</p></div>' +
      '<div class="shead" style="margin-top:26px"><div><p class="mono eyebrow">Map</p><h2>Every new-home community on the map</h2><p>Pins are colored by the monthly payment. Set your budget, add your work address to see drive times, and turn on flood zones.</p></div></div>' + nbMapHtml() +
      '<div class="shead" style="margin-top:26px"><div><p class="mono eyebrow">Best builder deals right now</p><h2>Incentives in each city</h2><p>Rate buydowns, closing-cost credits and price cuts from the builders, with the date each one ends. Checked ' + esc(niceDate(DEALS.asof)) + '. Builders change these often, so text Darien before you go.</p></div></div>' +
      '<div id="nb-deals"></div>' +
      '<div class="shead" style="margin-top:26px"><div><p class="mono eyebrow">Move in soon</p><h2>Move-in ready new homes</h2><p>Finished or nearly finished homes the builders want to sell now, often with the biggest discounts.</p></div></div>' +
      '<div id="nb-qmi"></div>' +
      '<div class="shead" style="margin-top:26px"><div><p class="mono eyebrow">Every community</p><h2>All new-home communities</h2></div></div>' +
      '<p class="count" id="nb-count" aria-live="polite"></p>' +
      '<div class="cards" id="nb-list"></div><div class="more-row"><button type="button" class="btn btn-line" id="nb-more" hidden></button></div>' +
      '<p class="src" style="margin-top:14px">Communities and starting prices from Homes.com, HomeFinder and builder websites, checked ' + esc(DATA.checked) + '. Prices are the base home; lots, options and upgrades add to them.</p></div></section>';
  },
  mount(root) {
    const N = S.nb;
    const st = { shown: 12, deals: 9, qmi: 9, empty: '<div class="empty"><h3>No communities match these filters</h3><p>Try a higher price, another area or fewer bedrooms.</p></div>' };
    const draw = () => {
      const q = (N.text || '').toLowerCase();
      const items = DATA.communities.filter((c) => inPlace(c) &&
        (!N.max || (c.min && c.min <= N.max)) && (!N.beds || (c.bmax && c.bmax >= N.beds)) && (!N.sqft || (c.sqft && c.sqft >= N.sqft)) && (!N.sqftMax || !c.sqft || c.sqft <= N.sqftMax) &&
        (!N.builder || c.builder === N.builder) && (N.age === 'any' || (N.age === '55' ? c.tags.includes('55+') : !c.tags.includes('55+'))) &&
        (!q || (c.name + ' ' + (c.builder || '') + ' ' + c.city + ' ' + c.zip).toLowerCase().includes(q)));
      const sorts = { price: (a, b) => (a.min || 9e9) - (b.min || 9e9), high: (a, b) => (b.min || 0) - (a.min || 0), size: (a, b) => (b.sqft || 0) - (a.sqft || 0), name: (a, b) => a.name.localeCompare(b.name) };
      items.sort(sorts[N.sort] || sorts.price);
      const rate = parseNum(N.rate) || LOANS[N.loan].rate;
      $('nb-count').innerHTML = plural(items.length, 'community', 'communities') + ' <span class="sub">in ' + esc(placeLabel(S.place)) + (items.length ? ' · from ' + money(Math.min.apply(null, items.filter((c) => c.min).map((c) => c.min).concat([9e9]))) : '') + '</span>';
      $('nb-deals').innerHTML = dealsSection(N, st.deals);
      $('nb-qmi').innerHTML = qmiSection(N, st.qmi);
      const dm = $('nbd-more'), qm = $('nbq-more');
      if (dm) dm.addEventListener('click', () => { st.deals += 9; draw(); });
      if (qm) qm.addEventListener('click', () => { st.qmi += 9; draw(); });
      pager('nb-list', 'nb-more', items, (c) => communityCard(c, { loan: N.loan, rate, cash: N.loan === 'fha' || N.loan === 'conv' ? 0 : 0 }), st);
    };
    const change = () => { st.shown = 12; st.deals = 9; st.qmi = 9; save(); draw(); };
    bindCounty(root, () => { N.builder = ''; render(CURRENT, true); });
    $('nb-town').addEventListener('change', () => { const v = $('nb-town').value; const t = NB_TOWNS.find((x) => x[0] === v); setPlace(v ? { k: 'town', n: v, c: t ? t[1] : null } : null); N.builder = ''; render(CURRENT, true); });
    [['nb-max', 'max'], ['nb-beds', 'beds'], ['nb-sqft', 'sqft'], ['nb-sqftmax', 'sqftMax'], ['nb-lot', 'lot']].forEach(([id, k]) => $(id).addEventListener('change', () => { N[k] = parseFloat($(id).value) || 0; change(); }));
    [['nb-builder', 'builder'], ['nb-age', 'age'], ['nb-sort', 'sort']].forEach(([id, k]) => $(id).addEventListener('change', () => { N[k] = $(id).value; change(); }));
    $('nb-loan').addEventListener('change', () => { N.loan = $('nb-loan').value; N.rate = ''; $('nb-rate').value = LOANS[N.loan].rate; change(); });
    $('nb-rate').addEventListener('input', () => { N.rate = $('nb-rate').value; save(); draw(); });
    if ($('nb-clear')) $('nb-clear').addEventListener('click', () => { N.text = ''; save(); render(CURRENT, true); });
    $('nb-more').addEventListener('click', () => { st.shown += 12; draw(); });
    $('nb-map').addEventListener('click', () => nbMapSearch(N));
    mountNbMap(root, N);
    draw();
  }
});

/* ===== Stockton $0 down, home by home ===== */
def('stockton', {
  nav: 'Stockton $0 down', scene: 'stockton', kicker: 'Stockton · New homes · VA and FHA', tileTitle: 'Stockton $0 down',
  title: 'Stockton new homes with $0 down',
  sub: 'Every new home and floor plan in six Stockton communities, with the down payment and monthly payment for a VA loan or FHA plus CalHFA MyHome.',
  html() {
    const K = sub('stk', STK_DEFAULTS);
    const priceOpts = [['any', 'Any price'], ['500000', 'Up to $500k'], ['550000', 'Up to $550k'], ['600000', 'Up to $600k'], ['650000', 'Up to $650k'], ['700000', 'Up to $700k'], ['800000', 'Up to $800k']];
    if (!priceOpts.some(([v]) => v === String(K.price))) K.price = 'any';
    const areas = Array.from(new Set(STK.communities.map((c) => c.area)));
    return '<section class="blk"><div class="wrap">' +
      '<div class="panel accent" style="display:grid;gap:12px"><span class="lbl">How you\'ll pay $0 down</span><div class="chips" role="group" aria-label="Loan">' +
        [['myhome', 'FHA + CalHFA MyHome (first-time buyers)'], ['va', 'VA loan (veterans)']].map(([v, t]) => '<button type="button" class="chip" data-route="' + v + '" aria-pressed="' + (K.route === v) + '">' + esc(t) + '</button>').join('') + '</div>' +
        '<div class="fields">' + pctField('sk-rate', 'Interest rate', K.rate, 'Builder specials can be lower') + moneyField('sk-pay', 'Max monthly payment', K.maxPay, '', 'Optional') +
          sel('sk-price', priceOpts, K.price, 'Price') + sel('sk-beds', BED_OPTS, K.beds, 'Bedrooms') + sel('sk-baths', BATH_OPTS.concat([[3.5, '3.5+']]), K.baths, 'Bathrooms') +
          sel('sk-sqmin', [[0, 'Any'], [1200, '1,200 sq ft'], [1500, '1,500 sq ft'], [1800, '1,800 sq ft'], [2000, '2,000 sq ft'], [2500, '2,500 sq ft'], [3000, '3,000 sq ft']], K.sqMin, 'Size from') +
          sel('sk-sqmax', [[0, 'Any'], [1500, '1,500 sq ft'], [1800, '1,800 sq ft'], [2000, '2,000 sq ft'], [2500, '2,500 sq ft'], [3000, '3,000 sq ft']], K.sqMax, 'Size up to') +
          sel('sk-stories', [['any', 'Any'], ['one', 'Single-story'], ['two', 'Two-story']], K.stories, 'Stories') +
          sel('sk-sort', [['price', 'Lowest price'], ['pay', 'Lowest monthly payment'], ['size', 'Biggest home'], ['beds', 'Most bedrooms']], K.sort, 'Sort') + '</div>' +
        '<div class="chips" role="group" aria-label="Show"><span class="mono">Show</span>' + [['all', 'All'], ['ready', 'Ready now'], ['plan', 'Floor plans to build']].map(([v, t]) => '<button type="button" class="chip" data-show="' + v + '" aria-pressed="' + (K.show === v) + '">' + t + '<span class="n"></span></button>').join('') + '</div>' +
        '<div class="chips" role="group" aria-label="Part of town"><span class="mono">Area</span>' + areas.map((a) => '<button type="button" class="chip" data-sarea="' + esc(a) + '" aria-pressed="' + K.areas.includes(a) + '">' + esc(a) + '<span class="n"></span></button>').join('') + '</div>' +
        '<label class="check" id="sk-fits-wrap"><input type="checkbox" id="sk-fits"' + (K.fits ? ' checked' : '') + '> Only homes FHA can cover (up to about ' + short(LIMITS['San Joaquin'].fha / 0.965) + ')</label>' +
        '<p class="count" id="sk-count" aria-live="polite"></p></div>' +
      '<div class="cards" id="sk-list"></div><div class="more-row"><button type="button" class="btn btn-line" id="sk-more" hidden></button></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Stockton builders</h2><p>Starting prices are for the base home. Text Darien before you visit so he can register you.</p></div></div><div class="scroll"><table class="tbl" id="sk-comms"></table></div></div></section>';
  },
  mount(root) {
    const K = S.stk;
    const st = { shown: 12, empty: '<div class="empty"><h3>No homes match all of these filters</h3><p>Try a higher price, fewer bedrooms or a bigger size range. A VA loan also covers homes over the FHA limit.</p></div>' };
    const fig = (h) => stkFig(h, K);
    const match = (h, f, o) => {
      o = Object.assign({ show: K.show, areas: K.areas }, o || {});
      const c = STK_COMM[h.comm];
      if (K.price !== 'any' && h.price > +K.price) return false;
      if (K.beds && h.bedsMax < K.beds) return false;
      if (K.baths && h.bathsMax < K.baths) return false;
      if (K.sqMin && h.sqft < K.sqMin) return false;
      if (K.sqMax && h.sqft > K.sqMax) return false;
      if (K.stories === 'one' && h.stories !== 1) return false;
      if (K.stories === 'two' && h.stories !== 2) return false;
      if (o.show !== 'all' && h.kind !== o.show) return false;
      if (o.areas.length && !o.areas.includes(c.area)) return false;
      if (K.fits && K.route === 'myhome' && !f.ok) return false;
      if (K.maxPay && f.total > K.maxPay) return false;
      return true;
    };
    const draw = () => {
      root.querySelectorAll('[data-route]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.route === K.route)));
      $('sk-fits-wrap').hidden = K.route === 'va';
      const all = STK.homes.map((h) => ({ h, f: fig(h) }));
      root.querySelectorAll('[data-show]').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.show === K.show)); b.querySelector('.n').textContent = all.filter((x) => match(x.h, x.f, { show: b.dataset.show })).length; });
      root.querySelectorAll('[data-sarea]').forEach((b) => { b.setAttribute('aria-pressed', String(K.areas.includes(b.dataset.sarea))); b.querySelector('.n').textContent = all.filter((x) => match(x.h, x.f, { areas: [b.dataset.sarea] })).length; });
      const sorts = { price: (a, b) => a.h.price - b.h.price, pay: (a, b) => a.f.total - b.f.total, size: (a, b) => b.h.sqft - a.h.sqft || a.h.price - b.h.price, beds: (a, b) => b.h.bedsMax - a.h.bedsMax || a.h.price - b.h.price };
      const list = all.filter((x) => match(x.h, x.f)).sort(sorts[K.sort] || sorts.price);
      $('sk-count').innerHTML = plural(list.length, 'home and plan', 'homes and plans') + ' match <span class="sub">· ' + list.filter((x) => x.h.kind === 'ready').length + ' ready now · $0 down with ' + (K.route === 'va' ? 'VA' : 'FHA + CalHFA MyHome') + '</span>';
      pager('sk-list', 'sk-more', list, (x) => stocktonCard(x.h, x.f, K), st);
    };
    const change = () => { st.shown = 12; save(); draw(); };
    root.querySelectorAll('[data-route]').forEach((b) => b.addEventListener('click', () => { K.route = b.dataset.route; change(); }));
    root.querySelectorAll('[data-show]').forEach((b) => b.addEventListener('click', () => { K.show = b.dataset.show; change(); }));
    root.querySelectorAll('[data-sarea]').forEach((b) => b.addEventListener('click', () => { const a = b.dataset.sarea; K.areas = K.areas.includes(a) ? K.areas.filter((x) => x !== a) : K.areas.concat(a); change(); }));
    $('sk-rate').addEventListener('input', () => { const v = parseNum($('sk-rate').value); if (v > 0 && v < 20) { K.rate = v; save(); draw(); } });
    bindMoney('sk-pay', (v) => { K.maxPay = v > 0 ? v : null; change(); });
    [['sk-price', 'price', 0], ['sk-stories', 'stories', 0], ['sk-sort', 'sort', 0]].forEach(([id, k]) => $(id).addEventListener('change', () => { K[k] = $(id).value; change(); }));
    [['sk-beds', 'beds'], ['sk-baths', 'baths'], ['sk-sqmin', 'sqMin'], ['sk-sqmax', 'sqMax']].forEach(([id, k]) => $(id).addEventListener('change', () => { K[k] = parseFloat($(id).value) || 0; change(); }));
    $('sk-fits').addEventListener('change', () => { K.fits = $('sk-fits').checked; change(); });
    $('sk-more').addEventListener('click', () => { st.shown += 12; draw(); });
    $('sk-comms').innerHTML = '<thead><tr><th>Community</th><th class="r">Prices</th><th class="r">Ready now</th><th>Good to know</th><th>Link</th></tr></thead><tbody>' + STK.communities.map((c) => {
      const hs = STK.homes.filter((h) => h.comm === c.key);
      const lo = Math.min.apply(null, hs.map((h) => h.price)), hi = Math.max.apply(null, hs.map((h) => h.price));
      const notes = (c.perks || []).concat(c.notes || []).filter((v, i, a) => a.indexOf(v) === i);
      return '<tr><td><b>' + esc(c.name) + '</b><small>' + esc(c.builder + ' · ' + c.area) + '</small><small>' + esc(c.address) + '</small></td><td class="r">' + short(lo) + '–' + short(hi) + '</td><td class="r">' + hs.filter((h) => h.kind === 'ready').length + '</td><td>' + esc(notes.join(' · ')) + '</td><td><a href="' + esc(track(c.url, { h: c.name + ' (community page)', s: c.site })) + '" target="_blank" rel="noopener">' + esc(c.site) + '</a></td></tr>';
    }).join('') + '</tbody>';
    draw();
  }
});
function stocktonCard(h, f, K) {
  const c = STK_COMM[h.comm];
  const title = (h.street ? h.street : h.plan + ' floor plan') + ' (' + c.name + ')';
  const size = range(h.beds, h.bedsMax) + ' bd · ' + range(h.baths, h.bathsMax) + ' ba · ' + comma(h.sqft) + ' sq ft';
  const facts = [size, h.stories === 1 ? 'Single-story' : h.stories === 2 ? 'Two-story' : '', h.lot ? comma(h.lot) + ' sq ft lot' : ''].filter(Boolean).join(' · ');
  const pill = h.kind === 'plan' ? '<span class="pill">To be built</span>' : '<span class="pill ' + (h.status === 'Under construction' ? 'pa' : 'ok') + '">' + esc(h.status) + '</span>';
  const tags = (c.perks || []).map((t) => '<span class="tag pa">' + esc(t) + '</span>').join('') + (h.stories === 1 ? '<span class="tag ok">Single-story</span>' : '') + (c.hoa ? '<span class="tag">HOA about ' + money(c.hoa) + '/mo</span>' : '') + (c.special ? '<span class="tag">Special tax about ' + money(c.special) + '/yr</span>' : '') + (h.note ? '<span class="tag warn">' + esc(h.note) + '</span>' : '');
  const addr = h.street ? h.street + ', Stockton, CA ' + h.zip : c.address;
  const info = { h: title, p: (h.kind === 'plan' ? 'From ' : '') + money(h.price), b: size, r: h.mls ? 'MLS# ' + h.mls : h.plan, city: 'Stockton', x: h.url || c.url, xs: c.site + ' website', m: mapFor(addr) };
  if (h.mls) info.z = zillowFor(h.street, 'Stockton', h.zip);
  const zero = !f.ok ? '<div class="stats3"><p class="wide over">Over the FHA limit for San Joaquin County. A VA loan can still do $0 down on this home.</p></div>' :
    '<div class="stats3"><div><span>Down payment</span><b class="fit">$0</b><small>' + (K.route === 'va' ? 'VA loan' : 'MyHome covers ' + short(f.help)) + '</small></div><div><span>Est. monthly</span><b>' + money(f.total) + '</b><small>At ' + K.rate + '%' + (K.maxPay && f.total > K.maxPay ? ', over your max' : '') + '</small></div><div><span>Loan amount</span><b>' + short(f.loan) + '</b><small>' + (K.route === 'va' ? 'Incl. VA funding fee' : 'Incl. FHA upfront fee') + '</small></div></div>';
  return '<article class="card"><div class="head">' + pill + heart('s:' + h.id, title, money(h.price)) + '</div>' +
    '<div><h3>' + esc(h.street ? h.street : h.plan + ' floor plan') + '</h3><div class="sub">' + esc((h.street ? h.plan + ' · ' : '') + c.name + ' by ' + c.builder) + '</div><div class="sub">' + esc(c.area + ' ' + h.zip) + '</div></div>' +
    '<div class="price num">' + (h.kind === 'plan' ? '<small>From </small>' : '') + money(h.price) + (h.priceNote ? ' <small>' + esc(h.priceNote) + '</small>' : '') + '</div><div class="facts">' + esc(facts) + '</div>' + zero +
    (tags ? '<div class="tags">' + tags + '</div>' : '') +
    (f.ok ? '<details class="more"><summary>Monthly payment breakdown</summary>' + breakdown(f) + (c.special == null ? '<p class="note">Plus Mello-Roos or HOA if the community has them. Ask Darien for the amounts.</p>' : '') + '</details>' : '') +
    '<div class="actions">' + details(info) + simBtn(slug(h.street || c.name + ' ' + h.plan)) + cartBtn('s:' + h.id, title, money(h.price)) + askBtn('s:' + h.id, title, money(h.price)) + '</div>' +
    '<div class="src">' + (h.kind === 'plan' ? 'Starting price' : 'Price') + ' from ' + esc(c.source) + ', checked ' + esc(STK.checked) + (h.mls ? ' · MLS# ' + esc(h.mls) : '') + '</div></article>';
}
