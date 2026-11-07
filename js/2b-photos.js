/* ===== Homepage backdrop: swap this one line once Deklan's site is seen =====
   HOME_BACKDROP_KEY is the photo key in PHOTOS below. No real photo of a home
   Darien toured (Hazel at SHAWOOD Folsom, Carlsberg at Ridgeline at Bickford)
   exists in img/, so the backdrop is a stock photo for now, labeled honestly
   in HOME_BACKDROP_NOTE and in the footer credit. To use a real tour-home
   photo later, add it to img/ as <key>-1920.jpg, <key>-960.jpg and
   <key>-tile.jpg, add a PHOTOS entry for it, and point this key at it. */
const HOME_BACKDROP_KEY = 'payment';
const HOME_BACKDROP_NOTE = 'Backdrop photo: a home at dusk, by Michael Brown on Unsplash. This is a stock photo, not a home Darien toured.';
const PV = '?v=__PHOTO_V__'; // changes whenever a photo changes, so browsers never show an old cached one
const PHOTOS = {
  home: { pos: '30% 30%', ai: true },
  guide: { pos: '70% 30%', ai: true },
  search: { pos: '50% 50%', by: 'Kindel Media', id: '9716228', site: 'pexels', src: 'https://images.pexels.com/photos/9716228/pexels-photo-9716228.jpeg?auto=compress&cs=tinysrgb' },
  assumable: { pos: '52% 53%', by: 'Roger Starnes Sr', id: '1XRV7Z4lhGo' },
  'zero-down': { pos: '52% 50%', by: 'Brian Zajac', id: 'g6LLnC-rn0E' },
  payment: { pos: '48% 50%', by: 'Michael Brown', id: 'G48h926L2qo' },
  'new-builds': { pos: '56% 45%', by: 'Troy Mortier', id: '9GAdLexoV7U' },
  placer: { pos: '52% 55%', by: 'Roger Starnes Sr', id: 'pGH1-iHveX0' },
  stockton: { pos: '50% 50%', by: 'Cosmin Gurau', id: '3cDza1lTxCQ' },
  refinance: { pos: '62% 50%', by: 'Luca Bravo', id: 'zAjdgNXsMeg' },
  build: { pos: '74% 53%', by: 'Lili Kovac', id: 'BSQq5dRT_KU' },
  about: { pos: '50% 62%', by: 'Get Lost Mike', id: '6267516', site: 'pexels', src: 'https://images.pexels.com/photos/6267516/pexels-photo-6267516.jpeg?auto=compress&cs=tinysrgb' },
  alerts: { pos: '50% 50%', by: 'Roger Starnes Sr', id: 'LUdiEvMAyQ8' },
  adu: { pos: '50% 50%' },
  cart: { pos: '50% 50%' }
};
function photoImg(key, tile, url) {
  // A listing's own photo (an https link from Darien's sheet) on the public site
  if (url && ON_WEB && /^https:\/\/[^\s"'<>]+$/i.test(url)) return '<img class="photo" src="' + esc(url) + '" alt="" decoding="async" referrerpolicy="no-referrer">';
  if (!PHOTOS[key]) return '';
  const R = PHOTOS[key].src;
  if (R && tile) return '<img class="photo" src="' + esc(R + '&w=760&h=300&fit=crop') + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" style="object-position:' + PHOTOS[key].pos + '">';
  if (R) return photoPh(key) + '<img class="photo" src="' + esc(R + '&w=1920') + '" srcset="' + esc(R + '&w=960') + ' 960w, ' + esc(R + '&w=1920') + ' 1920w" sizes="100vw" alt="" decoding="async" referrerpolicy="no-referrer" style="object-position:' + PHOTOS[key].pos + '">';
  if (tile) return '<img class="photo" src="img/' + key + '-tile.jpg' + PV + '" alt="" loading="lazy" decoding="async">';
  return photoPh(key) + '<img class="photo" src="img/' + key + '-1920.jpg' + PV + '" srcset="img/' + key + '-960.jpg' + PV + ' 960w, img/' + key + '-1920.jpg' + PV + ' 1920w" sizes="100vw" alt="" decoding="async" style="object-position:' + PHOTOS[key].pos + '">';
}
const thumbBox = (k) => '<div class="thumb">' + scene(PAGES[k].scene, true) + photoImg(k, true) + '</div>';
// Fade each photo in once it loads; drop it if it can't load so the drawn scene shows instead.
function wirePhotos(root) {
  root.querySelectorAll('img.photo:not([data-wired])').forEach((img) => {
    img.dataset.wired = '1';
    const ok = () => img.classList.add('on');
    const bad = () => img.remove();
    if (img.complete) { if (img.naturalWidth) ok(); else bad(); return; }
    img.addEventListener('load', ok, { once: true });
    img.addEventListener('error', bad, { once: true });
  });
}
function photoCredit(key) {
  const p = PHOTOS[key];
  if (!p) return '';
  if (p.ai) return 'Photo of Darien edited with AI.';
  if (!p.by) return '';
  return p.site === 'pexels' ? 'Backdrop photo by <a href="https://www.pexels.com/photo/' + p.id + '/" target="_blank" rel="noopener">' + esc(p.by) + '</a> on Pexels.'
    : 'Backdrop photo by <a href="https://unsplash.com/photos/' + p.id + '" target="_blank" rel="noopener">' + esc(p.by) + '</a> on Unsplash.';
}

// A small round picture for each tab in the top bar (the colored dot when a page has no photo yet)
function navThumb(k) {
  const p = PHOTOS[k], c = (typeof COLORS !== 'undefined' && COLORS[k]) || '#888';
  if (!p || p.optional) return '<span class="dot" style="background:' + c + '"></span>';
  const src = p.src ? p.src + '&w=96&h=96&fit=crop' : 'img/' + k + '-tile.jpg' + PV;
  return '<img class="kw-pic" src="' + esc(src) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" style="--tc:' + c + '" onerror="this.outerHTML=\'<span class=&quot;dot&quot; style=&quot;background:' + c + '&quot;></span>\'">';
}

// The small picture (already loaded for the tab buttons) shows right away, softly blurred, while the big photo loads
function photoSmall(k) { const p = PHOTOS[k]; return p.src ? p.src + '&w=760&h=300&fit=crop' : 'img/' + k + '-tile.jpg' + PV; }
function photoPh(k) {
  if (!PHOTOS[k] || PHOTOS[k].optional) return '';
  return '<img class="photo ph" src="' + esc(photoSmall(k)) + '" alt="" decoding="async" referrerpolicy="no-referrer" style="object-position:' + PHOTOS[k].pos + '">';
}
// After the first page shows, quietly load every page's big photo so tapping a tab shows its photo at once
function photoBig(k) {
  const p = PHOTOS[k], big = window.innerWidth * (window.devicePixelRatio || 1) > 960;
  return p.src ? p.src + '&w=' + (big ? 1920 : 960) : 'img/' + k + (big ? '-1920.jpg' : '-960.jpg') + PV;
}
function preloadPhotos() {
  const keys = Object.keys(PHOTOS).filter((k) => !PHOTOS[k].optional);
  keys.forEach((k) => { const i = new Image(); i.referrerPolicy = 'no-referrer'; i.src = photoSmall(k); });
  let n = 0;
  const next = () => {
    if (n >= keys.length) return;
    const i = new Image(); i.referrerPolicy = 'no-referrer';
    i.onload = i.onerror = () => setTimeout(next, 60);
    i.src = photoBig(keys[n++]);
  };
  next();
}
window.addEventListener('load', () => { (window.requestIdleCallback || ((f) => setTimeout(f, 800)))(preloadPhotos); }, { once: true });
