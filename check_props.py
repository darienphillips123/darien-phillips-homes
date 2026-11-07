"""Tests home pages for social links: /p/<home> links, the sign-in step, keyword search, listings from the sheet.
Usage: check_props.py <web folder built with the test tracker URL> <screenshot prefix>"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

web, out = os.path.abspath(sys.argv[1]), sys.argv[2]
ORIGIN = 'https://darien.test'
events = []
LISTINGS = {'ok': True, 'listings': [
    {'keyword': 'ENCINO', 'home': '8160 Encino Ave', 'headline': 'Country living in town with a 3% loan'},
    {'keyword': 'Oakview', 'address': '4471 Oak View Ln', 'city': 'Loomis', 'price': '$899,000', 'beds': '4', 'baths': '3', 'sqft': '2,640',
     'headline': 'Just listed: 4 bedrooms on half an acre', 'about': 'Single-story with a pool and a 3-car garage.', 'photo': '', 'link': 'https://www.zillow.com/homes/x_rb/'}]}


def serve(route):
    path = route.request.url.split(ORIGIN, 1)[1].split('#')[0].split('?')[0] or '/'
    if path == '/' or path.startswith('/p/'):  # what Netlify's _redirects rule does
        path = '/index.html'
    fp = os.path.normpath(os.path.join(web, path.lstrip('/')))
    if fp.startswith(web) and os.path.isfile(fp):
        route.fulfill(path=fp, headers={'content-type': 'text/html; charset=utf-8' if fp.endswith('.html') else 'image/jpeg'})
    else:
        route.fulfill(status=404, body='not found')


def tracker(route):
    req = route.request
    if req.method == 'GET':
        body = LISTINGS if 'mode=listings' in req.url else {'ok': True}
    else:
        try:
            d = json.loads(req.post_data or '{}')
        except ValueError:
            d = {}
        events.append(d)
        body = {'ok': True}
    route.fulfill(status=200, headers={'content-type': 'application/json', 'access-control-allow-origin': '*'}, body=json.dumps(body))


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}, reduced_motion='reduce')
    ctx.route(ORIGIN + '/**', serve)
    ctx.route('https://script.google.com/**', tracker)
    ctx.route('https://www.zillow.com/**', lambda r: r.fulfill(status=200, body='zillow'))
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    q = pg.evaluate
    T = lambda: q("document.getElementById('page-title').textContent")
    pg.goto(ORIGIN + '/p/encino?from=instagram'); pg.wait_for_timeout(900)
    print('1 landed:', q('location.pathname + location.search + location.hash'), '| page:', q('document.documentElement.dataset.page'), '| h1:', T())
    print('  address hidden before sign-in:', 'Encino' not in q("document.querySelector('main').innerText"), '| form:', q("!!document.getElementById('pf-form')"),
          '| sub:', q("document.querySelector('.hero .sub').textContent"))
    pv = [e for e in events if e.get('type') == 'pv']
    print('  view logged:', {k: pv[0].get(k) for k in ('pg', 'key', 'locked', 'src', 'v')} if pv else None)
    pg.screenshot(path=out + '-locked-desk.png')
    pg.click('#pf-go'); pg.wait_for_timeout(100)
    print('2 empty submit:', q("document.getElementById('pf-err').textContent"))
    pg.fill('#pf-name', 'Maria Lopez'); pg.fill('#pf-phone', '209-555-0101'); pg.fill('#pf-email', 'maria@example.com')
    n0 = len(events)
    pg.click('#pf-go'); pg.wait_for_timeout(600)
    lead = [e for e in events[n0:] if e.get('type') == 'lead']
    if lead:
        L = lead[0]
        print('  sign-in sent:', {k: L.get(k) for k in ('how', 'name', 'phone', 'email', 'h', 'p', 'key', 'kw', 'src', 'pg', 'landed')})
        print('  steps:', ' || '.join(L.get('steps') or []))
    else:
        print('  sign-in NOT sent')
    print('  unlocked h1:', T(), '| toast:', q("(document.querySelector('.prop-side .toast')||{}).textContent"), '| options:', q("[...document.querySelectorAll('.prop-side .optlist a')].map(a=>a.textContent).join(' / ')"))
    pg.screenshot(path=out + '-unlocked-desk.png')
    with ctx.expect_page() as newp:
        pg.click('.prop-side .optlist a[href*="zillow"]')
    newp.value.close(); pg.wait_for_timeout(300)
    c = [e for e in events if e.get('type') == 'click']
    print('3 Zillow click logged:', {k: c[-1].get(k) for k in ('h', 's', 'pg', 'n')} if c else None)
    # keyword from the sheet, while signed in
    pg.fill('#q', 'oakview'); pg.wait_for_timeout(150)
    print('4 search oakview:', q("[...document.querySelectorAll('#q-sugg button')].slice(0,3).map(b=>b.textContent).join(' / ')"))
    pg.press('#q', 'Enter'); pg.wait_for_timeout(400)
    print('  ->', q('location.hash'), '| h1:', T(), '| unlocked:', q("!!document.querySelector('.prop-card')"), '| listing card:', q("(document.querySelector('.prop-card h3')||{}).textContent"))
    print('  back label:', q("document.getElementById('back').getAttribute('aria-label')"))
    pg.click('#back'); pg.wait_for_timeout(300)
    print('  after Back:', q('location.hash'), T())
    # sign out, then search a keyword: still asks to sign in
    pg.click('#pf-switch'); pg.wait_for_timeout(300)
    print('5 switched user -> form shown:', q("!!document.getElementById('pf-form')"), '| h1:', T())
    q("location.hash = 'home'"); pg.wait_for_timeout(300)
    pg.fill('#q', 'encino'); pg.wait_for_timeout(150)
    print('  search encino:', q("[...document.querySelectorAll('#q-sugg button')].slice(0,2).map(b=>b.textContent).join(' / ')"))
    pg.press('#q', 'Enter'); pg.wait_for_timeout(400)
    print('  ->', q('location.hash'), '| asks to sign in:', q("!!document.getElementById('pf-form')"), '| h1:', T())
    # community and plan pages, ambiguous and unknown links
    q("location.hash = 'p/bridgeway-at-river-islands'"); pg.wait_for_timeout(300)
    print('6 community:', T(), '|', q("document.querySelector('.hero .t2').textContent"), '| form:', q("!!document.getElementById('pf-form')"))
    q("location.hash = 'p/lodi'"); pg.wait_for_timeout(300)
    print('  /p/lodi:', T(), '|', q("document.querySelectorAll('#view .card.teaser').length"), 'choices')
    q("location.hash = 'p/zzqqxx'"); pg.wait_for_timeout(300)
    print('  /p/zzqqxx:', T(), '|', q("(document.querySelector('#view h2')||{}).textContent"))
    # ManyChat links page
    q("location.hash = 'links'"); pg.wait_for_timeout(400)
    print('7 links page:', T(), '|', q("document.getElementById('lk-count').textContent")[:90], '| rows:', q("document.querySelectorAll('.linkrow').length"))
    print('  first rows:', q("[...document.querySelectorAll('.linkrow')].slice(0,3).map(r=>r.querySelector('b').textContent + ' -> ' + r.querySelector('code').textContent).join(' || ')"))
    pg.fill('#lk-q', 'treen'); pg.wait_for_timeout(150)
    print('  search treen:', q("[...document.querySelectorAll('.linkrow code')].map(c=>c.textContent).join(' | ')"))
    pg.click('[data-lsrc="facebook"]'); pg.wait_for_timeout(100)
    print('  for Facebook:', q("(document.querySelector('.linkrow code')||{}).textContent"))
    pg.screenshot(path=out + '-links-desk.png')
    print('errors:', errs)
    ctx.close()

    # phone: a fresh visitor taps the DM link
    c2 = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce', is_mobile=True, has_touch=True)
    c2.route(ORIGIN + '/**', serve)
    c2.route('https://script.google.com/**', tracker)
    p2 = c2.new_page()
    e2 = []
    p2.on('pageerror', lambda e: e2.append(str(e)))
    p2.goto(ORIGIN + '/p/oakview?from=instagram'); p2.wait_for_timeout(1200)
    print('phone: h1', p2.evaluate("document.getElementById('page-title').textContent"), '| width', p2.evaluate('document.documentElement.scrollWidth'), '| errors', e2)
    p2.screenshot(path=out + '-locked-phone.png', full_page=True)
    c2.close()
    b.close()
