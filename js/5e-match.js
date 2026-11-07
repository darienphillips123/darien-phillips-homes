/* ===== Smart search: type what you want, homes like this one, and a search that learns from hearts =====
   1. "Describe your home" turns plain words ("4 bed with a pool in Folsom under 800k") into map filters.
   2. Every home page gets "Every home like this on the MLS": same town, beds, baths, size and price,
      with a "Widen the search" step when there aren't enough.
   3. "Homes like the ones you liked" reads the hearts and thumbs-downs and builds a search from them.
   4. Sellers can ask for a home value and, if they want, monthly market reports. */

const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
// Words buyers use, matched to BoldTrail's must-have filters
const WISH_OPTS = [
  [/\bpool\b/, 'pool'], [/single[\s-]?stor(y|ey)|one[\s-]?stor(y|ey)|\bno stairs\b|\branch\b/, '1story'],
  [/new (build|construction|home)|newly built|brand new/, 'newconstruction'], [/(main|first|ground)[\s-]floor (primary|master|bed)/, 'master'],
  [/3[\s-]?car|three[\s-]car/, '3garage'], [/55\s?\+|active adult|senior/, 'adult'], [/\bhorse|equestrian/, 'horse'],
  [/\bviews?\b/, 'views'], [/waterfront|on the (lake|river|water)|lakefront|riverfront/, 'waterfront'], [/\bgolf/, 'golf'],
  [/solar|green home|energy efficient/, 'green'], [/fireplace/, 'fireplace'], [/basement/, 'basement'],
  [/open house/, 'openhouses'], [/price (drop|reduced|cut)|reduced/, 'reduced'], [/fixer|handyman|needs work|tlc/, 'fixer']
];
const optsFromText = (s) => { const t = String(s || '').toLowerCase(); return WISH_OPTS.filter(([re]) => re.test(t)).map(([, o]) => o); };
const optName = (o) => (MAP_OPTS.find((x) => x[0] === o) || [o, o])[1];

