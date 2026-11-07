"""Builds site/data.json for Darien's website from the earlier pages' data plus new-home research (Nov 2, 2026)."""
import ast
import json
import re
import sys

root = sys.argv[1]           # scratchpad folder
out_path = sys.argv[2]

# ---------- Towns (from the all-markets assumable page) ----------
tpl = open(root + '/build/template.html', encoding='utf-8').read()
raw = re.search(r'const RAW = (\[[\s\S]*?\n  \]);', tpl).group(1)
towns = []
for row in ast.literal_eval(raw):
    name, county, lat, lng, zoom = row[:5]
    aka = row[6] if len(row) > 6 else []
    towns.append({"n": name, "c": county, "lat": lat, "lng": lng, "z": zoom, "aka": aka})
county_of = {t["n"]: t["c"] for t in towns}
for extra, c in (("Mountain House", "San Joaquin"), ("Vineyard", "Sacramento"), ("Denair", "Stanislaus"),
                 ("Hughson", "Stanislaus"), ("Waterford", "Stanislaus"), ("Newman", "Stanislaus")):
    county_of.setdefault(extra, c)

# ---------- Assumable homes (MetroList export Oct 30 + earlier picks) ----------
mls = json.load(open(root + '/mls/homes.json', encoding='utf-8'))
assumables = []
for h in mls["homes"]:
    c = county_of.get(h["city"])
    if not c:
        print("no county for", h["city"])
    assumables.append({
        "id": "a" + str(h["id"]), "src": h.get("src"), "street": h["street"], "city": h["city"], "zip": h.get("zip"),
        "county": c, "price": h["price"], "beds": h.get("beds"), "baths": h.get("baths"), "sqft": h.get("sqft"),
        "acres": h.get("acres"), "year": h.get("year"), "type": h.get("type") or "", "rate": h.get("rate"),
        "rateText": h.get("rateText"), "balance": h.get("balance"), "gap": h.get("gap"), "pi": h.get("pi"),
        "matures": h.get("matures"), "balanceNote": h.get("balanceNote"), "gapText": h.get("gapText"),
        "dom": h.get("dom"), "tags": h.get("tags") or [], "mls": h.get("mls"),
        "remarks": (h.get("remarks") or "")[:260],
    })

# ---------- Placer under $2,500 (Roots estimates, Oct 31) ----------
placer = json.load(open(root + '/placer/homes.json', encoding='utf-8'))
for h in placer["homes"]:
    h["county"] = "Placer"

# ---------- Stockton $0 down (builders, Oct 31) ----------
stockton = json.load(open(root + '/stockton/homes.json', encoding='utf-8'))

