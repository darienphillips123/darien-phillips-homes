/* ===== ADUs: can this home have one, the city's rules and free plans, and homes with room for one =====
   State rules and city pages from HCD, the Government Code and each city's own ADU page, checked ADU.asof. */
const ADU = __ADU_JSON__;
const aduPlace = (n) => ADU.places.find((p) => p.name.toLowerCase() === String(n || '').toLowerCase()) || null;
const aduCounty = (n) => ADU.places.find((p) => p.kind === 'county' && p.name.toLowerCase().replace(/\s*\(.*\)/, '').replace(/ county$/, '') === String(n || '').toLowerCase()) || null;
const ADU_TOWNS = Array.from(new Set(ADU.places.filter((p) => p.kind === 'city').map((p) => p.name).concat(Object.values(TOWN).map((t) => t.n)))).sort();
const ADU_LOTS = [[0, 'Not sure'], [3000, 'Under 4,000 sq ft'], [4500, '4,000 to 5,000 sq ft'], [5500, '5,000 to 6,500 sq ft'], [7000, '6,500 to 8,000 sq ft'], [9000, '8,000 to 10,000 sq ft'], [12000, '10,000 sq ft to 1/2 acre'], [30000, '1/2 acre or more']];
const aduRule = (re) => (ADU.state.find((s) => re.test(s.topic)) || {}).rule || '';
function aduAnswer(A) {
  const town = A.town, lot = +A.lot || 0, type = A.type;
  const P = aduPlace(town), C = aduCounty(countyOf(town) || '');
  const out = [];
  if (type === 'condo') {
    out.push(['Condo or townhome', 'ADUs on condo and townhome lots are added on the shared (common) land, so the HOA and the building owners decide. A junior ADU (JADU) needs a single-family home. Darien can check a specific complex for you.']);
  } else if (type === 'multi') {
    out.push(['Duplex or apartment lot', aduRule(/multifamily/i) || 'Lots with two or more units can add ADUs by converting unused space and building detached units, under state law.']);
  } else {
    out.push(['Yes, in most cases', 'State law allows an ADU on any lot zoned for a single-family home, and also a junior ADU (JADU) inside the house. Cities can\'t require a minimum lot size, and they must allow at least an 800 sq ft unit with 4-foot side and rear setbacks.']);
    if (lot && lot < 4000) out.push(['Smaller lot', 'On a lot this size a garage conversion, an attached ADU or a JADU inside the home is usually the easiest fit. A detached unit is still allowed up to 800 sq ft with 4-foot setbacks.']);
    else if (lot && lot < 6500) out.push(['Room for a detached ADU', 'A lot this size usually fits a detached backyard cottage of about 600 to 800 sq ft, or a garage conversion.']);
    else if (lot) out.push(['Plenty of room', 'A lot this size usually fits a detached ADU up to 1,000 to 1,200 sq ft, and possibly an ADU plus a JADU. Ask about SB 9 lot splits too.']);
  }
  if (A.hoa === 'yes') out.push(['HOA', aduRule(/HOA|homeowner/i) || 'An HOA can\'t ban an ADU or JADU on a single-family lot, but it can set reasonable rules.']);
  const where = P || C;
  out.push([town ? town + ' rules and plans' : 'Your city', where ? (where.note || '') + (where.preapproved_plans ? ' Pre-approved ADU plans are available.' : '') : 'Darien can pull the city\'s ADU rules and fees for you.', where && where.url ? where.url : '']);
  return out;
}
def('adu', {
  nav: 'ADUs', scene: 'build', kicker: 'Accessory dwelling units', tileTitle: 'ADU checker',
  title: 'Can the home you want have an ADU?',
  sub: 'Find out if a home can add a backyard cottage, garage conversion or in-law suite, see your city\'s rules and free plans, and search homes with room for one.',
  ctas: () => '<a class="btn btn-ghost" href="' + esc('sms:+12098826469?&body=' + encodeURIComponent('Hi Darien, I\'m looking for a home that has an ADU or room to add one.')) + '">Text Darien</a>',
  html() {
    const A = sub('adu', { town: S.place && S.place.k === 'town' ? S.place.n : '', type: 'single', lot: 0, hoa: 'no' });
    return '<section class="blk"><div class="wrap"><div class="panel accent" style="display:grid;gap:12px">' +
      '<h2 style="margin:0">ADU checker</h2>' +
      '<div class="fields">' + sel('adu-town', [['', 'Pick a city or town']].concat(ADU_TOWNS.map((t) => [t, t])), A.town, 'City or town') +
        sel('adu-type', [['single', 'Single-family home'], ['condo', 'Condo or townhome'], ['multi', 'Duplex or more units']], A.type, 'Type of home') +
        sel('adu-lot', ADU_LOTS.map(([v, t]) => [String(v), t]), String(A.lot), 'Lot size') +
        sel('adu-hoa', [['no', 'No HOA'], ['yes', 'Has an HOA']], A.hoa, 'HOA') + '</div>' +
      '<div id="adu-out" aria-live="polite"></div>' +
      '<div class="ctas" style="margin:0"><button type="button" class="btn btn-pa" id="adu-map">See homes with room for an ADU</button>' +
        '<a class="btn btn-line" id="adu-ask" href="#">Ask Darien for homes that already have an ADU</a></div>' +
      '<p class="note">The map search shows single-family homes in that area on lots big enough for a detached ADU. Homes that already have an ADU or guest house are listed in the MLS remarks, so Darien searches those for you.</p>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">California law</p><h2>The ADU rules in plain English</h2><p>These apply in every city. Cities can be more generous, but not stricter. General information, not legal advice, so check with the city before you buy.</p></div></div>' +
      '<div class="cards">' + ADU.state.filter((s) => !/Governing law/i.test(s.topic)).map((s) => '<article class="card"><h3>' + esc(s.topic) + '</h3><div class="sub">' + esc(s.rule) + '</div>' + (s.src ? '<a class="src" target="_blank" rel="noopener" href="' + esc(s.src) + '">Source ↗</a>' : '') + '</article>').join('') + '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Every city</p><h2>City ADU pages and pre-approved plans</h2></div></div><div class="cards">' +
      ADU.places.map((p) => '<article class="card"><div class="head"><span class="pill ' + (p.preapproved_plans ? 'ok' : 'pa') + '">' + esc(p.preapproved_plans ? 'Pre-approved plans' : p.kind === 'county' ? 'County' : 'City') + '</span></div><h3>' + esc(p.name) + '</h3><div class="sub">' + esc(p.note || '') + '</div>' + (p.url ? '<a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="' + esc(p.url) + '">ADU page ↗</a>' : '') + '</article>').join('') +
      '</div><p class="src" style="margin-top:12px">Checked ' + esc(ADU.asof) + '.</p></div></section>';
  },
  mount(root) {
    const A = S.adu;
    const draw = () => {
      $('adu-out').innerHTML = '<div class="deal-list" style="list-style:none">' + aduAnswer(A).map(([t, d, u]) => '<li style="list-style:none"><b>' + esc(t) + '</b><span>' + esc(d) + '</span>' + (u ? '<a target="_blank" rel="noopener" href="' + esc(u) + '">City ADU page ↗</a>' : '') + '</li>').join('') + '</div>';
      $('adu-ask').href = 'sms:+12098826469?&body=' + encodeURIComponent('Hi Darien, can you find homes' + (A.town ? ' in ' + A.town : '') + ' that already have an ADU or guest house?');
    };
    [['adu-town', 'town'], ['adu-type', 'type'], ['adu-lot', 'lot'], ['adu-hoa', 'hoa']].forEach(([id, k]) => $(id).addEventListener('change', () => { A[k] = $(id).value; save(); draw(); logStep('ADU checker: ' + [A.town, A.type, A.lot ? A.lot + ' sq ft lot' : '', A.hoa === 'yes' ? 'HOA' : ''].filter(Boolean).join(', ')); }));
    $('adu-map').addEventListener('click', () => {
      const F = sub('search', {});
      Object.assign(F, { loc: A.town || (S.place ? placeLabel(S.place) : ''), min: 0, max: 0, beds: 0, baths: 0, sqft: 0, acres: (+A.lot || 0) >= 6500 ? Math.round(+A.lot / 43560 * 100) / 100 : 0.15, year: 0, condo: false, opts: [], pool: false });
      save(); logStep('ADU map search: ' + (F.loc || 'all areas'));
      go('search', true);
    });
    draw();
  }
});