function wishMoney(s) {
  const m = String(s).replace(/[$,\s]/g, '').match(/^(\d+(?:\.\d+)?)(k|m|mil|million|thousand)?$/i);
  if (!m) return 0;
  let v = parseFloat(m[1]);
  const u = (m[2] || '').toLowerCase();
  if (u === 'k' || u === 'thousand') v *= 1000; else if (u[0] === 'm') v *= 1e6; else if (v < 10) v *= 1e6; else if (v < 5000) v *= 1000;
  return Math.round(v);
}
// Plain words to filters. Only the parts it understands are returned.
function parseWish(text) {
  let t = ' ' + String(text || '').toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ') + ' ';
  Object.keys(NUM_WORDS).forEach((w) => { t = t.replace(new RegExp('\\b' + w + '\\b(?=[\\s-]*(bed|bd|br|bath|ba|acre|car))', 'g'), String(NUM_WORDS[w])); });
  t = t.replace(/\bhalf\s+(an\s+)?acre/g, '0.5 acre').replace(/\bquarter\s+acre/g, '0.25 acre');
 const f = {};
  // Money is read from the text with sizes, lots, beds, baths and years taken out, so "2,000 sq ft" is never a price
  const tm = t.replace(/\d[\d,.]*\s*\+?\s*(?:or more\s*)?(?:-|\s)?(?:sq\.?\s?f(?:ee|oo)?t|square|sf\b|acres?|bed|bd\b|br\b|bedroom|bath|ba\b|bathroom|car)/g, ' ').replace(/\b(?:19|20)\d\d\b/g, ' ').replace(/\b9[3-6]\d{3}\b/g, ' ');
  const M = '\\$?\\s?\\d[\\d,.]*\\s?(?:k|m|mil|million|thousand)?';
  let m;
  if ((m = tm.match(new RegExp('(' + M + ')\\s*(?:-|to|and)\\s*(' + M + ')(?!\\s*(?:sq|square|sf|acre|bed|bath))')))) { const a = wishMoney(m[1]), b = wishMoney(m[2]); if (a >= 20000 && b > a) { f.min = a; f.max = b; } }
  if (!f.max && (m = tm.match(new RegExp('(?:under|below|less than|max(?:imum)?|up to|no more than|budget(?: of| is)?|<)\\s*(' + M + ')')))) { const v = wishMoney(m[1]); if (v >= 20000) f.max = v; }
  if (!f.min && (m = tm.match(new RegExp('(?:over|above|more than|at least|min(?:imum)?|starting at|>)\\s*(' + M + ')(?!\\s*(?:sq|square|sf|acre|bed|bath))')))) { const v = wishMoney(m[1]); if (v >= 20000) f.min = v; }
  if (!f.max && (m = tm.match(new RegExp('(?:around|about|near|~)\\s*(' + M + ')(?!\\s*(?:sq|square|sf|acre|bed|bath))')))) { const v = wishMoney(m[1]); if (v >= 20000) { f.min = Math.round(v * 0.9 / 5000) * 5000; f.max = Math.round(v * 1.1 / 5000) * 5000; } }
  if (!f.max && !f.min && (m = tm.match(/\$\s?(\d[\d,.]*\s?(?:k|m)?)|\b(\d[\d,.]*\s?(?:k|m|mil|million))\b/))) { const v = wishMoney(m[1] || m[2]); if (v >= 20000) f.max = v; }
  if ((m = t.match(/(\d)\s*\+?\s*(?:or more\s*)?(?:-|\s)?(?:bed|bd|br\b|bedroom)/))) f.beds = +m[1];
  if ((m = t.match(/(\d(?:\.5)?)\s*\+?\s*(?:-|\s)?(?:bath|ba\b|bathroom)/))) f.baths = Math.floor(+m[1]);
  if ((m = t.match(/(\d[\d,]{2,})\s*\+?\s*(?:sq|square|sf\b)/))) { const v = +m[1].replace(/,/g, ''); if (v >= 400 && v < 20000) f.sqft = v; }
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:or more\s*)?acres?/))) f.acres = +m[1]; else if (/acreage|land\b|room to roam/.test(t)) f.acres = 1;
  if ((m = t.match(/(?:built|newer than|built after|after|since)\s*(?:in\s*)?((?:19|20)\d\d)/)) || (m = t.match(/((?:19|20)\d\d)\s*(?:or newer|and newer|\+)/))) f.year = +m[1];
  if (/condo|townhom|townhouse/.test(t)) f.condo = true;
  const opts = optsFromText(t);
  if (opts.length) f.opts = opts;
  // Places: towns (longest names first, so "west sacramento" wins over "sacramento"), counties and ZIP codes
  const places = [];
  let rest = t;
  Object.keys(TOWN).sort((a, b) => b.length - a.length).forEach((k) => {
    const re = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b(\\s+county)?');
    const hit = rest.match(re);
    if (hit) {
      places.push(hit[1] ? TOWN[k].n + ' County' : TOWN[k].n);
      rest = rest.replace(re, ' ');
    }
  });
  MAIN_COUNTIES.concat(['El Dorado', 'Yolo', 'Sutter', 'Yuba', 'Merced']).forEach((c) => { if (new RegExp('\\b' + c.toLowerCase() + '\\s+county\\b').test(rest)) places.push(c + ' County'); });
  (t.match(/\b9[3-6]\d{3}\b/g) || []).forEach((z) => places.push(z));
  if (places.length) f.loc = [...new Set(places)].slice(0, 10).join(', ');
  return f;
}
function filterText(f) {
  return [f.loc || '', f.min && f.max ? short(f.min) + ' to ' + short(f.max) : f.max ? 'up to ' + short(f.max) : f.min ? 'from ' + short(f.min) : '',
    f.beds ? f.beds + '+ beds' : '', f.baths ? f.baths + '+ baths' : '', f.sqft ? comma(f.sqft) + '+ sq ft' : '', f.acres ? f.acres + '+ acres' : '', f.year ? 'built ' + f.year + '+' : '',
    f.condo ? 'condos and townhomes too' : ''].concat((f.opts || []).map(optName)).filter(Boolean);
}
// Several places become one BoldTrail list of up to 10 towns
function idxWhere(loc) {
  const parts = String(loc || '').split(',').map((s) => s.trim()).filter(Boolean);
  return [...new Set(parts.map((x) => (TOWN[x.toLowerCase()] ? TOWN[x.toLowerCase()].n : idxPlace(x))).join(',').split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 20).join(',');
}

/* ===== Homes like this one, from the whole MLS ===== */
const firstNum = (v) => parseFloat(String(v || '').match(/\d+(\.\d+)?/) || 0) || 0;
const round5k = (v) => Math.round(v / 5000) * 5000;
function likeThis(p, step) {
  const beds = firstNum(p.beds), baths = firstNum(p.baths), sqft = +p.sqft || 0, price = +p.price || 0;
  const text = [p.hook, p.about, p.place, p.addr].join(' ');
  const opts = optsFromText(text).filter((o) => o !== 'openhouses' && o !== 'reduced');
  if ((p.kind === 'community' || p.kind === 'stockton') && !opts.includes('newconstruction')) opts.push('newconstruction');
  const town = p.city || '', county = p.county ? p.county + ' County' : town;
  const tight = [0.12, 0.25, 0.4][step];
  return {
    loc: step === 0 ? town : county,
    beds: step === 0 ? beds : Math.max(0, beds - 1), baths: step === 0 ? Math.floor(baths) : Math.max(0, Math.floor(baths) - 1),
    sqft: step === 2 || !sqft ? 0 : Math.floor(sqft * (step === 0 ? 0.88 : 0.75) / 100) * 100,
    min: price ? round5k(price * (1 - tight)) : 0, max: price ? round5k(price * (1 + tight)) : 0,
    opts: step === 0 ? opts : opts.filter((o) => o === 'pool' || o === 'adult' || o === '1story').slice(0, step === 2 ? 0 : 3)
  };
}
function mlsLikeHtml(p) {
  if (!p || !p.price) return '';
  const f = likeThis(p, 0);
  return '<div class="panel ml-box" id="ml-box" data-k="' + esc(p.key) + '" data-step="0">' +
    '<p class="mono eyebrow">Every home like this on the MLS</p><h3>Homes that match this one</h3>' +
    '<p class="note">Matched on ' + esc(filterText(f).join(', ')) + '. These are live from the MLS, including homes listed today.</p>' +
    '<div class="ctas" style="margin:10px 0 0"><button type="button" class="btn btn-pa" data-mlike="0">Show homes like this</button>' +
      '<button type="button" class="btn btn-line" data-mlike="1">Widen the search</button><button type="button" class="btn btn-line" data-mlike="2">Widen it more</button></div>' +
    '<div class="ml-frame" hidden><iframe title="Homes like this one" loading="lazy" allow="geolocation; fullscreen"></iframe></div>' +
    '<p class="fine" id="ml-open" hidden><a target="_blank" rel="noopener" href="#">Open full screen ↗</a> · Tap the heart on homes you like there and Darien sends you more like them.</p></div>';
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-mlike]');
  if (!b) return;
  const box = b.closest('#ml-box'), p = PROP_BY[box.dataset.k];
  if (!p) return;
  const step = +b.dataset.mlike, f = likeThis(p, step);
  const url = idxUrl(f);
  box.querySelector('.note').textContent = (step ? 'Widened to ' : 'Matched on ') + filterText(f).join(', ') + '. These are live from the MLS, including homes listed today.';
  const fr = box.querySelector('.ml-frame');
  fr.hidden = false;
  fr.querySelector('iframe').src = url;
  const op = box.querySelector('#ml-open');
  op.hidden = false;
  op.querySelector('a').href = track(url, { h: 'Homes like ' + propTitle(p, false), s: 'BoldTrail' });
  box.querySelectorAll('[data-mlike]').forEach((x) => { x.className = 'btn ' + (x === b ? 'btn-pa' : 'btn-line'); });
  const what = (step ? 'Widened search like ' : 'Homes like ') + propTitle(p, false) + ': ' + filterText(f).join(', ');
  beacon('click', { h: what.slice(0, 140), s: 'BoldTrail', p: '', b: '', r: '', pg: navName(), u: url.slice(0, 500) });
  logStep(what);
});

