/* ===== Refinance and payment help ===== */
def('refinance', {
  nav: 'Refinance', scene: 'refinance', kicker: 'Payment help and refinancing', tileTitle: 'Refinance help',
  title: 'Lower your payment or use your equity',
  sub: 'See what a refinance would do to your payment, how long it takes to earn back the costs, and which options fit your loan.',
  html() {
    const R = sub('refi', { balance: 380000, rate: 7.75, years: 28, value: 520000, type: 'conv', newRate: '', term: 30, costs: 6000, cashout: 0 });
    return '<section class="blk"><div class="wrap"><div class="calc">' +
      '<div class="panel accent" style="display:grid;gap:12px"><span class="lbl">Your loan now</span><div class="fields">' +
        moneyField('rf-bal', 'Loan balance', R.balance) + pctField('rf-rate', 'Current rate', R.rate) +
        '<div class="field"><label for="rf-years">Years left</label><input id="rf-years" type="text" inputmode="numeric" value="' + esc(R.years) + '"></div>' +
        moneyField('rf-value', 'Home value (estimate)', R.value) +
        sel('rf-type', [['conv', 'Conventional'], ['fha', 'FHA'], ['va', 'VA']], R.type, 'Loan type') +
      '</div><span class="lbl">The new loan</span><div class="fields">' +
        pctField('rf-new', 'New rate', R.newRate || defaultRefiRate(R), 'Recent average for this loan and term') +
        sel('rf-term', [[30, '30 years'], [20, '20 years'], [15, '15 years']], R.term, 'New term') +
        moneyField('rf-costs', 'Closing costs', R.costs, 'Often 2% to 3% of the loan') +
        moneyField('rf-cash', 'Cash out (optional)', R.cashout, '', '0') +
      '</div></div>' +
      '<div class="result" aria-live="polite"><span class="lbl">New monthly loan payment</span><div class="big num" id="rf-new-pi">$0</div><div id="rf-out"></div><p class="note" id="rf-note"></p></div>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Your refinance options</h2><p>Options that fit the loan you entered are outlined in green. A lender confirms what you qualify for.</p></div></div><div class="opts" id="rf-opts"></div>' +
      '<div class="panel bar" style="margin-top:14px"><div><b>Want a lender\'s real numbers?</b><p class="note">Darien can connect you with lenders for refinances, VA and FHA streamlines, and cash-out loans.</p></div><a class="btn btn-pa" href="sms:+12098826469?&body=' + encodeURIComponent('Hi Darien, can you connect me with a lender about refinancing?') + '">Text Darien</a></div></div></section>' + touredStripHtml();
  },
  mount() {
    const R = S.refi;
    const draw = () => {
      const newRate = parseNum(R.newRate) || defaultRefiRate(R);
      const curPI = pmt(R.balance, R.rate, R.years * 12);
      let fee = 0, feeLabel = '';
      if (R.type === 'va') { fee = (R.balance + R.cashout) * (R.cashout > 0 ? 0.0215 : 0.005); feeLabel = R.cashout > 0 ? 'VA funding fee (2.15%)' : 'VA funding fee (0.5%)'; }
      if (R.type === 'fha') { fee = (R.balance + R.cashout) * 0.0175; feeLabel = 'FHA upfront premium (1.75%)'; }
      const loan = R.balance + R.cashout + fee;
      const newPI = pmt(loan, newRate, R.term * 12);
      const diff = newPI - curPI;
      const ltv = R.value ? loan / R.value : 0;
      const be = diff < 0 ? Math.ceil(R.costs / -diff) : null;
      const intNow = curPI * R.years * 12 - R.balance;
      const intNew = newPI * R.term * 12 - loan;
      $('rf-new-pi').textContent = money(newPI);
      $('rf-out').innerHTML = '<ul class="break">' +
        '<li><span>Current payment (principal and interest)</span><span>' + money(curPI) + '</span></li>' +
        '<li><span>New payment</span><span>' + money(newPI) + '</span></li>' +
        '<li class="strong"><span>' + (diff <= 0 ? 'You\'d save each month' : 'Your payment goes up') + '</span><span>' + money(Math.abs(diff)) + '</span></li>' +
        '<li><span>New loan amount</span><span>' + money(loan) + '</span></li>' + (fee ? '<li><span>' + esc(feeLabel) + ', added to the loan</span><span>' + money(fee) + '</span></li>' : '') +
        '<li><span>Loan-to-value</span><span>' + (R.value ? Math.round(ltv * 100) + '%' : 'Add a value') + '</span></li>' +
        '<li><span>Months to earn back the closing costs</span><span>' + (be ? be : 'Doesn\'t pay back') + '</span></li>' +
        '<li><span>Interest left to pay: now vs. new</span><span>' + short(Math.max(intNow, 0)) + ' vs. ' + short(Math.max(intNew, 0)) + '</span></li></ul>';
      const notes = [];
      if (R.cashout > 0 && R.type !== 'va' && ltv > 0.8) notes.push('Cash-out refinances usually top out at 80% of the home\'s value for conventional and FHA loans. Lower the cash out or check the value.');
      if (R.rate - newRate < 0.5 && R.cashout === 0) notes.push('The new rate is less than half a point lower, so a rate-only refinance may not pay off.');
      if (be && be > 60) notes.push('It takes over five years to earn back the costs. Plan to keep the loan at least that long.');
      $('rf-note').textContent = notes.join(' ') || 'Payment shows principal and interest only. Property tax, insurance and mortgage insurance stay about the same.';
      const drop = R.rate - newRate;
      const opts = [
        ['Rate-and-term refinance', 'Any loan', ['Replace your loan with a lower rate or a different term.', 'Worth it when the savings pay back the closing costs before you sell.'], drop >= 0.5 && R.cashout === 0],
        ['Cash-out refinance', 'Use your equity', ['Borrow against your home for projects, debt payoff or a down payment.', 'Conventional and FHA usually allow up to 80% of the home\'s value. VA can allow more.'], R.cashout > 0],
        ['FHA Streamline', 'Current FHA loans', ['No appraisal. You need 210 days and six on-time payments on your current FHA loan.', 'The new payment has to be meaningfully lower, usually about half a point on the rate. No cash out.'], R.type === 'fha' && R.cashout === 0 && drop >= 0.5],
        ['VA IRRRL', 'Current VA loans', ['VA\'s streamline refinance. The funding fee is 0.5%, and VA doesn\'t require an appraisal.', 'A fixed rate has to drop at least 0.5%, and the costs must pay back within 36 months.'], R.type === 'va' && R.cashout === 0 && drop >= 0.5 && be && be <= 36],
        ['Shorter term', '15 or 20 years', ['15-year rates averaged ' + RATES.conv15 + '% on Oct 29, 2026, versus ' + RATES.conv + '% for 30 years.', 'The payment is higher, but you pay far less interest.'], R.term < 30],
        ['Drop mortgage insurance', 'FHA or low down payment', ['Conventional PMI can come off around 20% to 22% equity.', 'FHA mortgage insurance often lasts the life of the loan, so refinancing to conventional can remove it once you have 20% equity.'], (R.type === 'fha' && R.value && R.balance / R.value <= 0.8)],
        ['Recast', 'Keep your rate', ['Pay down a lump sum and ask your lender to re-figure the payment on the lower balance.', 'Many lenders charge a small fee. FHA and VA loans usually can\'t be recast.'], false]
      ];
      $('rf-opts').innerHTML = opts.map(([t, k, pts, hit]) => '<article class="opt' + (hit ? ' hit' : '') + '"><span class="mono">' + esc(k) + (hit ? ' · fits your loan' : '') + '</span><h3>' + esc(t) + '</h3><ul>' + pts.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul></article>').join('');
    };
    bindMoney('rf-bal', (v) => { if (v > 0) { R.balance = v; save(); draw(); } });
    bindMoney('rf-value', (v) => { R.value = v > 0 ? v : 0; save(); draw(); });
    bindMoney('rf-costs', (v) => { R.costs = v >= 0 ? v : 0; save(); draw(); });
    bindMoney('rf-cash', (v) => { R.cashout = v > 0 ? v : 0; save(); draw(); });
    $('rf-rate').addEventListener('input', () => { const v = parseNum($('rf-rate').value); if (v > 0) { R.rate = v; save(); draw(); } });
    $('rf-years').addEventListener('input', () => { const v = parseNum($('rf-years').value); if (v > 0 && v <= 40) { R.years = v; save(); draw(); } });
    $('rf-type').addEventListener('change', () => { R.type = $('rf-type').value; R.newRate = ''; $('rf-new').value = defaultRefiRate(R); save(); draw(); });
    $('rf-term').addEventListener('change', () => { R.term = +$('rf-term').value; R.newRate = ''; $('rf-new').value = defaultRefiRate(R); save(); draw(); });
    $('rf-new').addEventListener('input', () => { R.newRate = $('rf-new').value; save(); draw(); });
    draw();
  }
});
function defaultRefiRate(R) {
  if (R.type === 'va') return RATES.va;
  if (R.type === 'fha') return RATES.fha;
  return +R.term <= 15 ? RATES.conv15 : RATES.conv;
}

/* ===== Build a Home vendors, v5, Nov 9, 2026 =====
   Researched in ChatGPT, Nov 9, 2026, 35 unique builders. County
   lists are research shortlists, not a statistically verified
   ranking. City lists show builders serving the city, whatever
   number was available, not a forced top 10. Costs are ESTIMATES
   only, not a builder price. No names, prices or links invented. */
const BUILD_VENDORS_HTML = "<section id=\"build-home\">\n    <h2>Build a Home, top rated vendors by county and city</h2>\n    <p class=\"sub\">Popular homes are at the start of the site, Darien likes those, they stay. Below is the vendor reference list for Build a Home, researched in ChatGPT, Nov 9, 2026, 35 unique builders. County lists are research shortlists, not a statistically verified ranking of the five highest rated builders. City lists include builders serving the city even when their office is elsewhere, and the home base location is given for that reason. Links go to the vendor website where ChatGPT gave one, or to Houzz where ChatGPT gave a Houzz profile. Where ChatGPT found no social profile, this page says \"No social link found\", and no social link was invented.</p>\n    <h3 style=\"font-size:19px;margin:14px 0 10px;\">Estimated cost to build a home, ESTIMATE only</h3>\n    <p class=\"sub\">These are ESTIMATES only, independent planning ESTIMATES from ChatGPT, Nov 9, 2026, not advertised or official prices from any specific builder. They exclude land acquisition, major site development, financing, and soft costs unless stated. No builder publishes a full pricing sheet online in the sources checked, they quote per project, so ask the vendor, or ask Darien, for a pricing sheet for your lot and plan.</p>\n    <table class=\"vendor-table\"><tr><th>County</th><th>ESTIMATED cost per sq ft</th><th>ESTIMATED total, 2,000 to 3,000 sq ft</th></tr>\n    <tr><td>Placer County</td><td>ESTIMATED $300 to $500 per sq ft</td><td>ESTIMATED $600,000 to $1,500,000</td></tr>\n    <tr><td>Sacramento County</td><td>ESTIMATED $275 to $450 per sq ft</td><td>ESTIMATED $550,000 to $1,350,000</td></tr>\n    <tr><td>San Joaquin County</td><td>ESTIMATED $250 to $400 per sq ft</td><td>ESTIMATED $500,000 to $1,200,000</td></tr>\n    <tr><td>Stanislaus County</td><td>ESTIMATED $240 to $390 per sq ft</td><td>ESTIMATED $480,000 to $1,170,000</td></tr></table>\n    <p class=\"sub\">Example, ESTIMATE only: a 2,500 sq ft home at an assumed $350 per sq ft equals $875,000 base construction, plus a 20 percent additional planning allowance, $175,000, equals $1,050,000 ESTIMATED total, excluding land purchase. Budget separately for permits, impact fees, architectural and engineering services, and other soft costs.</p>\n    <h3 style=\"font-size:19px;margin:22px 0 10px;\">Placer County, 5 builders</h3>\n    <table class=\"vendor-table\"><tr><th>Vendor</th><th>What they do</th><th>Link</th></tr>\n    <tr><td>Sherman Custom Homes, Rocklin</td><td>Fully custom and semi-custom homes, luxury renovations, reports 300 plus homes built</td><td><a href=\"https://www.shermanhomesinc.com/\" target=\"_blank\" rel=\"noopener\">shermanhomesinc.com</a>, Houzz: <a href=\"https://www.houzz.com/professionals/home-builders/sherman-homes-construction-inc-pfvwus-pf~60619822\" target=\"_blank\" rel=\"noopener\">Houzz, Sherman Homes</a></td></tr>\n    <tr><td>Kosovan Homes, Loomis</td><td>Custom estates, ground up residences, barndominiums, luxury renovations</td><td><a href=\"https://kosovan-homes.com/\" target=\"_blank\" rel=\"noopener\">kosovan-homes.com</a>, No social link found</td></tr>\n    <tr><td>Lane Built Inc., Loomis</td><td>Design build homes on privately owned lots, grading, utilities, foundations, complete construction</td><td><a href=\"https://lanebuiltinc.com/\" target=\"_blank\" rel=\"noopener\">lanebuiltinc.com</a>, No social link found</td></tr>\n    <tr><td>Built Environment Inc., Meadow Vista</td><td>Custom homes, eco conscious design, residential planning, remodels</td><td><a href=\"https://www.builtenvironmentinc.com/\" target=\"_blank\" rel=\"noopener\">builtenvironmentinc.com</a>, No social link found</td></tr>\n    <tr><td>Marksman Builders, Auburn, Placer foothills</td><td>Ground up custom homes, design coordination, permitting, whole home renovations</td><td><a href=\"https://marksmanbuilders.com/\" target=\"_blank\" rel=\"noopener\">marksmanbuilders.com</a>, No social link found</td></tr></table>\n    <h3 style=\"font-size:19px;margin:22px 0 10px;\">Sacramento County, 5 builders</h3>\n    <table class=\"vendor-table\"><tr><th>Vendor</th><th>What they do</th><th>Link</th></tr>\n    <tr><td>HouseIdea, Sacramento area</td><td>Custom luxury residences, design build, architectural planning</td><td><a href=\"https://www.houseidea.com/\" target=\"_blank\" rel=\"noopener\">houseidea.com</a>, No social link found</td></tr>\n    <tr><td>Mercado Construction and Design, Folsom</td><td>Luxury custom homes, renovations, outdoor living</td><td><a href=\"https://www.mercadocd.com/\" target=\"_blank\" rel=\"noopener\">mercadocd.com</a>, Instagram @mercadoconstruction, no full social URL given in ChatGPT</td></tr>\n    <tr><td>CLK Construction, Sacramento</td><td>Custom residences, infill homes, estate renovations</td><td><a href=\"https://clkconstruction.com/\" target=\"_blank\" rel=\"noopener\">clkconstruction.com</a>, No social link found</td></tr>\n    <tr><td>Jeffrey R. Grenz General Contractor, Greater Sacramento</td><td>Individualized design build custom homes</td><td><a href=\"https://www.sacramentocustomhomebuilder.com/\" target=\"_blank\" rel=\"noopener\">sacramentocustomhomebuilder.com</a>, No social link found</td></tr>\n    <tr><td>Tankersley Build Co., Rancho Cordova</td><td>Luxury custom homes, design coordination and construction</td><td><a href=\"https://www.tankersleybuilds.com/\" target=\"_blank\" rel=\"noopener\">tankersleybuilds.com</a>, No social link found</td></tr></table>\n    <h3 style=\"font-size:19px;margin:22px 0 10px;\">San Joaquin County, 5 builders</h3>\n    <table class=\"vendor-table\"><tr><th>Vendor</th><th>What they do</th><th>Link</th></tr>\n    <tr><td>Custom Homes by Miller, Stockton</td><td>Bespoke luxury homes, custom residential construction</td><td><a href=\"https://customhomesmiller.com/\" target=\"_blank\" rel=\"noopener\">customhomesmiller.com</a>, Houzz: <a href=\"https://www.houzz.com/professionals/home-builders/custom-homes-by-miller-pfvwus-pf~1795473054\" target=\"_blank\" rel=\"noopener\">Houzz, Custom Homes by Miller, 5.0 out of 5, 8 reviews</a></td></tr>\n    <tr><td>McEachron Homes, Lodi</td><td>Custom houses, additions, guesthouses</td><td><a href=\"https://mceachronhomes.com/\" target=\"_blank\" rel=\"noopener\">mceachronhomes.com</a>, Houzz: <a href=\"https://www.houzz.com/professionals/home-builders/mceachron-homes-pfvwus-pf~1510545434\" target=\"_blank\" rel=\"noopener\">Houzz, McEachron Homes, 5.0 out of 5, 1 review</a></td></tr>\n    <tr><td>Morris Construction, Lodi</td><td>High end custom residences, construction management</td><td><a href=\"https://www.bmorrisconstruction.com/\" target=\"_blank\" rel=\"noopener\">bmorrisconstruction.com</a>, No social link found</td></tr>\n    <tr><td>Raymus Homes, Manteca</td><td>Custom homes on buyer owned lots and builder floor plans</td><td><a href=\"https://raymushomes.com/custom-homes.php\" target=\"_blank\" rel=\"noopener\">raymushomes.com, custom homes</a>, No social link found</td></tr>\n    <tr><td>Sarmento Bros. Construction, Manteca</td><td>Custom homes, design build, utilities, foundations, garages</td><td><a href=\"https://www.sarmentobrosconstruction.com/services/custom-homes\" target=\"_blank\" rel=\"noopener\">sarmentobrosconstruction.com, custom homes</a>, No social link found</td></tr></table>\n    <h3 style=\"font-size:19px;margin:22px 0 10px;\">Stanislaus County, 5 builders</h3>\n    <table class=\"vendor-table\"><tr><th>Vendor</th><th>What they do</th><th>Link</th></tr>\n    <tr><td>Dream Finder Construction, Modesto</td><td>Ground up custom homes, ADUs, additions and remodels</td><td><a href=\"https://dreamfinderconstruction.com/\" target=\"_blank\" rel=\"noopener\">dreamfinderconstruction.com</a>, No social link found</td></tr>\n    <tr><td>MHB, Inc., Turlock</td><td>Custom homes, multigenerational residences, design and construction</td><td><a href=\"https://mhbcustomhomes.com/\" target=\"_blank\" rel=\"noopener\">mhbcustomhomes.com</a>, Houzz: <a href=\"https://www.houzz.com/professionals/home-builders/mhb-inc-pfvwus-pf~279041827\" target=\"_blank\" rel=\"noopener\">Houzz, MHB Inc.</a></td></tr>\n    <tr><td>Windward Pacific Builders, Oakdale</td><td>Custom homes, energy efficient residences, new home communities</td><td><a href=\"https://windwardpacificbuilders.com/\" target=\"_blank\" rel=\"noopener\">windwardpacificbuilders.com</a>, Houzz: <a href=\"https://www.houzz.com/professionals/home-builders/windward-pacific-builders-pfvwus-pf~664981168\" target=\"_blank\" rel=\"noopener\">Houzz, Windward Pacific Builders, portfolio and 2 reviews</a></td></tr>\n    <tr><td>Schoolland Construction, Ripon area</td><td>Custom residential construction, new homes and renovations</td><td><a href=\"https://schoollandconstruction.com/\" target=\"_blank\" rel=\"noopener\">schoollandconstruction.com</a>, No social link found</td></tr>\n    <tr><td>Modesto ADU Company, Modesto</td><td>Custom homes and accessory dwelling units</td><td><a href=\"https://modestocustomhomebuilder.com/\" target=\"_blank\" rel=\"noopener\">modestocustomhomebuilder.com</a>, No social link found</td></tr></table>\n    <h3 style=\"font-size:19px;margin:22px 0 10px;\">All 35 builders, master list</h3>\n    <p class=\"sub\">The 20 county builders above, plus 15 more from the ChatGPT research, for a total of 35 unique builders. Websites and Houzz links are as given in that research. \"No social link found\" means ChatGPT found no specific social profile URL.</p>\n    <table class=\"vendor-table\"><tr><th>Vendor</th><th>What they do</th><th>Link</th></tr>\n    <tr><td>Superior Custom Construction, Loomis</td><td>Custom homes, guesthouses, multigenerational homes, ADUs</td><td><a href=\"https://superiorcustomconstruction.com/\" target=\"_blank\" rel=\"noopener\">superiorcustomconstruction.com</a>, Houzz: <a href=\"https://www.houzz.com/professionals/home-builders/superior-custom-construction-llc-pfvwus-pf~1043851\" target=\"_blank\" rel=\"noopener\">Houzz, Superior Custom Construction</a></td></tr>\n    <tr><td>K Squared Construction, Granite Bay</td><td>Custom homes, duplexes, residential design build</td><td><a href=\"https://ksquaredconstruction.com/\" target=\"_blank\" rel=\"noopener\">ksquaredconstruction.com</a>, No social link found</td></tr>\n    <tr><td>ESI Builders and Remodelers, El Dorado Hills</td><td>Custom homes, energy conscious building, additions</td><td><a href=\"https://esibuilders.com/\" target=\"_blank\" rel=\"noopener\">esibuilders.com</a>, No social link found</td></tr>\n    <tr><td>JTL Custom Builders, Shingle Springs</td><td>Primarily custom outdoor structures and renovations, confirm whole home availability</td><td><a href=\"https://jtlcustombuilders.com/\" target=\"_blank\" rel=\"noopener\">jtlcustombuilders.com</a>, No social link found</td></tr>\n    <tr><td>Fischer and Associates Urban Development, Stockton</td><td>Custom residential construction, planning and permits</td><td><a href=\"https://www.fischerurbandevelopment.com/\" target=\"_blank\" rel=\"noopener\">fischerurbandevelopment.com</a>, No social link found</td></tr>\n    <tr><td>Caresco Homes, Stockton</td><td>New homes and custom residential construction</td><td><a href=\"https://carescohomes.com/\" target=\"_blank\" rel=\"noopener\">carescohomes.com</a>, Houzz: <a href=\"https://www.houzz.com/professionals/home-builders/caresco-homes-pfvwus-pf~1202508484\" target=\"_blank\" rel=\"noopener\">Houzz, Caresco Homes</a></td></tr>\n    <tr><td>EG Custom Construction, Stockton</td><td>New homes, custom homes, guesthouses</td><td><a href=\"https://egcustomconstruction.com/\" target=\"_blank\" rel=\"noopener\">egcustomconstruction.com</a>, Houzz: <a href=\"https://www.houzz.com/professionals/general-contractors/eg-custom-construction-pfvwus-pf~2049304342\" target=\"_blank\" rel=\"noopener\">Houzz, EG Custom Construction</a></td></tr>\n    <tr><td>Phillips Construction Company, Stockton</td><td>Custom homes, additions, residential construction</td><td><a href=\"https://www.phillipsconstructioncompany.com/\" target=\"_blank\" rel=\"noopener\">phillipsconstructioncompany.com</a>, Houzz: <a href=\"https://www.houzz.com/professionals/general-contractors/phillips-construction-company-pfvwus-pf~2080\" target=\"_blank\" rel=\"noopener\">Houzz, Phillips Construction Company, portfolio and 5 reviews</a></td></tr>\n    <tr><td>JD Homes Design and Construction, Lodi</td><td>Custom new construction, plans and permits</td><td><a href=\"https://jdhomesdesign.com/\" target=\"_blank\" rel=\"noopener\">jdhomesdesign.com</a>, No social link found</td></tr>\n    <tr><td>DC Builders, regional, serves Modesto</td><td>Timber frame homes, custom farmhouses and hybrid structures</td><td><a href=\"https://www.dcbuilding.com/modesto-california-custom-home-construction/\" target=\"_blank\" rel=\"noopener\">dcbuilding.com, Modesto custom home construction</a>, No social link found</td></tr>\n    <tr><td>Steckler Construction, Central Valley, East Bay</td><td>Custom homes and luxury renovations</td><td><a href=\"https://www.stecklerconstruction.com/\" target=\"_blank\" rel=\"noopener\">stecklerconstruction.com</a>, No social link found</td></tr>\n    <tr><td>Wichert Homes, El Dorado Hills</td><td>High end bespoke homes, especially Serrano, reports 125 plus homes built in Serrano, company reported figure</td><td><a href=\"https://wicherthomes.com/\" target=\"_blank\" rel=\"noopener\">wicherthomes.com</a>, No social link found</td></tr>\n    <tr><td>Kenneth Development, El Dorado Hills</td><td>Premium custom residences and luxury construction</td><td><a href=\"https://www.kennethdevelopment.com/\" target=\"_blank\" rel=\"noopener\">kennethdevelopment.com</a>, No social link found</td></tr>\n    <tr><td>Brooks Builders, El Dorado County</td><td>Custom homes on vacant infill lots</td><td><a href=\"https://www.brooksbuilders.info/\" target=\"_blank\" rel=\"noopener\">brooksbuilders.info</a>, No social link found</td></tr>\n    <tr><td>Elliott Homes, Folsom</td><td>New home communities and builder designed residences, confirm custom lot program, included as a new home alternative, not a verified fully custom build on your lot company</td><td><a href=\"https://www.elliotthomes.com/\" target=\"_blank\" rel=\"noopener\">elliotthomes.com</a>, No social link found</td></tr></table>\n    <h3 style=\"font-size:19px;margin:22px 0 10px;\">Top vendors by city, whatever number is available</h3>\n    <p class=\"sub\">These city lists show the builders serving each city from the ChatGPT research, whatever number was available, not a forced top 10. Home base city is shown for each builder.</p>\n    <ul>\n      <li><b>Roseville, 8:</b> Sherman Custom Homes, Rocklin; Kosovan Homes, Loomis; Built Environment Inc., Meadow Vista; HouseIdea, Sacramento area; Lane Built Inc., Loomis; Superior Custom Construction, Loomis; Mercado Construction and Design, Folsom; K Squared Construction, Granite Bay</li>\n      <li><b>Folsom, 9:</b> Mercado Construction and Design, Folsom; ESI Builders and Remodelers, El Dorado Hills; Sherman Custom Homes, Rocklin; Lane Built Inc., Loomis; HouseIdea, Sacramento area; Marksman Builders, Placer foothills; Tankersley Build Co., Rancho Cordova; Superior Custom Construction, Loomis; JTL Custom Builders, Shingle Springs, primarily outdoor structures and renovations, confirm whole home availability</li>\n      <li><b>Sacramento, 8:</b> HouseIdea, Sacramento area; CLK Construction, Sacramento; Jeffrey R. Grenz General Contractor, Greater Sacramento; Mercado Construction and Design, Folsom; Tankersley Build Co., Rancho Cordova; Sherman Custom Homes, Rocklin; Marksman Builders, Placer foothills; Lane Built Inc., Loomis</li>\n      <li><b>Stockton, 9:</b> Custom Homes by Miller, Stockton; Fischer and Associates Urban Development, Stockton; Caresco Homes, Stockton; EG Custom Construction, Stockton; Phillips Construction Company, Stockton; McEachron Homes, Lodi; Morris Construction, Lodi; Sarmento Bros. Construction, Manteca; JD Homes Design and Construction, Lodi</li>\n      <li><b>Modesto, 9:</b> Dream Finder Construction, Modesto; Modesto ADU Company, Modesto; MHB, Inc., Turlock; Windward Pacific Builders, Oakdale; Schoolland Construction, Ripon area; DC Builders, regional; Sarmento Bros. Construction, Manteca; Steckler Construction, Central Valley, East Bay; Custom Homes by Miller, Stockton</li>\n      <li><b>Lincoln, 6:</b> Sherman Custom Homes, Rocklin; Kosovan Homes, Loomis; HouseIdea, Sacramento area; Superior Custom Construction, Loomis; Marksman Builders, Placer foothills, confirm Lincoln availability; Built Environment Inc., Meadow Vista, confirm Lincoln availability</li>\n      <li><b>Loomis, 7:</b> Kosovan Homes, Loomis; Lane Built Inc., Loomis; Superior Custom Construction, Loomis; Sherman Custom Homes, Rocklin; Marksman Builders, Placer foothills; HouseIdea, Sacramento area; Tankersley Build Co., Rancho Cordova</li>\n      <li><b>Rocklin, 8:</b> Sherman Custom Homes, Rocklin; Kosovan Homes, Loomis; Lane Built Inc., Loomis; Built Environment Inc., Meadow Vista; ESI Builders and Remodelers, El Dorado Hills; HouseIdea, Sacramento area; Superior Custom Construction, Loomis; K Squared Construction, Granite Bay</li>\n      <li><b>El Dorado Hills, 10:</b> Wichert Homes, El Dorado Hills; Kenneth Development, El Dorado Hills; ESI Builders and Remodelers, El Dorado Hills; Brooks Builders, El Dorado County; Sherman Custom Homes, Rocklin; Lane Built Inc., Loomis; Mercado Construction and Design, Folsom; HouseIdea, Sacramento area; Tankersley Build Co., Rancho Cordova; Superior Custom Construction, Loomis. El Dorado Hills is in El Dorado County, not one of the four counties above, included as requested.</li>\n      <li><b>Galt, 3:</b> McEachron Homes, Lodi; Custom Homes by Miller, Stockton, lot specific; Elliott Homes, Folsom, new home communities, builder designed, confirm custom lot program. ChatGPT found fewer strong matches specifically identifying Galt, so this list is intentionally short.</li>\n    </ul>\n    <h3 style=\"font-size:19px;margin:22px 0 10px;\">How to get a quote from a reliable builder, step by step</h3>\n    <p class=\"sub\">Contact at least 3 builders with the same property information, floor plan, and finish level.</p>\n    <ol>\n      <li><b>Step 1, identify the property:</b> supply parcel address or APN, lot size, slope, zoning, utilities, access, and any HOA restrictions.</li>\n      <li><b>Step 2, define the house:</b> give approximate floor area, number of stories, bedrooms, bathrooms, garage spaces, and finish level.</li>\n      <li><b>Step 3, verify the contractor:</b> check license, insurance, workers compensation status, and disciplinary history through the California Contractors State License Board. Request recent completed projects and homeowner references.</li>\n      <li><b>Step 4, request a preliminary estimate:</b> ask for a feasibility assessment, anticipated cost per square foot, site development budget, permits, and impact fee expectations.</li>\n      <li><b>Step 5, request an itemized construction proposal:</b> once plans and specifications are sufficiently developed, obtain a written breakdown of costs and exclusions.</li>\n      <li><b>Step 6, compare bids and select the builder:</b> compare total project scope, not just the lowest price. Review contract terms with an attorney or adviser before signing.</li>\n    </ol>\n    <p class=\"sub\">Caution: a website or review score alone is insufficient to establish reliability. For an actual property, the key question is the complete project budget, not just cost per square foot.</p>\n    <h3 style=\"font-size:19px;margin:22px 0 10px;\">What a quote should include, 14 item checklist</h3>\n    <ul>\n      <li>Architectural plans and engineering</li>\n      <li>Site preparation, grading and drainage</li>\n      <li>Foundation, framing and roofing</li>\n      <li>Windows, exterior doors and siding</li>\n      <li>Plumbing, electrical and HVAC</li>\n      <li>Insulation and California energy code compliance</li>\n      <li>Kitchen, bathrooms, flooring and interior finishes</li>\n      <li>Garage, driveway and exterior improvements</li>\n      <li>Permit fees, impact fees and inspections</li>\n      <li>Utility connections, septic or well work where needed</li>\n      <li>Builder overhead, profit and management fees</li>\n      <li>Allowances, exclusions and owner supplied materials</li>\n      <li>Construction schedule and payment milestones</li>\n      <li>Contingency, change order process and warranty</li>\n    </ul>\n    <h3 style=\"font-size:19px;margin:22px 0 10px;\">Copy and send email template, Request for Custom Home Construction Estimate</h3>\n    <p class=\"sub\">Send this to a builder, fill in your lot and home details, and ask for: (1) ESTIMATED cost per sq ft for the size and finish level, (2) whether they build on privately owned lots, (3) design, engineering, and permitting process, (4) whether preliminary estimates include site preparation, utilities, permits, and impact fees, (5) typical timeline, (6) process and cost for a detailed written proposal, (7) examples of recently completed custom homes in the area, (8) contractor license, insurance, and warranty coverage, plus an initial consultation.</p>\n    <p class=\"sub\">Sources: ChatGPT research, Nov 9, 2026. Review counts and scores can change. No vendor names, prices, or links were invented in this list.</p>\n  </section>";
function buildVendorsHtml() { return '<section class="blk"><div class="wrap">' + BUILD_VENDORS_HTML + '</div></section>'; }

/* ===== Cost to build ===== */
function medianPerSqft(county) {
  const v = DATA.communities.filter((c) => c.county === county && c.min && c.sqft).map((c) => c.min / c.sqft).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : 0;
}
def('build', {
  nav: 'Build a home', scene: 'build', kicker: 'Custom homes and lots', tileTitle: 'Cost to build',
  title: 'What it costs to build your own home',
  sub: 'Estimate the full cost to build on your own lot, from land and site work to fees and finishes, and the monthly payment once it\'s done.',
  html() {
    const B = sub('bld', { sqft: 2200, level: 'standard', custom: 250, lot: 250000, site: 30000, fees: 25000, design: 20000, rural: false, well: 45000, cont: 10, loan: 'conv', down: 20, county: 'Placer' });
    const L = DATA.build;
    return '<section class="blk"><div class="wrap"><div class="calc">' +
      '<div class="panel accent" style="display:grid;gap:12px">' +
        '<div class="chips" role="group" aria-label="Finish level"><span class="mono">Finish</span>' + [['basic', 'Builder grade · $' + L.basic], ['standard', 'Mid-range · $' + L.standard], ['premium', 'High-end · $' + L.premium], ['custom', 'My own number']].map(([v, t]) => '<button type="button" class="chip" data-level="' + v + '" aria-pressed="' + (B.level === v) + '">' + esc(t) + (v !== 'custom' ? '/sq ft' : '') + '</button>').join('') + '</div>' +
        '<div class="fields">' +
          '<div class="field"><label for="bd-sqft">Home size (sq ft)</label><input id="bd-sqft" type="text" inputmode="numeric" value="' + esc(comma(B.sqft)) + '"></div>' +
          moneyField('bd-custom', 'Your cost per sq ft', B.custom, 'Used with "My own number"') +
          moneyField('bd-lot', 'Lot price', B.lot, 'Or what you paid') +
          moneyField('bd-site', 'Site work and utility hookups', B.site, 'Often $15,000 to $45,000') +
          moneyField('bd-fees', 'Permits and impact fees', B.fees, 'Example. Varies a lot by city; ask the building department') +
          moneyField('bd-design', 'Plans, design and engineering', B.design, 'Example. Get quotes') +
          pctField('bd-cont', 'Contingency', B.cont, 'Cushion for surprises, often 10%') +
        '</div>' +
        '<label class="check"><input type="checkbox" id="bd-rural"' + (B.rural ? ' checked' : '') + '> Rural lot that needs a well and septic system</label>' +
        '<div class="fields" id="bd-well-row"' + (B.rural ? '' : ' hidden') + '>' + moneyField('bd-well', 'Well and septic', B.well, 'Example. Get bids from local drillers') + '</div>' +
        '<span class="lbl">Paying for it</span><div class="fields">' +
          sel('bd-loan', [['conv', 'Construction-to-permanent loan'], ['va', 'VA one-time close ($0 down)'], ['fha', 'FHA one-time close (3.5% down)']], B.loan, 'Loan') +
          pctField('bd-down', 'Down payment', B.down, 'Construction loans often need 10% to 20%') +
          sel('bd-county', MAIN_COUNTIES.map((c) => [c, c + ' County']), B.county, 'County') +
        '</div></div>' +
      '<div class="result" aria-live="polite"><span class="lbl">Estimated total to build</span><div class="big num" id="bd-total">$0</div><div id="bd-out"></div><p class="note" id="bd-note"></p></div>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>How building your own home works</h2></div></div><ol class="steps">' +
        '<li><b>Find the lot</b><span>Darien can search MLS land listings. Check zoning, utilities, slope and access before you buy.</span></li>' +
        '<li><b>Check what it needs</b><span>Rural lots in places like Loomis or the foothills may need a well, septic and a longer driveway.</span></li>' +
        '<li><b>Design and price it</b><span>Pick plans, then get bids from two or three licensed builders.</span></li>' +
        '<li><b>Line up the loan</b><span>A construction loan pays the builder in stages, then turns into your mortgage.</span></li>' +
        '<li><b>Build and move in</b><span>Permits, inspections and construction usually take many months, so plan your timeline with your builder.</span></li>' +
      '</ol>' + buildVendorsHtml() + '<div class="panel bar" style="margin-top:14px"><div><b>Looking for a lot?</b><p class="note">Tell Darien where you want to build and he\'ll send land listings that fit.</p></div><button type="button" class="btn btn-pa" id="bd-lots">Find me a lot</button></div></div></section>' + touredStripHtml();
  },
  mount(root) {
    const B = S.bld;
    const L = DATA.build;
    const draw = () => {
      root.querySelectorAll('[data-level]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.level === B.level)));
      $('bd-well-row').hidden = !B.rural;
      const per = B.level === 'custom' ? B.custom : L[B.level];
      const build = B.sqft * per;
      const cont = (build + B.site) * B.cont / 100;
      const total = B.lot + build + B.site + B.fees + B.design + (B.rural ? B.well : 0) + cont;
      const allIn = B.sqft ? (total - B.lot) / B.sqft : 0;
      const loan = B.loan;
      const cash = loan === 'va' ? 0 : total * Math.max(B.down, loan === 'fha' ? 3.5 : 0) / 100;
      const f = payment({ price: total, loan: loan === 'conv' ? 'conv' : loan, cash, county: B.county });
      const nbPer = medianPerSqft(B.county);
      $('bd-total').textContent = money(total);
      $('bd-out').innerHTML = '<ul class="break">' +
        '<li><span>Lot</span><span>' + money(B.lot) + '</span></li>' +
        '<li><span>Construction (' + comma(B.sqft) + ' sq ft at $' + per + ')</span><span>' + money(build) + '</span></li>' +
        '<li><span>Site work and utilities</span><span>' + money(B.site) + '</span></li>' +
        '<li><span>Permits and fees</span><span>' + money(B.fees) + '</span></li>' +
        '<li><span>Plans and engineering</span><span>' + money(B.design) + '</span></li>' +
        (B.rural ? '<li><span>Well and septic</span><span>' + money(B.well) + '</span></li>' : '') +
        '<li><span>Contingency (' + B.cont + '%)</span><span>' + money(cont) + '</span></li>' +
        '<li class="strong"><span>Cost per sq ft, not counting the lot</span><span>$' + comma(allIn) + '</span></li>' +
        '<li class="strong"><span>Monthly payment once built</span><span>' + money(f.total) + '</span></li></ul>';
      $('bd-note').textContent = 'Down payment ' + money(f.down) + ' with ' + ({ conv: 'a construction-to-permanent loan', va: 'a VA one-time close loan', fha: 'an FHA one-time close loan' })[loan] + (f.note ? '. ' + f.note : '') + '. ' +
        (nbPer ? 'New builds in ' + B.county + ' County start around $' + comma(nbPer) + ' per sq ft including the lot.' : '') +
        ' Construction costs per sq ft come from a 2026 Sacramento-area building cost guide; fees, design and well amounts are examples to replace with real bids.';
    };
    root.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => { B.level = b.dataset.level; save(); draw(); }));
    $('bd-sqft').addEventListener('input', () => { const v = parseNum($('bd-sqft').value); if (v > 0) { B.sqft = v; save(); draw(); } });
    [['bd-custom', 'custom'], ['bd-lot', 'lot'], ['bd-site', 'site'], ['bd-fees', 'fees'], ['bd-design', 'design'], ['bd-well', 'well']].forEach(([id, k]) => bindMoney(id, (v) => { B[k] = v >= 0 ? v : 0; save(); draw(); }));
    $('bd-cont').addEventListener('input', () => { const v = parseNum($('bd-cont').value); if (v >= 0) { B.cont = v; save(); draw(); } });
    $('bd-down').addEventListener('input', () => { const v = parseNum($('bd-down').value); if (v >= 0) { B.down = v; save(); draw(); } });
    $('bd-rural').addEventListener('change', () => { B.rural = $('bd-rural').checked; save(); draw(); });
    $('bd-loan').addEventListener('change', () => { B.loan = $('bd-loan').value; save(); draw(); });
    $('bd-county').addEventListener('change', () => { B.county = $('bd-county').value; save(); draw(); });
    $('bd-lots').addEventListener('click', () => { const A = sub('alerts', {}); A.wants = ['Land or a lot to build on']; save(); go('alerts'); });
    draw();
  }
});

