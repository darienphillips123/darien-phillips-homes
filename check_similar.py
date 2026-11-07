"""Tests the similar-homes sections, Similar homes buttons and the reach-out section. Usage: check_similar.py <web folder> <shot prefix>"""
import json, os, sys
from playwright.sync_api import sync_playwright
web, out = os.path.abspath(sys.argv[1]), sys.argv[2]
ORIGIN = 'https://darien.test'
def serve(route):
    path = route.request.url.split(ORIGIN, 1)[1].split('#')[0].split('?')[0] or '/'
    if path == '/' or path.startswith('/p/'):
        path = '/index.html'
    fp = os.path.join(web, path.lstrip('/'))
    route.fulfill(path=fp, headers={'content-type': 'text/html; charset=utf-8' if fp.endswith('.html') else 'image/jpeg'}) if os.path.isfile(fp) else route.fulfill(status=404, body='')
def tracker(route):
    body = {'ok': True, 'listings': []} if route.request.method == 'GET' else {'ok': True}
    route.fulfill(status=200, headers={'content-type': 'application/json', 'access-control-allow-origin': '*'}, body=json.dumps(body))
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}, reduced_motion='reduce')
    ctx.route(ORIGIN + '/**', serve); ctx.route('https://script.google.com/**', tracker)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    q = pg.evaluate
    pg.goto(ORIGIN + '/p/8160-encino-ave'); pg.wait_for_timeout(800)
    print('1 similar section:', q("(document.querySelector('#similar h2')||{}).textContent"), '|', q("(document.querySelector('#similar .shead p:not(.mono)')||{}).textContent"))
    print('  cards:', q("document.querySelectorAll('#sim-list .card').length"), '| more button shown:', q("!document.getElementById('sim-more').hidden"),
          '| first 3:', q("[...document.querySelectorAll('#sim-list .card')].slice(0,3).map(c=>c.querySelector('h3').textContent + ' ' + c.querySelector('.price').textContent).join(' || ')"))
    print('  nearby other kind:', q("[...document.querySelectorAll('#similar .cards')][1] ? [...[...document.querySelectorAll('#similar .cards')][1].querySelectorAll('h3')].map(h=>h.textContent).join(' / ') : 'none'"))
    print('  reach out:', q("(document.querySelector('.reach h2')||{}).textContent"), '|', q("[...document.querySelectorAll('.reach-acts a, .reach-acts button')].map(a=>a.textContent).join(' / ')"))
    print('  hero buttons:', q("[...document.querySelectorAll('.hero .ctas .btn')].map(a=>a.textContent).join(' / ')"))
    pg.click('.hero .ctas [data-jump="similar"]'); pg.wait_for_timeout(400)
    print('2 hero Similar homes -> similar section top at', q("Math.round(document.getElementById('similar').getBoundingClientRect().top)"), 'px')
    pg.click('#sim-more'); pg.wait_for_timeout(200)
    print('  after Show more:', q("document.querySelectorAll('#sim-list .card').length"), 'cards')
    pg.mouse.move(600, 500)
    for _ in range(14):
        pg.mouse.wheel(0, 250); pg.wait_for_timeout(120)
    pg.wait_for_timeout(400)
    print('  after scrolling to the end of the list with the mouse wheel:', q("document.querySelectorAll('#sim-list .card').length"), 'cards | button hidden:', q("document.getElementById('sim-more').hidden"))
    pg.screenshot(path=out + '-similar-desk.png')
    # Get homes like this by email
    pg.click('[data-like]'); pg.wait_for_timeout(400)
    print('3 homes like this ->', q('location.hash'), '| towns:', q("document.getElementById('al-towns').value"), '| price:', q("document.getElementById('al-price').value"),
          '| beds:', q("document.getElementById('al-beds').value"), '| wants:', q("[...document.querySelectorAll('input[name=want]:checked')].map(c=>c.value).join(', ')"),
          '| note:', q("(document.querySelector('#view .toast, #view .flash, #view [role=status]')||{}).textContent")[:120] if q("!!document.querySelector('#view .toast, #view .flash, #view [role=status]')") else '')
    # Similar homes on a list card
    q("location.hash = 'stockton'"); pg.wait_for_timeout(400)
    print('4 stockton card buttons:', q("[...document.querySelector('#sk-list .card .actions').querySelectorAll('button')].map(b=>b.textContent).join(' / ')"))
    pg.click('#sk-list .card [data-similar]'); pg.wait_for_timeout(600)
    print('  ->', q('location.hash'), '| similar section in view:', q("(() => { const r = document.getElementById('similar').getBoundingClientRect(); return r.top >= -5 && r.top < 200; })()"),
          '| h2:', q("document.querySelector('#similar h2').textContent"))
    q("location.hash = 'new-builds'"); pg.wait_for_timeout(400)
    pg.click('#view .card [data-similar]'); pg.wait_for_timeout(600)
    print('5 community ->', q('location.hash'), '|', q("document.querySelector('#similar h2').textContent"), '|', q("document.querySelectorAll('#sim-list .card').length"), 'similar communities | nearby homes:',
          q("[...document.querySelectorAll('#similar .cards')].length > 1"))
    q("location.hash = 'assumable'"); pg.wait_for_timeout(400)
    print('6 assumable card buttons:', q("[...document.querySelector('#as-list .card .actions').querySelectorAll('button')].map(b=>b.textContent).join(' / ')"))
    print('errors:', errs)
    ctx.close()
    c2 = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce', is_mobile=True, has_touch=True)
    c2.route(ORIGIN + '/**', serve); c2.route('https://script.google.com/**', tracker)
    p2 = c2.new_page(); e2 = []
    p2.on('pageerror', lambda e: e2.append(str(e)))
    p2.goto(ORIGIN + '/p/8160-encino-ave'); p2.wait_for_timeout(900)
    p2.evaluate("document.getElementById('similar').scrollIntoView()"); p2.wait_for_timeout(300)
    p2.screenshot(path=out + '-similar-phone.png')
    p2.evaluate("document.querySelector('.reach').scrollIntoView({block:'center'})"); p2.wait_for_timeout(300)
    p2.screenshot(path=out + '-reach-phone.png')
    print('phone width:', p2.evaluate('document.documentElement.scrollWidth'), '| errors:', e2)
    b.close()