/* ===== What they like: built from hearts, thumbs-downs and the dream search ===== */
function taste() {
  if (typeof saved === 'undefined' || typeof NOPE === 'undefined') return null;
  const liked = [...saved.keys()].map(propOfCard).filter((p) => p && p.price);
  if (!liked.length) return null;
  const noped = [...NOPE].map(propOfCard).filter(Boolean);
  const prices = liked.map((p) => p.price).sort((a, b) => a - b);
  const med = prices[Math.floor(prices.length / 2)];
  const lo = Math.min(prices[0], med * 0.85), hi = Math.max(prices[prices.length - 1], med * 1.15);
  const towns = {};
  liked.forEach((p) => { if (p.city) towns[p.city] = (towns[p.city] || 0) + 1; });
  noped.forEach((p) => { if (p.city && towns[p.city]) towns[p.city] -= 0.5; });
  const where = Object.keys(towns).filter((k) => towns[k] > 0).sort((a, b) => towns[b] - towns[a]).slice(0, 5);
  const bedsL = liked.map((p) => firstNum(p.beds)).filter(Boolean).sort((a, b) => a - b);
  const count = {};
  liked.forEach((p) => optsFromText([p.hook, p.about, p.place].join(' ')).forEach((o) => { count[o] = (count[o] || 0) + 1; }));
  const opts = Object.keys(count).filter((o) => o !== 'openhouses' && o !== 'reduced' && count[o] >= Math.max(1, liked.length / 2));
  if (liked.every((p) => p.kind === 'community' || p.kind === 'stockton') && !opts.includes('newconstruction')) opts.push('newconstruction');
  const f = { loc: where.join(', '), min: round5k(lo * 0.95), max: round5k(hi * 1.05), beds: bedsL.length ? bedsL[0] : 0, baths: 0, opts };
  if (typeof DREAM !== 'undefined' && DREAM.saved) {
    if (!f.loc && DREAM.areas) f.loc = DREAM.areas;
    if (DREAM.max && DREAM.max < f.max) f.max = DREAM.max;
    if (DREAM.beds > f.beds) f.beds = DREAM.beds;
    if (DREAM.baths) f.baths = DREAM.baths;
  }
  return { f, n: liked.length, nope: noped.length };
}

