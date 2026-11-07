/**
 * Website tracker for Darien Phillips, REALTOR®  (version 4)
 *
 * This runs on your own Google account and powers your public website:
 *   1. Home links for social posts and ManyChat (darienphillips.com/p/encino): visitors give their name,
 *      phone and email to see the home. You get an email right away with who they are, where they came
 *      from and what they looked at, then a summary of their whole visit once they stop browsing.
 *   2. Every page a visitor opens and every link they tap (Zillow, builder sites, maps, text, call)
 *      is logged in your sheet. When a client opens their personal link, you get an email.
 *   3. "Get full details" on a home: the visitor's name, phone and email come to you by email and
 *      land in your sheet, and they see every option for that home.
 *   4. "Get homes by email" sign-ups, including requests for a custom MLS page.
 *   5. "What's holding you back?" messages from your About page.
 *   6. The Listings tab: add your own keyword for a home (ENCINO), or a home that isn't on the site,
 *      and it works on the site within a few minutes.
 *   7. Your admin view: add #admin to the end of your website's address, enter your admin key,
 *      and your visitors, clicks, leads and sign-ups show at the top of every page. Only you see it.
 * Visitors' names, phones and emails are sent privately to Google, never placed in a link.
 *
 * ONE-TIME SETUP (about 5 minutes, on a computer):
 *   1. Go to script.google.com and click "New project". Delete the sample code,
 *      paste this whole file in, and click the Save icon.
 *   2. In the menu at the top, pick "setup" and click Run.
 *      Click "Review permissions", choose your Google account, then "Allow".
 *      If Google says it hasn't verified the app, click "Advanced", then
 *      "Go to Untitled project (unsafe)". That warning appears for any script you write
 *      for yourself. You'll get an email with a link to your activity sheet and your admin key.
 *   3. Click Deploy > New deployment. Click the gear next to "Select type" and choose
 *      "Web app". Set "Execute as" to Me and "Who has access" to Anyone. Click Deploy,
 *      then copy the Web app URL (it ends in /exec).
 *   4. Send that URL to Claude, which connects it to your website.
 *
 * If you already set up an earlier version: paste this over it, Save, run "setup" once,
 * then Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy.
 * The URL stays the same.
 */

const SETTINGS = {
  notifyEmail: 'darienphillips45@gmail.com',
  agentName: 'Darien Phillips',
  agentLine: 'REALTOR® · eXp Realty of Northern California · DRE #02439090',
  agentPhone: '209.882.6469',
  agentPhoneDial: '+12098826469',
  timeZone: 'America/Los_Angeles',
  quietMinutes: 30,
  clientVisitEmails: true,   // email when a client opens the personal link you sent them
  visitSummaries: true,      // email a summary of each signed-in visitor's visit once they stop browsing
  summaryAfterMinutes: 15,   // how long without activity counts as done browsing
  emailEachClick: false,     // true: also email every link a visitor opens (texts and calls always email)
  sheetTitle: 'Client home activity',
  allowedSites: [
    'centurycommunities.com', 'richmondamerican.com', 'lennar.com', 'lgihomes.com', 'kbhome.com',
    'newhomesource.com', 'zillow.com', 'roots.homes', 'www.google.com', 'calhfa.ca.gov', 'gsfahome.org',
    'va.gov', 'usda.gov', 'realtor.com', 'redfin.com', 'homes.com', 'consumerfinance.gov', 'hud.gov'
  ]
};

/* ---------- Setup ---------- */

function setup() {
  const props = PropertiesService.getScriptProperties();
  let book = null;
  const existing = props.getProperty('SHEET_ID');
  if (existing) {
    try { book = SpreadsheetApp.openById(existing); } catch (err) { book = null; }
  }
  if (!book) {
    book = SpreadsheetApp.create(SETTINGS.sheetTitle);
    book.getSheets()[0].setName('Clicks');
    props.setProperty('SHEET_ID', book.getId());
  }
  ensureSheet_(book, 'Visits', ['When', 'Who', 'Page', 'Visitor id', 'Client code', 'Came from', 'Device', 'Source', 'Link name', 'Preview only']);
  ensureSheet_(book, 'Clicks', ['When', 'Client', 'Home', 'Opened on', 'Price', 'Size', 'MLS# or plan', 'From page', 'Link', 'Visitor id']);
  ensureSheet_(book, 'Leads', ['When', 'Name', 'Phone', 'Email', 'Home', 'Price', 'Size', 'MLS# or plan', 'Note', 'Client code', 'From page', 'Link', 'Visitor id', 'Source', 'How', 'Keyword', 'What they did first']);
  ensureSheet_(book, 'Sign-ups', ['When', 'Name', 'Phone', 'Email', 'Wants', 'Areas', 'Max price', 'Max monthly', 'Beds', 'Baths', 'Size', 'Lot', 'Custom MLS page', 'Timeline', 'Saved homes', 'Notes', 'Client code']);
  ensureSheet_(book, 'Goals', ['When', 'Name', 'Phone', 'Email', "What's holding them back", 'Their goal', 'Client code', 'From page']);
  setupListings_(book);
  if (SETTINGS.visitSummaries && !ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === 'sendVisitSummaries')) {
    ScriptApp.newTrigger('sendVisitSummaries').timeBased().everyMinutes(10).create();
  }
  let key = props.getProperty('ADMIN_KEY');
  if (!key) { key = Utilities.getUuid().replace(/-/g, '').slice(0, 20); props.setProperty('ADMIN_KEY', key); }
  if (!book.getSheetByName('Most opened')) {
    const top = book.insertSheet('Most opened');
    top.getRange('A1').setFormula(
      '=IFERROR(QUERY(Leads!A:L,"select E, count(A), max(A) where E <> \'\' group by E order by count(A) desc ' +
      'label E \'Home\', count(A) \'Times opened\', max(A) \'Last opened\'",1),"No homes opened yet")');
    top.getRange('E1').setFormula(
      '=IFERROR(QUERY(Leads!A:L,"select B, E, count(A), max(A) where B <> \'\' group by B, E order by B, count(A) desc ' +
      'label B \'Name\', E \'Home\', count(A) \'Times opened\', max(A) \'Last opened\'",1),"No homes opened yet")');
    top.getRange('C:C').setNumberFormat('ddd m/d h:mm am/pm');
    top.getRange('H:H').setNumberFormat('ddd m/d h:mm am/pm');
    top.getRange('1:1').setFontWeight('bold');
  }
  MailApp.sendEmail(
    SETTINGS.notifyEmail,
    'Your website tracker is on',
    'Visits, homes opened, leads, sign-ups and messages from your website will show up in this sheet:\n' + book.getUrl() +
    '\n\nAdd your own keywords for your posts, or homes that aren\'t on the site, in its Listings tab.' +
    '\n\nYour admin key (keep it private): ' + key +
    '\nTo see your analytics at the top of your website, add #admin to the end of its address and enter this key.' +
    '\n\nNext step: Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone), then send the Web app URL to Claude.'
  );
  console.log('Activity sheet: ' + book.getUrl());
}

