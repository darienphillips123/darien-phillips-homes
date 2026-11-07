/* ===== Dream search, thumbs-down and "Picked for you" =====
   Visitors can build their dream search any time (the button at the bottom of the screen), or skip it.
   Hearts (saved homes) and thumbs-down teach the picks; signed-in visitors' dream searches go to Darien. */
const MUSTS = ['Single story', 'Pool', 'New build', 'Assumable loan', '$0 down', 'Acreage', 'RV or boat parking', 'Home office', 'Multi-gen suite', '3-car garage', 'No HOA', '55+ community'];
let DREAM = store.get('dp-dream', null) || { areas: '', min: 0, max: 0, beds: 0, baths: 0, musts: [], saved: false, skipped: false };
const NOPE = new Set(store.get('dp-nope', []) || []);
const saveDream = () => store.set('dp-dream', DREAM);
// Saved-card keys (a:, p:, c:, s:, l:) to the home pages they belong to
const CARD_PROP = {};
DATA.assumables.forEach((h) => { CARD_PROP['a:' + h.id] = slug(h.street); });
PLACER.forEach((h) => { CARD_PROP['p:' + h.id] = slug(h.street); });
DATA.communities.forEach((c) => { CARD_PROP['c:' + c.id] = slug(c.name); });
STK.homes.forEach((h) => { const c = STK_COMM[h.comm]; CARD_PROP['s:' + h.id] = slug(h.street || c.name + ' ' + h.plan); });
const propOfCard = (k) => PROP_BY[k.slice(0, 2) === 'l:' ? k.slice(2) : CARD_PROP[k]] || null;
const dreamAreas = () => String(DREAM.areas || '').split(',').map((s) => s.trim()).filter(Boolean);
function dreamText(d) {
  d = d || DREAM;
  return [dreamAreas().join(', ') || 'Any area', d.min ? 'from ' + short(d.min) : '', d.max ? 'up to ' + short(d.max) : '', d.beds ? d.beds + '+ beds' : '', d.baths ? d.baths + '+ baths' : '', (d.musts || []).join(', ')].filter(Boolean).join(' · ');
}
function nopeBtn(k, title) {
  const on = NOPE.has(k);
  return '<button type="button" class="nope" data-nope="' + esc(k) + '" data-t="' + esc(title) + '" aria-pressed="' + on + '" aria-label="Not for me: ' + esc(title) + '" title="Not for me">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.7a2 2 0 0 0-2 1.7l-1.4 9A2 2 0 0 0 4.3 15H10zM17 2h2.7A2.3 2.3 0 0 1 22 4.3v6.4a2.3 2.3 0 0 1-2.3 2.3H17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>';
}
document.addEventListener('click', (e) => {
  const n = e.target.closest('[data-nope]');
  if (!n) return;
  const k = n.dataset.nope, t = n.dataset.t;
  if (NOPE.has(k)) NOPE.delete(k); else { NOPE.add(k); if (saved.has(k)) { saved.delete(k); persistSaved(); } }
  store.set('dp-nope', [...NOPE]);
  document.querySelectorAll('[data-nope="' + k + '"]').forEach((b) => { b.setAttribute('aria-pressed', String(NOPE.has(k))); const card = b.closest('.card'); if (card) card.classList.toggle('noped', NOPE.has(k)); });
  document.querySelectorAll('[data-save="' + k + '"]').forEach((b) => { b.setAttribute('aria-pressed', String(saved.has(k))); b.querySelector('span').textContent = saved.has(k) ? 'Saved' : 'Save'; });
  if (NOPE.has(k)) { beacon('click', { h: ('Not for me: ' + t).slice(0, 140), s: 'Thumbs down', p: '', b: '', r: '', pg: navName(), u: '' }); logStep('Thumbs down: ' + t); }
});
document.addEventListener('click', (e) => {
  const s = e.target.closest('[data-save]');
  if (!s || !saved.has(s.dataset.save)) return;
  beacon('click', { h: ('Hearted: ' + s.dataset.t).slice(0, 140), s: 'Heart', p: s.dataset.p || '', b: '', r: '', pg: navName(), u: '' });
  if (NOPE.delete(s.dataset.save)) store.set('dp-nope', [...NOPE]);
});

