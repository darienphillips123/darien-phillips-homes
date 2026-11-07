/* ===== New-build deals: the best builder incentives in each city and their move-in-ready homes =====
   From builder websites and NewHomeSource, checked DEALS.asof. Offers with an end date disappear the day after they end. */
const DEALS = __DEALS_JSON__;
DEALS.communities.forEach((c, i) => {
  c.id = 'd' + i;
  c.city = String(c.city || '').replace(/\s*\(.*\)\s*$/, '');
  c.county = c.county || countyOf(c.city) || '';
});
const localISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const liveDeals = (c) => (c.incentives || []).filter((i) => !i.ends || i.ends >= localISO());
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const niceDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return MONTHS[m - 1] + ' ' + d; };
function endsText(i) {
  if (!i.ends) return { t: 'Limited time, so ask Darien if it\'s still on', soon: false };
  const [y, m, d] = i.ends.split('-').map(Number);
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(y, m - 1, d) - t0) / 86400000);
  return { t: days <= 0 ? 'Ends today' : days === 1 ? 'Ends tomorrow (' + niceDate(i.ends) + ')' : 'Ends in ' + days + ' days (' + niceDate(i.ends) + ')', soon: days <= 7 };
}
// The strongest offers first: real end dates and rate buydowns or credits rank above plain "limited time" price cuts
function dealRank(c) {
  return liveDeals(c).reduce((s, i) => s + (i.ends ? 3 : 1) + (/\d(\.\d+)?%/.test(i.title) ? 2 : 0) + (/credit|closing|flex|design|upgrade/i.test(i.title) ? 1 : 0), 0) + Math.min(3, (c.qmi || []).length * 0.5);
}
const nbLotOpts = [[0, 'Any lot size'], [0.12, '5,000+ sq ft lot'], [0.15, '6,500+ sq ft lot'], [0.25, '1/4 acre+'], [0.5, '1/2 acre+'], [1, '1 acre+']];
const nbMaxSizeOpts = [[0, 'Any'], [1600, 'Up to 1,600 sq ft'], [2000, 'Up to 2,000 sq ft'], [2500, 'Up to 2,500 sq ft'], [3000, 'Up to 3,000 sq ft'], [3500, 'Up to 3,500 sq ft']];
function dealFits(c, N) {
  return inPlace(c) && (!N.max || !c.price_min || c.price_min <= N.max) &&
    (!N.sqft || !c.sqft_max || c.sqft_max >= N.sqft) && (!N.sqftMax || !c.sqft_min || c.sqft_min <= N.sqftMax) &&
    (!N.builder || c.builder === N.builder);
}
function qmiFits(h, N) {
  return (!N.max || !h.price || h.price <= N.max) && (!N.beds || !h.beds || h.beds >= N.beds) &&
    (!N.sqft || !h.sqft || h.sqft >= N.sqft) && (!N.sqftMax || !h.sqft || h.sqft <= N.sqftMax) &&
    (!N.lot || !h.lot || h.lot >= N.lot * 43560);
}
function dealCard(c) {
  const deals = liveDeals(c).slice(0, 3);
  const cityTxt = c.city + (c.county && c.county !== c.city ? ' · ' + c.county + ' County' : '');
  return '<article class="card deal"><div class="head"><span class="pill pa">' + esc(cityTxt) + '</span>' + ((c.qmi || []).length ? '<span class="pill ok">' + plural(c.qmi.length, 'move-in ready home') + '</span>' : '') + '</div>' +
    '<div><h3>' + esc(c.name) + '</h3><div class="sub">' + esc(c.builder + (c.price_min ? ' · from ' + money(c.price_min) : '') + (c.sqft_min ? ' · ' + comma(c.sqft_min) + (c.sqft_max ? '–' + comma(c.sqft_max) : '+') + ' sq ft' : '')) + '</div></div>' +
    '<ul class="deal-list">' + deals.map((i) => { const e = endsText(i); return '<li><b>' + esc(i.title) + '</b>' + (i.detail ? '<span>' + esc(i.detail) + '</span>' : '') + (i.conditions ? '<span class="fine">' + esc(i.conditions) + '</span>' : '') + '<span class="ends' + (e.soon ? ' soon' : '') + '">' + esc(e.t) + '</span></li>'; }).join('') + '</ul>' +
    '<div class="optlist"><a class="btn btn-pa btn-sm" href="' + esc('sms:+12098826469?&body=' + encodeURIComponent('Hi Darien, I saw the deal at ' + c.name + ' by ' + c.builder + ' in ' + c.city + ' on your website. Can you tell me more?')) + '">Ask Darien about this deal</a>' +
      (c.url ? '<a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="' + esc(track(c.url, { h: c.name + ' (' + c.builder + ')', s: c.builder })) + '">Builder page ↗</a>' : '') + '</div></article>';
}
function qmiCard(h, c) {
  const facts = [h.beds ? h.beds + ' bd' : '', h.baths ? h.baths + ' ba' : '', h.sqft ? comma(h.sqft) + ' sq ft' : '', h.lot ? comma(h.lot) + ' sq ft lot' : ''].filter(Boolean).join(' · ');
  const deal = liveDeals(c)[0];
  return '<article class="card qmi"><div class="head"><span class="pill ok">' + esc(h.ready ? 'Move-in: ' + h.ready : 'Move-in ready') + '</span><span class="pill pa">' + esc(c.city) + '</span></div>' +
    '<div><h3>' + esc(h.plan ? h.plan + ' at ' + c.name : c.name) + '</h3><div class="sub">' + esc((h.addr ? h.addr + ' · ' : '') + c.builder) + '</div></div>' +
    (h.price ? '<div class="price num">' + money(h.price) + '</div>' : '') + (facts ? '<div class="facts">' + esc(facts) + '</div>' : '') +
    (h.deal ? '<div class="sub"><b>' + esc(h.deal) + '</b></div>' : '') + (deal ? '<div class="sub">Plus: ' + esc(deal.title) + ' · ' + esc(endsText(deal).t) + '</div>' : '') +
    '<div class="optlist"><a class="btn btn-line btn-sm" href="' + esc('sms:+12098826469?&body=' + encodeURIComponent('Hi Darien, I\'d like to see the move-in ready ' + (h.plan || 'home') + (h.addr ? ' at ' + h.addr : '') + ' in ' + c.name + ', ' + c.city + '.')) + '">Text Darien to see it</a></div></article>';
}
function dealsSection(N, shown) {
  const list = DEALS.communities.filter((c) => dealFits(c, N) && liveDeals(c).length).sort((a, b) => dealRank(b) - dealRank(a));
  // At most 3 per city, so every city gets a turn near the top
  const per = {}, top = [];
  list.forEach((c) => { per[c.city] = (per[c.city] || 0) + 1; if (per[c.city] <= 3) top.push(c); });
  if (!top.length) return '<div class="empty"><h3>No builder deals match these filters right now</h3><p>Try another area or a higher price. Darien hears about new builder deals every week, so text 209.882.6469 and he\'ll tell you what\'s coming.</p></div>';
  return '<div class="cards">' + top.slice(0, shown).map(dealCard).join('') + '</div>' +
    (top.length > shown ? '<div class="more-row"><button type="button" class="btn btn-line" id="nbd-more">Show more deals (' + (top.length - shown) + ')</button></div>' : '');
}
function qmiSection(N, shown) {
  const all = [];
  DEALS.communities.filter((c) => inPlace(c) && (!N.builder || c.builder === N.builder)).forEach((c) => (c.qmi || []).forEach((h) => { if (qmiFits(h, N)) all.push([h, c]); }));
  all.sort((a, b) => (a[0].price || 9e9) - (b[0].price || 9e9));
  if (!all.length) return '<div class="empty"><h3>No move-in ready homes match these filters</h3><p>Try a bigger price range or fewer must-haves.</p></div>';
  return '<p class="count">' + plural(all.length, 'move-in ready home') + ' · from ' + money(all[0][0].price || 0) + '</p><div class="cards">' + all.slice(0, shown).map(([h, c]) => qmiCard(h, c)).join('') + '</div>' +
    (all.length > shown ? '<div class="more-row"><button type="button" class="btn btn-line" id="nbq-more">Show more move-in ready homes (' + (all.length - shown) + ')</button></div>' : '');
}
// Lot size: builders rarely post lot sizes, so the MLS map does the lot-size search for new construction
function nbMapSearch(N) {
  const F = sub('search', {});
  Object.assign(F, { loc: S.place ? placeLabel(S.place) : '', min: 0, max: N.max || 0, beds: N.beds || 0, baths: 0, sqft: N.sqft || 0, acres: N.lot || 0, year: 0, condo: false, opts: ['newconstruction'], pool: false });
  save();
  logStep('New builds on the map: ' + [F.loc, N.max ? 'up to ' + short(N.max) : '', N.sqft ? comma(N.sqft) + '+ sq ft' : '', N.lot ? N.lot + '+ acre lot' : ''].filter(Boolean).join(', '));
  go('search', true);
}