/* ===== The search page extras: describe it, homes like your likes, and sellers ===== */
let WISH_RUN = '';
function wishHtml() {
  const T = taste();
  return '<section class="blk"><div class="wrap"><div class="panel accent wish" style="display:grid;gap:10px">' +
    '<label for="ms-wish"><b>Describe the home you want</b> <span class="note">in your own words, and the filters fill in for you</span></label>' +
    '<textarea id="ms-wish" rows="2" placeholder="For example: 4 bed 3 bath single story with a pool in Folsom or Roseville under $850k, at least 2,000 sq ft"></textarea>' +
    '<div class="ctas" style="margin:0"><button type="button" class="btn btn-pa" id="ms-wish-go">Find these homes</button>' +
      (T ? '<button type="button" class="btn btn-line" id="ms-taste">Homes like the ' + plural(T.n, 'home') + ' you liked</button>' : '') + '</div>' +
    '<p class="note" id="ms-wish-out"' + (WISH_RUN ? '' : ' hidden') + '>' + esc(WISH_RUN) + '</p>' +
    (T ? '' : '<p class="fine">Tip: tap the heart on homes you like and the thumbs-down on ones you don\'t. The site learns your taste and builds a search from it.</p>') +
    '</div></div></section>';
}
function sellerHtml() {
  return '<section class="blk"><div class="wrap"><div class="panel seller"><div><p class="mono eyebrow">Selling too?</p><h2>What\'s your home worth?</h2>' +
    '<p>Get a free home value from Darien. You choose whether you also want a market report each month with what\'s selling near you.</p></div>' +
    '<div class="ctas" style="margin:0"><a class="btn btn-pa" id="sell-val" target="_blank" rel="noopener" href="' + esc(track(IDX + '/seller/valuation/', { h: 'Home value request', s: 'BoldTrail' })) + '">Get my home value</a>' +
      '<a class="btn btn-line" href="' + esc('sms:+12098826469?&body=' + encodeURIComponent('Hi Darien, I\'m thinking about selling my home. Can you send me a market report?')) + '">Text Darien for a market report</a></div></div></div></section>';
}
function mountWish(root, F, show) {
  const go1 = (f, label, raw) => {
    Object.assign(F, { loc: '', min: 0, max: 0, beds: 0, baths: 0, sqft: 0, acres: 0, year: 0, condo: false, opts: [] });
    ['loc', 'min', 'max', 'beds', 'baths', 'sqft', 'acres', 'year'].forEach((k) => { if (f[k] !== undefined) F[k] = f[k]; });
    if (f.condo) F.condo = true;
    if (f.opts) F.opts = [...new Set(f.opts)];
    F.pool = false;
    save();
    WISH_RUN = label + ': ' + (filterText(F).join(', ') || 'every home');
    beacon('click', { h: (raw ? 'Described: "' + raw + '"' : label).slice(0, 140), s: 'Smart search', p: '', b: '', r: '', pg: 'Map search', u: '' });
    logStep(raw ? 'Described the home: ' + raw : label);
    render('search', true);
    const fr = $('ms-iframe');
    if (fr) fr.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const w = root.querySelector('#ms-wish');
  const run = () => {
    const raw = w.value.trim();
    if (!raw) { w.focus(); return; }
    const f = parseWish(raw);
    if (!Object.keys(f).length) {
      const out = root.querySelector('#ms-wish-out');
      out.hidden = false;
      out.textContent = 'Try adding a town, a price, or beds and baths, like "3 bed in Galt under 550k".';
      return;
    }
    go1(f, 'Searching for', raw);
  };
  root.querySelector('#ms-wish-go').addEventListener('click', run);
  w.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } });
  const tb = root.querySelector('#ms-taste');
  if (tb) tb.addEventListener('click', () => { const T = taste(); if (T) go1(Object.assign({ sqft: 0, acres: 0, year: 0 }, T.f), 'Homes like the ones you liked'); });
  root.querySelectorAll('#sell-val').forEach((a) => a.addEventListener('click', () => logStep('Asked for a home value')));
}