/* ===== About Darien ===== */
const GOALS = [
  { k: 'down', t: 'Saving for a down payment', help: 'You may not need one. VA and USDA loans can be $0 down, and FHA paired with California\'s MyHome loan can cover the 3.5% down payment.', go: [['zero-down', 'See $0-down options']] },
  { k: 'pay', t: 'The monthly payment', help: 'Start with a payment you\'re comfortable with. I\'ll show you the prices, loans and homes that fit it, with every monthly cost included.', go: [['payment', 'Shop by payment']] },
  { k: 'rate', t: 'Today\'s interest rates', help: 'Some homes come with the seller\'s low-rate FHA or VA loan that you can take over. And if rates drop after you buy, a refinance can lower your payment.', go: [['assumable', 'See assumable homes'], ['refinance', 'Refinance calculator']] },
  { k: 'credit', t: 'My credit', help: 'FHA loans accept lower credit scores than most loans. I\'ll connect you with a lender who can give you a clear plan to qualify.', go: [] },
  { k: 'find', t: 'Finding the right home', help: 'Tell me what matters most and I\'ll set up your own home search, with new matches sent to you every day.', go: [['alerts', 'Get homes by email']] },
  { k: 'sell', t: 'Selling my current home first', help: 'We\'ll plan the timing together so you can sell and buy in the right order, without paying for two homes longer than you need to.', go: [] },
  { k: 'new', t: 'Building or buying new', help: 'Compare more than 200 new-home communities and their builder offers, or estimate what it costs to build on your own lot.', go: [['new-builds', 'See new builds'], ['build', 'Cost to build']] },
  { k: 'start', t: 'Not sure where to start', help: 'That\'s what I\'m here for. We\'ll talk through your goals, budget and timeline, with no pressure.', go: [] }
];
def('about', {
  nav: 'About Darien', scene: 'about', kicker: 'REALTOR® · eXp Realty of Northern California', tileTitle: 'About Darien', portrait: true,
  title: 'Meet Darien Phillips',
  sub: 'Buying in this market is a challenge. With the right agent on your side, it can be a smooth one.',
  html() {
    const G = sub('goals', { picked: [] });
    const mine = me();
    return '<section class="blk"><div class="wrap"><div class="about">' +
      '<div class="bio"><p class="mono eyebrow">About me</p><h2>Hi, I\'m Darien</h2>' +
        '<p class="lead-in">Being a buyer in today\'s market is a challenge. Prices are high, rates change every week, and the right homes don\'t wait. With the right agent beside you, the process can still be smooth, and even exciting.</p>' +
        '<p>I\'m a REALTOR® with eXp Realty of Northern California, DRE #02439090, and I help buyers across Placer, Sacramento, San Joaquin and Stanislaus counties, from Loomis and Roseville to Stockton, Lodi, Manteca and Modesto.</p>' +
        '<p>My focus is making your next home affordable. I find homes with low-rate loans you can take over, line up $0-down options, compare builder offers and show you the real monthly cost before you decide. You\'ll get your own custom portal with new matches every day, and I\'ll be with you from the first showing to the day you get your keys.</p>' +
        '<p class="call">Contact me and we can get started on your new path together.</p>' +
        '<div class="actions"><a class="btn btn-pa" href="sms:+12098826469">Text Darien</a><a class="btn btn-line" href="tel:+12098826469">Call 209.882.6469</a><a class="btn btn-line" href="mailto:darienphillips45@gmail.com">Email</a></div>' +
      '</div>' +
      '<div class="about-side"><div class="panel"><h3 style="margin-bottom:8px">Contact</h3><div class="contact">' +
        '<div class="row"><span>Phone and text</span><b class="sel">209.882.6469</b></div>' +
        '<div class="row"><span>Email</span><b class="sel">darienphillips45@gmail.com</b></div>' +
        '<div class="row"><span>Brokerage</span><b>eXp Realty of Northern California</b></div>' +
        '<div class="row"><span>License</span><b>DRE #02439090</b></div></div></div>' +
      '<div class="panel"><h3 style="margin-bottom:8px">Areas served</h3><div class="places">' + MAIN_COUNTIES.map((c) => '<button type="button" class="chip" data-place="' + esc(c) + '">' + esc(c) + ' County</button>').join('') +
        POPULAR.slice(0, 12).map((n) => '<button type="button" class="chip" data-place="' + esc(n) + '">' + esc(n) + '</button>').join('') + '</div></div></div>' +
      '</div></div></section>' +
      '<section class="blk" id="goals"><div class="wrap"><div class="panel goals">' +
        '<div><p class="mono eyebrow">Your goals</p><h2>What would be most helpful to you right now?</h2></div>' +
        '<p class="lead">Pick what you\'d like help with, and I\'ll show you the next step. Send it to me and we\'ll make a plan together.</p>' +
        '<div class="goal-chips" role="group" aria-label="What would be most helpful">' + GOALS.map((g) => '<button type="button" class="chip" data-goal="' + g.k + '" aria-pressed="' + G.picked.includes(g.k) + '">' + esc(g.t) + '</button>').join('') + '</div>' +
        '<div class="goal-help" id="goal-help" aria-live="polite"></div>' +
        '<form class="goal-send" id="goal-form" novalidate><h3>Send this to Darien</h3>' +
          '<div class="fields">' +
            '<div class="field"><label for="gl-name">Your name</label><input id="gl-name" autocomplete="name" value="' + esc(mine.name || '') + '"></div>' +
            '<div class="field"><label for="gl-phone">Mobile number</label><input id="gl-phone" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(mine.phone || '') + '"></div>' +
            '<div class="field"><label for="gl-email">Email</label><input id="gl-email" type="email" autocomplete="email" value="' + esc(mine.email || '') + '"></div>' +
            '<div class="field wide"><label for="gl-note">Your dream or goal, in your own words (optional)</label><textarea id="gl-note" rows="3" placeholder="For example: a 3-bedroom near my job in Roseville, under $3,000 a month"></textarea></div>' +
          '</div>' +
          '<p class="fine">' + (TRACKER ? 'By tapping Send to Darien, you agree that Darien Phillips may contact you by phone, text or email. Consent isn\'t required to buy a home.' : 'This opens your own email or text app with your message filled in.') + '</p>' +
          '<div class="actions">' + (TRACKER ? '<button type="submit" class="btn btn-pa" id="gl-send">Send to Darien</button>' :
            '<a class="btn btn-pa" id="gl-text" href="#">Text it to Darien</a><a class="btn btn-line" id="gl-email-btn" href="#">Email it</a><button type="button" class="btn btn-line" id="gl-copy">Copy</button>') + '</div>' +
          '<p class="toast" id="gl-toast" role="status"></p>' +
        '</form>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>What I can help with</h2></div></div><div class="tiles">' +
        ['assumable', 'zero-down', 'new-builds', 'payment', 'refinance', 'build'].map((k) => '<button type="button" class="tile" data-go="' + k + '" style="--tc:' + PAGES[k].color + '">' + thumbBox(k) + '<div class="body"><b>' + esc(PAGES[k].tileTitle || PAGES[k].nav) + '</b><span>' + esc(TILE_TEXT[k]) + '</span></div></button>').join('') +
      '</div></div></section>' + touredStripHtml();
  },
  mount(root) {
    const G = S.goals;
    const picked = () => GOALS.filter((g) => G.picked.includes(g.k));
    const message = () => {
      const v = { name: $('gl-name').value.trim(), phone: $('gl-phone').value.trim(), email: $('gl-email').value.trim(), note: $('gl-note').value.trim() };
      const lines = ['Hi Darien, here\'s what\'s holding me back:'];
      picked().forEach((g) => lines.push('- ' + g.t));
      if (!G.picked.length) lines.push('- (I\'ll tell you when we talk)');
      if (v.note) lines.push('', 'My goal: ' + v.note);
      lines.push('', 'Name: ' + (v.name || '[your name]'));
      if (v.phone) lines.push('Phone: ' + v.phone);
      if (v.email) lines.push('Email: ' + v.email);
      return { v, text: lines.join('\n') };
    };
    const drawHelp = () => {
      $('goal-help').innerHTML = picked().map((g) => '<div class="goal-card"><b>' + esc(g.t) + '</b><p>' + esc(g.help) + '</p>' +
        (g.go.length ? '<div class="acts">' + g.go.map(([k, label]) => '<button type="button" class="btn btn-line btn-sm" data-go="' + k + '">' + esc(label) + '</button>').join('') + '</div>' : '') + '</div>').join('');
      if (!TRACKER) {
        const { text } = message();
        $('gl-text').href = 'sms:+12098826469?&body=' + encodeURIComponent(text);
        $('gl-email-btn').href = 'mailto:darienphillips45@gmail.com?subject=' + encodeURIComponent('What\'s holding me back') + '&body=' + encodeURIComponent(text);
      }
    };
    const toast = (t, bad) => { $('gl-toast').textContent = t; $('gl-toast').classList.toggle('err', !!bad); };
    const valid = () => {
      const { v } = message();
      if (!v.name) { toast('Please add your name.', true); $('gl-name').focus(); return null; }
      if (v.phone.replace(/\D/g, '').length < 10 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) { toast('Please add a mobile number or an email so Darien can reach you.', true); $('gl-phone').focus(); return null; }
      store.set('dp-me', { name: v.name, phone: v.phone, email: v.email });
      return v;
    };
    root.querySelectorAll('[data-goal]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.goal;
      G.picked = G.picked.includes(k) ? G.picked.filter((x) => x !== k) : G.picked.concat(k);
      save();
      b.setAttribute('aria-pressed', String(G.picked.includes(k)));
      drawHelp();
    }));
    $('goal-form').addEventListener('input', drawHelp);
    $('goal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!TRACKER) return;
      const v = valid();
      if (!v) return;
      const btn = $('gl-send');
      btn.disabled = true; btn.textContent = 'Sending...'; toast('');
      try {
        await post('goal', Object.assign({}, v, { goals: picked().map((g) => g.t).join(', '), pg: 'About Darien' }));
        toast('Thanks, ' + v.name.split(' ')[0] + '. Darien got your message and will reach out soon.');
        btn.textContent = 'Sent';
      } catch (x) {
        btn.disabled = false; btn.textContent = 'Send to Darien';
        toast('That didn\'t go through. Please try again, or text Darien at 209.882.6469.', true);
      }
    });
    if (!TRACKER) {
      ['gl-text', 'gl-email-btn'].forEach((id) => $(id).addEventListener('click', (e) => { drawHelp(); if (!valid()) { e.preventDefault(); return; } toast('Your app should open with your message filled in. If it doesn\'t, tap Copy.'); }));
      $('gl-copy').addEventListener('click', async () => {
        if (!valid()) return;
        try { await navigator.clipboard.writeText(message().text); toast('Copied. Paste it into a text to 209.882.6469 or an email to darienphillips45@gmail.com.'); }
        catch (x) { toast('Copy is blocked here. Text 209.882.6469 or email darienphillips45@gmail.com.', true); }
      });
    }
    drawHelp();
  }
});

