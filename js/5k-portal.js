/* ===== Custom Portal: a self-serve custom MLS portal request =====
   Same home-type options, city list and must-have words as the Finder,
   and the match count reuses the Finder items and the Finder's own
   matching rules, so the number shown here is the number the Finder
   would show for the same criteria. A monthly payment cap is turned
   into a top price with the site's own payment math, on an FHA loan
   with $0 down through CalHFA MyHome, and the lower of the two caps
   wins when both are given. No agent question on this form: the
   request goes straight to Darien as a sign-up, with the criteria in
   the Wants and Notes fields. */
const PORTAL_KINDS = [['all', 'Any'], ['newbuild', 'New build'], ['assumable', 'Assumable'], ['zerodown', '$0 down']];
const PORTAL_MUST = ['open floor plan', 'large backyard', 'pool', 'ADU', 'single story'];
const PORTAL_DEFAULTS = { email: '', kind: 'all', city: '', beds: 0, baths: 0, max: 0, pay: 0, must: [], extra: '' };
const portalKindLabel = (k) => (PORTAL_KINDS.find(([v]) => v === k) || PORTAL_KINDS[0])[1];
function portalMatches(B) {
  let cap = B.max || 0, payCap = 0;
  if (B.pay) {
    payCap = maxPrice(B.pay, { loan: 'myhome', cash: 0, county: countyOf(B.city) || 'Sacramento' });
    if (!payCap) return { items: [], cap: 0, payCap: 0 };
    cap = cap ? Math.min(cap, payCap) : payCap;
  }
  const mustWords = (B.must || []).join(' ').toLowerCase().split(/\s+/).filter(Boolean);
  const items = finderItems().filter((it) => {
    if (B.kind === 'assumable') { if (!(it.kind === 'assumable' || it.kind === 'placer')) return false; }
    if (B.kind === 'newbuild') { if (!(it.kind === 'community' || it.kind === 'plan' || it.kind === 'stockton')) return false; }
    if (B.kind === 'zerodown') {
      if (it.kind === 'stockton') { /* always a $0-down home */ }
      else if (it.kind !== 'community' || !it.price) return false;
      else { const lim = (LIMITS[it.county] || {}).fha; if (!lim || it.price * 0.965 > lim) return false; }
    }
    if (B.city && it.city !== B.city) return false;
    if (cap) { if (it.price == null || it.price > cap) return false; }
    if (B.beds) { if (it.beds == null || it.beds < B.beds) return false; }
    if (B.baths) { if (it.baths == null || it.baths < B.baths) return false; }
    if (mustWords.length && !mustWords.every((w) => it.hay.includes(w))) return false;
    return true;
  });
  return { items, cap, payCap };
}
function portalCriteriaLine(B) {
  return [portalKindLabel(B.kind), B.city || 'Anywhere', (B.beds ? B.beds + '+ beds' : 'Any beds') + ', ' + (B.baths ? B.baths + '+ baths' : 'Any baths'),
    B.max ? 'up to ' + money(B.max) : 'Any price', B.pay ? 'up to ' + money(B.pay) + ' a month' : 'No monthly cap',
    'Must-haves: ' + ((B.must || []).length ? B.must.join(', ') : 'None')].join(' · ');
}
def('portal', {
  nav: 'Custom Portal', scene: 'alerts', kicker: 'Your own custom portal', tileTitle: 'Custom Portal',
  title: 'Custom Portal',
  sub: 'Tell Darien what you want once. He builds your own custom MLS portal with matching homes and emails it to you.',
  photoKey: () => 'keys',
  html() {
    const B = sub('portal', PORTAL_DEFAULTS);
    B.must = (B.must || []).slice();
    if (!B.email && me().email) B.email = me().email;
    const cities = Array.from(new Set(finderItems().map((it) => it.city).filter(Boolean))).sort();
    return '<section class="blk"><div class="wrap">' +
      '<p class="fd-intro">Pick what you are looking for, add your email, and Darien builds your portal. No sign-up wall to browse, and no agent question on this form.</p>' +
      '<form id="pb-form" novalidate><div class="panel accent" style="display:grid;gap:14px">' +
      '<div class="field"><label for="pb-email">Your email</label><input id="pb-email" type="email" autocomplete="email" value="' + esc(B.email) + '" placeholder="you@example.com"></div>' +
      '<div class="fields">' +
        sel('pb-kind', PORTAL_KINDS, B.kind, 'Home type') +
        sel('pb-city', [['', 'Every city or area']].concat(cities.map((c) => [c, c])), B.city, 'City or area') +
        sel('pb-beds', BED_OPTS, B.beds, 'Bedrooms') + sel('pb-baths', BATH_OPTS, B.baths, 'Bathrooms') +
        moneyField('pb-max', 'Top price', B.max, '', 'No max') + moneyField('pb-pay', 'Monthly payment cap', B.pay, 'Everything: loan, tax, insurance and HOA', 'No cap') +
      '</div>' +
      '<fieldset><legend class="lbl">Must-haves</legend><div class="checks">' + PORTAL_MUST.map((m) => '<label><input type="checkbox" name="pb-must" value="' + esc(m) + '"' + (B.must.includes(m) ? ' checked' : '') + '> ' + esc(m) + '</label>').join('') + '</div></fieldset>' +
      '<div class="field"><label for="pb-extra">Anything else?</label><textarea id="pb-extra" rows="3" placeholder="Anything else you are looking for? A school, a commute, a view, a floor plan you liked...">' + esc(B.extra || '') + '</textarea></div>' +
      '<p class="note">Must-haves search the words in the listings, not a verified feature list, so a home only shows up if the listing mentions it.</p>' +
      '<p class="count" id="pb-count" aria-live="polite"></p>' +
      '<div class="actions"><button type="submit" class="btn btn-pa" id="pb-send">Build my custom portal</button></div>' +
      '<p class="toast err" id="pb-err" role="alert"></p>' +
      '<p class="fine">By tapping Build my custom portal, you agree that Darien Phillips may email, call or text you about homes. Unsubscribe anytime. Consent is not required to buy a home.</p>' +
      '</div></form>' +
      '<div id="pb-summary" hidden></div>' +
      '<p class="note" style="margin-top:14px">Want to browse first? <button type="button" class="btn btn-line btn-sm" data-go="finder">Open the Finder</button></p>' +
      '</div></section>';
  },
  mount(root) {
    const B = S.portal;
    const read = () => {
      B.email = $('pb-email').value.trim();
      B.kind = $('pb-kind').value; B.city = $('pb-city').value;
      B.beds = parseFloat($('pb-beds').value) || 0; B.baths = parseFloat($('pb-baths').value) || 0;
      B.must = [...root.querySelectorAll('input[name="pb-must"]:checked')].map((c) => c.value);
      B.extra = $('pb-extra').value.trim();
      save();
    };
    const drawCount = () => {
      const r = portalMatches(B);
      const el = $('pb-count');
      if (!el) return;
      if (B.pay && !r.payCap) {
        el.textContent = 'No home on this site fits that monthly payment yet. Raise the cap, or leave it blank and set a top price instead.';
        return;
      }
      el.textContent = plural(r.items.length, 'home or community', 'homes and communities') + ' match your criteria on this site right now' +
        (r.payCap ? ' (up to ' + money(r.payCap) + ' by your monthly cap, on an FHA loan with $0 down through CalHFA MyHome)' : '');
    };
    const showSummary = (r) => {
      $('pb-form').hidden = true;
      const s = $('pb-summary');
      s.hidden = false;
      s.innerHTML = '<div class="panel accent" style="display:grid;gap:12px">' +
        '<p class="mono eyebrow">Your portal request</p><h2>Your custom portal request is ready</h2>' +
        '<p class="toast">Darien will build your custom MLS portal and email it to you.</p>' +
        '<ul class="gz-sum">' +
        '<li><span>Email</span><b>' + esc(B.email) + '</b></li>' +
        '<li><span>Home type</span><b>' + esc(portalKindLabel(B.kind)) + '</b></li>' +
        '<li><span>City or area</span><b>' + esc(B.city || 'Anywhere') + '</b></li>' +
        '<li><span>Rooms</span><b>' + esc((B.beds ? B.beds + '+ beds' : 'Any beds') + ' · ' + (B.baths ? B.baths + '+ baths' : 'Any baths')) + '</b></li>' +
        '<li><span>Top price</span><b>' + esc(B.max ? 'Up to ' + money(B.max) : 'Any price') + '</b></li>' +
        '<li><span>Monthly payment cap</span><b>' + esc(B.pay ? money(B.pay) + ' a month' : 'No monthly cap') + '</b></li>' +
        '<li><span>Must-haves</span><b>' + esc((B.must || []).length ? B.must.join(', ') : 'None') + '</b></li>' +
        (B.extra ? '<li><span>Anything else</span><b>' + esc(B.extra) + '</b></li>' : '') +
        '<li><span>Homes that match right now</span><b>' + esc(plural(r.items.length, 'home or community', 'homes and communities') + ' match your criteria on this site') + '</b></li></ul>' +
        '<p class="note">This count is from the homes on this site right now. Your portal will also include matching homes from the MLS.</p>' +
        '<div class="ctas" style="margin:0"><button type="button" class="btn btn-pa" id="pb-see">See the matching homes</button>' +
        '<button type="button" class="btn btn-line" id="pb-change">Change my criteria</button></div>' +
        (TRACKER ? '' : '<p class="fine">This preview does not send anything. Email your request to darienphillips45@gmail.com or text 209.882.6469.</p>') +
        '</div>';
      $('pb-see').addEventListener('click', () => {
        Object.assign(sub('finder', FINDER_DEFAULTS), { kind: B.kind, city: B.city, beds: B.beds, baths: B.baths, max: r.cap, q: (B.must || []).join(' ') });
        save(); go('finder', true);
      });
      $('pb-change').addEventListener('click', () => { s.hidden = true; s.innerHTML = ''; $('pb-form').hidden = false; drawCount(); });
      s.scrollIntoView({ block: 'start' });
    };
    $('pb-form').addEventListener('input', () => { read(); drawCount(); });
    $('pb-form').addEventListener('change', () => { read(); drawCount(); });
    bindMoney('pb-max', (v) => { B.max = isNaN(v) ? 0 : v; save(); drawCount(); });
    bindMoney('pb-pay', (v) => { B.pay = isNaN(v) ? 0 : v; save(); drawCount(); });
    $('pb-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      read();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(B.email)) {
        $('pb-err').textContent = 'Please add a valid email, so Darien can send your portal to you.';
        $('pb-email').focus();
        return;
      }
      $('pb-err').textContent = '';
      const r = portalMatches(B);
      const data = { name: '', email: B.email, phone: '', notes: 'Custom Portal request: ' + portalCriteriaLine(B) + (B.extra ? ' Anything else: ' + B.extra : '') + '. ' + plural(r.items.length, 'home or community', 'homes and communities') + ' match on the site right now.',
        wants: portalKindLabel(B.kind) + ((B.must || []).length ? ', must-haves: ' + B.must.join(', ') : ''), areas: B.city || 'Anywhere Darien works',
        price: B.max ? money(B.max) : '', pay: B.pay ? money(B.pay) : '', beds: B.beds ? B.beds + '+' : 'Any', baths: B.baths ? B.baths + '+' : 'Any',
        size: 'Any', lot: 'Any', when: '', mls: 'yes', saved: '', hasAgent: 'no', agentName: '', agentBrokerage: '', agentContact: '' };
      if (!TRACKER) { showSummary(r); return; }
      const btn = $('pb-send');
      btn.disabled = true; btn.textContent = 'Building your portal...';
      try {
        await post('signup', data);
        trackEvent('Signed up for a custom portal', 'Info request');
        logStep('Asked Darien to build a custom portal: ' + portalCriteriaLine(B) + (B.extra ? ' Anything else: ' + B.extra : ''));
        showSummary(r);
      } catch (x) {
        btn.disabled = false; btn.textContent = 'Build my custom portal';
        $('pb-err').textContent = 'That did not go through. Please try again, or text Darien at 209.882.6469.';
      }
    });
    drawCount();
  }
});
