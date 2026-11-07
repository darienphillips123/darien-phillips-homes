/* ===== Beginner's guide: every step from pre-qualification to keys, the words that go with each, and a chart with a legend ===== */
const GUIDE_PHASES = [
  ['prep', 'Get ready', '#2C7BE5'], ['shop', 'Shop', '#13A89E'], ['offer', 'Make an offer', '#E9A23B'], ['escrow', 'Escrow', '#B4416E'], ['close', 'Close', '#2FA36B']
];
// [phase, step, what happens, typical timing, money due?, deadline?]
const GUIDE_STEPS = [
  ['prep', 'Check your budget and credit', 'Look at your monthly budget, savings and credit score. This decides which loans you can use.', 'Anytime, ideally 1 to 3 months before you shop', false, false],
  ['prep', 'Pre-qualification', 'A quick estimate from a lender of how much you might borrow, based on what you tell them. Free, and it doesn\'t lock anything in.', '1 day', false, false],
  ['prep', 'Pre-approval', 'The lender checks your income, assets and credit and gives you a letter showing what you\'re approved for. Sellers expect this with an offer.', '1 to 5 days', false, false],
  ['prep', 'Sign a buyer representation agreement', 'A short written agreement with your agent about the work they\'ll do for you and how they\'re paid. California requires one before touring homes with an agent.', 'Before your first tour', false, false],
  ['shop', 'Tour homes and new-build models', 'See homes in person or on video, compare neighborhoods, and look at payment estimates. For new builds, your agent should be with you (or registered) at the first visit.', '2 weeks to a few months', false, false],
  ['shop', 'Pick the home and price it', 'Your agent pulls comparable sales (comps) so you know what the home is really worth before you offer.', '1 to 2 days', false, false],
  ['offer', 'Write and send the offer', 'The purchase agreement lists your price, deposit, loan, contingencies and closing date. The seller can accept, reject or counter.', 'Same day to a few days', false, true],
  ['offer', 'Offer accepted (in contract)', 'Once both sides sign, you\'re "in contract" and the escrow clock starts.', 'Day 0', false, true],
  ['escrow', 'Earnest money deposit (EMD)', 'Your good-faith deposit, often 1% to 3% of the price, wired to the escrow company. In California it\'s usually due within 3 business days of acceptance. It goes toward your down payment and closing costs.', 'Within about 3 business days', true, true],
  ['escrow', 'Open escrow and title', 'A neutral escrow officer holds the money and paperwork. The title company checks that the seller can legally sell and that there are no unpaid liens.', 'Days 1 to 3', false, false],
  ['escrow', 'Disclosures', 'The seller gives you reports on the home\'s condition and history, plus hazard disclosures (flood, fire and earthquake zones). Read and sign them.', 'Usually within 7 days', false, true],
  ['escrow', 'Home inspection', 'A licensed inspector checks the roof, plumbing, electrical, heating and more. You can ask for repairs or a credit, or cancel within your contingency period.', 'Days 3 to 10', true, true],
  ['escrow', 'Appraisal', 'The lender hires an appraiser to confirm the home is worth the price. If it comes in low, you can renegotiate, pay the difference, or cancel if you have an appraisal contingency.', 'Days 7 to 17', true, true],
  ['escrow', 'Loan underwriting and approval', 'The lender verifies everything and issues final loan approval. Don\'t change jobs, open new credit or make big purchases during escrow.', 'Days 10 to 25', false, true],
  ['escrow', 'Remove contingencies', 'You sign off that you\'re satisfied with the inspection, appraisal and loan. After this, your deposit is usually at risk if you back out.', 'Often by day 17', false, true],
  ['close', 'Closing Disclosure', 'Your lender sends the final loan terms and closing costs. By law you get it at least 3 business days before you sign.', '3+ business days before signing', false, true],
  ['close', 'Final walk-through', 'One last look to make sure the home is in the agreed condition and any repairs were done.', '1 to 5 days before closing', false, false],
  ['close', 'Sign loan documents', 'You sign the loan and closing papers with a notary, usually at the escrow office.', 'A few days before closing', false, false],
  ['close', 'Bring your cash to close', 'Wire your down payment and closing costs (minus your EMD) to escrow. Always call escrow at a number you already trust to confirm wiring instructions.', '1 to 2 days before closing', true, true],
  ['close', 'Funding, recording and keys', 'The lender funds the loan, the deed is recorded with the county, and the home is yours. Time to get the keys!', 'Closing day, often day 30', false, false]
];
// [term, definition, phase]
const GUIDE_TERMS = [
  ['Adjustable-rate mortgage (ARM)', 'A loan whose rate is fixed for a set time (for example 5 years on a "5/1 ARM") and then can change once a year after that.', 'prep'],
  ['Amortization', 'Paying a loan off over time with regular payments. Early payments are mostly interest; later ones are mostly principal.', 'prep'],
  ['Annual percentage rate (APR)', 'The yearly cost of a loan including the interest rate and certain fees. Use it to compare loan offers.', 'prep'],
  ['Appraisal', 'A professional estimate of the home\'s value, ordered by the lender, to make sure the loan isn\'t more than the home is worth.', 'escrow'],
  ['Appraisal contingency', 'A clause that lets you renegotiate or cancel if the appraisal comes in below the price.', 'offer'],
  ['As-is', 'The seller won\'t make repairs. You can still inspect, and you can still cancel within your contingency period.', 'offer'],
  ['Assumable loan', 'A seller\'s existing FHA, VA or USDA loan that a qualified buyer can take over, keeping the seller\'s rate. You pay the difference between the price and the loan balance.', 'prep'],
  ['Buyer representation agreement', 'A written agreement between you and your agent describing their services and how they\'re paid. Required in California before touring with an agent.', 'prep'],
  ['Buydown', 'Money paid up front (often by the builder or seller) to lower your rate, either for the first years (like a 2-1 buydown) or for the life of the loan.', 'offer'],
  ['CalHFA MyHome', 'A California down payment assistance loan for first-time buyers, often paired with FHA or conventional loans.', 'prep'],
  ['Cash to close', 'The total you bring to closing: down payment plus closing costs, minus your EMD and any credits.', 'close'],
  ['Close of escrow (COE)', 'The day the sale is final: the loan funds, the deed records and you own the home.', 'close'],
  ['Closing costs', 'Fees to finish the purchase and loan, such as lender fees, title insurance, escrow fees, recording fees and prepaid taxes and insurance. Buyers often pay about 2% to 5% of the price.', 'close'],
  ['Closing Disclosure (CD)', 'The final, official list of your loan terms and closing costs. You must get it at least 3 business days before signing.', 'close'],
  ['Comparable sales (comps)', 'Recently sold homes like the one you want, used to judge a fair price.', 'shop'],
  ['Contingency', 'A condition in your offer (inspection, appraisal, loan) that must be met, or you can cancel without losing your deposit.', 'offer'],
  ['Contingency removal', 'Signing off that a condition is satisfied. After removing contingencies, backing out usually risks your deposit.', 'escrow'],
  ['Conventional loan', 'A mortgage not backed by the government. You can put as little as 3% to 5% down; under 20% down usually means PMI.', 'prep'],
  ['Counteroffer', 'A reply that changes the terms of an offer, such as the price or closing date.', 'offer'],
  ['Credit score', 'A number (usually 300 to 850) that shows lenders how you handle credit. Higher scores usually get better rates.', 'prep'],
  ['Debt-to-income ratio (DTI)', 'Your monthly debt payments, including the new mortgage, divided by your monthly income before taxes. Lenders use it to decide how much you can borrow.', 'prep'],
  ['Deed', 'The legal document that transfers ownership of the home. It\'s recorded with the county at closing.', 'close'],
  ['Disclosures', 'Forms the seller must give you about the home\'s condition, history and natural hazards.', 'escrow'],
  ['Down payment', 'The part of the price you pay up front. The loan covers the rest.', 'prep'],
  ['Down payment assistance (DPA)', 'Grants or low-cost second loans that help cover your down payment or closing costs.', 'prep'],
  ['Earnest money deposit (EMD)', 'Your good-faith deposit after the offer is accepted, often 1% to 3% of the price. It\'s held in escrow and credited toward your purchase at closing.', 'escrow'],
  ['Escrow', 'A neutral third party that holds money and documents until every condition of the sale is met.', 'escrow'],
  ['Escrow (impound) account', 'An account your lender may set up to pay property taxes and homeowners insurance as part of your monthly payment.', 'close'],
  ['FHA loan', 'A government-backed loan with as little as 3.5% down and flexible credit rules. It has mortgage insurance (MIP).', 'prep'],
  ['Final walk-through', 'Your last visit before closing to confirm the home\'s condition and that agreed repairs were done.', 'close'],
  ['Fixed-rate mortgage', 'A loan whose interest rate never changes, usually over 15 or 30 years.', 'prep'],
  ['HOA (homeowners association)', 'A group that manages a community\'s shared areas and rules, paid for with monthly or yearly dues.', 'shop'],
  ['Home inspection', 'A licensed inspector\'s review of the home\'s structure and systems. Paid by the buyer, usually a few hundred dollars.', 'escrow'],
  ['Home warranty', 'A service plan that covers repairs to appliances and systems for a set time, often a year.', 'close'],
  ['Homeowners insurance', 'Insurance that protects the home and your belongings. Lenders require it before closing.', 'escrow'],
  ['Inspection contingency', 'Time in your contract (often 17 days in California) to inspect and cancel or renegotiate.', 'offer'],
  ['Interest rate', 'The yearly cost of borrowing, as a percent of the loan.', 'prep'],
  ['Lien', 'A legal claim on a property for an unpaid debt. Title must be clear of liens before closing.', 'escrow'],
  ['Listing agent', 'The agent who represents the seller.', 'shop'],
  ['Loan contingency', 'A clause that lets you cancel if you can\'t get your loan approved by a set date.', 'offer'],
  ['Loan Estimate (LE)', 'A standard 3-page form from a lender showing the rate, payment and costs of a loan. Lenders must give it within 3 business days of your application.', 'prep'],
  ['Loan-to-value (LTV)', 'The loan amount divided by the home\'s value. A lower LTV means more equity and often a better rate.', 'prep'],
  ['Mello-Roos', 'A special California tax in some (often newer) neighborhoods that pays for schools, roads and parks. It\'s added to your property tax bill.', 'shop'],
  ['MLS (Multiple Listing Service)', 'The database agents use to list and find homes for sale. MetroList is the MLS for most of the Sacramento and Central Valley area.', 'shop'],
  ['Mortgage insurance (PMI / MIP)', 'Insurance that protects the lender when you put less than 20% down. PMI is for conventional loans; MIP is for FHA.', 'prep'],
  ['Origination fee', 'A lender\'s charge for processing your loan, often shown as a percent of the loan.', 'close'],
  ['PITI', 'Principal, interest, taxes and insurance: the four parts of a typical monthly house payment. Add HOA dues if there are any.', 'prep'],
  ['Points (discount points)', 'Fees you pay up front to lower your interest rate. One point is 1% of the loan.', 'offer'],
  ['Pre-approval', 'A lender\'s written approval for a loan amount after checking your income, assets and credit.', 'prep'],
  ['Pre-qualification', 'A quick, informal estimate of how much you might be able to borrow.', 'prep'],
  ['Principal', 'The amount you borrowed, not counting interest.', 'prep'],
  ['Property tax', 'A yearly tax on the home. In California it\'s about 1% of the purchase price plus local assessments.', 'shop'],
  ['Purchase agreement', 'The contract between buyer and seller with the price and all the terms. In California it\'s often called the RPA.', 'offer'],
  ['Quick move-in (QMI)', 'A newly built home that\'s finished or almost finished and can close soon.', 'shop'],
  ['Rate lock', 'A lender\'s promise to hold your interest rate for a set time while your loan is processed.', 'escrow'],
  ['Recording', 'When the county records the deed and loan, making the sale official in public records.', 'close'],
  ['Seller credit (concessions)', 'Money the seller agrees to put toward your closing costs or a rate buydown.', 'offer'],
  ['Title', 'Legal ownership of the property.', 'escrow'],
  ['Title insurance', 'Insurance that protects you and your lender if a problem with ownership (like an old lien) shows up later.', 'close'],
  ['Transfer tax', 'A tax charged when a home changes hands. In much of Northern California the seller usually pays the county transfer tax.', 'close'],
  ['Underwriting', 'The lender\'s final review of you and the home before approving the loan.', 'escrow'],
  ['USDA loan', 'A government-backed loan for eligible rural and suburban areas, with $0 down for buyers under income limits.', 'prep'],
  ['VA loan', 'A loan for eligible veterans and service members with $0 down and no monthly mortgage insurance.', 'prep'],
  ['Wire fraud', 'Scammers sending fake wiring instructions. Always call escrow at a known phone number before sending money.', 'close']
];
const phaseOf = (k) => GUIDE_PHASES.find((p) => p[0] === k) || GUIDE_PHASES[0];
def('guide', {
  nav: 'Beginner\'s guide', scene: 'home', kicker: 'New to buying? Start here', tileTitle: 'Beginner\'s guide',
  photoKey: () => 'guide',
  title: 'The beginner\'s guide to buying a home',
  sub: 'Every step from pre-qualification to getting your keys, what each word means, and when money is due.',
  ctas: () => '<button type="button" class="btn btn-pa" data-jump="g-chart">See the steps</button><button type="button" class="btn btn-ghost" data-jump="g-words">Real estate words A to Z</button><a class="btn btn-ghost" href="sms:+12098826469">Text Darien</a><a class="btn btn-ghost" href="tel:+12098826469">Call Darien</a><a class="btn btn-ghost" href="mailto:darienphillips45@gmail.com">Email Darien</a>',
  html() {
    const legend = '<div class="g-legend" role="list" aria-label="Chart legend">' +
      GUIDE_PHASES.map(([, n, c]) => '<span role="listitem"><i class="g-sw" style="background:' + c + '"></i>' + esc(n) + '</span>').join('') +
      '<span role="listitem"><b class="g-ic">$</b>Money is due</span><span role="listitem"><b class="g-ic">⏱</b>Has a deadline</span></div>';
    const chart = '<ol class="g-chart">' + GUIDE_STEPS.map(([ph, t, d, when, money, dl], i) => {
      const [, pn, c] = phaseOf(ph);
      return '<li class="g-step" style="--gc:' + c + '"><div class="g-num">' + (i + 1) + '</div><div class="g-body"><div class="g-top"><span class="g-ph">' + esc(pn) + '</span>' +
        (money ? '<b class="g-ic" title="Money is due">$</b>' : '') + (dl ? '<b class="g-ic" title="Has a deadline">⏱</b>' : '') + '</div><h3>' + esc(t) + '</h3><p>' + esc(d) + '</p><p class="g-when">' + esc(when) + '</p></div></li>';
    }).join('') + '</ol>';
    const bar = '<div class="g-bar" aria-hidden="true">' + GUIDE_PHASES.map(([k, n, c]) => '<span style="flex:' + GUIDE_STEPS.filter((s) => s[0] === k).length + ';background:' + c + '">' + esc(n) + '</span>').join('') + '</div>';
    return '<section class="blk" id="g-chart"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">The chart</p><h2>From first step to keys, in order</h2>' +
        '<p>Most purchases take about 30 to 45 days once your offer is accepted. Timing below is typical for California and can change with your contract.</p></div></div>' +
        bar + '<div class="panel g-legend-box"><b>How to read the chart (legend)</b><p class="note">Each color is a stage of the purchase, shown in the strip above and on every step. <b class="g-ic">$</b> means you\'ll pay something at that step. <b class="g-ic">⏱</b> means there\'s a deadline in your contract or by law, so don\'t miss it.</p>' + legend + '</div>' +
        chart + '</div></section>' +
      '<section class="blk" id="g-money"><div class="wrap"><div class="shead"><div><h2>Where your money goes</h2></div></div><div class="why">' +
        '<div class="panel"><b>Earnest money deposit (EMD)</b><p>Often 1% to 3% of the price, due within about 3 business days of acceptance. It counts toward your down payment and costs at closing.</p></div>' +
        '<div class="panel"><b>Down payment</b><p>$0 with VA or USDA, 3.5% with FHA, and 3% to 5% and up with conventional loans. Assistance programs can help.</p></div>' +
        '<div class="panel"><b>Closing costs</b><p>Usually about 2% to 5% of the price for buyers: lender fees, title and escrow, recording, plus prepaid taxes and insurance. Sellers and builders sometimes pay part.</p></div>' +
        '<div class="panel"><b>Inspection and appraisal</b><p>Paid during escrow, usually a few hundred dollars each. The appraisal is often paid through your lender.</p></div>' +
      '</div></div></section>' +
      '<section class="blk" id="g-words"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Glossary</p><h2>Real estate words A to Z</h2><p>' + GUIDE_TERMS.length + ' words you\'ll hear, in plain English. The color shows the stage where each one usually comes up.</p></div></div>' +
        '<div class="field" style="max-width:460px;margin-bottom:12px"><label for="g-find">Find a word</label><input id="g-find" type="search" placeholder="For example EMD, escrow, PMI" autocomplete="off"></div>' +
        '<dl class="g-terms" id="g-terms">' + GUIDE_TERMS.map(([t, d, ph]) => '<div class="g-term" style="--gc:' + phaseOf(ph)[2] + '" data-t="' + esc((t + ' ' + d).toLowerCase()) + '"><dt>' + esc(t) + '</dt><dd>' + esc(d) + '</dd></div>').join('') + '</dl>' +
        '<p class="note" id="g-none" hidden>No matching words. Text Darien and he\'ll explain it.</p>' +
        '<p class="fine" style="margin-top:14px">This guide is general information, not legal, tax or lending advice. Your contract, lender and escrow officer set the actual deadlines and costs.</p>' +
      '</div></section>' +
      '<section class="blk"><div class="wrap"><div class="panel accent bar"><div><b>Ready for the first step?</b><p class="note">Darien can connect you with a lender for pre-approval and walk you through every step on this page.</p></div><a class="btn btn-pa" href="sms:+12098826469">Text Darien</a><button type="button" class="btn btn-line" data-go="search">Search every home</button></div></div></section>';
  },
  mount(root) {
    const f = root.querySelector('#g-find');
    if (!f) return;
    f.addEventListener('input', () => {
      const v = f.value.trim().toLowerCase();
      let n = 0;
      root.querySelectorAll('.g-term').forEach((el) => { const on = !v || el.dataset.t.includes(v); el.hidden = !on; if (on) n++; });
      root.querySelector('#g-none').hidden = n > 0;
    });
  }
});