/* ===== Homes by email ===== */
const WANTS = ['Homes with assumable loans', '$0-down homes', 'New builds', 'Resale homes', 'Help with payments or refinancing', 'Land or a lot to build on'];
def('alerts', {
  nav: 'Get homes by email', scene: 'alerts', kicker: 'Homes by email', tileTitle: 'Homes by email',
  title: 'Get homes sent to you daily',
  sub: 'Tell Darien what you want. He\'ll email matches as they hit the market, and he can set up your own custom portal with homes from the MLS in your range.',
  html() {
    const A = sub('alerts', { wants: ['Homes with assumable loans', 'New builds'], counties: [], towns: '', price: '', pay: '', beds: '3+', baths: '2+', size: 'Any', lot: 'Any', when: '1 to 3 months', mls: true, name: '', email: '', phone: '', notes: '' });
    if (S.place && !A.towns && S.place.k === 'town') A.towns = S.place.n;
    if (S.place && S.place.k === 'county' && !A.counties.includes(S.place.n)) A.counties = A.counties.concat(S.place.n);
    const mine = me();
    if (!A.name && mine.name) { A.name = mine.name; A.email = A.email || mine.email || ''; A.phone = A.phone || mine.phone || ''; }
    const flash = S.flash || '';
    delete S.flash;
    const contact =
      '<div class="field"><label for="al-name">Your name</label><input id="al-name" autocomplete="name" value="' + esc(A.name) + '"></div>' +
      '<div class="field"><label for="al-email">Email</label><input id="al-email" type="email" autocomplete="email" value="' + esc(A.email) + '"></div>' +
      '<div class="field"><label for="al-phone">Mobile number</label><input id="al-phone" type="tel" autocomplete="tel" value="' + esc(A.phone) + '"></div>' +
      '<div class="field wide"><label for="al-notes">Anything else</label><textarea id="al-notes" rows="3">' + esc(A.notes) + '</textarea></div>';
    return '<section class="blk"><div class="wrap">' + (flash ? '<div class="callout" style="margin-bottom:12px"><b>Saved</b><p>' + esc(flash) + '</p></div>' : '') +
      '<form class="grid2" id="al-form" novalidate><div class="panel accent" style="display:grid;gap:14px">' +
        '<fieldset><legend class="lbl">What are you looking for?</legend><div class="checks">' + WANTS.map((w) => '<label><input type="checkbox" name="want" value="' + esc(w) + '"' + (A.wants.includes(w) ? ' checked' : '') + '> ' + esc(w) + '</label>').join('') + '</div></fieldset>' +
        '<fieldset><legend class="lbl">Where?</legend><div class="checks">' + MAIN_COUNTIES.map((c) => '<label><input type="checkbox" name="county" value="' + esc(c) + '"' + (A.counties.includes(c) ? ' checked' : '') + '> ' + esc(c) + ' County</label>').join('') + '</div></fieldset>' +
        '<div class="fields"><div class="field wide"><label for="al-towns">Towns or ZIP codes</label><input id="al-towns" value="' + esc(A.towns) + '" placeholder="For example Loomis, Rocklin, 95212"></div>' +
          moneyField('al-price', 'Max price', parseMoney(A.price) || 0, '', 'Optional') + moneyField('al-pay', 'Max monthly payment', parseMoney(A.pay) || 0, '', 'Optional') +
          sel('al-beds', ['Any', '2+', '3+', '4+', '5+'].map((v) => [v, v]), A.beds, 'Bedrooms') + sel('al-baths', ['Any', '2+', '2.5+', '3+'].map((v) => [v, v]), A.baths, 'Bathrooms') +
          sel('al-size', ['Any', '1,200+ sq ft', '1,500+ sq ft', '1,800+ sq ft', '2,000+ sq ft', '2,500+ sq ft'].map((v) => [v, v]), A.size, 'Home size') +
          sel('al-lot', ['Any', '5,000+ sq ft', '7,500+ sq ft', '10,000+ sq ft', 'Half acre+', '1 acre+', '5 acres+'].map((v) => [v, v]), A.lot, 'Lot size') +
          sel('al-when', ['As soon as possible', '1 to 3 months', '3 to 6 months', '6+ months'].map((v) => [v, v]), A.when, 'Timeline') + '</div>' +
        '<label class="check"><input type="checkbox" id="al-mls"' + (A.mls ? ' checked' : '') + '> Set up my own custom portal with homes from the MLS in this range, updated daily</label>' +
      '</div><div class="panel" style="display:grid;gap:12px;align-content:start">' +
        '<span class="lbl">Homes you saved</span><div class="tags" id="al-saved"></div>' +
        '<div class="fields">' + contact + '</div>' +
        (TRACKER ? '<div class="actions"><button type="submit" class="btn btn-pa" id="al-send">Sign me up</button></div><p class="toast" id="al-toast" role="status"></p>' +
          '<p class="fine">By tapping Sign me up, you agree that Darien Phillips may email, call or text you about homes. Unsubscribe anytime. Consent isn\'t required to buy a home.</p>' :
          '<label class="lbl" for="al-msg">Your request to Darien</label><textarea id="al-msg" rows="9" readonly style="font-family:var(--f-mono);font-size:0.8rem;width:100%;border:1.5px solid var(--line);border-radius:9px;padding:10px;background:var(--card);color:var(--ink)"></textarea>' +
          '<div class="actions"><a class="btn btn-pa" id="al-email-btn" href="#">Email it to Darien</a><a class="btn btn-line" id="al-text-btn" href="#">Text it</a><button type="button" class="btn btn-line" id="al-copy">Copy</button></div>' +
          '<p class="toast" id="al-toast" role="status"></p><p class="fine">This opens your own email or text app with your request filled in. If nothing opens, copy it and send it to darienphillips45@gmail.com or text 209.882.6469.</p>') +
        '<p class="fine">Your custom portal with homes from the MLS lets you save or pass on each home, and Darien sees what you save so he can send better matches. Unsubscribe anytime.</p>' +
      '</div></form></div></section>' + touredStripHtml();
  },
  mount(root) {
    const A = S.alerts;
    const read = () => {
      A.wants = [...root.querySelectorAll('input[name="want"]:checked')].map((c) => c.value);
      A.counties = [...root.querySelectorAll('input[name="county"]:checked')].map((c) => c.value);
      A.towns = $('al-towns').value.trim();
      const p = parseMoney($('al-price').value), m = parseMoney($('al-pay').value);
      A.price = p > 0 ? money(p) : ''; A.pay = m > 0 ? money(m) : '';
      ['beds', 'baths', 'size', 'lot', 'when'].forEach((k) => { A[k] = $('al-' + k).value; });
      A.mls = $('al-mls').checked;
      A.name = $('al-name').value.trim(); A.email = $('al-email').value.trim(); A.phone = $('al-phone').value.trim(); A.notes = $('al-notes').value.trim();
      save();
    };
    const savedText = () => [...saved.values()].map((x) => x.t + (x.p ? ' (' + x.p + ')' : '')).join('; ');
    const areasText = () => A.counties.map((c) => c + ' County').concat(A.towns ? [A.towns] : []).join(', ') || 'Anywhere Darien works';
    const draw = () => {
      $('al-saved').innerHTML = saved.size ? [...saved.values()].map((x) => '<span class="tag">' + esc(x.t) + ' <button type="button" data-unsave="' + esc(x.k) + '" aria-label="Remove ' + esc(x.t) + '" style="border:0;background:none;cursor:pointer;color:inherit">×</button></span>').join('') : '<span class="note">None yet. Tap Save on any home.</span>';
      if (TRACKER) return;
      const lines = ['Hi Darien, please send me homes that fit what I\'m looking for.', '', 'Name: ' + (A.name || '[your name]'), 'Email: ' + (A.email || '[your email]')];
      if (A.phone) lines.push('Phone: ' + A.phone);
      lines.push('Looking for: ' + (A.wants.join(', ') || 'Homes'), 'Areas: ' + areasText());
      if (A.price) lines.push('Max price: ' + A.price);
      if (A.pay) lines.push('Max monthly payment: ' + A.pay);
      lines.push('Bedrooms: ' + A.beds + ' · Bathrooms: ' + A.baths + ' · Size: ' + A.size + ' · Lot: ' + A.lot, 'Timeline: ' + A.when);
      lines.push('Custom portal with homes from the MLS: ' + (A.mls ? 'Yes, please set one up' : 'No, email is fine'));
      if (A.agentName) { lines.push('', 'I am working with a realtor.', 'Agent: ' + A.agentName, 'Brokerage: ' + (A.agentBrokerage || 'Not given'), 'Agent contact: ' + (A.agentContact || ''), 'Please send all home info to my agent to share with me.'); }
      if (saved.size) { lines.push('', 'Homes I saved:'); saved.forEach((x) => lines.push('- ' + x.t + (x.p ? ' (' + x.p + ')' : ''))); }
      if (A.notes) lines.push('', 'Notes: ' + A.notes);
      const msg = lines.join('\n');
      $('al-msg').value = msg;
      $('al-email-btn').href = 'mailto:darienphillips45@gmail.com?subject=' + encodeURIComponent('Please send me homes' + (A.mls ? ' and set up my custom portal' : '')) + '&body=' + encodeURIComponent(msg);
      $('al-text-btn').href = 'sms:+12098826469?&body=' + encodeURIComponent(msg);
    };
    const ready = () => {
      if (!A.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(A.email)) { $('al-toast').textContent = 'Add your name and a valid email first, so Darien can send you homes.'; $('al-toast').classList.add('err'); (!A.name ? $('al-name') : $('al-email')).focus(); return false; }
      $('al-toast').classList.remove('err');
      store.set('dp-me', { name: A.name, phone: A.phone, email: A.email });
      return true;
    };
    $('al-form').addEventListener('input', () => { read(); draw(); });
    $('al-form').addEventListener('change', () => { read(); draw(); });
    // Details first: what they signed up for, and where to browse homes,
    // then the agent question at the end.
    const signupDetailsHtml = () => '<p class="note">Here are the details first. You asked for: ' + esc(A.wants.join(', ') || 'homes') + ' in ' + esc(areasText()) + (A.price ? ', up to ' + esc(A.price) : '') + ', ' + esc(A.beds) + ' bed, ' + esc(A.baths) + ' bath.</p>' +
      (saved.size ? '<p class="note">Homes you saved: ' + esc(savedText()) + '</p>' : '') +
      '<div class="optlist"><a class="btn btn-line" href="https://darien-phillips-homes.pages.dev" target="_blank" rel="noopener">See more homes on Darien\'s website</a></div>';
    const doSignup = async (agent) => {
      if (agent) { A.agentName = agent.name; A.agentBrokerage = agent.brokerage; A.agentContact = agent.contact; A.agentPhone = agent.phone || ''; A.agentEmail = agent.email || ''; save(); }
      const btn = $('al-send');
      btn.disabled = true; btn.textContent = 'Sending...'; $('al-toast').textContent = '';
      try {
        await post('signup', { name: A.name, email: A.email, phone: A.phone, notes: A.notes, wants: A.wants.join(', '), areas: areasText(), price: A.price, pay: A.pay, beds: A.beds, baths: A.baths, size: A.size, lot: A.lot, when: A.when, mls: A.mls ? 'yes' : 'no', saved: savedText().slice(0, 600), hasAgent: agent ? 'yes' : 'no', agentName: agent ? agent.name : '', agentBrokerage: agent ? agent.brokerage : '', agentContact: agent ? agent.contact : '' });
        if (agent) trackEvent('Signed up, sent to agent', 'Agent form');
        else trackEvent('Signed up for homes by email', 'Info request');
        $('al-toast').textContent = agent ? REALTOR_MSG : 'You\'re signed up, ' + A.name.split(' ')[0] + '. Darien will set up your search and reach out soon.';
        btn.textContent = agent ? 'Sent to your agent' : 'Signed up';
      } catch (x) {
        btn.disabled = false; btn.textContent = 'Sign me up';
        $('al-toast').textContent = 'That didn\'t go through. Please try again, or text Darien at 209.882.6469.'; $('al-toast').classList.add('err');
      }
    };
    $('al-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!TRACKER) return;
      read();
      if (!ready()) return;
      openRealtorCheck({ home: 'homes by email', detailsHtml: signupDetailsHtml(), onNo: () => doSignup(null), onYes: (agent) => doSignup(agent) });
    });
    root.addEventListener('click', (e) => { const u = e.target.closest('[data-unsave]'); if (u) { saved.delete(u.dataset.unsave); persistSaved(); draw(); } });
    if (!TRACKER) {
      const withRealtor = (after) => {
        read(); draw();
        if (!ready()) return;
        openRealtorCheck({
          home: 'homes by email',
          detailsHtml: signupDetailsHtml(),
          onNo: () => after(null),
          onYes: (agent) => { A.agentName = agent.name; A.agentBrokerage = agent.brokerage; A.agentContact = agent.contact; A.agentPhone = agent.phone || ''; A.agentEmail = agent.email || ''; save(); draw(); $('al-toast').textContent = REALTOR_MSG; after(agent); }
        });
      };
      $('al-email-btn').addEventListener('click', (e) => { e.preventDefault(); withRealtor(() => { $('al-toast').textContent = (A.agentName ? REALTOR_MSG + ' ' : '') + 'Your email app should open with this filled in. If it doesn\'t, tap Copy.'; location.href = $('al-email-btn').href; }); });
      $('al-text-btn').addEventListener('click', (e) => { e.preventDefault(); withRealtor(() => { $('al-toast').textContent = (A.agentName ? REALTOR_MSG + ' ' : '') + 'Your texting app should open with this filled in. If it doesn\'t, tap Copy.'; location.href = $('al-text-btn').href; }); });
      $('al-copy').addEventListener('click', async () => {
        withRealtor(async () => {
          try { await navigator.clipboard.writeText($('al-msg').value); $('al-toast').textContent = (A.agentName ? REALTOR_MSG + ' ' : '') + 'Copied. Paste it into an email to darienphillips45@gmail.com or a text to 209.882.6469.'; }
          catch (x) { $('al-msg').focus(); $('al-msg').select(); $('al-toast').textContent = 'Copy is blocked here. The text is selected, so press Ctrl+C or Cmd+C.'; }
        });
      });
    }
    read();
    draw();
  }
});

