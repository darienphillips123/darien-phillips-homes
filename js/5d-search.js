/* ===== Map search: every MLS home, through Darien's BoldTrail IDX site =====
   The map, filters, sign-in, favorites and saved searches run on darienphillips.exprealty.com,
   so every visitor's views and likes land in Darien's BoldTrail CRM. */
const IDX = 'https://darienphillips.exprealty.com';
// Darien's whole service area. BoldTrail's map handles up to 20 towns at once, so these are the 20 biggest across his 4 counties
const SERVICE_TOWNS = 'Roseville,Rocklin,Lincoln,Loomis,Auburn,Granite Bay,Sacramento,Elk Grove,Folsom,Citrus Heights,Stockton,Lodi,Manteca,Tracy,Lathrop,Modesto,Turlock,Oakdale,Riverbank,Ceres';
const SERVICE_LABEL = 'Placer, Sacramento, San Joaquin and Stanislaus';
const AREA_CHIPS = [['', 'All 4 counties']].concat(MAIN_COUNTIES.map((c) => [c + ' County', c + ' County']));
// BoldTrail understands towns, ZIP codes and neighborhoods, but not county names, so a county becomes its list of towns
function idxPlace(loc) {
  const v = String(loc || '').trim();
  const m = v.match(/^(.+?)\s+county$/i) || (MAIN_COUNTIES.concat(['El Dorado', 'Yolo', 'Sutter', 'Yuba', 'Merced']).some((c) => c.toLowerCase() === v.toLowerCase()) ? [v, v] : null);
  if (m) {
    const towns = Object.values(TOWN).filter((t) => String(t.c || '').toLowerCase() === m[1].toLowerCase()).map((t) => t.n);
    if (towns.length) return towns.slice(0, 10).join(',');
  }
  return v;
}
// What buyers can ask the map for (BoldTrail's own filter names)
const MAP_OPTS = [['1story', 'Single story'], ['pool', 'Pool'], ['newconstruction', 'New construction'], ['master', 'Main-floor primary'], ['3garage', '3-car garage'], ['adult', '55+ community'], ['horse', 'Horse property'], ['views', 'Views'], ['waterfront', 'Waterfront'], ['golf', 'Golf course'], ['green', 'Solar / green'], ['fireplace', 'Fireplace'], ['basement', 'Basement'], ['openhouses', 'Open houses'], ['reduced', 'Price reduced'], ['fixer', 'Fixer-upper']];
function idxUrl(f) {
  const where = idxWhere(f.loc) || SERVICE_TOWNS;
  const p = new URLSearchParams(Object.assign({ advanced: '1' }, where ? { display: where } : {}, { 'types[]': '1', beds: String(f.beds || 0), baths: String(f.baths || 0), min: String(f.min || 0), max: String(f.max || 100000000), rtype: 'map' }));
  if (f.condo) p.append('types[]', '2');
  if (f.sqft) p.set('minfootage', String(f.sqft));
  if (f.acres) p.set('minacres', String(f.acres));
  if (f.year) p.set('yearbuilt', String(f.year));
  const opts = new Set(f.opts || []);
  if (f.pool) opts.add('pool');
  opts.forEach((o) => p.append('options[]', o));
  return IDX + '/index.php?' + p.toString();
}
function searchFilters() {
  const F = sub('search', { loc: '', min: 0, max: 0, beds: 0, baths: 0, pool: false, opts: [], sqft: 0, acres: 0, year: 0, condo: false });
  if (!Array.isArray(F.opts)) F.opts = [];
  if (F.pool && !F.opts.includes('pool')) { F.opts.push('pool'); F.pool = false; }
  return F;
}
def('search', {
  nav: 'Map search', scene: 'home', kicker: 'Every home for sale', tileTitle: 'Map search',
  photoKey: () => 'search',
  navName: () => 'Map search' + (searchFilters().loc ? ': ' + searchFilters().loc : ''),
  title: () => searchFilters().loc ? 'Search every home near ' + searchFilters().loc : 'Search every home near you',
  sub: 'Every home on the MLS, live on a map. Filter by price, beds, baths, pool and more, draw your own area, and tap the heart on the homes you like. Create a free login once to see every detail and save your search.',
  ctas: () => '<a class="btn btn-ghost" href="sms:+12098826469">Text Darien</a><a class="btn btn-ghost" href="tel:+12098826469">Call Darien</a><a class="btn btn-ghost" href="mailto:darienphillips45@gmail.com">Email Darien</a>',
  html() {
    const F = searchFilters();
    const opts = (vals, any) => vals.map((v) => [v, v ? v + '+' : any]);
    return wishHtml() + '<section class="blk"><div class="wrap">' +
      '<form class="panel" id="ms-form" novalidate style="display:grid;gap:12px">' +
        '<div class="chips" role="group" aria-label="Search for your home in"><span class="lbl" style="width:100%">Search for your home in:</span>' + AREA_CHIPS.map(([v, t]) => '<button type="button" class="chip" data-msarea="' + esc(v) + '" aria-pressed="' + ((F.loc || '') === v) + '">' + esc(t) + '</button>').join('') + '</div>' +
        '<div class="fields">' +
          '<div class="field wide"><label for="ms-loc">City, ZIP, county or neighborhood</label><input id="ms-loc" value="' + esc(F.loc) + '" placeholder="All 4 counties, or type a city or ZIP like Galt or 95355" autocomplete="off"></div>' +
          moneyField('ms-min', 'Min price', F.min, '', 'No min') + moneyField('ms-max', 'Max price', F.max, '', 'No max') +
          sel('ms-beds', opts([0, 1, 2, 3, 4, 5], 'Any'), String(F.beds), 'Bedrooms') +
          sel('ms-baths', opts([0, 1, 2, 3, 4], 'Any'), String(F.baths), 'Bathrooms') +
          sel('ms-sqft', [[0, 'Any'], [1200, '1,200+'], [1500, '1,500+'], [1800, '1,800+'], [2000, '2,000+'], [2500, '2,500+'], [3000, '3,000+'], [4000, '4,000+']].map(([v, t]) => [String(v), t]), String(F.sqft), 'Home size (sq ft)') +
          sel('ms-acres', [[0, 'Any'], [0.25, '1/4 acre+'], [0.5, '1/2 acre+'], [1, '1 acre+'], [2, '2 acres+'], [5, '5 acres+'], [10, '10 acres+']].map(([v, t]) => [String(v), t]), String(F.acres), 'Lot size') +
          sel('ms-year', [[0, 'Any'], [2024, '2024 or newer'], [2020, '2020 or newer'], [2010, '2010 or newer'], [2000, '2000 or newer'], [1990, '1990 or newer']].map(([v, t]) => [String(v), t]), String(F.year), 'Year built') +
          '<div class="field"><span class="lbl">Home type</span><label style="display:flex;gap:8px;align-items:center;min-height:44px"><input type="checkbox" id="ms-condo"' + (F.condo ? ' checked' : '') + '> Include condos and townhomes</label></div>' +
        '</div>' +
        '<fieldset><legend class="lbl">Must-haves</legend><div class="checks">' + MAP_OPTS.map(([v, t]) => '<label><input type="checkbox" name="ms-opt" value="' + v + '"' + (F.opts.includes(v) ? ' checked' : '') + '> ' + esc(t) + '</label>').join('') + '</div></fieldset>' +
        '<div class="ctas" style="margin:0"><button type="submit" class="btn btn-pa">Update the map</button>' +
          '<a class="btn btn-line" id="ms-full" target="_blank" rel="noopener" href="#">Open full screen ↗</a></div>' +
        '<p class="note">Even more filters (style, garage size, HOA and more) are under "More Filters" on the map. Tap the heart on a home to save it; Darien uses your likes to send you better matches.</p>' +
      '</form>' +
      '<div class="ms-frame" style="margin-top:14px;border-radius:16px;overflow:hidden;border:1px solid var(--line, rgba(0,0,0,.12));background:var(--card, #fff)">' +
        '<iframe id="ms-iframe" title="Map of homes for sale" loading="lazy" style="display:block;width:100%;height:min(1100px,85vh);border:0" allow="geolocation; fullscreen" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
      '</div></div></section>' + sellerHtml();
  },
  mount(root) {
    const F = searchFilters();
    const frame = root.querySelector('#ms-iframe'), full = root.querySelector('#ms-full');
    const show = (log) => {
      const url = idxUrl(F);
      frame.src = url;
      full.href = track(url, { h: 'Map search' + (F.loc ? ': ' + F.loc : ''), s: 'BoldTrail' });
      if (log) {
        const bits = [F.loc || 'All 4 counties', F.min ? 'from ' + short(F.min) : '', F.max ? 'up to ' + short(F.max) : '', F.beds ? F.beds + '+ beds' : '', F.baths ? F.baths + '+ baths' : '', F.sqft ? comma(F.sqft) + '+ sq ft' : '', F.acres ? F.acres + '+ acres' : '', F.year ? 'built ' + F.year + '+' : ''].concat((F.opts || []).map((o) => (MAP_OPTS.find((x) => x[0] === o) || [o, o])[1].toLowerCase())).filter(Boolean).join(', ');
        beacon('click', { h: ('Searched the map: ' + bits).slice(0, 140), s: 'BoldTrail', p: '', b: '', r: '', pg: 'Map search', u: url.slice(0, 500) });
        logStep('Searched the map: ' + bits);
      }
    };
    root.querySelector('#ms-form').addEventListener('submit', (e) => {
      e.preventDefault();
      F.loc = root.querySelector('#ms-loc').value.trim();
      F.min = parseMoney(root.querySelector('#ms-min').value) || 0;
      F.max = parseMoney(root.querySelector('#ms-max').value) || 0;
      F.beds = +root.querySelector('#ms-beds').value || 0;
      F.baths = +root.querySelector('#ms-baths').value || 0;
      F.sqft = +root.querySelector('#ms-sqft').value || 0;
      F.acres = +root.querySelector('#ms-acres').value || 0;
      F.year = +root.querySelector('#ms-year').value || 0;
      F.condo = root.querySelector('#ms-condo').checked;
      F.opts = [...root.querySelectorAll('[name="ms-opt"]:checked')].map((x) => x.value);
      F.pool = false;
      save();
      show(true);
      const h = $('page-title');
      if (h) h.textContent = F.loc ? 'Search every home near ' + F.loc : 'Search every home near you';
    });
    root.querySelectorAll('[data-msarea]').forEach((b) => b.addEventListener('click', () => {
      root.querySelector('#ms-loc').value = b.dataset.msarea;
      root.querySelectorAll('[data-msarea]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      root.querySelector('#ms-form').requestSubmit();
    }));
    mountWish(root, F, show);
    show(false);
  }
});
// Opens the map search for any place or text, from the search box or other pages
function mapSearch(loc, opts) {
  const F = sub('search', {});
  F.loc = loc || '';
  if (opts) F.opts = opts;
  save();
  go('search', true);
}