/** The Listings tab: Darien's keywords and featured homes, read by the website. */
function setupListings_(book) {
  if (book.getSheetByName('Listings')) return;
  const s = book.insertSheet('Listings');
  const head = ['Keyword', 'Home already on your site (address or MLS#)', 'Address', 'City', 'Price', 'Beds', 'Baths', 'Sq ft', 'Headline', 'Description', 'Photo link', 'Listing link', 'Show on site'];
  s.appendRow(head);
  s.appendRow(['ENCINO', '8160 Encino Ave', '', '', '', '', '', '', 'Country living in town with a 3% loan you can take over', '', '', '', 'No']);
  s.setFrozenRows(1);
  s.getRange('1:1').setFontWeight('bold');
  const notes = [
    'One word people comment on your post or type in the site\'s search, like ENCINO. The link is darienphillips.com/p/ plus the keyword.',
    'For a home already on the site, put its street address or MLS# here and leave Address through Listing link blank.',
    'For a home that isn\'t on the site: its street address.', 'Town', 'Like $899,000', '', '', '',
    'One line shown at the top of the home\'s page.', 'A few sentences about the home, shown after the visitor signs in.',
    'Optional: a link to a photo you have the rights to use, starting with https://', 'Optional: the listing on Zillow, your MLS or your own page, starting with https://',
    'Yes to use this row, No to turn it off. The example row is off until you change it to Yes.'];
  notes.forEach((n, i) => { if (n) s.getRange(1, i + 1).setNote(n); });
}

/** Rows from the Listings tab that are turned on, for the website (public: no visitor details). */
function listings_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('listings');
  if (hit) return JSON.parse(hit);
  const out = { ok: true, listings: [] };
  const s = sheet_('Listings');
  if (s && s.getLastRow() > 1) {
    const https = (u) => (/^https:\/\/\S+$/i.test(String(u || '').trim()) ? String(u).trim().slice(0, 500) : '');
    const t = (v, n) => plain_(String(v || '').trim()).slice(0, n);
    s.getRange(2, 1, Math.min(s.getLastRow() - 1, 500), 13).getDisplayValues().forEach((r) => {
      const kw = String(r[0] || '').trim();
      if (!/^[A-Za-z0-9-]{2,40}$/.test(kw) || /^no$/i.test(String(r[12] || '').trim())) return;
      out.listings.push({ keyword: kw, home: t(r[1], 120), address: t(r[2], 120), city: t(r[3], 60), price: t(r[4], 20), beds: t(r[5], 8),
        baths: t(r[6], 8), sqft: t(r[7], 12), headline: t(r[8], 140), about: t(r[9], 1200), photo: https(r[10]), link: https(r[11]) });
    });
  }
  cache.put('listings', JSON.stringify(out), 120);
  return out;
}

function ensureSheet_(book, name, headers) {
  let sheet = book.getSheetByName(name);
  if (!sheet) sheet = book.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.getRange('A:A').setNumberFormat('ddd m/d/yyyy h:mm am/pm');
  }
  return sheet;
}

function sheet_(name) {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) return null;
  return SpreadsheetApp.openById(id).getSheetByName(name);
}

/* ---------- Web pages ---------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  const mode = String(p.mode || 'go');
  if (mode === 'ping') return json_({ ok: true, version: 4 });
  if (mode === 'listings') return json_(listings_());
  if (mode === 'lead') return page_(leadPage_(p), clip_(p.h, 90).replace(/^'/, '') || 'Home details');
  if (mode === 'join') return page_(joinPage_(p), 'Get homes by email');
  return goPage_(p);
}

function page_(html, title) {
  return HtmlService.createHtmlOutput(html)
    .setTitle(title + ' · ' + SETTINGS.agentName)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Plain tracked link (older pages): log, email, then continue to the site. */
function goPage_(p) {
  const link = safeLink_(p.u);
  const visit = {
    when: new Date(), client: clip_(p.c, 60) || 'Visitor', home: clip_(p.h, 140),
    site: clip_(p.s, 40) || siteName_(link), price: clip_(p.p, 24), size: clip_(p.b, 48),
    ref: clip_(p.r, 40), page: clip_(p.pg, 60), link: link
  };
  if (visit.home || link) recordClick_(visit);
  let body;
  if (link) {
    body = '<p class="meta">' + esc_([visit.price, visit.size].filter(Boolean).join(' · ')) + '</p>' +
      '<a class="btn" href="' + esc_(link) + '" target="_top" rel="noopener">Continue to ' + esc_(visit.site || 'the page') + '</a>' +
      '<script>setTimeout(function(){try{window.top.location.replace(' + js_(link) + ');}catch(e){}},500);</script>';
  } else {
    body = '<p class="meta">This link can\'t be opened from here.</p>';
  }
  return page_(shell_('<h1>' + (esc_(visit.home) || 'Opening your page') + '</h1>' + body), plain_(visit.home) || SETTINGS.agentName);
}