/* ===== Your cart: click a home to see it in the preview =====
   Nov 10, 2026: the family shopping image is the Cart tab header only,
   so the preview inside the tab is text only now, no duplicate of the
   header photo. Clicking a home in the cart updates the preview text
   with that home's name, address and price. */
function cartClickPreviewHtml() {
  return '<div class="panel" id="cartClickPreview" style="display:grid;gap:12px;margin-bottom:16px">' +
    '<div><b>Shopping for a home, together.</b> <span id="cartClickText">Click a home in your cart to see it here.</span></div></div>';
}
document.addEventListener('click', (e) => {
  const a = e.target.closest ? e.target.closest('.cart-pan-card h3 a, .cart-list a, .cart-next-card a') : null;
  const box = document.getElementById('cartClickText');
  if (!a || !box) return;
  const card = a.closest('.cart-pan-card, .cart-next-card') || a.closest('li');
  const price = card ? (card.querySelector('.price') || {}).textContent || '' : '';
  box.textContent = a.textContent.trim() + (price ? ', ' + price.trim() : '') + '.';
});
/* ===== Your cart: homes to ask Darien about, like shopping ===== */
// Homes like the ones the visitor liked or saved. Same city first, then
// similar price and bed/bath. If there is no saved history at all, fall
// back to popular homes and say so plainly.
function similarHomes() {
  const seeds = (typeof propOfCard === 'function' ? [...saved.keys()].map(propOfCard).filter((p) => p && p.price) : []);
  const pool = (typeof PROPS !== 'undefined' ? PROPS : []).filter((p) => p && p.price && typeof p.card === 'function');
  const seedKeys = new Set(seeds.map((p) => p.key));
  const cand = pool.filter((p) => !seedKeys.has(p.key));
  if (!seeds.length) return { list: cand.slice(0, 6), basedOn: false };
  const score = (p) => {
    let s = 0;
    seeds.forEach((q) => {
      if (p.city && q.city && p.city === q.city) s += 3;
      else if (p.county && q.county && p.county === q.county) s += 1;
      const d = Math.abs(p.price - q.price) / q.price;
      if (d <= 0.2) s += 2; else if (d <= 0.4) s += 1;
      if (p.beds && q.beds && String(p.beds) === String(q.beds)) s += 1;
      if (p.baths && q.baths && String(p.baths) === String(q.baths)) s += 1;
      if (p.kind === q.kind) s += 1;
    });
    return s;
  };
  return { list: cand.sort((a, b) => score(b) - score(a)).slice(0, 6), basedOn: true };
}
// The card key (a:, p:, c:, s:, l:) for a property, so a similar home can
// be added to the cart with the same key the rest of the site uses.
function cartKeyForProp(p) {
  if (typeof CARD_PROP === 'undefined') return p.key;
  const hit = Object.keys(CARD_PROP).find((k) => CARD_PROP[k] === p.key);
  return hit || p.key;
}
/* ===== Cart pan row =====
   Carted homes in a horizontal row of square boxes that pans right to
   left. The row pauses on hover or focus, and Prev and Next arrows step
   through it. No ring anywhere. Every carted home shows a photo: its
   property photo, its TOURED_MEDIA photo, Cornwall photo A, or the
   home's sheet photo, with a stock photo and an honest label as the
   last resort, never a text-only card. */
