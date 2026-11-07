/* ===== A page for every home, for social posts and ManyChat DMs =====
   Each home has its own link, like darienphillips.com/p/8160-encino-ave, or just /p/encino.
   Visitors see a preview, then give their name, mobile number and email to see the address, loan,
   payment and links. Darien gets an email when they do, and later a summary of their visit. */
const SITE_URL = ON_WEB && /^https?:$/.test(location.protocol) && !/^(localhost|127\.|\[::1\])/.test(location.hostname) ? location.origin : 'https://darienphillips.com';
const PROPS = [];
const PROP_BY = {};
let PROP_KEY = '';
let LISTINGS = TRACKER ? 'loading' : 'none'; // Darien's Listings tab: 'loading', 'ready' or 'none'

const hayOf = (p) => ' ' + [p.addr, p.city, p.zip, p.place, (p.alias || []).join(' '), p.keywords.join(' ')].filter(Boolean).join(' ').toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ';
function addProp(p) {
  if (!p.key || PROP_BY[p.key]) return null; // the same home in two lists (MLS and Placer): keep the first
  p.keywords = p.keywords || [];
  p.hay = hayOf(p);
  PROPS.push(p);
  [p.key].concat(p.alias || []).forEach((k) => { const s = slug(String(k || '')); if (s && !PROP_BY[s]) PROP_BY[s] = p; });
  return p;
}
DATA.assumables.forEach((h) => addProp({
  key: slug(h.street), alias: [h.mls], kind: 'assumable', page: 'assumable', addr: h.street, city: h.city, county: h.county, zip: h.zip,
  price: h.price, beds: h.beds, baths: h.baths, sqft: h.sqft,
  hook: h.rate ? (h.type ? h.type + ' loan' : 'Loan') + ' at ' + h.rate + '% you can take over' : 'Loan you can take over',
  card: () => assumableCard(h)
}));
PLACER.forEach((h) => addProp({
  key: slug(h.street), alias: [h.id], kind: 'placer', page: 'placer', addr: h.street, city: h.city, county: 'Placer', zip: h.zip,
  price: h.price, beds: h.beds, baths: h.baths, sqft: h.sqft, hook: h.type + ' loan at ' + h.rate + '% you can take over',
  card: () => { const P = sub('pl', PL_DEFAULTS); return placerCard(h, placerFigure(h, P), P); }
}));
STK.homes.forEach((h) => {
  const c = STK_COMM[h.comm];
  addProp({
    key: slug(h.street || c.name + ' ' + h.plan), alias: [h.mls], kind: 'stockton', page: 'stockton', open: !h.street,
    addr: h.street || h.plan + ' at ' + c.name, place: c.name + ' ' + c.builder, city: 'Stockton', county: 'San Joaquin', zip: h.zip,
    price: h.price, from: h.kind === 'plan', beds: range(h.beds, h.bedsMax), baths: range(h.baths, h.bathsMax), sqft: h.sqft,
    hook: 'New ' + (h.kind === 'plan' ? 'floor plan' : 'home') + ' by ' + c.builder + ' with $0-down options',
    card: () => { const K = sub('stk', STK_DEFAULTS); return stocktonCard(h, stkFig(h, K), K); }
  });
});
DATA.communities.forEach((c) => addProp({
  key: slug(c.name), kind: 'community', page: 'new-builds', open: true, addr: c.name, place: c.builder, city: c.city, county: c.county, zip: c.zip,
  price: c.min, from: true, beds: c.bmin ? range(c.bmin, c.bmax) : null, sqft: c.sqft,
  hook: 'New homes' + (c.builder ? ' by ' + c.builder : ''), card: () => communityCard(c, { loan: 'myhome' })
}));

const KIND_LABEL = { assumable: 'Assumable loan', placer: 'Assumable loan', stockton: 'New home', community: 'New-home community', listing: 'Featured home' };
const propPrice = (p) => (p.price ? (p.from ? 'From ' : '') + money(p.price) : 'Price: ask Darien');
const propFacts = (p) => [p.beds ? p.beds + ' bd' : '', p.baths ? p.baths + ' ba' : '', p.sqft ? comma(p.sqft) + (p.kind === 'community' ? '+' : '') + ' sq ft' : ''].filter(Boolean).join(' · ');
function propTitle(p, full) {
  if (full || p.open) return p.addr + (p.city ? ', ' + p.city : '');
  return (p.beds ? p.beds + '-bedroom home' : 'Home') + ' in ' + (p.city || 'Northern California');
}
const propLink = (p, src) => SITE_URL + '/p/' + (p.keywords[0] ? slug(p.keywords[0]) : p.key) + (src ? '?from=' + encodeURIComponent(src) : '');