# ---------- New-home communities (Homes.com, HomeFinder and builder sites, checked Nov 2, 2026) ----------
# county|city|zip|community|builder|min|max|beds min|beds max|sq ft from|tags|source
ROWS = """
Sacramento|Sacramento|95835|Natomas Landing - The Cottages|Risewell Homes|586710|649990|3|4|1829||H
Sacramento|Galt|95632|Dry Creek Oaks|Riverland Homes|499900|577427|2|3|1480||H
Sacramento|Elk Grove|95758|Arbor Ranch - The Cottages|Risewell Homes|694500|803990|3|4|1953||H
Sacramento|Rancho Cordova|95742|The Arista Community|Beazer Homes|599990|698990|3|6|2278||H
Sacramento|Sacramento|95829|Wildleaf - Woodhaven|Beazer Homes|761990|821990|4|5|3015||H
Sacramento|Sacramento|95816|The R21 Community|Beazer Homes|704990|909990|2|4|2046||H
Sacramento|Sacramento|95829|Wildleaf - Brookmere|Beazer Homes|589990|698018|4|5|1935||H
Sacramento|Galt|95632|Elliott Ranch - Veranda|Elliott Homes|445950|507883|3|4|1466||H
Sacramento|Elk Grove|95758|Courtyards at Cotton Lane|Next Generation Capital|498990|569990|3|3|1296||H
Sacramento|Galt|95632|The Fairways|K. Hovnanian Homes|615990|740290|4|5|2274||H
Sacramento|Rancho Cordova|95742|Four Seasons at The Ranch|K. Hovnanian Homes|424990|804177|2|3|1307|55+|H
Sacramento|Sacramento|95829|Wildleaf - Sagestone|Beazer Homes|664990|709990|3|6|2325||H
Sacramento|Sacramento|95829|Meridian at Wildhawk South|Taylor Morrison|619999|784999|2|6|2260||H
Sacramento|Sacramento|95828|Flora at Willow Vista|Taylor Morrison|524999|619475|3|5|1699||H
Sacramento|Sacramento|95829|Latitude at Wildhawk South|Taylor Morrison|689999|962525|1|6|2188||H
Sacramento|Sacramento|95828|Orchid at Willow Vista|Taylor Morrison|579930|642290|3|5|2324||H
Sacramento|Sacramento|95829|Oakbridge at Wildhawk North|Taylor Morrison|561999|598999|3|5|1556||H
Sacramento|Sacramento|95829|Trailhead at Wildhawk North|Taylor Morrison|574999|624999|3|5|2188||H
Sacramento|Sacramento|95828|Wisteria at Willow Vista|Taylor Morrison|674999|716445|3|6|2249||H
Sacramento|Rancho Murieta|95683|Murieta Hills|Terrata Homes|799900|1009900|3|5|2004||H
Sacramento|Sacramento|95835|Terrace Park|Tri Pointe Homes|536454|612207|3|4|1815||H
Sacramento|Sacramento|95835|Northpointe Reserve|Next Generation Capital|456900|499900|3|3|1409||H
Sacramento|Sacramento|95835|Northlake - Watersyde|Lennar|633990|752960|4|5|2309||H
Sacramento|Sacramento|95835|Northlake - Bleau|Lennar|640990|872990|4|5|2143||H
Sacramento|Sacramento|95835|Northlake - Drifton|Lennar|646990|867636|4|5|2282||H
Sacramento|Rancho Cordova|95742|Bloom at Sunridge Park|Tri Pointe Homes|650905|804583|3|5|2430||H
Sacramento|Elk Grove|95757|Arbor Ranch - Lyric|Lennar|788990|894990|4|5|2632||H
Sacramento|Sacramento|95829|Anchor at Wildhawk South|Taylor Morrison|617999|689999|3|6|2262||H
Sacramento|Elk Grove|95757|Arbor Ranch - Symphony|Lennar|728990|856092|4|5|2463||H
Sacramento|Rancho Murieta|95683|Haven at Murieta|Richmond American|661950|736950|3|4|1890||H
Sacramento|Galt|95632|Elliott Ranch - Sage|Elliott Homes|540950|649110|3|4|1609||H
Sacramento|Elk Grove|95624|Hamilton Park|KB Home|530825|560005|3|4|1885||H
Sacramento|Sacramento|95835|Northlake - Shor|Lennar|550990|626990|3|4|1765||H
Sacramento|Sacramento|95823|Ventris Place|Next Generation Capital|494990|620990|3|4|1196||H
Sacramento|Folsom|95630|Esquire at Folsom Ranch|KB Home|667990|929120|3|5|1838||H
Sacramento|Sacramento|95835|Northlake - Wavmor|Lennar|603990|802240|3|5|2127||H
Sacramento|Sacramento|95835|Northlake - Crestvue|Lennar|630779|923434|3|5|1789||H
Sacramento|Sacramento|95835|Northlake - Lakelet|Lennar|596990|667990|4|4|2107||H
Sacramento|Elk Grove|95757|The Grove - Westbourne|KB Home|590000|742500|||||H
Sacramento|Elk Grove|95757|Arbor Ranch - Harmony|Lennar|592990|662990|3|4|1579||H
Sacramento|Elk Grove|95757|Cherry Knolls|Richmond American|557950|645000|3|4|1730||H
Sacramento|Rancho Cordova|95742|Rio Del Oro - Placer|Elliott Homes|732950|917870|3|4|2130||H
Sacramento|Rancho Cordova|95742|Rio Del Oro - Sutter|Elliott Homes|626950|734020|3|4|1566||H
Sacramento|Sacramento|95832|Delta Shores West - Riva|KB Home|481990|533085|4|5|1795||H
Sacramento|Sacramento|95832|Delta Shores West - Edgewater|KB Home|575990|678470|3|6|1685||H
Sacramento|Sacramento|95827|Westcott Station|KB Home|457990|539990|3|4|1587||H
Sacramento|Elk Grove|95758|Tegan Estates|Riverland Homes|641319|681319|4|5|1960||H
Sacramento|Rancho Cordova|95742|Park Haven|Cresleigh Homes|519000|653275|3|5|1342||H
Sacramento|Elk Grove|95757|Esplanade at Madeira Ranch - Classics|Taylor Morrison|519999|619000|2|3|1522|55+|H
Sacramento|Sacramento|95838|Archer Estates|KB Home|466990|569000|3|6|1429||H
Sacramento|Elk Grove|95757|Esplanade at Madeira Ranch - Premiers|Taylor Morrison|649999|769000|2|4|2143|55+|H
Sacramento|Rancho Cordova|95742|Silverbrook at The Ranch|K. Hovnanian Homes|524990|574712|3|4|1850||H
Sacramento|Elk Grove|95757|Esplanade at Madeira Ranch - Estates|Taylor Morrison|729999|929000|2|4|2268|55+|H
Sacramento|Rancho Cordova|95742|Seasons at Cypress|Richmond American|534700|642309|4|5|1720||H
Sacramento|Galt|95632|Elliott Ranch - Willow|Elliott Homes|625950|734250|3|5|2015||H
Sacramento|Galt|95632|Greenwood - The Towns|Lennar|432990|528990|3|5|1328||H
Sacramento|Antelope|95843|Antelope North - Calabria II|Lennar|498490|599990|3|4|1233||H
Sacramento|Rancho Cordova|95742|Starblossom at Montelena|Tri Pointe Homes|599000|659000|4|4|2557||H
Sacramento|Rancho Cordova|95670|Stone Creek Village - Veranda|Elliott Homes|480950|525950|3|4|1452||H
Sacramento|Elk Grove|95758|Arbor Ranch - The Bungalows|Risewell Homes|790730|885215|3|5|2182||H
Sacramento|Galt|95632|The Cottages at Greenwood|Lennar|468990|580990|3|4|1883||H
Sacramento|Galt|95632|Cedar Glen at Summerfield|Lennar|600990|656990|4|5|2673||H
Sacramento|Antelope|95843|Antelope North - Windsor|Lennar|559990|643990|3|4|1765||H
Sacramento|Rancho Cordova|95742|Riverblossom at Montelena|Tri Pointe Homes|499000|570890|3|4|1752||H
Sacramento|Rancho Cordova|95742|The Preserve - Aqua|Lennar|554990|696990|4|5|1879||H
Sacramento|Elk Grove|95757|Orchard at Madeira Ranch|Taylor Morrison|819999|999999|3|5|2480||H
Sacramento|Folsom|95630|Broadstone Estates - The Trails|Woodside Homes|890990|1168432|3|7|2604||H
Sacramento|Elk Grove|95757|The Grove - Highland|KB Home|609990||3|3|1738||H
Sacramento|Sacramento|95829|Bluestone at Wildhawk North|Taylor Morrison|519999|549999|3|3|1730||H
Sacramento|Rancho Cordova|95742|Rio Del Oro - Coloma|Elliott Homes|471950|558650|3|4|1219||H
Sacramento|Sacramento|95834|Skylar|D.R. Horton|414990|436990|3|3|1296||H
Sacramento|Sacramento|95835|Waters Edge|Lennar|523990|588990|3|4|1454||H
Sacramento|Elk Grove|95624|Elliott Springs - Laurel|Elliott Homes|676950|817770|3|4|1609||H
Sacramento|Galt|95632|Cedar Grove at Summerfield|Lennar|547870|618990|3|4|2018||H
Sacramento|Elk Grove|95757|Poppy Meadows - Marigold|Beazer Homes|728990|859990|3|4|2450||H
Sacramento|Folsom|95630|Preserve at Folsom Ranch - Oak Trails|Toll Brothers|875995|1053000|4|5|2940||H
Sacramento|Rancho Cordova|95742|The Preserve - Azure|Lennar|575990|697990|3|5|1873||H
San Joaquin|Mountain House|95391|Lakeshore - Bolsena|Rurka Homes|915000|1265880|4|5|2681||H
San Joaquin|Mountain House|95391|Lakeshore - Campelli|Rurka Homes|820000|1054530|4|6|2157||H
San Joaquin|Mountain House|95391|Lakeshore - Alserio|Rurka Homes|1019880|1449880|4|6|2315||H
San Joaquin|Lathrop|95330|Bridgeway at River Islands|Risewell Homes|575000|675000|3|4|1953||H
San Joaquin|Manteca|95336|The Estates in Manteca|K. Hovnanian Homes|573490|730990|3|5|1774||H
San Joaquin|Mountain House|95391|Crestview at Mountain House - Artisan|Risewell Homes|679990|930000|3|4|1846||H
San Joaquin|Mountain House|95391|Silverleaf at Lakeshore|Taylor Morrison|850000|950000|3|5|2654||H
San Joaquin|Mountain House|95391|Trailview at Lakeshore|Taylor Morrison|1018000|1050000|4|6|3168||H
San Joaquin|Lathrop|95330|River Islands - Westwind|Van Daele Homes|622990|711601|4|5|1896||H
San Joaquin|Lathrop|95330|Serena at River Islands|Kiper Homes|779900|879900|4|6|2594||H
San Joaquin|Lathrop|95330|Paddlewheel at River Islands|Taylor Morrison|883940|1035000|4|6|2725||H
San Joaquin|Lathrop|95330|Capri at River Islands|Kiper Homes|735000|799900|3|5|2483||H
San Joaquin|Lathrop|95330|River Islands - Monterey|Van Daele Homes|528990|636208|4|5|1885||H
San Joaquin|Manteca|95337|Poppy at Oakwood Trails|Taylor Morrison|715000|885000|3|5|2494||H
San Joaquin|Manteca|95337|Cielo at Villa Ticino|KB Home|614990|651990|3|6|2346||H
San Joaquin|Lathrop|95330|Skye at River Islands|Kiper Homes|799000|960900|4|5|2959||H
San Joaquin|Manteca|95336|Dawn at The Collective|Trumark Homes|539670|721000|2|2|2021|55+|H
San Joaquin|Manteca|95336|Vida at The Collective|Trumark Homes|458604|607000|2|2|1297|55+|H
San Joaquin|Lathrop|95330|Driftway at River Islands|Lennar|587880|655880|4|5|1870||H
San Joaquin|Tracy|95377|Tracy Hills - Rangewood|Lennar|749995|982880|4|5|2492||H
San Joaquin|Tracy|95377|Tracy Hills - Boulder|Lennar|674683|843880|4|4|2164||H
San Joaquin|Lodi|95242|Gateway - Wisteria Collection|FCB Homes|639950|799950|3|4|1842||H
San Joaquin|Manteca|95337|Sage at Oakwood Trails|Taylor Morrison|715000||4|5|2725||H
San Joaquin|Manteca|95337|Terra at Villa Ticino|KB Home|653990|679990|3|5|1985||H
San Joaquin|Mountain House|95391|The Estates at College Park|Richmond American|1369849|1932229|4|5|2900||H
San Joaquin|Tracy|95377|Tracy Hills - Rockingham|Lennar|815025|1035880|4|5|2673||H
San Joaquin|Lathrop|95330|Meridian at River Islands|Lennar|692880|907322|4|5|2296||H
San Joaquin|Tracy|95377|Tracy Hills - Slateshire|Lennar|868443|1139880|4|5|2908||H
San Joaquin|Tracy|95377|Tracy Hills - Ridgerton|Lennar|750880|949880|4|5|2363||H
San Joaquin|Lathrop|95330|Heritage at River Islands|Lennar|613880|679880|3|4|1820||H
San Joaquin|Manteca|95336|Origin at The Collective|Trumark Homes|605713|706055|2|3|2621|55+|H
San Joaquin|Tracy|95377|Regency at Tracy Lakes - Laguna|Toll Brothers|659995|733532|2|3|1768|55+|H
San Joaquin|Tracy|95377|Tracy Hills - Cairnway|Lennar|748880|913880|4|5|2220||H
San Joaquin|Tracy|95377|Tracy Hills - Crestwick|Lennar|701861|929880|4|5|2500||H
San Joaquin|Mountain House|95391|Belleza at Lakeview|Richmond American|1022950|1042950|4|5|2380||H
San Joaquin|Mountain House|95391|Altamira at College Park|KB Home|802990|968990|4|6|2029||H
San Joaquin|Mountain House|95391|Lotus at Lakeshore|Century Communities|800960|1174390|4|4|2157||H
San Joaquin|Mountain House|95391|Maggiore|Lennar|839143|999880|4|5|2356||H
San Joaquin|Manteca|95337|Griffin Park - Sendero|KB Home|519990|621990|3|4|1466||H
San Joaquin|Mountain House|95391|Turano|Lennar|934814|1243880|4|5|2710||H
San Joaquin|Tracy|95377|Regency at Tracy Lakes - Calero|Toll Brothers|799995|935155|2|3|2393|55+|H
San Joaquin|Mountain House|95391|Mezzano|Lennar|833579|1168880|4|5|2258||H
San Joaquin|Manteca|95337|Griffin Park - Prado|KB Home|575990|638990|3|5|1865||H
San Joaquin|Mountain House|95391|Lugano at Lakeshore|Lennar|739500|914880|4|5|1829||H
San Joaquin|Manteca|95337|Machado Ranch - Heston|Meritage Homes|655000|749000|4|5|2515||H
San Joaquin|Manteca|95337|Gilmore at Denali|Lennar|617654|699880|4|5|1927||H
San Joaquin|Lodi|95242|Rose Gate - Carrousel Collection|FCB Homes|629950|739500|3|4|1755||H
San Joaquin|Stockton|95219|Westlake - Waterfront|Lennar|710990|847714|4|5|2937||H
San Joaquin|Manteca|95336|Cedar Point - Pine|Lennar|636880|684168|4|5|2648||H
San Joaquin|Manteca|95336|Cedar Point - Evergreen|Lennar|547880|602227|3|4|1878||H
San Joaquin|Manteca|95336|Cedar Point - Cypress|Lennar|481880|540997|3|3|1245||H
San Joaquin|Manteca|95336|Cedar Point - Oak|Lennar|597880|642923|4|5|2252||H
San Joaquin|Lodi|95240|Sonterra|K. Hovnanian Homes|645000|685990|3|3|1917||H
San Joaquin|Manteca|95336|Cedar Point - Walnut|Lennar|681880|767212|5|6|2948||H
San Joaquin|Mountain House|95391|Malana at Lakeview|Century Communities|1003990|1104990|||||H
San Joaquin|Tracy|95377|Regency at Tracy Lakes - Pinecrest|Toll Brothers|599995|706000|2|3|1560|55+|H
San Joaquin|Lathrop|95330|River Islands - Hideaway|Van Daele Homes|467990|533990|3|4|1447||H
San Joaquin|Tracy|95377|Regency at Tracy Lakes - Echo|Toll Brothers|959995|1072000|3|3|2548|55+|H
San Joaquin|Manteca|95337|Machado Ranch - Eastwood|Meritage Homes|589000|720200|4|5|1898||H
San Joaquin|Manteca|95337|Alder Grove|Meritage Homes|599000|719800|3|5|1733||H
San Joaquin|Lathrop|95330|Mariposa|K. Hovnanian Homes|681990|899650|4|5|2274||H
San Joaquin|Mountain House|95391|Mountain House - Opal|Shea Homes|1013025|1182852|4|5|2409||H
San Joaquin|Manteca|95337|Aspen at Villa Ticino|Meritage Homes|600000|798286|4|5|2047||H
San Joaquin|Lathrop|95330|Capri II at River Islands|Kiper Homes|749990|799990|3|5|2483||H
San Joaquin|Manteca|95337|Aurora at Denali|D.R. Horton|586490|714490|4|5|1898||H
San Joaquin|Ripon|95366|Meadowood - Parks|Lennar|639258|678880|4|5|2178||H
San Joaquin|Ripon|95366|Meadowood - Courts|Lennar|598055|644880|3|4|1900||H
San Joaquin|Lodi|95242|Gateway - Parkwoods Collection|FCB Homes|645950|686500|3|4|1985||H
San Joaquin|Lodi|95242|Rose Gate - Chelsea Collection|FCB Homes|729950|979950|3|6|2280||H
San Joaquin|Manteca|95337|Griffin Park - Artisan|Raymus Homes|627990|754990|3|5|1751||H
San Joaquin|Mountain House|95391|Mountain House - Emerald|Shea Homes|1230547|1260847|4|4|3336||H
San Joaquin|Lathrop|95330|River Islands - Clearwater|Signature Homes|744706|849703|4|5|3071||H
San Joaquin|Manteca|95337|Griffin Park - Arroyo|KB Home|538990|672990|3|5|1610||H
Stanislaus|Hughson|95326|Orchards at Parkwood|KB Home|429990|481990|3|4|1425||H
Stanislaus|Riverbank|95367|Enclave at Crossroads West|KB Home|559990|609990|3|4|1985||H
Stanislaus|Patterson|95363|Baldwin Ranch - Bradford|Lennar|449880|545880|3|4|1507||H
Stanislaus|Hughson|95326|Heritage at Parkwood|KB Home|553990|649999|3|5|2143||H
Stanislaus|Modesto|95357|Autumnwood at Tivoli|KB Home|481990|562990|3|4|1397||H
Stanislaus|Modesto|95355|Summerfield at Tivoli|KB Home|513990|594990|3|4|1557||H
Stanislaus|Modesto|95357|Hayden at Tivoli|KB Home|531990|599990|3|5|2259||H
Stanislaus|Patterson|95363|Acacia II at Patterson Ranch|KB Home|479990|499990|3|4|1593||H
Stanislaus|Modesto|95355|The Crossings|D.R. Horton|449490|630490|3|5|1567||H
Stanislaus|Newman|95360|Mattos Ranch|LGI Homes|429900|570900|3|5|1235||H
Stanislaus|Riverbank|95367|Heritage Collection II|D.R. Horton|469490|535490|4|4|1858||H
Stanislaus|Waterford|95386|Trestle|D.R. Horton|409490|533490|3|5|1353||H
Stanislaus|Riverbank|95367|Diamond Bar East|LGI Homes|499900|624900|3|5|1122||H
Stanislaus|Modesto|95356|Eve at Founders Point|D.R. Horton|514490|632490|3|5|1582||H
Stanislaus|Turlock|95382|Fifth Edition|Florsheim Homes|376990|456990|2|4|884||H
Stanislaus|Oakdale|95361|Monarch at Saddlewood|D.R. Horton|473490|531490|3|4|1588||H
Stanislaus|Patterson|95363|Camden Shire|LGI Homes|479900|590900|3|5|1235||H
Stanislaus|Oakdale|95361|Saddlewood|Florsheim Homes|499000|549000|3|4|1637||H
Stanislaus|Oakdale|95361|Estates at Tesoro|Tesoro Homes|969990|1350000|3|4|2480||H
Stanislaus|Denair|95316|Monte Vista Collection|LGI Homes|599900|758900|3|5|1335||H
Placer|Lincoln|95648|Wildwood - Mariposa|Pulte Homes|639990|822690|3|7|2154||H
Placer|Roseville|95747|Wildflower at Winding Creek|Woodside Homes|693990|866915|3|5|2330||H
Placer|Roseville|95747|Rose at Placer One|Pulte Homes|718491|860504|4|7|2194||H
Placer|Granite Bay|95661|The Park at Granite Bay|Woodside Homes|924990|1253990|3|5|2335||H
Placer|Roseville|95747|Lily at Placer One|Pulte Homes|696990|769179|4|6|2224||H
Placer|Roseville|95747|Solaire - Jasmine|Pulte Homes|704990|964237|4|6|2815||H
Placer|Roseville|95747|Solaire - Camellia|Pulte Homes|712990|812990|||||H
Placer|Lincoln|95648|Wildwood - Augustine|Pulte Homes|559990|759686|3|6|1788||H
Placer|Lincoln|95648|Liberty at Lincoln - Freedom|Woodside Homes|557990|603990|3|5|1933||H
Placer|Lincoln|95648|Wildwood - Wisteria|Pulte Homes|764990|900623|5|8|3410||H
Placer|Roseville|95747|Summerfield at Sierra Vista|Woodside Homes|519990|603286|3|5|1359||H
Placer|Auburn|95603|Briar Meadows|Fieldstone Communities|||3|5|2095||H
Placer|Auburn|95603|Canyon Creek|Fieldstone Communities|||3|5|2713||H
Placer|Rocklin|95765|Finale at Whitney Ranch|Anthem Properties|1129000|1379900|4|6|3216||H
Placer|Rocklin|95765|Westhaven at Whitney Ranch|KB Home|462990|549384|3|4|1570||H
Placer|Roseville|95747|Ashford at Placer One|KB Home|493794|521653|3|3|1687||H
Placer|Rocklin|95765|Tribute Pointe at Whitney Ranch|JMC Homes|1029990|1439990|3|6|2405||H
Placer|Roseville|95747|Aria at Placer One|Taylor Morrison|534999|649000|3|4|1572||H
Placer|Lincoln|95648|Hidden Hills|Century Communities|605000||3|5||Gated|B
Placer|Lincoln|95648|Twelve Bridges|Century Communities|500000|||||No HOA|B
Placer|Roseville|95747|Windham II|Lennar|580990||||||F
Placer|Roseville|95747|Canterbury at Placer One||504990||||||F
Placer|Roseville|95747|Bristol at Placer One||730990||||||F
Placer|Roseville|95747|Overland Village at Sierra Vista||759990||||||F
Placer|Roseville|95747|Brighton at Placer One||605335||||||F
Placer|Roseville|95747|Cambridge at Placer One||536990||||||F
Placer|Roseville|95678|The Links at Sierra View||711886||||||F
Placer|Roseville|95747|Highline Village at Sierra Vista||529990||||||F
Placer|Roseville|95747|Orion at Solaire||599999||||||F
Placer|Roseville|95747|Willow at Winding Creek||627990||||||F
Placer|Roseville|95747|Sagebrook at Fiddyment Farm||729990||||||F
Placer|Roseville|95747|Excelsior Village at Sierra Vista||754990||||||F
Placer|Roseville|95747|Sentinel Village at Sierra Vista||669990||||||F
Placer|Roseville|95747|Inspiration Village at Sierra Vista||593990||||||F
Placer|Roseville|95747|Tesoro at Amoruso Ranch||684990||||||F
Placer|Roseville|95747|Allora at Amoruso Ranch||584990||||||F
Placer|Roseville|95747|Dragonfly II at Winding Creek||518990||||||F
Placer|Roseville|95747|Morgan Place||599900||||||F
Placer|Roseville|95747|Tapestry at Amoruso Ranch||762950||||||F
Placer|Roseville|95747|Seasons at Amoruso Ranch||715950||||||F
Placer|Roseville|95747|Pinnacle at Solaire||553990||||||F
Placer|Roseville|95747|Aviara at Amoruso Ranch||611990||||||F
Placer|Roseville|95747|Milazzo at Amoruso Ranch||500990||||||F
Placer|Roseville|95747|Heritage Placer Vineyards - Lazio||546490|||||55+|F
Placer|Roseville|95747|Heritage Placer Vineyards - Molise||504990|||||55+|F
Placer|Roseville|95747|Heritage Placer Vineyards - Emilia||631652|||||55+|F
Placer|Roseville|95747|Windham at Sierra West||609990||||||F
"""