function cartPhotoFor(x) {
  const media = (typeof TOURED_MEDIA !== 'undefined') ? TOURED_MEDIA : {};
  const m = media[x.k];
  if (m && m.photos && m.photos.length) return { src: m.photos[0], tag: 'REAL PHOTO, Zillow listing photo, Photo A' };
  if (m && m.photo) return { src: m.photo, tag: m.credit || 'Listing photo' };
  const p = (typeof propOfCard === 'function') ? propOfCard(x.k) : null;
  if (p) {
    if (p.img && /^https:\/\//i.test(p.img)) return { src: p.img, tag: 'Listing photo' };
    const pm = media[p.key];
    if (pm && pm.photos && pm.photos.length) return { src: pm.photos[0], tag: 'REAL PHOTO, Zillow listing photo, Photo A' };
    if (pm && pm.photo) return { src: pm.photo, tag: pm.credit || 'Listing photo' };
  }
  if (x.k === 't:cornwall-rocklin') return { src: 'https://photos.zillowstatic.com/fp/ac07c90610729589746756f36bd5036e-d_d.jpg', tag: 'REAL PHOTO, Zillow listing photo, Photo A' };
  return { src: TOUR_STOCK_IMG, tag: 'STOCK PHOTO, not this home' };
}
function cartPanCard(e) {
  const photo = e.img ? '<img class="cart-pan-photo" src="' + esc(e.img) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' + (e.imgTag ? '<span class="cart-photo-tag">' + esc(e.imgTag) + '</span>' : '') : '<div class="cart-photo-none">No photo on file for this home yet</div>';
  const body = '<div class="head"><span class="pill pa">' + esc(e.pill) + '</span></div>' + photo +
    (e.link ? '<h3><a href="' + esc(e.link) + '">' + esc(e.title) + '</a></h3>' : '<h3>' + esc(e.title) + '</h3>') +
    (e.price ? '<div class="price num">' + esc(e.price) + '</div>' : '') +
    (e.facts ? '<div class="facts">' + esc(e.facts) + '</div>' : '') +
    '<div class="cart-pan-acts">' +
    (e.removeKey ? '<button type="button" class="btn btn-line btn-sm" data-remove-cart="' + esc(e.removeKey) + '">Remove</button>' : '') +
    (e.addKey ? cartBtn(e.addKey, e.title, e.price || '') : '') +
    '</div>';
  return '<article class="card cart-pan-card">' + body + '</article>';
}
function cartPanHtml(entries, label) {
  return '<div class="cart-pan-wrap" data-cart-pan-wrap>' +
    '<div class="cart-pan-bar"><button type="button" class="btn btn-line btn-sm" data-pan-prev aria-label="Show earlier homes">← Prev</button><p class="cart-pan-hint">Homes slide right to left. Hover to pause, or use Prev and Next.</p><button type="button" class="btn btn-line btn-sm" data-pan-next aria-label="Show more homes">Next →</button></div>' +
    '<div class="cart-pan-viewport" data-cart-pan tabindex="0" role="region" aria-label="' + esc(label) + '"><div class="cart-pan-track">' + entries.map(cartPanCard).join('') + '</div></div></div>';
}
// Auto-pan: the row drifts right to left on its own, pauses on hover or
// focus, and Prev and Next step it by one card. The track is duplicated
// once so the loop wraps without a jump.
function bindCartPan(root) {
  root.querySelectorAll('[data-cart-pan]').forEach((vp) => {
    const track = vp.querySelector('.cart-pan-track');
    if (!track || !track.children.length) return;
    track.innerHTML += track.innerHTML;
    let paused = false, coolUntil = 0;
    const step = () => {
      if (!document.contains(vp)) { clearInterval(t); return; }
      if (paused || Date.now() < coolUntil || document.hidden) return;
      vp.scrollLeft += 1;
      if (vp.scrollLeft >= track.scrollWidth / 2) vp.scrollLeft = 0;
    };
    const t = setInterval(step, 40);
    vp.addEventListener('mouseenter', () => { paused = true; });
    vp.addEventListener('mouseleave', () => { paused = false; });
    vp.addEventListener('focusin', () => { paused = true; });
    vp.addEventListener('focusout', () => { paused = false; });
    const wrap = vp.closest('[data-cart-pan-wrap]');
    if (wrap) {
      const prev = wrap.querySelector('[data-pan-prev]'), next = wrap.querySelector('[data-pan-next]');
      const hop = (d) => { coolUntil = Date.now() + 5000; vp.scrollBy({ left: d * 280, behavior: 'smooth' }); };
      if (prev) prev.addEventListener('click', () => hop(-1));
      if (next) next.addEventListener('click', () => hop(1));
    }
  });
}
function cartEntryFor(x) {
  const p = typeof propOfCard === 'function' ? propOfCard(x.k) : null;
  const photo = cartPhotoFor(x);
  return {
    title: p ? propTitle(p, true) : x.t,
    price: p ? propPrice(p) : (x.p || ''),
    facts: p ? [p.city, propFacts(p)].filter(Boolean).join(' · ') : '',
    link: p ? '#p/' + p.key : '',
    pill: 'In your cart',
    img: photo.src,
    imgTag: photo.tag,
    removeKey: x.k
  };
}
def('cart', {
  nav: 'Your cart', scene: 'cart', kicker: 'Your cart', tileTitle: 'Your cart',
  title: 'Homes in your cart',
  sub: 'Add any home or new-build community to your cart, like shopping. Then ask Darien for more info on all of them at once. Your cart is saved on this device.',
  ctas: () => '<a class="btn btn-ghost" href="sms:+12098826469">Text Darien</a><a class="btn btn-ghost" href="tel:+12098826469">Call Darien</a><a class="btn btn-ghost" href="mailto:darienphillips45@gmail.com">Email Darien</a>',
  html() {
    const items = [...cart.values()];
    const views = '<div class="cart-view" role="group" aria-label="How to see your carted homes"><button type="button" class="btn btn-line btn-sm" data-cart-view="pan" aria-pressed="true">Pan</button><button type="button" class="btn btn-line btn-sm" data-cart-view="all" aria-pressed="false">All</button><button type="button" class="btn btn-line btn-sm" data-cart-view="next" aria-pressed="false">Next</button></div>';
    if (!items.length) {
      const sim = similarHomes();
      const entries = sim.list.map((p) => {
        const photo = cartPhotoFor({ k: cartKeyForProp(p) });
        return {
          title: propTitle(p, true), price: propPrice(p),
          facts: [p.city, propFacts(p)].filter(Boolean).join(' · '),
          link: '#p/' + p.key,
          pill: sim.basedOn ? 'Like the ones you looked at' : 'Popular home',
          img: photo.src,
          imgTag: photo.tag,
          addKey: cartKeyForProp(p)
        };
      });
      return '<section class="blk cart-page"><div class="wrap">' + cartClickPreviewHtml() + '<div class="empty"><h3>Your cart is empty</h3><p>Tap "Add to cart" on any home or new-build community, on any tab, and it will show up here.</p><p><button type="button" class="btn btn-pa" data-go="assumable">Browse assumable homes</button> <button type="button" class="btn btn-line" data-go="new-builds">Browse new builds</button></p></div>' +
        (entries.length ? '<div class="shead" style="margin-top:22px" data-grow><div><h2>' + (sim.basedOn ? 'Homes like the ones you looked at' : 'Popular homes to start with') + '</h2><p>' + (sim.basedOn ? 'Based on homes you saved or liked on this site.' : 'Popular homes on this site. These are not based on your history, because there is no saved or liked home on this device yet.') + '</p></div></div>' + cartPanHtml(entries, 'Similar homes') : '') +
        '</div></section>';
    }
    const entries = items.map(cartEntryFor);
    return '<section class="blk cart-page"><div class="wrap">' + cartClickPreviewHtml() + views +
      '<div data-cart-view-panel="pan">' + cartPanHtml(entries, 'Homes in your cart') + '</div>' +
      '<div data-cart-view-panel="all" hidden><div class="shead" style="margin-top:4px"><div><h2>Your cart, ' + items.length + (items.length === 1 ? ' home' : ' homes') + '</h2><p>Every home below is in your cart. Remove any you do not want, or ask Darien about all of them at once.</p></div></div>' +
      '<ul class="cart-list">' + items.map((x) => {
        const e = cartEntryFor(x);
        const inner = '<div><b>' + esc(e.title) + '</b><span class="cart-list-facts">' + esc([e.price, e.facts].filter(Boolean).join(' · ')) + '</span></div>';
        const linked = e.link ? '<a href="' + esc(e.link) + '">' + inner + '</a>' : inner;
        const photo = e.img ? '<img class="cart-list-photo" src="' + esc(e.img) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '';
        return '<li>' + photo + linked + '<button type="button" class="btn btn-line btn-sm" data-remove-cart="' + esc(x.k) + '">Remove</button></li>';
      }).join('') + '</ul></div>' +
      '<div data-cart-view-panel="next" hidden><div class="cart-next" data-cart-next></div></div>' +
      '<div class="panel accent" style="margin-top:16px;display:grid;gap:12px"><b>Get more info on these ' + plural(items.length, 'home') + '</b><p class="note">Tap below to see the details for these homes first, then answer one question about an agent.</p>' +
      '<div class="ctas" style="margin:0"><button type="button" class="btn btn-pa" data-cart-contact="sms">Text Darien about these homes</button>' +
      '<button type="button" class="btn btn-line" data-cart-contact="email">Email Darien about these homes</button>' +
      '<a class="btn btn-line" href="tel:+12098826469">Call Darien</a></div></div></div></section>';
  },
  mount(root) {
    bindCartPan(root);
    const panels = {};
    root.querySelectorAll('[data-cart-view-panel]').forEach((p) => { panels[p.dataset.cartViewPanel] = p; });
    const btns = [...root.querySelectorAll('[data-cart-view]')];
    if (!btns.length) return;
    const items = [...cart.values()];
    let idx = 0;
    const drawNext = () => {
      const box = panels.next ? panels.next.querySelector('[data-cart-next]') : null;
      if (!box || !items.length) return;
      if (idx >= items.length) idx = items.length - 1;
      if (idx < 0) idx = 0;
      const x = items[idx];
      const e = cartEntryFor(x);
      const inner = '<b>' + esc(e.title) + '</b>' + ((e.price || e.facts) ? '<span class="cart-list-facts">' + esc([e.price, e.facts].filter(Boolean).join(' · ')) + '</span>' : '');
      const photo = e.img ? '<img class="cart-next-photo" src="' + esc(e.img) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' + (e.imgTag ? '<span class="cart-photo-tag">' + esc(e.imgTag) + '</span>' : '') : '';
      box.innerHTML = '<div class="cart-next-step"><button type="button" class="btn btn-line btn-sm" data-next-prev>← Prev</button><span>' + (idx + 1) + ' of ' + items.length + '</span><button type="button" class="btn btn-line btn-sm" data-next-next>Next →</button></div>' +
        '<div class="cart-next-card">' + photo + (e.link ? '<a href="' + esc(e.link) + '">' + inner + '</a>' : inner) +
        '<div class="cart-pan-acts"><button type="button" class="btn btn-line btn-sm" data-remove-cart="' + esc(x.k) + '">Remove</button></div></div>';
      box.querySelector('[data-next-prev]').addEventListener('click', () => { idx = (idx - 1 + items.length) % items.length; drawNext(); });
      box.querySelector('[data-next-next]').addEventListener('click', () => { idx = (idx + 1) % items.length; drawNext(); });
    };
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      Object.keys(panels).forEach((k) => { panels[k].hidden = k !== b.dataset.cartView; });
      if (b.dataset.cartView === 'next') drawNext();
    }));
    drawNext();
  }
});