/* Finding homes: an exact link name or keyword first, then streets, towns, communities and MLS numbers */
function propSearch(q, n) {
  const s = slug(q);
  if (s.length < 3) return [];
  const exact = PROP_BY[s] || null;
  const words = s.split('-');
  const hits = PROPS.filter((p) => p !== exact && words.every((w) => p.hay.includes(' ' + w)));
  return (exact ? [exact] : []).concat(hits).slice(0, n || 6);
}
function resolveProp(key) {
  const s = slug(key || '');
  if (!s) return { list: [] };
  if (PROP_BY[s]) return { one: PROP_BY[s] };
  const words = s.split('-');
  const hits = PROPS.filter((p) => words.every((w) => p.hay.includes(' ' + w)));
  return hits.length === 1 ? { one: hits[0] } : { list: hits.slice(0, 12) };
}

/* Darien's own homes and keywords, from the Listings tab of his Google Sheet */
const LISTED = new Set();
function applyListings(rows) {
  (rows || []).forEach((L) => {
    const key = slug(L.keyword || '');
    if (!key || LISTED.has(key)) return;
    LISTED.add(key);
    const kw = String(L.keyword).trim().toUpperCase();
    const base = L.home ? resolveProp(L.home).one : null;
    if (base) { // a keyword for a home already on the site
      if (!base.keywords.includes(kw)) base.keywords.push(kw);
      if (L.headline) base.hook = String(L.headline).slice(0, 140);
      base.hay = hayOf(base);
      PROP_BY[key] = base;
      return;
    }
    if (!L.address) return;
    const p = { key, alias: [], kind: 'listing', page: 'home', addr: String(L.address).slice(0, 120), city: String(L.city || '').slice(0, 60), zip: '',
      county: countyOf(L.city) || '', price: parseMoney(L.price) || 0, beds: String(L.beds || '').slice(0, 8), baths: String(L.baths || '').slice(0, 8),
      sqft: parseNum(L.sqft) || 0, hook: String(L.headline || '').slice(0, 140), about: String(L.about || '').slice(0, 1200),
      img: /^https:\/\/\S+$/i.test(L.photo || '') ? L.photo : '', link: /^https:\/\/\S+$/i.test(L.link || '') ? L.link : '', keywords: [kw] };
    p.card = () => listingCard(p);
    p.hay = hayOf(p);
    PROPS.unshift(p);
    PROP_BY[key] = p; // a listing's keyword always opens that listing
  });
}
async function loadListings() {
  if (!TRACKER) return;
  const cached = store.get('dp-listings', null);
  if (cached && Array.isArray(cached.list)) applyListings(cached.list);
  const fresh = cached && Date.now() - (cached.at || 0) < 5 * 60 * 1000;
  if (!fresh) try {
    const res = await fetch(TRACKER + '?mode=listings');
    const out = await res.json();
    if (out && out.ok && Array.isArray(out.listings)) { applyListings(out.listings); store.set('dp-listings', { at: Date.now(), list: out.listings }); }
  } catch (e) { /* the homes built into the site still work */ }
  const waiting = LISTINGS === 'loading';
  LISTINGS = 'ready';
  if (waiting && (CURRENT === 'property' || CURRENT === 'links' || CURRENT === 'home')) render(CURRENT, true);
}
function listingCard(p) {
  const title = p.addr + (p.city ? ', ' + p.city : '');
  const facts = propFacts(p);
  const info = { h: title, p: p.price ? money(p.price) : '', b: facts, l: p.hook, city: p.city,
    z: p.city ? zillowFor(p.addr, p.city, p.zip) : '', x: p.link, xs: 'Full listing', m: mapFor(p.addr + (p.city ? ', ' + p.city : '') + ', CA') };
  return '<article class="card"><div class="head"><span class="pill pa">Featured home</span>' + heart('l:' + p.key, title, info.p) + '</div>' +
    (p.img && ON_WEB ? '<img class="card-photo" src="' + esc(p.img) + '" alt="' + esc(title) + '" loading="lazy" referrerpolicy="no-referrer">' : '') +
    '<div><h3>' + esc(p.addr) + '</h3><div class="sub">' + esc(p.city || '') + '</div></div>' +
    (p.price ? '<div class="price num">' + money(p.price) + '</div>' : '') + (facts ? '<div class="facts">' + esc(facts) + '</div>' : '') +
    (p.hook ? '<p><b>' + esc(p.hook) + '</b></p>' : '') + (p.about ? '<p class="note">' + esc(p.about) + '</p>' : '') +
    '<div class="actions">' + details(info) + '</div><div class="src">Featured by Darien</div></article>';
}
// The details behind a home's card (title, price, links), the same ones its "Get full details" button uses
function propInfo(p) {
  const html = p.card();
  const m = html.match(/data-gate="(g\d+)"/);
  return { html, info: (m && GATES.get(m[1])) || { h: propTitle(p, true), p: propPrice(p) } };
}
function homeOptions(info, name) {
  const out = [
    info.z ? ['See photos and details on Zillow', info.z, 'Zillow', 'btn-pa'] : null,
    info.x ? [info.xs || 'More details', info.x, info.xs || 'Website', 'btn-line'] : null,
    info.m ? ['Map', info.m, 'Google Maps', 'btn-line'] : null
  ].filter(Boolean).map(([label, url, site, cls]) => '<a class="btn ' + cls + '" href="' + esc(track(url, { h: info.h, s: site, p: info.p, b: info.b, r: info.r })) + '" target="_blank" rel="noopener">' + esc(label) + '</a>');
  const text = 'Hi Darien, it\'s ' + (name || 'me') + '. I\'d like to know more about ' + info.h + '.';
  out.push('<a class="btn btn-line" href="' + esc('sms:+12098826469?&body=' + encodeURIComponent(text)) + '">Text Darien about this home</a>');
  out.push('<a class="btn btn-line" href="tel:+12098826469">Call Darien</a>');
  return out.join('');
}
function teaserCard(p, full) {
  return '<a class="card teaser" href="#p/' + esc(p.key) + '"><div class="head"><span class="pill ' + (p.kind === 'community' || p.kind === 'stockton' ? 'pa' : p.kind === 'listing' ? 'ok' : 'fha') + '">' + esc(KIND_LABEL[p.kind]) + '</span>' + (toursFor(commOf(p)).length ? '<span class="pill ok">▶ Video tour</span>' : '') + '</div>' +
    '<h3>' + esc(propTitle(p, full || signedIn())) + '</h3><div class="price num">' + esc(propPrice(p)) + '</div>' +
    (propFacts(p) ? '<div class="facts">' + esc(propFacts(p)) + '</div>' : '') + (p.hook ? '<div class="sub">' + esc(p.hook) + '</div>' : '') + '<span class="go">See this home →</span></a>';
}

