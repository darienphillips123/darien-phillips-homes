# Builds js/5g-deals.js from inputs/new-build-deals.json (rerun after updating the deals file)
import json, os
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
d = json.load(open(os.path.join(root, 'inputs', 'new-build-deals.json')))
tpl = open(os.path.join(here, '5g-deals.tpl.js')).read()
js = json.dumps(d, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
open(os.path.join(root, 'js', '5g-deals.js'), 'w').write(tpl.replace('__DEALS_JSON__', js))
print('deals js written', len(d['communities']))

a = json.load(open(os.path.join(root, 'inputs', 'adu.json')))
t2 = open(os.path.join(here, '5h-adu.tpl.js')).read()
open(os.path.join(root, 'js', '5h-adu.js'), 'w').write(t2.replace('__ADU_JSON__', json.dumps(a, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')))
print('adu js written')

g = json.load(open(os.path.join(root, 'inputs', 'nb-geo.json')))
t3 = open(os.path.join(here, '5i-nbmap.tpl.js')).read()
open(os.path.join(root, 'js', '5i-nbmap.js'), 'w').write(t3.replace('__GEO_JSON__', json.dumps(g, separators=(',', ':'))))
print('map js written')
