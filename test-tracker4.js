// Tests the version 4 tracker with stand-ins for Google's services.
const fs = require('fs'), vm = require('vm'), crypto = require('crypto');
const sheets = {}, mails = [], cache = {}, props = {}, triggers = [];
let NOW = Date.parse('2026-11-02T21:00:00Z');
function mkSheet(name) {
  const fmt = { setFontWeight() { return this; }, setNumberFormat() { return this; }, setFormula() { return this; }, setNote() { return this; } };
  const s = { name, rows: [], appendRow(r) { this.rows.push(r.map((v) => v)); return this; }, getLastRow() { return this.rows.length; },
    setName(n) { delete sheets[this.name]; this.name = n; sheets[n] = this; return this; }, setFrozenRows() { return this; },
    getRange(a, b, c, d) {
      if (typeof a !== 'number') return fmt;
      const rows = this.rows;
      const vals = () => rows.slice(a - 1, a - 1 + c).map((r) => { const o = r.slice(b - 1, b - 1 + d); while (o.length < d) o.push(''); return o; });
      return Object.assign({ getValues: vals, getDisplayValues: () => vals().map((r) => r.map((v) => (v instanceof Date ? v.toISOString() : String(v)))) }, fmt);
    } };
  sheets[name] = s; return s;
}
mkSheet('Sheet1');
const book = { getId: () => 'SHEET1', getUrl: () => 'https://docs.google.com/spreadsheets/d/SHEET1/edit', getSheets: () => Object.values(sheets), insertSheet: (n) => mkSheet(n), getSheetByName: (n) => sheets[n] || null };
class FakeDate extends Date { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }
const ctx = { console, Date: FakeDate, JSON, Math, String, Number, Array, Object, RegExp,
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; }, getProperties: () => Object.assign({}, props), deleteProperty: (k) => { delete props[k]; } }) },
  SpreadsheetApp: { create: () => book, openById: () => book },
  MailApp: { sendEmail: (to, subj, body) => mails.push({ to, subj, body }), getRemainingDailyQuota: () => 90 },
  CacheService: { getScriptCache: () => ({ get: (k) => cache[k] || null, put: (k, v) => { cache[k] = v; } }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  ScriptApp: { getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TEST/exec' }), getProjectTriggers: () => triggers,
    newTrigger: (fn) => ({ timeBased: () => ({ everyMinutes: (m) => ({ create: () => { triggers.push({ getHandlerFunction: () => fn, m }); } }) }) }) },
  Utilities: { DigestAlgorithm: { MD5: 'md5' }, computeDigest: (a, s) => [...crypto.createHash('md5').update(s).digest()], base64EncodeWebSafe: (b) => Buffer.from(b).toString('base64url'),
    formatDate: (d, tz, f) => { const p = new Date(d.getTime() - 8 * 3600e3).toISOString(); return f === 'yyyy-MM-dd' ? p.slice(0, 10) : f === 'h:mm a' ? p.slice(11, 16) : p; }, getUuid: () => crypto.randomUUID() },
  HtmlService: { createHtmlOutput: (h) => ({ html: h, setTitle(t) { this.title = t; return this; }, addMetaTag() { return this; } }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ text: s, setMimeType() { return this; } }) } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('Darien-Website-Tracker.gs', 'utf8'), ctx);