/* The picks: the dream search first, then what they hearted, minus anything they gave a thumbs-down */
function picks(n) {
  const areas = dreamAreas().map((a) => a.toLowerCase().replace(/\s+county$/, ''));
  const liked = [...saved.keys()].map(propOfCard).filter(Boolean);
  const noped = [...NOPE].map(propOfCard).filter(Boolean);
  const nopedKeys = new Set(noped.map((p) => p.key));
  const likedKeys = new Set(liked.map((p) => p.key));
  if (!DREAM.saved && !liked.length) return [];
  const has = (p, m) => {
    const hay = String(p.hay || '').toLowerCase();
    return m === 'New build' ? p.kind === 'community' || p.kind === 'stockton' : m === 'Assumable loan' ? p.kind === 'assumable' || p.kind === 'placer'
      : m === '$0 down' ? p.kind === 'stockton' : m === '55+ community' ? /55\+|active adult/.test(hay) : m === 'Single story' ? /single.story|one.story/.test(hay) : hay.includes(m.toLowerCase().split(' ')[0]);
  };
  return PROPS.filter((p) => p.price && !nopedKeys.has(p.key) && !likedKeys.has(p.key)).map((p) => {
    let s = 0;
    if (areas.length) s += areas.some((a) => String(p.city || '').toLowerCase() === a || String(p.county || '').toLowerCase() === a || String(p.zip || '') === a) ? 4 : -3;
    if (DREAM.max) s += p.price <= DREAM.max * 1.03 ? 2 : -2 - (p.price - DREAM.max) / DREAM.max * 10;
    if (DREAM.min && p.price < DREAM.min * 0.97) s -= 1.5;
    const bd = Math.max(0, ...String(p.beds || '').split(/[^0-9.]+/).map(parseFloat).filter((x) => x > 0));
    if (DREAM.beds && bd) s += bd >= DREAM.beds ? 1 : -4;
    (DREAM.musts || []).forEach((m) => { s += has(p, m) ? 1.2 : 0; });
    liked.forEach((l) => { if (l.city === p.city) s += 0.8; if (l.kind === p.kind) s += 0.4; if (Math.abs(l.price - p.price) / l.price < 0.15) s += 0.6; });
    noped.forEach((x) => { if (x.addr === p.addr || (x.place && x.place === p.place)) s -= 2; if (x.city === p.city && Math.abs(x.price - p.price) / x.price < 0.1) s -= 0.5; });
    return { p, s };
  }).filter((o) => o.s > 0).sort((a, b) => b.s - a.s).slice(0, n).map((o) => o.p);
}
function picksHtml() {
  const list = picks(6);
  const why = DREAM.saved ? 'Based on your dream search (' + dreamText() + ')' + (saved.size ? ' and the homes you hearted' : '') : 'Based on the homes you hearted';
  if (!list.length) return DREAM.saved ? '<section class="blk picks"><div class="wrap"><div class="panel"><b>Your dream search is saved</b><p class="note">' + esc(dreamText()) + '. No homes on the site match yet, so try the map, or Darien will send matches as they hit the market.</p><div class="ctas" style="margin:8px 0 0"><button type="button" class="btn btn-pa btn-sm" data-dreammap="1">See matches on the map</button><button type="button" class="btn btn-line btn-sm" data-dream="edit">Edit my dream search</button></div></div></div></section>' : '';
  return '<section class="blk picks"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Picked for you</p><h2>Homes that fit what you want</h2><p>' + esc(why) + '. Tap the heart on homes you like and the thumbs-down on ones you don\'t, and these picks get better.</p></div></div>' +
    '<div class="cards">' + list.map((p) => teaserCard(p)).join('') + '</div>' +
    '<div class="more-row"><button type="button" class="btn btn-pa" data-dreammap="1">See every match on the map</button><button type="button" class="btn btn-line" data-dream="edit">Edit my dream search</button></div></div></section>';
}

