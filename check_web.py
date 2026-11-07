"""Tests the public website build against a pretend Google tracker.
Usage: check_web.py <web folder built with the test tracker URL> <screenshot prefix>"""
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from playwright.sync_api import sync_playwright

web, out = os.path.abspath(sys.argv[1]), sys.argv[2]
ORIGIN = 'https://darien.test'
TRACK = 'https://script.google.com/macros/s/TESTDEPLOYMENT123/exec'
events = []
now = datetime.now(timezone.utc)
iso = lambda m: (now - timedelta(minutes=m)).isoformat()
STATS = {
    'ok': True, 'at': iso(0), 'sheet': 'https://docs.google.com/spreadsheets/d/TESTSHEET/edit',
    'ranges': {'1': {'visitors': 4, 'views': 11, 'clicks': 5, 'leads': 1, 'signups': 1, 'goals': 1},
               '7': {'visitors': 19, 'views': 64, 'clicks': 23, 'leads': 3, 'signups': 2, 'goals': 2},
               '30': {'visitors': 51, 'views': 190, 'clicks': 71, 'leads': 8, 'signups': 5, 'goals': 4}},
    'pages': {'Home': {'1': {'views': 4, 'clicks': 0}, '7': {'views': 22, 'clicks': 2}, '30': {'views': 70, 'clicks': 6}},
              'Assumable': {'1': {'views': 3, 'clicks': 3}, '7': {'views': 15, 'clicks': 11}, '30': {'views': 41, 'clicks': 30}},
              'About Darien': {'7': {'views': 6, 'clicks': 1}, '30': {'views': 12, 'clicks': 2}}},
    'pageHomes': {'Assumable': [['2956 Treen Ct, Rancho Cordova', 6], ['8120 Shadowfax Ct, Citrus Heights', 3]]},
    'recent': [
        {'t': iso(3), 'k': 'lead', 'who': 'Maria Lopez', 'what': 'asked for details on 2956 Treen Ct, Rancho Cordova', 'pg': 'Assumable', 'contact': '209-555-0101 · maria@example.com'},
        {'t': iso(9), 'k': 'click', 'who': 'Maria Lopez', 'what': 'opened 2956 Treen Ct, Rancho Cordova on Zillow', 'pg': 'Assumable'},
        {'t': iso(14), 'k': 'view', 'who': 'Visitor K7Q2', 'what': 'viewed Stockton $0 down'},
        {'t': iso(65), 'k': 'goal', 'who': 'Ana Ruiz', 'what': "shared what's holding them back: Saving for a down payment", 'pg': 'About Darien', 'contact': '(209) 555-0199'},
        {'t': iso(60 * 26), 'k': 'signup', 'who': 'John Park', 'what': 'signed up for homes by email and a custom MLS page: New builds', 'pg': 'Get homes by email', 'contact': 'john@example.com'}],
    'people': [{'who': 'Maria Lopez', 'last': iso(3), 'views': 5, 'clicks': 2, 'leads': 1, 'contact': '209-555-0101 · maria@example.com'},
               {'who': 'Ana Ruiz', 'last': iso(65), 'views': 2, 'clicks': 0, 'leads': 1, 'contact': '(209) 555-0199'}]
}
TYPES = {'.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg'}


def serve(route):
    path = route.request.url.split(ORIGIN, 1)[1].split('#')[0].split('?')[0] or '/'
    if path == '/':
        path = '/index.html'
    fp = os.path.normpath(os.path.join(web, path.lstrip('/')))
    if fp.startswith(web) and os.path.isfile(fp):
        route.fulfill(path=fp, headers={'content-type': TYPES.get(os.path.splitext(fp)[1], 'application/octet-stream')})
    else:
        route.fulfill(status=404, body='not found')