function recordClick_(visit) {
  try {
    const s = sheet_('Clicks');
    if (s) s.appendRow([visit.when, visit.client, visit.home, visit.site, visit.price, visit.size, visit.ref, visit.page, visit.link, visit.vid || '']);
  } catch (err) { console.error(err); }
  const contact = /^(Texted|Called|Emailed) Darien$/.test(plain_(visit.home));
  if (!contact && !SETTINGS.emailEachClick) return;
  notify_([visit.client, visit.home, visit.site].join('|'),
    contact ? plain_(visit.client) + ' ' + plain_(visit.home).replace(' Darien', ' you').toLowerCase() + ' from your website'
      : plain_(visit.client) + ' opened ' + (plain_(visit.home) || 'a link') + (visit.site ? ' on ' + plain_(visit.site) : ''),
    [plain_(visit.client) + (contact ? ' tapped to ' + { Texted: 'text', Called: 'call', Emailed: 'email' }[plain_(visit.home).split(' ')[0]] + ' you on your website.' : ' opened a link on your website.'), '',
      contact ? null : 'What: ' + (plain_(visit.home) || 'Not given'),
      visit.price ? 'Price: ' + plain_(visit.price) : null,
      visit.size ? 'Size: ' + plain_(visit.size) : null,
      visit.site && !contact ? 'Opened on: ' + plain_(visit.site) : null,
      visit.link ? 'Link: ' + visit.link : null,
      visit.page ? 'From your page: ' + plain_(visit.page) : null]);
}

/** "Get full details": contact form, then every option for the home. */
function leadPage_(p) {
  const home = {
    h: clip_(p.h, 140), p: clip_(p.p, 30), b: clip_(p.b, 60), r: clip_(p.r, 40), l: clip_(p.l, 80),
    city: clip_(p.city, 40), c: clip_(p.c, 60), pg: clip_(p.pg, 60),
    z: safeLink_(p.z), x: safeLink_(p.x), xs: clip_(p.xs, 40), m: safeLink_(p.m)
  };
  const joinUrl = ScriptApp.getService().getUrl() + '?mode=join&areas=' + encodeURIComponent(plain_(home.city)) + (home.c ? '&c=' + encodeURIComponent(plain_(home.c)) : '');
  const opt = (href, label, cls) => href ? '<a class="opt ' + (cls || '') + '" href="' + esc_(href) + '" target="_blank" rel="noopener" data-site="' + esc_(label) + '">' + esc_(label) + '</a>' : '';
  const textBody = encodeURIComponent('Hi Darien, I\'m interested in ' + plain_(home.h) + '.');
  const options =
    opt(home.z, 'See photos and details on Zillow', 'main') +
    opt(home.x, home.xs || 'More details', '') +
    opt(home.m, 'Map', '') +
    '<a class="opt" href="tel:' + SETTINGS.agentPhoneDial + '" target="_top">Call Darien</a>' +
    '<a class="opt" href="sms:' + SETTINGS.agentPhoneDial + '?&body=' + textBody + '" target="_top">Text Darien about this home</a>' +
    '<a class="opt" href="mailto:' + SETTINGS.notifyEmail + '?subject=' + encodeURIComponent('About ' + plain_(home.h)) + '" target="_top">Email Darien</a>' +
    '<a class="opt" href="' + esc_(joinUrl) + '" target="_top">Get homes like this by email</a>';
  const html =
    '<p class="eyebrow">Home details</p>' +
    '<h1>' + (esc_(home.h) || 'Home details') + '</h1>' +
    '<p class="meta">' + esc_([home.p, home.b, home.l].filter(Boolean).join(' · ')) + '</p>' +
    '<div id="known" class="card" hidden><p id="known-text"></p><button class="btn" id="go-known" type="button">Show me the details</button>' +
      '<button class="link" id="not-me" type="button">Not you?</button></div>' +
    '<form id="form" class="card" novalidate>' +
      '<p class="lead">Enter your info to see everything on this home. Darien will follow up with answers and similar homes.</p>' +
      field_('name', 'Your name', 'text', 'name') + field_('phone', 'Mobile number', 'tel', 'tel') + field_('email', 'Email', 'email', 'email') +
      '<label class="lbl" for="note">Questions or a good time to tour (optional)</label><textarea id="note" rows="2"></textarea>' +
      '<p class="fine">By tapping Get the details, you agree that Darien Phillips may contact you by phone, text or email about homes. Consent isn\'t required to buy a home. Message and data rates may apply.</p>' +
      '<button class="btn" type="submit" id="send">Get the details</button><p class="err" id="err" role="alert"></p>' +
    '</form>' +
    '<div id="options" hidden><p class="ok" id="thanks"></p><div class="opts">' + options + '</div></div>' +
    '<script>' +
    'var HOME=' + js_(home) + ';' +
    'var KEY="dp-visitor";function load(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){return null}}' +
    'function keep(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}' +
    'function forget(){try{localStorage.removeItem(KEY)}catch(e){}}' +
    'function $(i){return document.getElementById(i)}' +
    'function done(name){$("form").hidden=true;$("known").hidden=true;$("options").hidden=false;$("thanks").textContent="Thanks, "+name.split(" ")[0]+". Here is everything for this home. Darien got your note.";}' +
    'function send(v,btn){if(btn){btn.disabled=true;btn.textContent="Sending...";}' +
      'google.script.run.withSuccessHandler(function(){keep({name:v.name,phone:v.phone,email:v.email});done(v.name);})' +
      '.withFailureHandler(function(e){if(btn){btn.disabled=false;btn.textContent="Get the details";}$("err").textContent="That didn\'t go through. Please try again, or text Darien at ' + SETTINGS.agentPhone + '.";$("form").hidden=false;})' +
      '.submitLead(Object.assign({},HOME,v));}' +
    'var me=load();if(me&&me.name&&me.email){$("form").hidden=true;$("known").hidden=false;$("known-text").textContent="Welcome back, "+me.name.split(" ")[0]+".";}' +
    '$("go-known").onclick=function(){send({name:me.name,phone:me.phone,email:me.email,note:""},this)};' +
    '$("not-me").onclick=function(){forget();me=null;$("known").hidden=true;$("form").hidden=false;};' +
    '$("form").onsubmit=function(ev){ev.preventDefault();var v={name:$("name").value.trim(),phone:$("phone").value.trim(),email:$("email").value.trim(),note:$("note").value.trim()};' +
      'if(!v.name){$("err").textContent="Please add your name.";$("name").focus();return;}' +
      'if(v.phone.replace(/\\D/g,"").length<10){$("err").textContent="Please add a mobile number with area code.";$("phone").focus();return;}' +
      'if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v.email)){$("err").textContent="Please add a valid email.";$("email").focus();return;}' +
      '$("err").textContent="";send(v,$("send"));};' +
    'document.querySelectorAll(".opt[data-site]").forEach(function(a){a.addEventListener("click",function(){var m=load()||{};google.script.run.logOption({h:HOME.h,s:a.getAttribute("data-site"),u:a.href,name:m.name||"",email:m.email||"",c:HOME.c,pg:HOME.pg});});});' +
    '</script>';
  return shell_(html);
}

