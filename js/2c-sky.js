/* ===== Time of day =====
   The site follows the sun over Sacramento at the moment someone visits: bright in the daytime, warmer and darker
   as the sun gets low, and dark at night. It sets the shade and brightness of each page's photo, the color of the
   top bar and footer, and light or dark mode (unless the page's host already picked one, as the preview on Claude can). */
const SKY_AT = { lat: 38.58, lon: -121.49 };
const SKY_THEME = !document.documentElement.dataset.theme;
// Visitors can pick Day or Night themselves with the sun/moon button; Auto follows the sun.
// Light by default; visitors can switch to Night or Auto (follows the sun) with the sun/moon button
let SKY_MODE = String(store.get('dp-theme', 'day') || 'day');
if (!['day', 'night', 'auto'].includes(SKY_MODE)) SKY_MODE = 'day';
function sunElevation(date) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 10957.5; // days since noon UTC, Jan 1, 2000
  const g = (357.529 + 0.98560028 * d) * rad; // mean anomaly
  const q = 280.459 + 0.98564736 * d; // mean longitude, degrees
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad; // ecliptic longitude
  const e = (23.439 - 0.00000036 * d) * rad; // tilt of the earth's axis
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24; // hours
  const ha = (gmst * 15 + SKY_AT.lon) * rad - ra;
  const lat = SKY_AT.lat * rad;
  return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) / rad;
}
function skyFor(date) {
  const el = sunElevation(date);
  const k = Math.min(1, Math.max(0, (24 - el) / 34)); // 0 with the sun high, 1 once it's well below the horizon
  const dark = k * k * (3 - 2 * k);
  const warm = Math.max(0, 1 - Math.abs(el - 3) / 11); // strongest with the sun just above the horizon
  const night = Math.min(1, Math.max(0, (-2 - el) / 10)); // blue hour into night
  const phase = el >= 20 ? 'day' : el >= 6 ? 'late-day' : el >= -2 ? 'sunset' : el >= -10 ? 'dusk' : 'night';
  return { el, dark, warm, night, phase };
}
const mixRGB = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function applySky(date) {
  const now = date || new Date();
  let s = skyFor(now);
  if (SKY_MODE === 'day') { s = skyFor(new Date(Date.UTC(2026, 5, 21, 20, 0))); }
  if (SKY_MODE === 'night') { s = skyFor(new Date(Date.UTC(2026, 11, 21, 8, 0))); }
  const root = document.documentElement, st = root.style;
  const set = (k, v) => st.setProperty(k, v.toFixed(3));
  // Shade over the photo: light by day (enough to keep the words readable), deeper toward sunset and at night
  set('--sky-l', 0.6 + 0.3 * s.dark);
  set('--sky-m', 0.34 + 0.38 * s.dark);
  set('--sky-r', 0.42 * s.dark);
  set('--sky-b', 0.2 + 0.4 * s.dark);
  set('--sky-m1', 0.02 + 0.32 * s.dark);
  set('--sky-m2', 0.5 + 0.36 * s.dark);
  set('--sky-w1', 0.1 * s.warm);
  set('--sky-w2', 0.3 * s.warm);
  set('--sky-n', 0.28 * s.night);
  st.setProperty('--sky-photo', 'brightness(' + (1.12 - 0.34 * s.dark).toFixed(3) + ') saturate(' + (1.1 - 0.22 * s.dark).toFixed(3) + ')');
  // The color behind the words on phones: blue by day, warm plum around sunset, deep navy at night
  const c = mixRGB(mixRGB([30, 82, 72], [56, 34, 54], s.warm), [11, 21, 32], s.night);
  st.setProperty('--hero-rgb', c.join(', '));
  // Top bar and footer: sky blue by day, dusky plum around sunset, navy at night
  const brand = mixRGB(mixRGB([27, 74, 66], [96, 48, 86], s.warm), [10, 31, 46], Math.max(s.night, 0.25 * s.dark));
  const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
  st.setProperty('--brand', hex(brand));
  st.setProperty('--brand-line', hex(mixRGB(brand, [255, 255, 255], 0.2)));
  st.setProperty('--brand-muted', hex(mixRGB(brand, [255, 255, 255], 0.78)));
  const tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', hex(brand));
  if (SKY_MODE !== 'auto') root.dataset.theme = SKY_MODE === 'day' ? 'light' : 'dark';
  else if (SKY_THEME) root.dataset.theme = s.el > -4 ? 'light' : 'dark';
  themeButton();
  root.dataset.sky = s.phase;
  return s;
}
function themeButton() {
  const b = document.getElementById('theme-btn');
  if (!b) return;
  const dark = document.documentElement.dataset.theme === 'dark';
  const label = SKY_MODE === 'day' ? 'Day mode' : SKY_MODE === 'night' ? 'Night mode' : 'Auto (follows the sun)';
  b.innerHTML = (dark ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>') +
    '<span class="vh">Theme: ' + label + '. Tap to change.</span>';
  b.title = 'Theme: ' + label + ' (tap to change)';
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('#theme-btn')) return;
  SKY_MODE = SKY_MODE === 'day' ? 'night' : SKY_MODE === 'night' ? 'auto' : 'day';
  store.set('dp-theme', SKY_MODE);
  applySky();
});
applySky();
setInterval(() => applySky(), 5 * 60 * 1000);