/* The dream-search builder (a pop-up), from the floating button, after signing in on a home, or from the picks */
function openDream(after) {
  const D = DREAM;
  const nums = (vals, any) => vals.map((v) => '<option value="' + v + '"' + (+D[any === 'b' ? 'beds' : 'baths'] === v ? ' selected' : '') + '>' + (v ? v + '+' : 'Any') + '</option>').join('');
  openModal('<h2 id="dr-title">Build your dream search</h2><p class="note">Tell us what you\'re looking for and we\'ll pick homes for you here, on the map and by email. Takes 20 seconds, and you can skip it.</p>' +
    '<form id="dr-form" novalidate style="display:grid;gap:12px;margin-top:10px"><div class="fields">' +
      '<div class="field wide"><label for="dr-areas">Towns, ZIP codes or counties</label><input id="dr-areas" value="' + esc(D.areas || (S.place ? placeLabel(S.place) : '')) + '" placeholder="For example Galt, Elk Grove, 95209"></div>' +
      moneyField('dr-min', 'Min price', D.min, '', 'No min') + moneyField('dr-max', 'Max price', D.max, '', 'No max') +
      '<div class="field"><label for="dr-beds">Bedrooms</label><select id="dr-beds">' + nums([0, 2, 3, 4, 5], 'b') + '</select></div>' +
      '<div class="field"><label for="dr-baths">Bathrooms</label><select id="dr-baths">' + nums([0, 2, 3, 4], 'ba') + '</select></div>' +
    '</div><fieldset><legend class="lbl">Must-haves</legend><div class="checks">' + MUSTS.map((m) => '<label><input type="checkbox" name="dr-must" value="' + esc(m) + '"' + ((D.musts || []).includes(m) ? ' checked' : '') + '> ' + esc(m) + '</label>').join('') + '</div></fieldset>' +
    '<div class="ctas" style="margin:0"><button type="submit" class="btn btn-pa">Save my dream search</button><button type="button" class="btn btn-line" id="dr-skip">Skip for now</button></div>' +
    '<p class="fine">' + (signedIn() ? 'Darien will see your dream search and send you matches.' : 'Saved on this device. When you sign in on a home, Darien gets it too so he can send matches.') + '</p></form>', (box) => {
    box.querySelector('#dr-skip').addEventListener('click', () => { DREAM.skipped = true; saveDream(); closeModal(); logStep('Skipped the dream search'); if (after) after(); });
    box.querySelector('#dr-form').addEventListener('submit', (e) => {
      e.preventDefault();
      DREAM = { areas: box.querySelector('#dr-areas').value.trim(), min: parseMoney(box.querySelector('#dr-min').value) || 0, max: parseMoney(box.querySelector('#dr-max').value) || 0,
        beds: +box.querySelector('#dr-beds').value || 0, baths: +box.querySelector('#dr-baths').value || 0, musts: [...box.querySelectorAll('[name="dr-must"]:checked')].map((x) => x.value), saved: true, skipped: false, sent: false };
      saveDream();
      const ft = document.querySelector('.dream-fab .t'); if (ft) ft.textContent = 'My dream search';
      logStep('Saved a dream search: ' + dreamText());
      sendDream();
      closeModal();
      if (after) after(); else render(CURRENT === 'property' ? 'property' : CURRENT, true);
      const pk = document.querySelector('.picks');
      if (pk) pk.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  });
}
// Signed-in visitors' dream searches go to Darien as a sign-up, once per change
async function sendDream() {
  if (!DREAM.saved || DREAM.sent) return;
  beacon('click', { h: ('Dream search: ' + dreamText()).slice(0, 140), s: 'Dream search', p: '', b: '', r: '', pg: navName(), u: '' });
  if (!signedIn() || !TRACKER) return;
  const m = me();
  try {
    await post('signup', { name: m.name, email: m.email, phone: m.phone, notes: 'Dream search from the website: ' + dreamText(), wants: (DREAM.musts || []).join(', '), areas: dreamAreas().join(', '),
      price: DREAM.max ? money(DREAM.max) : '', pay: '', beds: DREAM.beds ? DREAM.beds + '+' : 'Any', baths: DREAM.baths ? DREAM.baths + '+' : 'Any', size: 'Any', lot: (DREAM.musts || []).includes('Acreage') ? '1 acre+' : 'Any', when: '', mls: 'yes', saved: [...saved.values()].map((x) => x.t).join('; ').slice(0, 600) });
    DREAM.sent = true; saveDream();
  } catch (x) { /* try again next time */ }
}
// After someone signs in on a home: offer the dream search once (they can skip), and send a saved one
function afterSignIn() {
  if (DREAM.saved) { sendDream(); return; }
  if (DREAM.skipped || sess.get('dp-dream-asked', '')) return;
  sess.set('dp-dream-asked', '1');
  setTimeout(() => openDream(), 900);
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-dream]')) { openDream(); return; }
  if (e.target.closest('[data-dreammap]')) {
    const F = sub('search', {});
    const M2O = { 'Single story': '1story', Pool: 'pool', 'New build': 'newconstruction', '3-car garage': '3garage', '55+ community': 'adult', 'RV or boat parking': '3garage' };
    Object.assign(F, { loc: dreamAreas()[0] || '', min: DREAM.min || 0, max: DREAM.max || 0, beds: DREAM.beds || 0, baths: DREAM.baths || 0, pool: false, acres: (DREAM.musts || []).includes('Acreage') ? 1 : 0, opts: [...new Set((DREAM.musts || []).map((m) => M2O[m]).filter(Boolean))] });
    save(); go('search', true);
  }
});
// The floating button in the middle of the screen
(function dreamFab() {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'dream-fab'; b.setAttribute('data-dream', 'open');
  b.innerHTML = '<span aria-hidden="true">✨</span> <span class="t">' + (DREAM.saved ? 'My dream search' : 'Build your dream search') + '</span>';
  document.body.appendChild(b);
  // Stay out of the way of the top buttons: show once the visitor scrolls past the top of the page
  const toggle = () => b.classList.toggle('show', window.scrollY > Math.min(420, window.innerHeight * 0.5));
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
})();