/** "Get homes by email": contact info plus the search they picked on the website. */
function joinPage_(p) {
  const pref = {
    wants: clip_(p.wants, 160), areas: clip_(p.areas, 200), price: clip_(p.price, 20), pay: clip_(p.pay, 20),
    beds: clip_(p.beds, 10), baths: clip_(p.baths, 10), size: clip_(p.size, 20), lot: clip_(p.lot, 20),
    mls: p.mls === 'no' ? 'no' : 'yes', when: clip_(p.when, 40), saved: clip_(p.saved, 600), c: clip_(p.c, 60)
  };
  const summary = [
    pref.wants ? ['Looking for', pref.wants] : null, pref.areas ? ['Areas', pref.areas] : null,
    pref.price ? ['Max price', pref.price] : null, pref.pay ? ['Max monthly', pref.pay] : null,
    pref.beds ? ['Bedrooms', pref.beds] : null, pref.baths ? ['Bathrooms', pref.baths] : null,
    pref.size ? ['Home size', pref.size] : null, pref.lot ? ['Lot size', pref.lot] : null,
    pref.when ? ['Timeline', pref.when] : null, pref.saved ? ['Homes saved', pref.saved] : null
  ].filter(Boolean).map((r) => '<li><span>' + esc_(r[0]) + '</span><b>' + esc_(r[1]) + '</b></li>').join('');
  const html =
    '<p class="eyebrow">Get homes by email</p><h1>Your home search</h1>' +
    (summary ? '<ul class="sum">' + summary + '</ul>' : '') +
    '<form id="form" class="card" novalidate>' +
      field_('name', 'Your name', 'text', 'name') + field_('email', 'Email', 'email', 'email') + field_('phone', 'Mobile number', 'tel', 'tel') +
      '<label class="check"><input type="checkbox" id="mls"' + (pref.mls === 'yes' ? ' checked' : '') + '> Set up my own MLS page with homes in this range, updated daily</label>' +
      '<label class="lbl" for="notes">Anything else (optional)</label><textarea id="notes" rows="2"></textarea>' +
      '<p class="fine">By tapping Sign me up, you agree that Darien Phillips may email, call or text you about homes. Unsubscribe anytime. Consent isn\'t required to buy a home.</p>' +
      '<button class="btn" type="submit" id="send">Sign me up</button><p class="err" id="err" role="alert"></p>' +
    '</form>' +
    '<div id="done" class="card" hidden><p class="ok" id="thanks"></p><p>Darien will set up your search and reach out. Questions now? Call or text ' + esc_(SETTINGS.agentPhone) + '.</p></div>' +
    '<script>var PREF=' + js_(pref) + ';function $(i){return document.getElementById(i)}' +
    'try{var me=JSON.parse(localStorage.getItem("dp-visitor")||"null");if(me){$("name").value=me.name||"";$("email").value=me.email||"";$("phone").value=me.phone||"";}}catch(e){}' +
    '$("form").onsubmit=function(ev){ev.preventDefault();var v=Object.assign({},PREF,{name:$("name").value.trim(),email:$("email").value.trim(),phone:$("phone").value.trim(),notes:$("notes").value.trim(),mls:$("mls").checked?"yes":"no"});' +
      'if(!v.name){$("err").textContent="Please add your name.";return;}' +
      'if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v.email)){$("err").textContent="Please add a valid email.";return;}' +
      'var b=$("send");b.disabled=true;b.textContent="Sending...";' +
      'google.script.run.withSuccessHandler(function(){try{localStorage.setItem("dp-visitor",JSON.stringify({name:v.name,email:v.email,phone:v.phone}))}catch(e){}$("form").hidden=true;$("done").hidden=false;$("thanks").textContent="You\'re signed up, "+v.name.split(" ")[0]+".";})' +
      '.withFailureHandler(function(){b.disabled=false;b.textContent="Sign me up";$("err").textContent="That didn\'t go through. Please try again, or text Darien at ' + SETTINGS.agentPhone + '.";}).submitSignup(v);};' +
    '</script>';
  return shell_(html);
}

/* ---------- Requests from the public website ---------- */

function doPost(e) {
  let d = {};
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}') || {}; } catch (err) { d = {}; }
  let out;
  try {
    const type = String(d.type || '');
    if (type === 'pv') out = logVisit_(d);
    else if (type === 'click') out = logClick_(d);
    else if (type === 'lead') out = { ok: submitLead(d) };
    else if (type === 'signup') out = { ok: submitSignup(d) };
    else if (type === 'goal') out = { ok: submitGoal(d) };
    else if (type === 'stats') out = stats_(d);
    else out = { ok: false, error: 'unknown request' };
  } catch (err) {
    out = { ok: false, error: String((err && err.message) || err).slice(0, 120) };
  }
  return json_(out);
}

function json_(v) {
  return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);
}

/** Who did it: the name they gave, the client name in their link, or their visitor code. */
function who_(d) { return clip_(d && d.n, 80) || clip_(d && d.c, 60) || ('Visitor ' + (clip_(d && d.v, 12) || '?')); }

/** A page view on the website. Emails you when a named client opens the site (once per half hour). */
function logVisit_(d) {
  const v = { who: who_(d), page: clip_(d.pg, 90), id: clip_(d.v, 12), client: clip_(d.c, 60), dev: clip_(d.dev, 12) };
  const ref = hostOf_(String(d.ref || '').replace(/^http:/i, 'https:')).replace(/^www\./, '');
  try {
    const s = sheet_('Visits');
    if (s) s.appendRow([new Date(), v.who, v.page, v.id, v.client, clip_(ref, 60), v.dev, clip_(srcName_(d.src), 30), clip_(d.key, 80), d.locked === 'yes' ? 'yes' : '']);
  } catch (err) { console.error(err); }
  if (SETTINGS.clientVisitEmails && v.client) {
    notify_(['visit', plain_(v.who)].join('|'), plain_(v.who) + ' is on your website',
      [plain_(v.who) + ' just opened your website' + (v.page ? ' (' + plain_(v.page) + ')' : '') + '.', '',
        'Each page and home they open is in your activity sheet, and in the admin view on your website.']);
  }
  return { ok: true };
}