/* ===== The home page itself ===== */
def('property', {
  nav: 'Home details', scene: 'home', color: '#FF7A59',
  cur() { return resolveProp(PROP_KEY).one || null; },
  navName() { const p = this.cur(); return p ? 'Home: ' + propTitle(p, true) : 'Home details'; },
  photoKey() { const p = this.cur(); return p ? p.page : 'home'; },
  photoUrl() { const p = this.cur(); return p && p.img ? p.img : ''; },
  kicker() { const p = this.cur(); return p ? KIND_LABEL[p.kind] + (p.city ? ' · ' + p.city : '') : 'Home details'; },
  title() { const p = this.cur(); return p ? propTitle(p, signedIn()) : LISTINGS === 'loading' ? 'Finding your home…' : 'Let\'s find that home'; },
  title2() { const p = this.cur(); return p ? propPrice(p) : ''; },
  sub() { const p = this.cur(); return p ? [p.hook, propFacts(p)].filter(Boolean).join(' · ') : 'Search by street, town or the keyword from Darien\'s post.'; },
  ctas() {
    const p = this.cur();
    if (!p) return '<a class="btn btn-ghost" href="sms:+12098826469">Text Darien</a>';
    if (!signedIn()) return '<button type="button" class="btn btn-pa" data-jump="pf-form">See the full details</button><button type="button" class="btn btn-ghost" data-jump="similar">Similar homes</button>';
    return '<a class="btn btn-pa" href="' + esc('sms:+12098826469?&body=' + encodeURIComponent('Hi Darien, I\'d like to see ' + propTitle(p, true) + '.')) + '">Text Darien to tour it</a><button type="button" class="btn btn-ghost" data-jump="similar">Similar homes</button><a class="btn btn-ghost" href="tel:+12098826469">Call</a>';
  },
  html() {
    const p = this.cur();
    if (!p) {
      if (LISTINGS === 'loading') return '<section class="blk"><div class="wrap"><div class="panel"><p>Loading this home…</p></div></div></section>';
      const r = resolveProp(PROP_KEY);
      return '<section class="blk"><div class="wrap"><div class="panel" style="display:grid;gap:14px">' +
        (r.list.length ? '<h2>Which home are you looking for?</h2><div class="cards">' + r.list.map((x) => teaserCard(x, true)).join('') + '</div>'
          : '<h2>We couldn\'t find "' + esc(PROP_KEY) + '"</h2><p>Search by street, town or the keyword from Darien\'s post, or text Darien at 209.882.6469 and he\'ll send it to you.</p>') +
        searchBox('q3') + '</div></div></section>';
    }
    if (this.last !== p.key) { simShown = SIM_STEP; simAuto = 0; this.last = p.key; }
    return '<section class="blk"><div class="wrap">' + (signedIn() ? unlockedHtml(p) : lockedHtml(p)) + '</div></section>' + modelsHtml(p) + similarHtml(p);
  },
  mount() {
    const p = this.cur();
    if ($('q3')) bindSearch($('q3'), $('q3-sugg'));
    if (!p) return;
    const more = $('sim-more');
    if (more) {
      const list = similarProps(p);
      const grow = () => {
        simShown += SIM_STEP;
        $('sim-list').innerHTML = simListHtml(list);
        more.hidden = list.length <= simShown;
      };
      more.addEventListener('click', grow);
      // Scrolling down to the end of the list loads the next homes on its own, twice, then the button takes over.
      // Only the visitor's own scrolling counts, not a jump from a Similar homes button.
      if ('IntersectionObserver' in window) {
        let scrolled = false;
        const mark = () => { scrolled = true; };
        ['wheel', 'touchmove', 'keydown'].forEach((t) => window.addEventListener(t, mark, { passive: true, once: true }));
        const io = new IntersectionObserver((ents) => {
          if (!$('sim-more') || more.hidden || simAuto >= 2) { io.disconnect(); return; }
          if (scrolled && ents.some((x) => x.isIntersecting)) { simAuto++; grow(); }
        }, { rootMargin: '0px 0px 80px 0px' });
        io.observe(more);
      }
    }
    if (jumpAfter) {
      const id = jumpAfter;
      jumpAfter = '';
      setTimeout(() => { const el = $(id); if (el) el.scrollIntoView({ block: 'start' }); }, 0);
    }
    let pfRealtor = null;
    const pfFormEl = $('pf-form');
    if (pfFormEl) {
      const applyPfRealtor = (v) => {
        pfRealtor = v;
        const go = $('pf-go');
        if (go) { go.disabled = false; go.textContent = v === 'yes' ? 'Send to my agent' : 'See the home'; }
        const vf = $('pf-visitor-fields'), af = $('pf-agent-fields'), fine = $('pf-fine');
        if (vf) vf.hidden = v !== 'no';
        if (af) af.hidden = v !== 'yes';
        if (fine) fine.textContent = v === 'yes' ? 'By tapping Send to my agent, you agree that Darien Phillips may contact your agent about this home.' : 'By tapping See the home, you agree that Darien Phillips may contact you by phone, text or email about homes. Consent isn\'t required to buy a home. Message and data rates may apply.';
        pfFormEl.querySelectorAll('[data-pf-realtor]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pfRealtor === v)));
      };
      pfFormEl.querySelectorAll('[data-pf-realtor]').forEach((b) => b.addEventListener('click', () => applyPfRealtor(b.dataset.pfRealtor)));
      const pass = realtorPass();
      if (pass) {
        if (pass.hasAgent && pass.agent) {
          $('pf-aname').value = pass.agent.name || '';
          $('pf-abrokerage').value = pass.agent.brokerage || '';
          $('pf-aphone').value = pass.agent.phone || '';
          $('pf-aemail').value = pass.agent.email || '';
          applyPfRealtor('yes');
        } else applyPfRealtor('no');
      }
    }
    const f = $('pf-form');
    if (f) f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = (t, el) => { $('pf-err').textContent = t; if (el && el.focus) el.focus(); };
      if (!pfRealtor) return err('Please answer the realtor question first.', $('pf-go'));
      if (pfRealtor === 'yes') {
        const a = { name: $('pf-aname').value.trim(), brokerage: $('pf-abrokerage').value.trim(), phone: $('pf-aphone').value.trim(), email: $('pf-aemail').value.trim() };
        if (!a.name) return err('Please add your agent\'s name.', $('pf-aname'));
        const phoneOk = a.phone.replace(/\D/g, '').length >= 10;
        const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email);
        if (!phoneOk && !emailOk) return err('Please add your agent\'s phone or email, so Darien can reach them.', a.phone ? $('pf-aphone') : $('pf-aemail'));
        a.contact = phoneOk ? a.phone : a.email;
        const btn = $('pf-go');
        btn.disabled = true; btn.textContent = 'Sending...'; $('pf-err').textContent = '';
        if (TRACKER) {
          try { await post('lead', Object.assign({}, propInfo(p).info, { hasAgent: 'yes', agentName: a.name, agentBrokerage: a.brokerage, agentContact: a.contact, agentPhone: a.phone, agentEmail: a.email, key: p.key, pg: navName(), note: realtorAgentText(a, propTitle(p, true)) })); } catch (x) { /* the thanks message below still shows; the visitor can text Darien */ }
        }
        f.innerHTML = '<h3>Thanks</h3><p class="toast">' + esc(REALTOR_MSG) + '</p><p class="note">Your agent: ' + esc(a.name) + (a.brokerage ? ' · ' + esc(a.brokerage) : '') + ' · ' + esc(a.contact) + '</p><p class="note">Darien will send all home info for ' + esc(propTitle(p, true)) + ' to your agent to share with you.</p><div class="ctas"><a class="btn btn-line" href="sms:+12098826469">Text Darien</a></div>';
        return;
      }
      const v = { name: $('pf-name').value.trim(), phone: $('pf-phone').value.trim(), email: $('pf-email').value.trim() };
      if (!v.name) return err('Please add your name.', $('pf-name'));
      if (v.phone.replace(/\D/g, '').length < 10) return err('Please add a mobile number with area code.', $('pf-phone'));
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) return err('Please add a valid email.', $('pf-email'));
      store.set('dp-me', v);
      sess.set('dp-just', p.key);
      logStep('Signed in to see ' + propTitle(p, true));
      if (TRACKER) {
        const btn = $('pf-go');
        btn.disabled = true; btn.textContent = 'Opening…'; $('pf-err').textContent = '';
        const body = Object.assign({}, propInfo(p).info, v, { how: 'signin', key: p.key, kw: p.keywords[0] || '', landed: sess.get('dp-landed', ''), pg: navName(), steps: stepsText().slice(-25) });
        try { await post('lead', body); } catch (x) { beacon('lead', body); }
      }
      render('property', true);
      afterSignIn();
      const g = document.querySelector('.prop-grid');
      if (g) g.scrollIntoView({ block: 'start' });
    });
    const sw = $('pf-switch');
    if (sw) sw.addEventListener('click', () => { store.del('dp-me'); sess.set('dp-just', ''); render('property', true); });
  }
});
function lockedHtml(p) {
  const m = me();
  const what = p.kind === 'community' || p.kind === 'stockton' ? 'Your $0-down payment, builder offers and floor plans'
    : p.kind === 'listing' ? 'Price, payment and loan options' : 'The seller\'s loan, your cash to close and monthly payment';
  return '<div class="prop-grid">' +
    '<div class="panel prop-lock"><p class="mono eyebrow">Preview</p><h2>' + esc(propTitle(p, false)) + '</h2>' +
      '<div class="price num">' + esc(propPrice(p)) + '</div>' + (propFacts(p) ? '<div class="facts">' + esc(propFacts(p)) + '</div>' : '') +
      (p.hook ? '<p class="hook">' + esc(p.hook) + '</p>' : '') +
      '<div class="veil" aria-hidden="true"><div><span>Address</span><b>0000 Sample Street</b></div><div><span>Monthly payment</span><b>$0,000</b></div><div><span>Loan details</span><b>0.00% · $000,000</b></div></div>' +
      '<p class="mono eyebrow">You\'ll see</p><ul class="unlock-list"><li>' + (p.open ? 'The address and map' : 'The exact address and map') + '</li><li>Photos and the full listing</li><li>' + esc(what) + '</li><li>A quick way to text or call Darien for a tour</li></ul>' +
      '<button type="button" class="linkbtn" data-jump="similar">Or see similar homes nearby ↓</button>' +
    '</div>' +
    '<form class="panel prop-form" id="pf-form" novalidate><h3>See the full details</h3>' +
      '<div id="pf-realtor"><p class="note"><b>' + esc(REALTOR_QUESTION) + '</b></p><p class="note">Darien does not want to step on anyones toes, so he checks first.</p>' +
      '<div class="ctas" style="margin:0"><button type="button" class="btn btn-line" data-pf-realtor="no">No</button><button type="button" class="btn btn-line" data-pf-realtor="yes">Yes, I have a realtor</button></div></div>' +
      '<div id="pf-agent-fields" hidden><p class="note">Please put your agent\'s info in, so Darien can send all home info to your agent to share with you.</p><div class="fields">' +
        '<div class="field wide"><label for="pf-aname">Agent name</label><input id="pf-aname" autocomplete="name"></div>' +
        '<div class="field wide"><label for="pf-abrokerage">Brokerage (if you know it)</label><input id="pf-abrokerage"></div>' +
        '<div class="field"><label for="pf-aphone">Agent phone</label><input id="pf-aphone" type="tel" inputmode="tel" autocomplete="tel"></div>' +
        '<div class="field"><label for="pf-aemail">Agent email</label><input id="pf-aemail" type="email" autocomplete="email"></div>' +
      '</div></div>' +
      '<div id="pf-visitor-fields" hidden><p class="note">Enter your name, mobile number and email to see everything on this home. Darien uses it to answer your questions and send you homes like it.</p>' +
      '<div class="fields">' +
        '<div class="field wide"><label for="pf-name">Your name</label><input id="pf-name" autocomplete="name" value="' + esc(m.name || '') + '"></div>' +
        '<div class="field"><label for="pf-phone">Mobile number</label><input id="pf-phone" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(m.phone || '') + '"></div>' +
        '<div class="field"><label for="pf-email">Email</label><input id="pf-email" type="email" autocomplete="email" value="' + esc(m.email || '') + '"></div>' +
      '</div></div>' +
      '<p class="fine" id="pf-fine">By tapping See the home, you agree that Darien Phillips may contact you by phone, text or email about homes. Consent isn\'t required to buy a home. Message and data rates may apply.</p>' +
      '<div><button class="btn btn-pa" type="submit" id="pf-go" disabled>See the home</button></div><p class="toast err" id="pf-err" role="alert"></p>' +
    '</form></div>';
}
function unlockedHtml(p) {
  const { html, info } = propInfo(p);
  const m = me(), first = String(m.name || '').split(' ')[0];
  const just = sess.get('dp-just', '') === p.key;
  const note = 'Hi Darien, I\'m interested in ' + info.h + (info.p ? ' (' + info.p + ')' : '') + '.\n\nName: ' + m.name + '\nPhone: ' + m.phone + '\nEmail: ' + m.email;
  return '<div class="prop-grid"><div class="prop-card">' + html + '</div>' +
    '<div class="panel prop-side"><p class="toast">' + esc(just ? 'Thanks, ' + first + '.' + (TRACKER ? ' Darien got your info.' : '') + ' Here\'s everything on this home.' : 'Welcome back, ' + first + '. Here\'s everything on this home.') + '</p>' +
      '<div class="optlist">' + homeOptions(info, m.name) + '<button type="button" class="btn btn-line" data-jump="similar">Find similar homes</button>' + (!TRACKER ? '<a class="btn btn-line" href="' + esc('mailto:darienphillips45@gmail.com?subject=' + encodeURIComponent('About ' + info.h) + '&body=' + encodeURIComponent(note)) + '">Email Darien about this home</a>' : '') + '</div>' +
      '<p class="fine">Not ' + esc(first) + '? <button type="button" class="linkbtn" id="pf-switch">Use different info</button></p></div></div>';
}
/* ===== Homes like this one: close in price, same town first, then the same county ===== */
const SIM_STEP = 6;
let simShown = SIM_STEP, simAuto = 0, jumpAfter = '';
function similarProps(p) {
  const home = p.kind !== 'community';
  const beds = parseFloat(p.beds) || 0;
  return PROPS.filter((x) => x !== p && (x.kind !== 'community') === home && x.price && p.price && (x.city === p.city || (x.county && x.county === p.county)))
    .map((x) => {
      const d = Math.abs(x.price - p.price) / p.price;
      const bd = beds && parseFloat(x.beds) ? Math.abs(parseFloat(x.beds) - beds) : 0;
      return { x, d, s: (x.city === p.city ? 0 : 1) + d * 4 + (bd >= 2 ? 0.5 : 0) + (x.page === p.page ? 0 : 0.3) };
    })
    .filter((o) => o.d <= 0.35).sort((a, b) => a.s - b.s).map((o) => o.x);
}
// The other kind nearby: new-home communities for a resale home, homes for sale for a community
function nearbyOther(p) {
  const home = p.kind !== 'community';
  return PROPS.filter((x) => (x.kind === 'community') === home && x.price && p.price && (x.city === p.city || (x.county && x.county === p.county)) && Math.abs(x.price - p.price) / p.price <= 0.25)
    .sort((a, b) => (a.city === p.city ? 0 : 1) - (b.city === p.city ? 0 : 1) || Math.abs(a.price - p.price) - Math.abs(b.price - p.price)).slice(0, 3);
}
function simListHtml(list) {
  return list.slice(0, simShown).map((x) => teaserCard(x)).join('');
}
function similarHtml(p) {
  const list = similarProps(p);
  const other = nearbyOther(p);
  const lo = short(Math.max(0, p.price * 0.8)), hi = short(p.price * 1.2);
  return '<section class="blk" id="similar"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Homes like this</p>' +
      '<h2>' + (p.kind === 'community' ? 'Similar new-home communities' : 'More homes like this one') + '</h2>' +
      '<p>Close in price (about ' + lo + ' to ' + hi + ') in ' + esc(p.city || 'the area') + (p.county ? ' and nearby ' + esc(p.county) + ' County' : '') + '. Tap one to see it.</p></div></div>' +
    (list.length ? '<div class="cards" id="sim-list">' + simListHtml(list) + '</div>' +
      '<div class="more-row"><button type="button" class="btn btn-line" id="sim-more"' + (list.length > simShown ? '' : ' hidden') + '>Show more homes like this</button></div>'
      : '<div class="empty"><h3>No close matches on Darien\'s site right now</h3><p>Search the whole MLS below, or Darien can send them to you.</p></div>') +
    mlsLikeHtml(p) +
    (other.length ? '<div class="shead" style="margin-top:24px"><div><h2 style="font-size:1.3rem">' + (p.kind === 'community' ? 'Homes for sale nearby in this price range' : 'New-home communities nearby in this price range') + '</h2></div></div>' +
      '<div class="cards">' + other.map((x) => teaserCard(x)).join('') + '</div>' : '') +
    (p.page && p.page !== 'home' && NAV_ORDER.includes(p.page) ? '<div class="more-row"><button type="button" class="btn btn-line" data-go="' + p.page + '">See all ' + esc((PAGES[p.page].tileTitle || PAGES[p.page].nav).toLowerCase()) + '</button></div>' : '') +
    '</div></section>' + reachOutHtml(p);
}
function reachOutHtml(p) {
  const what = signedIn() ? propTitle(p, true) : propTitle(p, false) + ' (' + propPrice(p) + ', darienphillips.com/p/' + p.key + ')';
  const msg = 'Hi Darien, I\'m looking at ' + what + ' on your website and would like more information.';
  return '<section class="blk"><div class="wrap"><div class="panel reach"><div><p class="mono eyebrow">Questions?</p><h2>Want more information? Reach out to Darien</h2>' +
      '<p>He can answer questions about this home, find every home like it, including new listings the day they hit the market, and set up showings.</p></div>' +
    '<div class="reach-acts"><a class="btn btn-pa" href="' + esc('sms:+12098826469?&body=' + encodeURIComponent(msg)) + '">Text Darien</a>' +
      '<a class="btn btn-line" href="tel:+12098826469">Call 209.882.6469</a>' +
      '<a class="btn btn-line" href="' + esc('mailto:darienphillips45@gmail.com?subject=' + encodeURIComponent('More information: ' + (signedIn() ? propTitle(p, true) : 'a home on your website')) + '&body=' + encodeURIComponent(msg)) + '">Email Darien</a>' +
      '<button type="button" class="btn btn-line" data-like="' + esc(p.key) + '">Get homes like this by email</button></div>' + areaLinksHtml({ name: p.addr, addr: signedIn() ? p.addr : '', city: p.city, zip: p.zip }) + '</div></div></section>';
}
// A "Similar homes" button for home cards on the list pages
function simBtn(key) {
  return PROP_BY[key] ? '<button type="button" class="btn btn-line btn-sm" data-similar="' + esc(key) + '">Similar homes</button>' : '';
}
document.addEventListener('click', (e) => {
  const s = e.target.closest('[data-similar]');
  if (s) { jumpAfter = 'similar'; if (location.hash === '#p/' + s.dataset.similar) render('property'); else location.hash = 'p/' + s.dataset.similar; return; }
  const l = e.target.closest('[data-like]');
  if (!l) return;
  const p = PROP_BY[l.dataset.like];
  if (!p) return;
  const A = sub('alerts', {});
  A.wants = p.kind === 'assumable' || p.kind === 'placer' ? ['Homes with assumable loans'] : p.kind === 'listing' ? ['Resale homes'] : ['New builds', '$0-down homes'];
  if (p.city) A.towns = p.city;
  if (p.price) A.price = money(Math.ceil(p.price * 1.1 / 10000) * 10000);
  const b = parseInt(p.beds, 10);
  if (b >= 2) A.beds = Math.min(b, 5) + '+';
  S.flash = 'Set up for homes like ' + propTitle(p, signedIn()) + '. Check the details, add your name and email, and Darien will send you every match.';
  save();
  go('alerts');
});
document.addEventListener('click', (e) => {
  const j = e.target.closest('[data-jump]');
  if (!j) return;
  const el = $(j.dataset.jump);
  if (!el) return;
  el.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
  const i = el.querySelector('input');
  if (i) i.focus({ preventScroll: true });
});

