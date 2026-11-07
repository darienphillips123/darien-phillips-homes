/* ===== Admin view: Darien's website analytics at the top of every page =====
   Turn it on by adding #admin to the site's address and entering the admin key from the tracker's setup email.
   The key stays in that browser only. While it's on, Darien's own visits aren't counted. */
const ADMIN_STORE = 'dp-admin-key';
const KIND = { view: '#8AB4F8', click: '#F2C14E', lead: '#FF8A65', signup: '#5BCB8E', goal: '#E59CD8' };
const RANGE_LABEL = { 1: 'Today', 7: '7 days', 30: '30 days' };
let STATS = null, statsAt = 0, statsErr = '', abRange = '7', abPanel = '', statsTimer = null;
const adminKey = () => String(store.get(ADMIN_STORE, '') || '');
function ago(iso) {
  const t = new Date(iso).getTime();
  if (!t) return '';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.round(h / 24);
  return d < 7 ? d + 'd ago' : new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function adminInit() {
  if (!TRACKER || !adminKey()) return;
  ADMIN = true;
  // Keep the analytics bar in view when the page reloads instead of scrolling past it
  try { history.scrollRestoration = 'manual'; } catch (e) { /* older browsers */ }
  refreshStats();
  clearInterval(statsTimer);
  statsTimer = setInterval(() => { if (document.visibilityState === 'visible') refreshStats(); }, 60000);
}
async function refreshStats() {
  try {
    STATS = await post('stats', { key: adminKey() });
    statsAt = Date.now();
    statsErr = '';
  } catch (x) {
    statsErr = x.message === 'key' ? 'Your admin key didn\'t match. Sign in again with the key from your tracker email.' : 'Couldn\'t load your analytics just now. It will try again in a minute.';
    if (x.message === 'key') store.del(ADMIN_STORE);
  }
  drawAdmin();
}
function openAdmin() {
  if (!TRACKER) {
    openModal('<p class="mono eyebrow">Admin view</p><h2 id="modal-title">Your analytics show on your public website</h2><p>' +
      (ON_WEB ? 'Connect your Google tracker first. After that, this page asks for your admin key and shows visitors, clicks, detail requests and sign-ups at the top of every page.'
        : 'This preview on Claude can\'t load analytics. Open your public website and add #admin to the end of its address.') + '</p>');
    return;
  }
  openModal('<p class="mono eyebrow">Admin view</p><h2 id="modal-title">See your website analytics</h2>' +
    '<p class="note">Enter the admin key from your tracker setup email. This browser remembers it, and only you see the analytics bar.</p>' +
    '<form id="ad-form" class="fields" novalidate><div class="field wide"><label for="ad-key">Admin key</label><input id="ad-key" type="password" autocomplete="off" spellcheck="false"></div>' +
    '<div class="field wide"><button class="btn btn-pa" type="submit">Show my analytics</button><p class="toast err" id="ad-err" role="alert"></p></div></form>',
  (d) => d.querySelector('#ad-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = $('ad-key').value.trim();
    if (!key) { $('ad-err').textContent = 'Enter your admin key.'; return; }
    $('ad-err').textContent = 'Checking...';
    try {
      STATS = await post('stats', { key });
      statsAt = Date.now(); statsErr = '';
      store.set(ADMIN_STORE, key);
      closeModal();
      adminInit();
      drawAdmin();
      window.scrollTo(0, 0);
    } catch (x) {
      $('ad-err').textContent = x.message === 'key' ? 'That key didn\'t match. Check the setup email from your tracker.' : 'Couldn\'t reach your tracker. Check your connection and try again.';
    }
  }));
}
function adminPanel() {
  if (abPanel === 'link') {
    return '<h4>Send a client their own link</h4><p>When a client opens their link, you\'ll see their name here and in your emails instead of a visitor code.</p>' +
      '<div class="ab-link"><label class="vh" for="ab-name">Client name</label><input id="ab-name" placeholder="Client name, like Maria Lopez" autocomplete="off">' +
      '<label class="vh" for="ab-page">Page to open</label><select id="ab-page">' + NAV_ORDER.map((k) => '<option value="' + k + '">' + esc(PAGES[k].nav) + '</option>').join('') + '</select></div>' +
      '<div class="ab-link"><code id="ab-url">Type a name to make a link</code><button type="button" class="ab-btn" data-ab="copy">Copy</button></div>';
  }
  if (abPanel === 'people') {
    const ppl = (STATS && STATS.people) || [];
    return '<h4>Clients and leads active in the last 30 days</h4>' + (ppl.length ? '<ul class="ab-list">' + ppl.map((p) => '<li><time>' + esc(ago(p.last)) + '</time><span><b>' + esc(p.who) + '</b><small>' +
      [plural(p.views || 0, 'page view'), plural(p.clicks || 0, 'link') + ' opened', p.leads ? plural(p.leads, 'request') : '', p.contact || ''].filter(Boolean).map(esc).join(' · ') + '</small></span></li>').join('') + '</ul>'
      : '<p>No named clients yet. Send a client link so you know who\'s looking.</p>');
  }
  const rows = (STATS && STATS.recent) || [];
  return '<h4>Latest activity</h4>' + (rows.length ? '<ul class="ab-list">' + rows.map((e) => '<li><time>' + esc(ago(e.t)) + '</time><span><span class="k" style="background:' + (KIND[e.k] || KIND.view) + '"></span><b>' + esc(e.who || 'Visitor') + '</b> ' + esc(e.what || '') +
    (e.pg && e.k !== 'view' ? '<small>From ' + esc(e.pg) + '</small>' : '') + (e.contact ? '<small>' + esc(e.contact) + '</small>' : '') + '</span></li>').join('') + '</ul>'
    : '<p>No activity yet. It shows up here as soon as someone visits.</p>');
}
function bindLinkTool(focus, name, page) {
  const n = $('ab-name'), p = $('ab-page');
  if (!n) return;
  if (name != null) n.value = name;
  if (page) p.value = page;
  const upd = () => {
    const s = slug(n.value).replace(/^[^a-z]+/, '').slice(0, 40).replace(/-$/, '');
    $('ab-url').textContent = s ? location.origin + location.pathname + '#' + (p.value !== 'home' ? p.value + '--' : '') + 'for-' + s : 'Type a name to make a link';
  };
  n.addEventListener('input', upd);
  p.addEventListener('change', upd);
  upd();
  if (focus) n.focus();
}
function drawAdmin() {
  const bar = $('adminbar');
  if (!ADMIN) { bar.hidden = true; bar.innerHTML = ''; return; }
  const keepName = $('ab-name') ? $('ab-name').value : null, keepPage = $('ab-page') ? $('ab-page').value : null;
  const r = STATS && STATS.ranges ? STATS.ranges[abRange] : null;
  const stat = (n, label) => '<div class="ab-stat"><b>' + (r ? comma(n || 0) : '–') + '</b><span>' + esc(label) + '</span></div>';
  const name = navName();
  const pg = STATS && STATS.pages && STATS.pages[name] ? STATS.pages[name][abRange] : null;
  const homes = (STATS && STATS.pageHomes && STATS.pageHomes[name]) || [];
  let line = '<b>This page · ' + esc(name) + '</b> · ';
  line += pg && (pg.views || pg.clicks) ? plural(pg.views || 0, 'view') + ' · ' + plural(pg.clicks || 0, 'link') + ' opened (' + RANGE_LABEL[abRange].toLowerCase() + ')' : 'No visits in this range yet';
  if (homes.length) line += ' · Most opened here in 30 days: ' + homes.slice(0, 3).map((h) => esc(h[0]) + ' (' + h[1] + ')').join(', ');
  bar.hidden = false;
  bar.innerHTML = '<div class="wrap">' +
    '<div class="ab-row"><span class="ab-badge">Admin view</span><span class="ab-note">Only you see this.</span><span class="ab-sp"></span>' +
      '<div class="ab-seg" role="group" aria-label="Time range">' + ['1', '7', '30'].map((k) => '<button type="button" data-ab-range="' + k + '" aria-pressed="' + (k === abRange) + '">' + RANGE_LABEL[k] + '</button>').join('') + '</div>' +
      ['activity', 'people', 'link'].map((k) => '<button type="button" class="ab-btn" data-ab="' + k + '" aria-expanded="' + (abPanel === k) + '">' + { activity: 'Activity', people: 'People', link: 'Client link' }[k] + '</button>').join('') +
      '<button type="button" class="ab-btn" data-go="links">ManyChat links</button>' +
      (STATS && /^https:\/\/docs\.google\.com\//.test(STATS.sheet || '') ? '<a class="ab-btn" href="' + esc(STATS.sheet) + '" target="_blank" rel="noopener">Sheet ↗</a>' : '') +
      '<button type="button" class="ab-btn" data-ab="refresh" aria-label="Refresh the numbers">↻</button><button type="button" class="ab-btn" data-ab="exit">Exit</button></div>' +
    '<div class="ab-stats">' + stat(r && r.visitors, 'Visitors') + stat(r && r.views, 'Page views') + stat(r && r.clicks, 'Links opened') + stat(r && r.leads, 'Detail requests') + stat(r && r.signups, 'Email sign-ups') + stat(r && r.goals, 'Messages') + '</div>' +
    '<p class="ab-page">' + line + '</p>' +
    (abPanel ? '<div class="ab-panel">' + adminPanel() + '</div>' : '') +
    '<p class="ab-msg" role="status">' + esc(statsErr || (statsAt ? 'Updated ' + new Date(statsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Loading your analytics...')) +
      (statsErr && !adminKey() ? ' <button type="button" class="ab-btn" data-ab="signin">Sign in</button>' : '') + '</p>' +
  '</div>';
  if (abPanel === 'link') bindLinkTool(false, keepName, keepPage);
}
$('adminbar').addEventListener('click', async (e) => {
  const rg = e.target.closest('[data-ab-range]');
  if (rg) { abRange = rg.dataset.abRange; drawAdmin(); return; }
  const b = e.target.closest('[data-ab]');
  if (!b) return;
  const a = b.dataset.ab;
  if (a === 'activity' || a === 'people' || a === 'link') { abPanel = abPanel === a ? '' : a; drawAdmin(); if (abPanel === 'link') bindLinkTool(true); return; }
  if (a === 'refresh') { b.textContent = '…'; refreshStats(); return; }
  if (a === 'exit') { store.del(ADMIN_STORE); ADMIN = false; STATS = null; abPanel = ''; clearInterval(statsTimer); drawAdmin(); return; }
  if (a === 'signin') { openAdmin(); return; }
  if (a === 'copy') {
    const t = $('ab-url').textContent;
    if (!/^https?:/.test(t)) return;
    try { await navigator.clipboard.writeText(t); b.textContent = 'Copied'; }
    catch (x) { const rr = document.createRange(); rr.selectNodeContents($('ab-url')); const s = window.getSelection(); s.removeAllRanges(); s.addRange(rr); b.textContent = 'Press Ctrl+C'; }
  }
});