/** A link opened on the website: a home on Zillow, a builder site, a map, or a text or call to you. */
function logClick_(d) {
  const link = String(d.u || '').trim();
  recordClick_({
    when: new Date(), client: who_(d), home: clip_(d.h, 140), site: clip_(d.s, 40) || siteName_(link),
    price: clip_(d.p, 24), size: clip_(d.b, 48), ref: clip_(d.r, 40), page: clip_(d.pg, 90),
    link: /^https:\/\/\S+$/i.test(link) ? clip_(link, 500) : '', vid: clip_(d.v, 12)
  });
  return { ok: true };
}

/** "What's holding you back?" from the About page. */
function submitGoal(d) {
  const f = (k, n) => clip_(d && d[k], n);
  const v = { name: f('name', 80), phone: f('phone', 30), email: f('email', 120), goals: f('goals', 300), note: f('note', 800), c: f('c', 60), pg: f('pg', 60) };
  const okEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(plain_(v.email));
  const okPhone = plain_(v.phone).replace(/\D/g, '').length >= 10;
  if (!v.name || !(okEmail || okPhone)) throw new Error('Missing name or a way to reach them');
  const s = sheet_('Goals');
  if (s) s.appendRow([new Date(), v.name, v.phone, v.email, v.goals, v.note, v.c, v.pg]);
  notify_(['goal', plain_(v.email) || plain_(v.phone), v.goals, v.note].join('|'),
    'Message: ' + plain_(v.name) + ' told you what\'s holding them back',
    [plain_(v.name) + ' told you what\'s holding them back, from your About page.', '',
      'Name: ' + plain_(v.name), v.phone ? 'Phone: ' + plain_(v.phone) : null, v.email ? 'Email: ' + plain_(v.email) : null, '',
      "What's holding them back: " + (plain_(v.goals) || 'Didn\'t pick any'),
      v.note ? 'Their goal, in their words: ' + plain_(v.note) : null,
      v.c ? 'Client code in their link: ' + plain_(v.c) : null]);
  return true;
}

/** The numbers for your admin view. Only answers when the admin key matches. */
function stats_(d) {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty('ADMIN_KEY');
  if (!key || String((d && d.key) || '') !== key) return { ok: false, error: 'key' };
  const now = new Date();
  const DAY = 86400000;
  const tz = SETTINGS.timeZone;
  const today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const inRange = (t, r) => (r === '1' ? Utilities.formatDate(t, tz, 'yyyy-MM-dd') === today : now - t <= Number(r) * DAY);
  const rows = (name, cols, max) => {
    const s = sheet_(name);
    if (!s) return [];
    const last = s.getLastRow();
    if (last < 2) return [];
    const start = Math.max(2, last - max + 1);
    return s.getRange(start, 1, last - start + 1, cols).getValues().filter((r) => r[0] instanceof Date && now - r[0] <= 31 * DAY);
  };
  const visits = rows('Visits', 7, 6000);
  const clicks = rows('Clicks', 9, 4000);
  const leads = rows('Leads', 12, 1000);
  const signups = rows('Sign-ups', 17, 1000);
  const goals = rows('Goals', 8, 1000);
  const contactLink = (h) => /^(Texted|Called|Emailed) Darien$/.test(plain_(h));
  const ranges = {};
  const pages = {};
  const bump = (p, r, k) => { p = plain_(p) || 'Website'; pages[p] = pages[p] || {}; pages[p][r] = pages[p][r] || { views: 0, clicks: 0 }; pages[p][r][k]++; };
  ['1', '7', '30'].forEach((r) => {
    const v = visits.filter((x) => inRange(x[0], r));
    const c = clicks.filter((x) => inRange(x[0], r));
    const ids = {};
    v.forEach((x) => { ids[String(x[3] || x[1])] = 1; });
    ranges[r] = {
      visitors: Object.keys(ids).length, views: v.length, clicks: c.length,
      leads: leads.filter((x) => inRange(x[0], r)).length, signups: signups.filter((x) => inRange(x[0], r)).length,
      goals: goals.filter((x) => inRange(x[0], r)).length
    };
    v.forEach((x) => bump(x[2], r, 'views'));
    c.forEach((x) => bump(x[7], r, 'clicks'));
  });
  const byPage = {};
  clicks.map((x) => [x[2], x[7]]).concat(leads.map((x) => [x[4], x[10]])).forEach((x) => {
    const h = plain_(x[0]);
    if (!h || contactLink(h)) return;
    const p = plain_(x[1]) || 'Website';
    byPage[p] = byPage[p] || {};
    byPage[p][h] = (byPage[p][h] || 0) + 1;
  });
  const pageHomes = {};
  Object.keys(byPage).forEach((p) => {
    pageHomes[p] = Object.keys(byPage[p]).map((h) => [h, byPage[p][h]]).sort((a, b) => b[1] - a[1]).slice(0, 5);
  });
  const iso = (t) => t.toISOString();
  const reach = (x) => [plain_(x[2]), plain_(x[3])].filter(String).join(' · ');
  const ev = [];
  visits.slice(-80).forEach((x) => ev.push({ t: iso(x[0]), k: 'view', who: plain_(x[1]), what: 'viewed ' + (plain_(x[2]) || 'the website') }));
  clicks.slice(-80).forEach((x) => ev.push({ t: iso(x[0]), k: 'click', who: plain_(x[1]),
    what: contactLink(x[2]) ? plain_(x[2]).replace(' Darien', ' you').toLowerCase() : 'opened ' + (plain_(x[2]) || 'a link') + (x[3] ? ' on ' + plain_(x[3]) : ''), pg: plain_(x[7]) }));
  leads.slice(-40).forEach((x) => ev.push({ t: iso(x[0]), k: 'lead', who: plain_(x[1]), what: 'asked for details on ' + (plain_(x[4]) || 'a home'), pg: plain_(x[10]), contact: reach(x) }));
  signups.slice(-40).forEach((x) => ev.push({ t: iso(x[0]), k: 'signup', who: plain_(x[1]),
    what: 'signed up for homes by email' + (x[12] === 'Yes' ? ' and a custom MLS page' : '') + (x[4] ? ': ' + plain_(x[4]) : ''), pg: 'Get homes by email', contact: reach(x) }));
  goals.slice(-40).forEach((x) => ev.push({ t: iso(x[0]), k: 'goal', who: plain_(x[1]),
    what: "shared what's holding them back: " + (plain_(x[4]) || 'none picked') + (x[5] ? '. Their goal: ' + plain_(x[5]) : ''), pg: plain_(x[7]), contact: reach(x) }));
  ev.sort((a, b) => (a.t < b.t ? 1 : a.t > b.t ? -1 : 0));
  const ppl = {};
  const person = (who, t) => {
    const w = plain_(who);
    if (!w || /^Visitor\b/.test(w)) return null;
    const p = ppl[w] = ppl[w] || { who: w, last: t, views: 0, clicks: 0, leads: 0, contact: '' };
    if (t > p.last) p.last = t;
    return p;
  };
  visits.forEach((x) => { const p = person(x[1], x[0]); if (p) p.views++; });
  clicks.forEach((x) => { const p = person(x[1], x[0]); if (p) p.clicks++; });
  leads.concat(signups, goals).forEach((x) => { const p = person(x[1], x[0]); if (p) { p.leads++; p.contact = reach(x) || p.contact; } });
  const people = Object.keys(ppl).map((k) => ppl[k]).sort((a, b) => b.last - a.last).slice(0, 15)
    .map((p) => ({ who: p.who, last: iso(p.last), views: p.views, clicks: p.clicks, leads: p.leads, contact: p.contact }));
  const id = props.getProperty('SHEET_ID');
  return { ok: true, at: iso(now), sheet: id ? 'https://docs.google.com/spreadsheets/d/' + id + '/edit' : '', ranges: ranges, pages: pages, pageHomes: pageHomes, recent: ev.slice(0, 60), people: people };
}

