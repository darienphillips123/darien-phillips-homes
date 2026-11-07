/* ===== New-builds map: every community as a pin, colored by monthly payment, with a commute filter,
   flood-zone layer, area checks (flood, fire, schools) and a jump to ADU-size lots.
   Pins sit at the community's ZIP code (approximate); "Directions" opens the exact sales office in Google Maps. */
const NB_GEO = {"zip":{"93635":[37.064,-120.8431],"95206":[37.9279,-121.2791],"95212":[38.026,-121.27],"95215":[37.9525,-121.224],"95219":[38.0265,-121.3668],"95228":[37.9272,-120.6192],"95240":[38.1187,-121.267],"95242":[38.1207,-121.3494],"95258":[38.1545,-121.3022],"95301":[37.3475,-120.6003],"95316":[37.5224,-120.791],"95324":[37.4053,-120.8571],"95326":[37.5989,-120.8588],"95328":[37.5546,-120.9129],"95330":[37.8116,-121.3085],"95336":[37.8188,-121.2422],"95337":[37.7993,-121.2496],"95341":[37.2845,-120.4722],"95348":[37.3303,-120.4937],"95351":[37.6328,-121.0083],"95355":[37.7276,-120.8501],"95356":[37.712,-121.0269],"95357":[37.6644,-120.9091],"95360":[37.307,-121.0187],"95361":[37.7729,-120.8239],"95363":[37.4699,-121.1434],"95366":[37.747,-121.134],"95367":[37.7328,-120.9498],"95370":[37.9951,-120.3316],"95377":[37.723,-121.4782],"95380":[37.4903,-120.8345],"95382":[37.5264,-120.8457],"95386":[37.6881,-120.6795],"95391":[37.7699,-121.5437],"95603":[38.9204,-121.0763],"95605":[38.5923,-121.5273],"95608":[38.6394,-121.3287],"95616":[38.5462,-121.7484],"95618":[38.5463,-121.7094],"95624":[38.4133,-121.3679],"95630":[38.6643,-121.1484],"95632":[38.2699,-121.3011],"95640":[38.3498,-120.9397],"95642":[38.3695,-120.7944],"95648":[38.8877,-121.2943],"95661":[38.7486,-121.2473],"95667":[38.7298,-120.7958],"95670":[38.6033,-121.2751],"95672":[38.7053,-120.9889],"95677":[38.793,-121.2254],"95678":[38.7616,-121.2913],"95682":[38.6737,-120.9779],"95683":[38.4972,-121.1025],"95685":[38.3983,-120.8094],"95691":[38.5584,-121.5455],"95694":[38.5307,-121.9644],"95742":[38.5788,-121.2656],"95746":[38.7369,-121.2096],"95747":[38.7755,-121.3549],"95757":[38.3944,-121.4293],"95758":[38.4183,-121.435],"95762":[38.662,-121.0651],"95765":[38.8222,-121.2785],"95776":[38.6821,-121.7329],"95816":[38.5759,-121.4676],"95823":[38.477,-121.4341],"95827":[38.5501,-121.3373],"95828":[38.4919,-121.4157],"95829":[38.4751,-121.3649],"95831":[38.4953,-121.5221],"95832":[38.4669,-121.4924],"95834":[38.6468,-121.5345],"95835":[38.6631,-121.5259],"95838":[38.641,-121.4451],"95843":[38.7125,-121.369],"95901":[39.1506,-121.564],"95932":[39.2081,-122.0118],"95945":[39.2197,-121.0459],"95949":[39.1781,-121.0686],"95961":[39.0337,-121.5495],"95973":[39.7694,-121.8555],"95993":[39.1368,-121.6667]},"city":{"Carmichael":[38.6271,-121.3222],"Elk Grove":[38.4088,-121.3716],"Orangevale":[38.6785,-121.2258],"Sacramento":[38.5811,-121.4939],"Los Banos":[37.0592,-120.8505],"Stockton":[37.9577,-121.2908],"Copperopolis":[37.981,-120.6419],"Lodi":[38.1343,-121.2736],"Woodbridge":[38.1541,-121.3013],"Atwater":[37.3477,-120.6091],"Denair":[37.5257,-120.7973],"Hilmar":[37.4085,-120.8502],"Hughson":[37.597,-120.866],"Keyes":[37.5566,-120.9155],"Lathrop":[37.8227,-121.2766],"Manteca":[37.7986,-121.2117],"Merced":[37.303,-120.4843],"Modesto":[37.6393,-120.9969],"Newman":[37.3139,-121.0204],"Oakdale":[37.7666,-120.8472],"Patterson":[37.4716,-121.1297],"Ripon":[37.7395,-121.1247],"Riverbank":[37.736,-120.9355],"Sonora":[37.9853,-120.3835],"Tracy":[37.7386,-121.4201],"Turlock":[37.4947,-120.8466],"Waterford":[37.6413,-120.7605],"Mountain House":[37.7833,-121.5427],"Auburn":[38.8946,-121.074],"West Sacramento":[38.5805,-121.5302],"Davis":[38.5436,-121.739],"Folsom":[38.678,-121.1761],"Galt":[38.2546,-121.2999],"Ione":[38.3527,-120.9327],"Jackson":[38.3488,-120.7741],"Lincoln":[38.8916,-121.2932],"Granite Bay":[38.7418,-121.1693],"Placerville":[38.7296,-120.7985],"Rancho Cordova":[38.5891,-121.3027],"Rescue":[38.7117,-120.9514],"Rocklin":[38.7907,-121.2358],"Roseville":[38.7521,-121.288],"Cameron Park":[38.6782,-120.9943],"Rancho Murieta":[38.5019,-121.0947],"Sutter Creek":[38.393,-120.8024],"Winters":[38.5249,-121.9708],"El Dorado Hills":[38.6561,-121.0743],"Woodland":[38.6786,-121.7733],"Antelope":[38.7082,-121.33],"Linda":[39.1219,-121.5661],"Colusa":[39.2141,-122.0092],"Grass Valley":[39.2191,-121.0629],"Olivehurst":[39.0954,-121.5518],"Plumas Lake":[39.0204,-121.5512],"Chico":[39.7285,-121.8375],"Yuba City":[39.1404,-121.6169]}};
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
function nbPoint(c, i) {
  const g = NB_GEO.zip[c.zip] || NB_GEO.city[c.city] || null;
  if (!g) return null;
  // spread communities that share a ZIP in a small spiral so every pin can be tapped
  const a = i * 2.399, r = 0.006 * Math.sqrt(i);
  return [g[0] + r * Math.sin(a), g[1] + r * Math.cos(a) * 1.25];
}
function nbMonthly(c) {
  if (!c.min) return 0;
  // FHA where the price fits FHA's limit, otherwise a conventional loan with 5% down
  let f = payment({ price: c.min, loan: 'fha', cash: 0, rate: LOANS.fha.rate, county: c.county, tax: 0.0115 });
  if (!f.ok) f = payment({ price: c.min, loan: 'conv', cash: c.min * 0.05, rate: LOANS.conv.rate, county: c.county, tax: 0.0115 });
  return f.ok ? Math.round(f.total) : 0;
}
const PAY_BANDS = [[3000, '#2E9E5B', 'Under $3,000'], [3500, '#7E8F1F', '$3,000–3,500'], [4000, '#D9901A', '$3,500–4,000'], [4500, '#F06A3B', '$4,000–4,500'], [1e9, '#C2367A', '$4,500+']];
const payColor = (m) => (m ? (PAY_BANDS.find((b) => m < b[0]) || PAY_BANDS[PAY_BANDS.length - 1])[1] : '#888');
const areaLinks = (c) => [
  ['Flood zone', 'https://msc.fema.gov/portal/search?AddressQuery=' + encodeURIComponent((c.addr || c.name || '') + ', ' + c.city + ', CA ' + (c.zip || ''))],
  ['Fire zone', 'https://osfm.fire.ca.gov/what-we-do/community-wildfire-preparedness-and-mitigation/fire-hazard-severity-zones'],
  ['Schools', 'https://www.greatschools.org/search/search.page?q=' + encodeURIComponent(c.zip || c.city + ' CA')]
];
const areaLinksHtml = (c) => '<div class="area-links"><span class="mono">Check the area</span>' + areaLinks(c).map(([t, u]) => '<a target="_blank" rel="noopener" href="' + esc(u) + '">' + esc(t) + ' ↗</a>').join('') + '</div>';
function loadLeaflet() {
  if (window.L && window.L.map) return Promise.resolve();
  return new Promise((ok, bad) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = LEAFLET_CSS; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = LEAFLET_JS; s.onload = ok; s.onerror = bad; document.head.appendChild(s);
  });
}
function nbMapHtml() {
  return '<div class="panel nbmap" id="nbmap-box"><div class="nbmap-bar">' +
      '<div class="field"><label for="nbm-pay">Max monthly payment</label><select id="nbm-pay"><option value="0">Any</option>' + [2500, 3000, 3500, 4000, 4500, 5000, 6000].map((v) => '<option value="' + v + '">Up to ' + money(v) + '/mo</option>').join('') + '</select></div>' +
      '<div class="field wide"><label for="nbm-work">Commute: your work or school address</label><input id="nbm-work" placeholder="For example: 2801 K St, Sacramento" autocomplete="street-address"></div>' +
      '<div class="field"><label for="nbm-min">Max drive</label><select id="nbm-min"><option value="0">Any</option>' + [15, 20, 30, 40, 45, 60].map((v) => '<option value="' + v + '">' + v + ' min</option>').join('') + '</select></div>' +
      '<div class="field"><span class="lbl">Map layers</span><label style="display:flex;gap:8px;align-items:center;min-height:44px"><input type="checkbox" id="nbm-flood"> FEMA flood zones</label></div>' +
    '</div>' +
    '<div class="nbmap-legend">' + PAY_BANDS.map(([, c, t]) => '<span><i style="background:' + c + '"></i>' + esc(t) + '</span>').join('') + '<span class="note">Est. monthly at the starting price (FHA, or conventional with 5% down above FHA limits)</span></div>' +
    '<p class="count" id="nbm-count" aria-live="polite"></p>' +
    '<div id="nbm-map" class="nbmap-map" role="region" aria-label="Map of new-home communities"></div>' +
    '<div class="ctas" style="margin:10px 0 0"><button type="button" class="btn btn-line btn-sm" id="nbm-adu">See resale homes here with room for an ADU</button></div>' +
    '<p class="fine">Pins are placed by ZIP code, so they show the area, not the exact street. Tap "Directions" for the sales office. Drive times come from OpenStreetMap routing and are estimates without traffic.</p></div>';
}
function mountNbMap(root, N) {
  const box = root.querySelector('#nbmap-box');
  if (!box) return;
  let map, layer, flood, work = null, times = {};
  const pts = {};
  const byZip = {};
  DATA.communities.forEach((c) => { const k = c.zip || c.city; byZip[k] = (byZip[k] || 0) + 1; pts[c.id] = nbPoint(c, byZip[k] - 1); });
  const list = () => DATA.communities.filter((c) => pts[c.id] && inPlace(c) && (!N.max || (c.min && c.min <= N.max)) && (!N.beds || (c.bmax && c.bmax >= N.beds)) && (!N.sqft || (c.sqft_max || c.sqft || 0) >= N.sqft) && (!N.builder || c.builder === N.builder));
  const draw = () => {
    if (!map) return;
    const maxPay = +$('nbm-pay').value || 0, maxMin = +$('nbm-min').value || 0;
    layer.clearLayers();
    const shown = [];
    list().forEach((c) => {
      const m = nbMonthly(c);
      if (maxPay && (!m || m > maxPay)) return;
      const t = times[c.id];
      if (work && maxMin && (t == null || t > maxMin * 60)) return;
      shown.push(c);
      const mk = L.circleMarker(pts[c.id], { radius: 8, color: '#fff', weight: 2, fillColor: payColor(m), fillOpacity: 0.95 });
      mk.bindPopup('<b>' + esc(c.name) + '</b><br>' + esc((c.builder || '') + ' · ' + c.city) + '<br>' + (c.min ? 'From ' + money(c.min) : 'Price to be set') + (m ? ' · about ' + money(m) + '/mo' : '') +
        (c.status === 'coming soon' ? '<br><i>Coming soon</i>' : '') + (t != null ? '<br>About ' + Math.round(t / 60) + ' min drive' : '') +
        '<div class="pop-acts"><a href="#p/' + esc(slug(c.name)) + '">See details</a><a target="_blank" rel="noopener" href="' + esc('https://www.google.com/maps/search/' + encodeURIComponent(c.name + ' ' + (c.builder || '') + ' ' + c.city + ' CA')) + '">Directions ↗</a></div>' + areaLinksHtml(c));
      layer.addLayer(mk);
    });
    $('nbm-count').textContent = plural(shown.length, 'community', 'communities') + ' on the map' + (work && maxMin ? ' within ' + maxMin + ' min of ' + work.label : '');
    if (shown.length && !draw.fitted) { const sv = nbMapView(); if (!sv) { map.fitBounds(L.latLngBounds(shown.map((c) => pts[c.id])).pad(0.1)); } draw.fitted = true; }
  };
  const el = root.querySelector('#nbm-map');
  const start = () => loadLeaflet().then(() => {
    if (!el.isConnected || el._leaflet_id) return; // the page was redrawn; the new copy runs its own map
    const sv = nbMapView();
    map = L.map(el, { scrollWheelZoom: false }).setView(sv ? [sv.lat, sv.lng] : [38.4, -121.3], sv ? sv.z : 8);
    if (sv) draw.fitted = true;
    // Remember where the visitor was looking, so going back from a pin or a
    // home restores that view instead of zooming in again.
    map.on('moveend zoomend', () => { const c = map.getCenter(); saveNbMapView({ lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5), z: map.getZoom() }); });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' }).addTo(map);
    layer = L.layerGroup().addTo(map);
    draw();
    setTimeout(() => { map.invalidateSize(); draw.fitted = !!nbMapView(); draw(); }, 250);
  }).catch(() => { el.innerHTML = '<div class="empty"><p>The map couldn\'t load. Check your connection and try again.</p></div>'; });
  // only load the map once it scrolls into view
  const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { io.disconnect(); start(); } });
  io.observe(el);
  $('nbm-pay').addEventListener('change', () => { draw.fitted = false; draw(); });
  $('nbm-min').addEventListener('change', () => { draw.fitted = false; commute(); });
  $('nbm-flood').addEventListener('change', (e) => {
    if (!map) return;
    if (e.target.checked) { floodOn = true; floodDraw(); map.on('moveend', floodDraw); }
    else { floodOn = false; map.off('moveend', floodDraw); if (flood) { map.removeLayer(flood); flood = null; } }
  });
  // FEMA's flood map, redrawn for the area on screen
  let floodOn = false;
  function floodDraw() {
    if (!map || !floodOn) return;
    const b = map.getBounds(), sz = map.getSize(), P = L.CRS.EPSG3857;
    const sw = P.project(b.getSouthWest()), ne = P.project(b.getNorthEast());
    const url = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/export?bbox=' + [sw.x, sw.y, ne.x, ne.y].map((v) => v.toFixed(0)).join(',') + '&bboxSR=3857&imageSR=3857&size=' + sz.x + ',' + sz.y + '&layers=show:28&transparent=true&format=png32&f=image';
    if (flood) { flood.setUrl(url); flood.setBounds(b); } else flood = L.imageOverlay(url, b, { opacity: 0.55, attribution: 'FEMA flood zones' }).addTo(map);
  }
  let wt;
  $('nbm-work').addEventListener('input', () => { clearTimeout(wt); wt = setTimeout(commute, 900); });
  async function commute() {
    const q = $('nbm-work').value.trim();
    if (!q || !(+$('nbm-min').value)) { work = null; draw(); return; }
    try {
      $('nbm-count').textContent = 'Finding drive times…';
      const g = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=' + encodeURIComponent(q)).then((r) => r.json());
      if (!g.length) { $('nbm-count').textContent = 'We couldn\'t find that address. Try adding the city.'; return; }
      work = { lat: +g[0].lat, lon: +g[0].lon, label: q };
      const cs = list().filter((c) => times[c.id] === undefined || times.__for !== q);
      if (times.__for !== q) times = { __for: q };
      for (let i = 0; i < cs.length; i += 90) {
        const part = cs.slice(i, i + 90);
        const coords = [[work.lon, work.lat]].concat(part.map((c) => [pts[c.id][1], pts[c.id][0]])).map((p) => p[0].toFixed(5) + ',' + p[1].toFixed(5)).join(';');
        const t = await fetch('https://router.project-osrm.org/table/v1/driving/' + coords + '?sources=0&annotations=duration').then((r) => r.json());
        if (t.durations) part.forEach((c, k) => { times[c.id] = t.durations[0][k + 1]; });
      }
      logStep('New-builds commute search: ' + q + ', ' + $('nbm-min').value + ' min');
      draw();
    } catch (x) { $('nbm-count').textContent = 'Drive times aren\'t available right now. Try again in a minute.'; }
  }
  $('nbm-adu').addEventListener('click', () => {
    const F = sub('search', {});
    Object.assign(F, { loc: S.place ? placeLabel(S.place) : '', min: 0, max: N.max || 0, beds: N.beds || 0, baths: 0, sqft: 0, acres: 0.15, year: 0, condo: false, opts: [], pool: false });
    save(); go('search', true);
  });
}