/* ===== Links for posts and ManyChat (for Darien; not in the menu) ===== */
def('links', {
  nav: 'ManyChat links', scene: 'alerts', color: '#2F7A6B', kicker: 'For your posts and DMs',
  photoKey() { return 'alerts'; },
  title: 'A link for every home',
  sub: 'Paste a home\'s link into ManyChat. People who comment your keyword get it in a DM, sign in with their name, phone and email to see the home, and you get an email.',
  ctas() { return '<button type="button" class="btn btn-pa" data-jump="lk-q">Find a home</button>'; },
  html() {
    const L = sub('links', { q: '', src: 'instagram' });
    return '<section class="blk"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">How it works</p><h2>From a post to a lead in your inbox</h2></div></div>' +
      '<ol class="steps">' +
        '<li><b>Copy the home\'s link</b><span>Search below by street, town, community or MLS#. Use the street name as your keyword (ENCINO for 8160 Encino Ave) and it works in the site\'s search too.</span></li>' +
        '<li><b>Make the DM in ManyChat</b><span>New automation, then "User comments on your post or reel" (or a DM keyword). Add your keyword and a message with a button that opens the home\'s link.</span></li>' +
        '<li><b>They sign in to see it</b><span>Name, mobile and email first. The same goes for anyone who types the keyword into the site\'s search.</span></li>' +
        '<li><b>You get the details</b><span>An email the moment they sign in, then a summary of every page and home they looked at once they\'re done.</span></li>' +
      '</ol>' +
      '<div class="panel" style="display:grid;gap:12px;margin-top:16px"><div class="chips" role="group" aria-label="Where you\'ll post the link"><span class="mono">Link for</span>' +
        [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['', 'Anywhere']].map(([v, t]) => '<button type="button" class="chip" data-lsrc="' + v + '" aria-pressed="' + (L.src === v) + '">' + t + '</button>').join('') + '</div>' +
        '<div class="field"><label for="lk-q">Find a home</label><input id="lk-q" type="search" autocomplete="off" placeholder="Street, town, community or MLS#" value="' + esc(L.q) + '"></div>' +
        '<p class="count" id="lk-count" aria-live="polite"></p></div>' +
      '<div class="linklist" id="lk-list"></div>' +
      '<p class="src" style="margin-top:14px">' + (TRACKER ? 'Want your own keyword, or a home that isn\'t on the site? Add a row to the Listings tab in your activity sheet. It works on the site within a few minutes, with no update needed.'
        : 'Want your own keyword, or a home that isn\'t on the site? Ask Claude to add it. Once your Google tracker is connected, you can add them yourself in a sheet.') + '</p></div></section>';
  },
  mount() {
    const L = S.links;
    const draw = () => {
      document.querySelectorAll('[data-lsrc]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lsrc === L.src)));
      const q = L.q.trim();
      const items = q.length >= 3 ? propSearch(q, 40) : PROPS.filter((p) => p.kind === 'listing' || p.keywords.length).concat(PROPS.filter((p) => p.kind === 'assumable' || p.kind === 'placer').slice(0, 24))
        .filter((p, i, a) => a.indexOf(p) === i);
      $('lk-count').textContent = q.length >= 3 ? plural(items.length, 'home') + ' match "' + q + '"' : 'Your featured homes and homes with assumable loans. Search to find any of the ' + comma(PROPS.length) + ' homes and communities on the site.';
      $('lk-list').innerHTML = items.length ? items.map((p) => '<div class="linkrow"><div><b>' + esc(propTitle(p, true)) + '</b><small>' + esc([KIND_LABEL[p.kind], propPrice(p), p.keywords.length ? 'Keyword ' + p.keywords.join(', ') : ''].filter(Boolean).join(' · ')) + '</small></div>' +
        '<code>' + esc(propLink(p, L.src)) + '</code><div class="acts"><button type="button" class="btn btn-pa btn-sm" data-copy="' + esc(propLink(p, L.src)) + '">Copy link</button><a class="btn btn-line btn-sm" href="#p/' + esc(p.key) + '">Open</a></div></div>').join('')
        : '<div class="empty"><h3>No homes match</h3><p>Try a street name, town, community or MLS#.</p></div>';
    };
    $('lk-q').addEventListener('input', () => { L.q = $('lk-q').value; save(); draw(); });
    document.querySelectorAll('[data-lsrc]').forEach((b) => b.addEventListener('click', () => { L.src = b.dataset.lsrc; save(); draw(); }));
    $('lk-list').addEventListener('click', async (e) => {
      const c = e.target.closest('[data-copy]');
      if (!c) return;
      try { await navigator.clipboard.writeText(c.dataset.copy); c.textContent = 'Copied'; }
      catch (x) { const r = document.createRange(); r.selectNodeContents(c.closest('.linkrow').querySelector('code')); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); c.textContent = 'Press Copy'; }
      setTimeout(() => { c.textContent = 'Copy link'; }, 1800);
    });
    draw();
  }
});