/** Every 10 minutes: emails a summary of each signed-in visitor's visit once they've stopped browsing. */
function sendVisitSummaries() {
  if (!SETTINGS.visitSummaries) return;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const now = Date.now();
    const props = PropertiesService.getScriptProperties();
    const recent = (name, cols) => {
      const s = sheet_(name);
      if (!s) return [];
      const last = s.getLastRow();
      if (last < 2) return [];
      const start = Math.max(2, last - 3000 + 1);
      return s.getRange(start, 1, last - start + 1, cols).getValues().filter((r) => r[0] instanceof Date && now - r[0].getTime() <= 6 * 3600000);
    };
    const visits = recent('Visits', 10), clicks = recent('Clicks', 10), leads = recent('Leads', 17);
    const people = {}, events = {};
    leads.forEach((r) => { const id = plain_(r[12]); if (id) people[id] = { name: plain_(r[1]), phone: plain_(r[2]), email: plain_(r[3]), src: plain_(r[13]) || (people[id] || {}).src }; });
    const add = (id, when, text, who, src) => {
      id = plain_(id);
      if (!id) return;
      (events[id] = events[id] || []).push({ t: when.getTime(), x: text });
      const w = plain_(who);
      if (!people[id] && w && !/^Visitor\b/.test(w)) people[id] = { name: w };
      if (people[id] && src && !people[id].src) people[id].src = plain_(src);
    };
    const contact = { Texted: 'text', Called: 'call', Emailed: 'email' };
    visits.forEach((r) => add(r[3], r[0], 'Viewed ' + (plain_(r[2]) || 'your website') + (r[9] === 'yes' ? ' (preview, before signing in)' : ''), r[1], r[7]));
    clicks.forEach((r) => {
      const h = plain_(r[2]);
      add(r[9], r[0], /^(Texted|Called|Emailed) Darien$/.test(h) ? 'Tapped to ' + contact[h.split(' ')[0]] + ' you' : 'Opened ' + (h || 'a link') + (r[3] ? ' on ' + plain_(r[3]) : ''), r[1]);
    });
    leads.forEach((r) => add(r[12], r[0], (plain_(r[14]) === 'Signed in' ? 'Signed in to see ' : 'Asked for details on ') + (plain_(r[4]) || 'a home'), r[1]));
    const fmt = (t) => Utilities.formatDate(new Date(t), SETTINGS.timeZone, 'h:mm a');
    Object.keys(events).forEach((id) => {
      const who = people[id];
      if (!who || !who.name) return; // only people who signed in or opened their own link
      const key = 'sum_' + id;
      const done = Number(props.getProperty(key) || 0);
      const list = events[id].filter((e) => e.t > done).sort((a, b) => a.t - b.t);
      if (!list.length) return;
      const lastT = list[list.length - 1].t;
      if (now - lastT < SETTINGS.summaryAfterMinutes * 60000) return; // still browsing
      props.setProperty(key, String(lastT));
      if (list.length < 2) return; // nothing new worth an email
      const homes = [], opened = [];
      list.forEach((e) => {
        const m = e.x.match(/^Viewed Home: (.+?)( \(preview|$)/);
        if (m && homes.indexOf(m[1]) < 0) homes.push(m[1]);
        if (/^Opened /.test(e.x) && opened.indexOf(e.x.slice(7)) < 0) opened.push(e.x.slice(7));
      });
      const mins = Math.max(1, Math.round((lastT - list[0].t) / 60000));
      notify_(['summary', id, String(lastT)].join('|'),
        'Visit summary: ' + who.name + ' looked at ' + (homes.length ? homes.length + (homes.length === 1 ? ' home' : ' homes') : list.length + ' pages') + (opened.length ? ' and opened ' + opened.length + (opened.length === 1 ? ' link' : ' links') : ''),
        [who.name + ' was on your website from ' + fmt(list[0].t) + ' to ' + fmt(lastT) + ' (' + mins + (mins === 1 ? ' minute' : ' minutes') + ').',
          who.phone ? 'Phone: ' + who.phone : null, who.email ? 'Email: ' + who.email : null, who.src ? 'Came from: ' + who.src : null, '',
          homes.length ? 'Homes they looked at:' : null].concat(homes.map((h) => '- ' + h), homes.length ? [''] : [],
          opened.length ? ['Links they opened:'] : [], opened.map((o) => '- ' + o), opened.length ? [''] : [],
          ['Everything they did:'], list.map((e) => fmt(e.t) + '  ' + e.x)));
    });
    const all = props.getProperties();
    Object.keys(all).forEach((k) => { if (k.indexOf('sum_') === 0 && now - Number(all[k]) > 30 * 86400000) props.deleteProperty(k); });
  } finally {
    lock.releaseLock();
  }
}

