/* ===== New-builds map: every community as a pin, colored by monthly payment, with a commute filter,
   flood-zone layer, area checks (flood, fire, schools) and a jump to ADU-size lots.
   Pins sit at the community's ZIP code (approximate); "Directions" opens the exact sales office in Google Maps. */
const NB_GEO = __GEO_JSON__;
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
    if (shown.length && !draw.fitted) { map.fitBounds(L.latLngBounds(shown.map((c) => pts[c.id])).pad(0.1)); draw.fitted = true; }
  };
  const el = root.querySelector('#nbm-map');
  const start = () => loadLeaflet().then(() => {
    if (!el.isConnected || el._leaflet_id) return; // the page was redrawn; the new copy runs its own map
    map = L.map(el, { scrollWheelZoom: false }).setView([38.4, -121.3], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' }).addTo(map);
    layer = L.layerGroup().addTo(map);
    draw();
    setTimeout(() => { map.invalidateSize(); draw.fitted = false; draw(); }, 250);
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