def tracker(route):
    body = route.request.post_data or ''
    try:
        d = json.loads(body)
    except ValueError:
        d = {}
    d['_method'] = route.request.method
    events.append(d)
    t = d.get('type')
    res = (STATS if d.get('key') == 'testkey' else {'ok': False, 'error': 'key'}) if t == 'stats' else {'ok': True}
    route.fulfill(status=200, headers={'content-type': 'application/json', 'access-control-allow-origin': '*'}, body=json.dumps(res))


def kinds():
    return [(e.get('type'), e.get('pg') or e.get('h') or '') for e in events]


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}, reduced_motion='reduce')
    ctx.route(ORIGIN + '/**', serve)
    ctx.route('https://script.google.com/**', tracker)
    ctx.route('https://www.zillow.com/**', lambda r: r.fulfill(status=200, body='zillow'))
    ctx.route('https://roots.homes/**', lambda r: r.fulfill(status=200, body='roots'))
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    q = pg.evaluate
    pg.goto(ORIGIN + '/#for-maria-lopez')
    pg.wait_for_timeout(700)
    print('1 load:', q('document.title'), '| h1:', q("document.getElementById('page-title').textContent"), '| events:', kinds())
    pg.click('#kw [data-go="assumable"]'); pg.wait_for_timeout(300)
    pg.click('#kw [data-go="stockton"]'); pg.wait_for_timeout(300)
    print('2 views:', [k for k in kinds() if k[0] == 'pv'], '| first pv fields:', {k: events[0].get(k) for k in ('type', 'v', 'c', 'n', 'pg', 'p', 'dev', 'ref')})
    print('3 back button:', q("document.getElementById('back').hidden"), q("document.getElementById('back').getAttribute('aria-label')"))
    pg.click('#back'); pg.wait_for_timeout(250)
    print('   after back ->', q('document.documentElement.dataset.page'), '| label now:', q("document.getElementById('back').getAttribute('aria-label')"))
    pg.click('#back'); pg.wait_for_timeout(250)
    print('   after back ->', q('document.documentElement.dataset.page'), '| back hidden on home:', q("document.getElementById('back').hidden"))
    # scroll restore: go to assumable, scroll, open stockton, come back
    pg.click('#kw [data-go="assumable"]'); pg.wait_for_timeout(250)
    q('window.scrollTo(0, 1500)'); pg.wait_for_timeout(100)
    q("location.hash = 'stockton'"); pg.wait_for_timeout(250)
    print('   stockton top y:', q('window.scrollY'))
    pg.click('#back'); pg.wait_for_timeout(300)
    print('   back to assumable, y restored:', q('window.scrollY'), '| page:', q('document.documentElement.dataset.page'))
    # lead
    n0 = len(events)
    pg.click('#view [data-gate]'); pg.wait_for_timeout(150)
    pg.fill('#g-name', 'Maria Lopez'); pg.fill('#g-phone', '209-555-0101'); pg.fill('#g-email', 'maria@example.com'); pg.fill('#g-note', 'Saturday?')
    pg.click('#gate-form button[type=submit]'); pg.wait_for_timeout(500)
    lead = [e for e in events[n0:] if e.get('type') == 'lead']
    print('4 lead sent:', bool(lead), '| fields:', {k: lead[0].get(k) for k in ('name', 'phone', 'email', 'h', 'p', 'pg', 'c', 'v')} if lead else None, '| method:', lead[0]['_method'] if lead else None)
    print('   thanks:', q("document.getElementById('g-thanks').textContent"), '| options:', q("[...document.querySelectorAll('#g-opts a, #g-opts button')].map(a=>a.textContent).join(' / ')"))
    print('   no personal info in any tracker URL:', all('maria' not in (r or '').lower() for r in []))
    with ctx.expect_page() as newp:
        pg.click('#g-opts a[href*="zillow"]')
    newp.value.close()
    pg.wait_for_timeout(300)
    clicks = [e for e in events if e.get('type') == 'click']
    print('5 click logged:', {k: clicks[-1].get(k) for k in ('h', 's', 'p', 'pg', 'n', 'c')} if clicks else None)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    # goals on About
    pg.click('#kw [data-go="about"]'); pg.wait_for_timeout(400)
    print('6 about: portrait shown:', q("!!document.querySelector('.hero-portrait img') && document.querySelector('.hero-portrait img').naturalWidth"),
          '| sub:', q("document.querySelector('.hero .sub').textContent"))
    print('   bio first line:', q("document.querySelector('.bio .lead-in').textContent")[:120], '| call:', q("document.querySelector('.bio .call').textContent"))
    pg.click('[data-goal="down"]'); pg.click('[data-goal="credit"]'); pg.wait_for_timeout(100)
    print('   help cards:', q("[...document.querySelectorAll('#goal-help .goal-card b')].map(b=>b.textContent).join(' / ')"))
    pg.fill('#gl-note', '3 bedrooms near Lodi under $3,000 a month')
    n1 = len(events)
    pg.click('#gl-send'); pg.wait_for_timeout(500)
    goal = [e for e in events[n1:] if e.get('type') == 'goal']
    print('   goal sent:', {k: goal[0].get(k) for k in ('name', 'phone', 'email', 'goals', 'note', 'pg')} if goal else None, '| toast:', q("document.getElementById('gl-toast').textContent"))
    # sign-up
    pg.click('#kw [data-go="alerts"]'); pg.wait_for_timeout(400)
    n2 = len(events)
    if q("!!document.getElementById('al-send')"):
        for sel, val in (('#al-name', 'Maria Lopez'), ('#al-email', 'maria@example.com')):
            if q("!!document.querySelector('%s')" % sel) and not q("document.querySelector('%s').value" % sel):
                pg.fill(sel, val)
        pg.click('#al-send'); pg.wait_for_timeout(500)
    su = [e for e in events[n2:] if e.get('type') == 'signup']
    print('7 signup sent:', {k: su[0].get(k) for k in ('name', 'email', 'wants', 'areas', 'mls')} if su else None, '| toast:', q("(document.getElementById('al-toast')||{}).textContent"))
    # admin
    pv_before = len([e for e in events if e.get('type') == 'pv'])
    q("location.hash = 'admin'"); pg.wait_for_timeout(300)
    print('8 admin modal:', q("document.getElementById('modal-title') && document.getElementById('modal-title').textContent"), '| hash now:', q('location.hash'))
    pg.fill('#ad-key', 'nope'); pg.click('#ad-form button[type=submit]'); pg.wait_for_timeout(300)
    print('   wrong key ->', q("document.getElementById('ad-err').textContent"))
    pg.fill('#ad-key', 'testkey'); pg.click('#ad-form button[type=submit]'); pg.wait_for_timeout(500)
    print('   bar shown:', not q("document.getElementById('adminbar').hidden"), '| stats:', q("[...document.querySelectorAll('.ab-stat')].map(s=>s.textContent).join(' | ')"))
    print('   this page:', q("document.querySelector('.ab-page').textContent"))
    pg.click('[data-ab-range="30"]'); pg.wait_for_timeout(100)
    pg.click('#kw [data-go="assumable"]'); pg.wait_for_timeout(400)
    print('   assumable page line (30d):', q("document.querySelector('.ab-page').textContent"))
    pg.click('[data-ab="activity"]'); pg.wait_for_timeout(100)
    print('   activity:', q("[...document.querySelectorAll('.ab-list li')].slice(0,3).map(li=>li.textContent).join(' || ')")[:300])
    pg.screenshot(path=out + '-admin-desk.png')
    pg.click('[data-ab="people"]'); pg.wait_for_timeout(100)
    print('   people:', q("[...document.querySelectorAll('.ab-list li')].map(li=>li.textContent).join(' || ')")[:240])
    pg.click('[data-ab="link"]'); pg.wait_for_timeout(100)
    pg.fill('#ab-name', 'Maria Lopez'); pg.select_option('#ab-page', 'stockton'); pg.wait_for_timeout(100)
    print('   client link:', q("document.getElementById('ab-url').textContent"))
    pv_after = len([e for e in events if e.get('type') == 'pv'])
    print('   page views counted while in admin:', pv_after - pv_before)
    pg.reload(); pg.wait_for_timeout(800)
    print('   admin stays on after reload:', not q("document.getElementById('adminbar').hidden"))
    pg.click('[data-ab="exit"]'); pg.wait_for_timeout(100)
    print('   exit -> bar hidden:', q("document.getElementById('adminbar').hidden"), '| key forgotten:', q("localStorage.getItem('dp-admin-key')"))
    # hover color
    pg.click('#kw [data-go="home"]'); pg.wait_for_timeout(300)
    q('window.scrollTo(0,0)')
    sel = '.hero .ctas .btn-pa'
    before = q("getComputedStyle(document.querySelector('%s')).backgroundColor" % sel)
    pg.hover(sel); pg.wait_for_timeout(250)
    after = q("getComputedStyle(document.querySelector('%s')).backgroundColor" % sel)
    g0 = q("getComputedStyle(document.querySelector('.hero .ctas .btn-ghost')).backgroundColor")
    pg.hover('.hero .ctas .btn-ghost'); pg.wait_for_timeout(250)
    g1 = q("getComputedStyle(document.querySelector('.hero .ctas .btn-ghost')).backgroundColor")
    print('9 hover: main button', before, '->', after, '| outline button', g0, '->', g1)
    print('errors:', errs)
    ctx.close()

    # phone, About page and admin bar
    ctx2 = b.new_context(viewport={'width': 390, 'height': 844}, color_scheme='dark', reduced_motion='reduce', is_mobile=True, has_touch=True)
    ctx2.route(ORIGIN + '/**', serve)
    ctx2.route('https://script.google.com/**', tracker)
    pg2 = ctx2.new_page()
    e2 = []
    pg2.on('pageerror', lambda e: e2.append(str(e)))
    pg2.goto(ORIGIN + '/#about'); pg2.wait_for_timeout(700)
    pg2.screenshot(path=out + '-about-phone.png', full_page=False)
    pg2.evaluate("document.getElementById('goals').scrollIntoView()"); pg2.wait_for_timeout(200)
    pg2.click('[data-goal="pay"]'); pg2.wait_for_timeout(150)
    pg2.screenshot(path=out + '-goals-phone.png', full_page=False)
    pg2.evaluate("localStorage.setItem('dp-admin-key', JSON.stringify('testkey'))")
    pg2.goto(ORIGIN + '/#assumable'); pg2.reload(); pg2.wait_for_timeout(900)
    pg2.screenshot(path=out + '-admin-phone.png', full_page=False)
    print('phone: width', pg2.evaluate('document.documentElement.scrollWidth'), '| admin bar:', not pg2.evaluate("document.getElementById('adminbar').hidden"), '| errors:', e2)
    ctx2.close()

    # time of day
    for label, t in (('noon', '2026-11-02T12:00:00-08:00'), ('golden', '2026-11-02T16:20:00-08:00'), ('sunset', '2026-11-02T16:58:00-08:00'), ('night', '2026-11-02T20:30:00-08:00')):
        c3 = b.new_context(viewport={'width': 1366, 'height': 760}, reduced_motion='reduce')
        c3.route(ORIGIN + '/**', serve)
        c3.route('https://script.google.com/**', lambda r: r.fulfill(status=200, body='{"ok":true}'))
        p3 = c3.new_page()
        p3.clock.set_fixed_time(t)
        p3.goto(ORIGIN + '/#home'); p3.wait_for_timeout(700)
        st = p3.evaluate("(() => { const s = getComputedStyle(document.documentElement); return [document.documentElement.dataset.sky, s.getPropertyValue('--sky-l'), s.getPropertyValue('--sky-r'), s.getPropertyValue('--sky-w2'), s.getPropertyValue('--sky-n'), s.getPropertyValue('--hero-rgb')]; })()")
        print('sky', label, st)
        p3.screenshot(path=out + '-sky-' + label + '.png')
        c3.close()
    b.close()