SOURCES = {"H": "Homes.com", "F": "HomeFinder", "B": "Century Communities"}


def num(v):
    v = v.strip()
    return int(v) if v else None


communities = []
seen = set()
for line in ROWS.strip().splitlines():
    parts = line.split("|")
    if len(parts) != 12:
        sys.exit("bad row (%d fields): %s" % (len(parts), line))
    county, city, zip_code, name, builder, lo, hi, bmin, bmax, sqft, tags, src = parts
    key = (name.lower(), city.lower())
    if key in seen:
        sys.exit("duplicate: " + line)
    seen.add(key)
    communities.append({
        "id": "c%03d" % (len(communities) + 1), "county": county, "city": city, "zip": zip_code, "name": name,
        "builder": builder or None, "min": num(lo), "max": num(hi), "bmin": num(bmin), "bmax": num(bmax),
        "sqft": num(sqft), "tags": [t for t in tags.split(",") if t], "src": SOURCES[src],
    })

# Stockton communities with full home-by-home detail on the Stockton page
for c in stockton["communities"]:
    hs = [h for h in stockton["homes"] if h["comm"] == c["key"]]
    communities.append({
        "id": "c%03d" % (len(communities) + 1), "county": "San Joaquin", "city": "Stockton",
        "zip": hs[0]["zip"], "name": c["name"], "builder": c["builder"],
        "min": min(h["price"] for h in hs), "max": max(h["price"] for h in hs),
        "bmin": min(h["beds"] for h in hs), "bmax": max(h["bedsMax"] for h in hs),
        "sqft": min(h["sqft"] for h in hs), "tags": [p for p in c.get("perks", []) if p != "No HOA"] + (["No HOA"] if c.get("hoa") == 0 else []),
        "src": c["source"], "url": c["url"], "stockton": c["key"],
    })

for c in communities:
    assert c["county"] in ("Sacramento", "San Joaquin", "Stanislaus", "Placer"), c
    if c["min"] and c["max"]:
        assert c["max"] >= c["min"], c

data = {
    "checked": "Nov 2, 2026",
    "towns": towns,
    "assumables": assumables,
    "assumablesChecked": "Oct 30, 2026",
    "placer": placer,
    "stockton": stockton,
    "communities": communities,
    "counties": {
        "Placer": {"fha": 764750, "calhfa": 245000},
        "Sacramento": {"fha": 764750, "calhfa": 245000},
        "San Joaquin": {"fha": 678500, "calhfa": 214000},
        "Stanislaus": {"fha": 545100, "calhfa": 195000},
    },
    "conforming": 832750,
    "rates": {"conv": 7.24, "conv15": 6.60, "fha": 7.07, "va": 7.04, "usda": 7.07},
    "build": {"basic": 173, "standard": 204, "premium": 275},
}
json.dump(data, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
by = {}
for c in communities:
    by[c["county"]] = by.get(c["county"], 0) + 1
print("towns:", len(towns), "| assumables:", len(assumables), "| placer:", len(placer["homes"]),
      "| stockton homes:", len(stockton["homes"]), "| communities:", len(communities), by)