/** Where a visitor came from, from the ?from= part of the link you posted. */
function srcName_(s) {
  const k = String(s || '').toLowerCase().replace(/[^a-z0-9 _-]/g, '').slice(0, 30);
  const names = { instagram: 'Instagram', ig: 'Instagram', facebook: 'Facebook', fb: 'Facebook', tiktok: 'TikTok', manychat: 'ManyChat', youtube: 'YouTube', google: 'Google', email: 'Email', text: 'Text message' };
  return names[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : '');
}

/** Makes a new admin key (if the old one got out) and emails it to you. */
function newAdminKey() {
  const key = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
  PropertiesService.getScriptProperties().setProperty('ADMIN_KEY', key);
  MailApp.sendEmail(SETTINGS.notifyEmail, 'Your new website admin key', 'Your new admin key: ' + key + '\nThe old key no longer works.');
}

/* ---------- Called from the pages ---------- */

function submitLead(d) {
  const v = {
    name: clip_(d && d.name, 80), phone: clip_(d && d.phone, 30), email: clip_(d && d.email, 120), note: clip_(d && d.note, 500),
    h: clip_(d && d.h, 140), p: clip_(d && d.p, 30), b: clip_(d && d.b, 60), r: clip_(d && d.r, 40), l: clip_(d && d.l, 80),
    c: clip_(d && d.c, 60), pg: clip_(d && d.pg, 90), link: safeLink_(d && (d.z || d.x || d.m)),
    vid: clip_(d && d.v, 12), src: clip_(srcName_(d && d.src), 30), kw: clip_(d && d.kw, 40),
    how: d && d.how === 'signin' ? 'Signed in' : 'Asked for details',
    steps: (d && Array.isArray(d.steps) ? d.steps : []).slice(-25).map((x) => plain_(clip_(x, 200)))
  };
  if (!v.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(plain_(v.email))) throw new Error('Missing name or email');
  const s = sheet_('Leads');
  if (s) s.appendRow([new Date(), v.name, v.phone, v.email, v.h, v.p, v.b, v.r, v.note, v.c, v.pg, v.link, v.vid, v.src, v.how, v.kw, clip_(v.steps.join(' | '), 4000)]);
  if (v.how === 'Signed in') {
    notify_(['signin', plain_(v.email), v.h].join('|'),
      'New sign-in' + (v.src ? ' from ' + plain_(v.src) : '') + ': ' + plain_(v.name) + ' is looking at ' + (plain_(v.h) || 'a home'),
      [plain_(v.name) + ' signed in on your website to see ' + (plain_(v.h) || 'a home') + '.', '',
        'Name: ' + plain_(v.name), 'Phone: ' + plain_(v.phone), 'Email: ' + plain_(v.email),
        v.src ? 'Came from: ' + plain_(v.src) + (v.kw ? ' (keyword ' + plain_(v.kw) + ')' : '') : (v.kw ? 'Keyword: ' + plain_(v.kw) : null), '',
        'Home: ' + (plain_(v.h) || 'Not given'), v.p ? 'Price: ' + plain_(v.p) : null, v.b ? 'Size: ' + plain_(v.b) : null,
        v.l ? 'About it: ' + plain_(v.l) : null, v.r ? 'MLS# or plan: ' + plain_(v.r) : null, v.link ? 'Link: ' + v.link : null,
        v.c ? 'Client code in their link: ' + plain_(v.c) : null,
        v.steps.length ? '' : null, v.steps.length ? 'What they did on your website so far:' : null].concat(v.steps.length ? v.steps : [],
        SETTINGS.visitSummaries ? ['', 'You\'ll get a summary of everything they look at once they stop browsing.'] : []));
    return true;
  }
  notify_(['lead', plain_(v.email), v.h].join('|'),
    'Lead: ' + plain_(v.name) + ' wants details on ' + (plain_(v.h) || 'a home'),
    [plain_(v.name) + ' asked for the full details on a home from your website.', '',
      'Name: ' + plain_(v.name), 'Phone: ' + plain_(v.phone), 'Email: ' + plain_(v.email),
      v.note ? 'Note: ' + plain_(v.note) : null, '',
      'Home: ' + (plain_(v.h) || 'Not given'), v.p ? 'Price: ' + plain_(v.p) : null, v.b ? 'Size: ' + plain_(v.b) : null,
      v.l ? 'Loan: ' + plain_(v.l) : null, v.r ? 'MLS# or plan: ' + plain_(v.r) : null, v.link ? 'Link: ' + v.link : null,
      v.pg ? 'From your page: ' + plain_(v.pg) : null, v.c ? 'Client code in their link: ' + plain_(v.c) : null]);
  return true;
}

function submitSignup(d) {
  const f = (k, n) => clip_(d && d[k], n);
  const v = {
    name: f('name', 80), email: f('email', 120), phone: f('phone', 30), wants: f('wants', 160), areas: f('areas', 200),
    price: f('price', 20), pay: f('pay', 20), beds: f('beds', 10), baths: f('baths', 10), size: f('size', 20), lot: f('lot', 20),
    mls: d && d.mls === 'yes' ? 'Yes' : 'No', when: f('when', 40), saved: f('saved', 600), notes: f('notes', 600), c: f('c', 60)
  };
  if (!v.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(plain_(v.email))) throw new Error('Missing name or email');
  const s = sheet_('Sign-ups');
  if (s) s.appendRow([new Date(), v.name, v.phone, v.email, v.wants, v.areas, v.price, v.pay, v.beds, v.baths, v.size, v.lot, v.mls, v.when, v.saved, v.notes, v.c]);
  notify_(['join', plain_(v.email)].join('|'),
    'Sign-up: ' + plain_(v.name) + (v.mls === 'Yes' ? ' wants a custom MLS page' : ' wants homes by email'),
    [plain_(v.name) + ' signed up for homes by email on your website.', '',
      'Name: ' + plain_(v.name), 'Email: ' + plain_(v.email), v.phone ? 'Phone: ' + plain_(v.phone) : null, '',
      'Custom MLS page: ' + v.mls, v.wants ? 'Looking for: ' + plain_(v.wants) : null, v.areas ? 'Areas: ' + plain_(v.areas) : null,
      v.price ? 'Max price: ' + plain_(v.price) : null, v.pay ? 'Max monthly: ' + plain_(v.pay) : null,
      [v.beds && 'Beds ' + plain_(v.beds), v.baths && 'Baths ' + plain_(v.baths), v.size && 'Size ' + plain_(v.size), v.lot && 'Lot ' + plain_(v.lot)].filter(Boolean).join(' · ') || null,
      v.when ? 'Timeline: ' + plain_(v.when) : null, v.saved ? 'Homes they saved: ' + plain_(v.saved) : null,
      v.notes ? 'Notes: ' + plain_(v.notes) : null, v.c ? 'Client code in their link: ' + plain_(v.c) : null]);
  return true;
}