ctx.setup();
console.log('sheets:', Object.keys(sheets).join(', '), '| trigger:', triggers.map((t) => t.getHandlerFunction() + '/' + t.m + 'min').join(','), '| setup mail mentions Listings:', mails[0].body.includes('Listings'));
ctx.setup();
console.log('setup twice keeps one trigger:', triggers.length === 1, '| listings header:', sheets.Listings.rows[0].slice(0, 3).join(' / '));
const post = (d) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(d) } }).text);
const get = (p) => JSON.parse(ctx.doGet({ parameter: p }).text);
console.log('ping:', JSON.stringify(get({ mode: 'ping' })));
console.log('listings (example off):', JSON.stringify(get({ mode: 'listings' })));
sheets.Listings.rows[1][12] = 'Yes';
sheets.Listings.appendRow(['OAKVIEW', '', '4471 Oak View Ln', 'Loomis', '$899,000', '4', '3', '2,640', 'Just listed', 'Pool and a 3-car garage', 'javascript:alert(1)', 'https://www.zillow.com/homes/x_rb/', 'Yes']);
sheets.Listings.appendRow(['bad keyword!', '', 'x', '', '', '', '', '', '', '', '', '', 'Yes']);
delete cache.listings;
const L = get({ mode: 'listings' });
console.log('listings:', L.listings.map((x) => x.keyword + (x.home ? '->' + x.home : '') + (x.address ? ' ' + x.address : '') + ' photo=' + (x.photo || '-') + ' link=' + (x.link ? 'ok' : '-')).join(' | '));
const m0 = mails.length;
// a visitor from Instagram: preview, sign-in, more pages, a Zillow click
const V = { v: 'JX2V', src: 'instagram' };
post(Object.assign({ type: 'pv', pg: 'Home: 8160 Encino Ave, Stockton', key: 'encino', locked: 'yes', dev: 'Phone', c: '', n: '' }, V));
NOW += 60e3;
const r = post(Object.assign({ type: 'lead', how: 'signin', name: 'Maria Lopez', phone: '209-555-0101', email: 'maria@example.com', h: '8160 Encino Ave, Stockton', p: '$685,000', b: '3 bd · 2 ba',
  l: 'Country living in town with a 3% loan', key: '8160-encino-ave', kw: 'ENCINO', pg: 'Home: 8160 Encino Ave, Stockton', z: 'https://www.zillow.com/homes/x_rb/',
  steps: ['1:05 PM  Arrived from Instagram (link to /p/encino)', '1:05 PM  Viewed Home: 8160 Encino Ave, Stockton (preview, before signing in)', '1:06 PM  Signed in to see 8160 Encino Ave, Stockton'] }, V));
console.log('sign-in:', JSON.stringify(r), '| email subject:', mails[mails.length - 1].subj);
console.log('--- sign-in email ---\n' + mails[mails.length - 1].body + '\n---');
console.log('lead row tail:', JSON.stringify(sheets.Leads.rows[sheets.Leads.rows.length - 1].slice(12)));
NOW += 60e3; post(Object.assign({ type: 'pv', pg: 'Home: 8160 Encino Ave, Stockton', key: 'encino', n: 'Maria Lopez' }, V));
NOW += 60e3; post(Object.assign({ type: 'click', h: '8160 Encino Ave, Stockton', s: 'Zillow', p: '$685,000', pg: 'Home: 8160 Encino Ave, Stockton', u: 'https://www.zillow.com/homes/x_rb/', n: 'Maria Lopez' }, V));
NOW += 120e3; post(Object.assign({ type: 'pv', pg: 'Home: 4471 Oak View Ln, Loomis', key: 'oakview', n: 'Maria Lopez' }, V));
NOW += 60e3; post(Object.assign({ type: 'click', h: 'Texted Darien', s: 'Text', pg: 'Home: 4471 Oak View Ln, Loomis', u: '', n: 'Maria Lopez' }, V));
console.log('emails during the visit (sign-in + text tap only):', mails.slice(m0).map((m) => m.subj).join(' || '));
// an anonymous visitor: no emails
post({ type: 'pv', v: 'ANON', pg: 'Home', src: '' });
post({ type: 'click', v: 'ANON', h: '123 Main St', s: 'Zillow', u: 'https://www.zillow.com/homes/y_rb/' });
const before = mails.length;
ctx.sendVisitSummaries();
console.log('summary while still browsing:', mails.length === before ? 'none (good)' : mails[mails.length - 1].subj);
NOW += 16 * 60e3;
ctx.sendVisitSummaries();
console.log('summary after 16 quiet minutes:', mails.length - before, 'email(s)');
console.log('--- summary email ---\n' + mails[mails.length - 1].subj + '\n' + mails[mails.length - 1].body + '\n---');
const n1 = mails.length; NOW += 20 * 60e3; ctx.sendVisitSummaries();
console.log('no repeat summary:', mails.length === n1);
// client link visit still emails; a plain named visit does not
const n2 = mails.length;
post({ type: 'pv', v: 'CL01', c: 'John Park', pg: 'Assumable' });
console.log('client link visit email:', mails.length - n2 === 1 ? mails[mails.length - 1].subj : 'none');
// admin stats still work with the new columns
const st = post({ type: 'stats', key: props.ADMIN_KEY });
console.log('stats ok:', st.ok, '| today:', JSON.stringify(st.ranges['1']), '| recent kinds:', st.recent.slice(0, 5).map((e) => e.k).join(','));
console.log('formula guard in steps:', JSON.stringify(post({ type: 'lead', how: 'signin', name: 'X', phone: '2095550101', email: 'x@example.com', h: 'H', steps: ['=HYPERLINK("x")'] })), sheets.Leads.rows[sheets.Leads.rows.length - 1][16]);