/** Logs which option a visitor opened after getting details (sheet only, no email). */
function logOption(d) {
  try {
    const s = sheet_('Clicks');
    const who = clip_(d && d.name, 80) || clip_(d && d.c, 60) || 'Visitor';
    if (s) s.appendRow([new Date(), who, clip_(d && d.h, 140), clip_(d && d.s, 60), '', '', '', clip_(d && d.pg, 60), safeLink_(d && d.u)]);
  } catch (err) { console.error(err); }
  return true;
}

/** Sends a sample lead so you can check the email and the sheet. */
function sendTestLead() {
  submitLead({ name: 'Test Buyer', phone: '209-555-0100', email: 'test@example.com', note: 'Testing the tracker',
    h: '1234 Sample St, Stockton', p: '$450,000', b: '3 bd · 2 ba · 1,500 sq ft', l: 'FHA 3.25% assumable', pg: 'Test',
    z: 'https://www.zillow.com/stockton-ca/' });
}

/* ---------- Helpers ---------- */

function notify_(key, subject, lines) {
  try {
    const cache = CacheService.getScriptCache();
    const k = 'n' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, key));
    if (cache.get(k)) return;
    if (MailApp.getRemainingDailyQuota() < 2) return;
    cache.put(k, '1', Math.max(60, SETTINGS.quietMinutes * 60));
    const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    const body = lines.filter((l) => l !== null)
      .concat(['', 'When: ' + Utilities.formatDate(new Date(), SETTINGS.timeZone, 'EEE MMM d, h:mm a'),
        id ? 'Your activity sheet: https://docs.google.com/spreadsheets/d/' + id + '/edit' : ''])
      .join('\n');
    MailApp.sendEmail(SETTINGS.notifyEmail, subject.slice(0, 180), body);
  } catch (err) {
    console.error('Could not send the email: ' + err);
  }
}

function shell_(inner) {
  const css =
    'body{margin:0;background:#F3F6F8;color:#13222D;font:16px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}' +
    'main{max-width:560px;margin:0 auto;padding:28px 18px 40px}' +
    '.who{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:#55687A;font-size:14px;margin:0 0 22px;border-bottom:1px solid #D4DEE6;padding-bottom:12px}' +
    '.who b{color:#13222D}.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:12px;color:#9A5400;margin:0 0 4px}' +
    'h1{font-size:26px;line-height:1.15;margin:0 0 6px}.meta{color:#55687A;margin:0 0 18px}' +
    '.card{background:#fff;border:1px solid #D4DEE6;border-radius:14px;padding:16px;margin:14px 0}' +
    '.lead{margin:0 0 12px}.lbl{display:block;font-weight:600;font-size:14px;margin:10px 0 4px}' +
    'input[type=text],input[type=tel],input[type=email],textarea{width:100%;box-sizing:border-box;font:inherit;padding:10px 12px;border:1.5px solid #D4DEE6;border-radius:10px;background:#fff;color:#13222D}' +
    'input:focus,textarea:focus{outline:3px solid #F2A33A;border-color:#F2A33A}' +
    '.check{display:flex;gap:8px;align-items:flex-start;margin:12px 0;font-weight:600}' +
    '.btn{display:inline-block;background:#F2A33A;color:#2A1600;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:999px;border:0;font-size:16px;cursor:pointer;margin-top:8px}' +
    '.btn[disabled]{opacity:.6}.link{background:none;border:0;color:#145F8F;text-decoration:underline;cursor:pointer;font:inherit;margin-left:12px}' +
    '.fine{color:#55687A;font-size:12.5px;margin:12px 0 0}.err{color:#B5401A;font-weight:600;min-height:1.2em}.ok{color:#1D7444;font-weight:700}' +
    '.opts{display:grid;gap:10px;margin-top:10px}.opt{display:block;text-align:center;padding:13px 16px;border-radius:12px;border:1.5px solid #D4DEE6;background:#fff;color:#13222D;font-weight:700;text-decoration:none}' +
    '.opt.main{background:#0F2E44;border-color:#0F2E44;color:#fff}' +
    '.sum{list-style:none;padding:0;margin:0 0 6px}.sum li{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #D4DEE6;padding:6px 0;font-size:14px}.sum li span{color:#55687A}';
  return '<!doctype html><html><head><meta charset="utf-8"><base target="_top"><style>' + css + '</style></head><body><main>' +
    '<div class="who"><span><b>' + esc_(SETTINGS.agentName) + '</b> · ' + esc_(SETTINGS.agentLine) + '</span><span>' + esc_(SETTINGS.agentPhone) + '</span></div>' +
    inner + '</main></body></html>';
}

function field_(id, label, type, auto) {
  return '<label class="lbl" for="' + id + '">' + esc_(label) + '</label><input id="' + id + '" type="' + type + '" autocomplete="' + auto + '"' + (type === 'tel' ? ' inputmode="tel"' : '') + '>';
}

function safeLink_(u) {
  const s = String(u || '').trim();
  if (!/^https:\/\/[^\s]+$/i.test(s)) return '';
  const host = hostOf_(s);
  const ok = host && SETTINGS.allowedSites.some((site) => host === site || host.endsWith('.' + site));
  return ok ? s : '';
}
function hostOf_(u) { const m = String(u).match(/^https:\/\/([^\/?#:]+)/i); return m ? m[1].toLowerCase() : ''; }
function siteName_(link) { return hostOf_(link).replace(/^www\./, ''); }
function plain_(s) { return String(s || '').replace(/^'/, ''); }
function esc_(s) {
  return plain_(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function js_(v) { return JSON.stringify(v).replace(/</g, '\\u003c').split(String.fromCharCode(8232)).join(' ').split(String.fromCharCode(8233)).join(' '); }

/** Trims a value and stops the sheet from reading it as a formula. */
function clip_(v, n) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
