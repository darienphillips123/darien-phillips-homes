/* ===== Homepage backdrop =====
   HOME_BACKDROP_KEY is the photo key in PHOTOS below. The home page
   hero itself is now the 3D card flip stack in heroSlidesData() below,
   cycling through the toured homes one by one; the stock home-at-dusk
   photo ('payment') is only the fallback backdrop, labeled honestly
   in HOME_BACKDROP_NOTE and in the footer credit: a stock photo, not
   a home Darien toured. Headers, Nov 10, 2026, Darien's direction:
   one unique header photo per tab, top only, no header image used
   twice, no giant photo inside a tab. Finder is the keys photo,
   Custom Portal is the homes-popping-out-of-a-screen image, Shop by
   Payment is the digital-screen image with Darien as the helper, Cart
   is the family-with-cart image, Assumable is Assumable Home 2 as its
   header only, and ADU is a stock modern home with a backyard from
   Unsplash, not Ridge Park and not a Home hero slide. To use
   a real tour-home photo later, add it to img/ as <key>-1920.jpg,
   <key>-960.jpg and <key>-tile.jpg, add a PHOTOS entry for it, and
   point this key at it. */
const HOME_BACKDROP_KEY = 'payment';
const HOME_BACKDROP_NOTE = 'Hero photos flip through 12 homes, two at a time, starting on a different home each visit. Real listing photos are labeled REAL PHOTO, builder and listing photos are labeled as such, and stock photos are labeled STOCK PHOTO, never as a real photo of the home.';
const PV = '?v=__PHOTO_V__'; // changes whenever a photo changes, so browsers never show an old cached one
const PHOTOS = {
  home: { pos: '30% 30%', aiNote: 'Stock photo, a realtor handing keys to a couple, Pexels. Not Darien, not a real closing.' },
  guide: { pos: '70% 30%', ai: true },
  search: { pos: '50% 50%', by: 'Kindel Media', id: '9716228', site: 'pexels', src: 'https://images.pexels.com/photos/9716228/pexels-photo-9716228.jpeg?auto=compress&cs=tinysrgb' },
  assumable: { pos: '50% 50%', ai: true, aiNote: 'AI-generated image, ChatGPT, Assumable Home 2, not a real photo, not a real home. Sign text in the image is AI-generated.' },
  'zero-down': { pos: '52% 50%', by: 'Brian Zajac', id: 'g6LLnC-rn0E' },
  payment: { pos: '50% 50%', ai: true, aiNote: 'AI-generated image, ChatGPT, Modern Home Search Showroom, not a real photo. Darien is the helper in the navy suit, front and center, showing the customer the screen. A different man presses the Monthly Payment button. Prices on the screen, $725,000, $849,000 and $1,195,000, are AI-invented, not real homes, do not quote them as real.' },
  'new-builds': { pos: '56% 45%', by: 'Troy Mortier', id: '9GAdLexoV7U' },
  placer: { pos: '52% 55%', by: 'Roger Starnes Sr', id: 'pGH1-iHveX0' },
  stockton: { pos: '50% 50%', by: 'Cosmin Gurau', id: '3cDza1lTxCQ' },
  refinance: { pos: '62% 50%', by: 'Luca Bravo', id: 'zAjdgNXsMeg' },
  build: { pos: '74% 53%', by: 'Lili Kovac', id: 'BSQq5dRT_KU' },
  about: { pos: '50% 62%', by: 'Get Lost Mike', id: '6267516', site: 'pexels', src: 'https://images.pexels.com/photos/6267516/pexels-photo-6267516.jpeg?auto=compress&cs=tinysrgb' },
  alerts: { pos: '50% 50%', by: 'Roger Starnes Sr', id: 'LUdiEvMAyQ8' },
  adu: { pos: '50% 50%', aiNote: 'Stock photo, modern home with a backyard, Unsplash. Not a real ADU, not a home Darien toured.' },
  cart: { pos: '50% 50%', ai: true, aiNote: 'AI-generated image, ChatGPT, Dream Home Shopping Adventure, not a real photo, not a real home. A happy family, dad, mom and two kids, pushing a shopping cart full of miniature luxury houses down a sunny suburban street, mom pointing at a modern luxury home. Cart tab header only.' },
  'family-cart': { pos: '50% 50%', ai: true, aiNote: 'AI-generated image, ChatGPT, Dream Home Shopping Adventure, not a real photo, not a real home. A happy family, dad, mom and two kids, pushing a shopping cart full of miniature luxury houses down a sunny suburban street, mom pointing at a modern luxury home. Cart tab header only.' },
  /* Headers, Nov 10, 2026, Darien's direction: one unique header photo
     per tab, top only, no header image used twice. Finder is the keys
     photo, Darien handing keys to a couple. Custom Portal is the new
     homes-popping-out-of-a-screen image, family and couple smiling, no
     prices on screen. Both are AI-generated, not real photos, and
     photoCredit labels them as such. The shopping-cart street image is
     gone from headers. */
  portal: { pos: '48% 50%', ai: true, aiNote: 'AI-generated image, ChatGPT, homes popping out of a large computer screen in 3D, family and couple smiling, no prices on screen. Not a real photo. Custom Portal header only.' },
  finder: { pos: '50% 40%', ai: true, aiNote: 'AI-generated image of Darien handing over the keys to a couple. It is not a photo of a real closing.' },
};
/* ===== Homepage hero slideshow, v9, Nov 10, 2026 =====
   Hero v9, mix of G and D plus dual-card pan, picked Nov 9. 3D card
   flip stack plus parallax scroll, no plain fade. Two homes are
   visible at once, left and right, both coming into the screen, the
   left home pans left and the right home pans right over the 8
   second hold, so you see more of each home, and they rotate with
   the cards. 12 slides. Base order, front/back in order: Hazel
   front, Home in Loomis back, Home in Folsom front, Home in Rocklin
   back, Home in Rescue front, Home in Stockton front, Home in
   Stockton front, Home in Modesto back, Home in Folsom front, Home
   in Modesto front, Home in Lincoln front, Home in Folsom front.
   Beginning alternates front, back, front, back, front. Only 3 back
   views exist now, so front views follow in a row at the end, the
   allowed exception. Never 2 backs in a row. Random start on every
   load, see js/6-boot.js, so a refresh shows another home first.
   SER, BRADY, PALM and RIO are out of the hero in v9. 4641 Dehone
   Cir, Folsom, is in, as a stock placeholder, SHAWOOD at Folsom,
   Birch to-be-built, $1,399,990, not move-in ready, no real front
   photo exists yet, not the Hazel photo. Real Zillow photos swapped
   in Nov 10, 2026, live browser pull Nov 9, 7:07 to 7:15 PM PST,
   re-checked Nov 9, 7:15 PM, all HEAD 200: Slot 2 ex-BRADY, 2561
   Ladd Rd, Modesto, ACTIVE $1,550,000, back Photo 8, wooden deck
   with two white chairs overlooking pool, served 800x532, upscales
   about 2.4x in the wide hero, its dusk Photo 1 front is not used,
   this slot is a back slot; Slot 3 ex-PALM, 2503 Breaker Way,
   Stockton, ACTIVE $549,000, Photo 1 front, daytime, sunny, served
   960x720, upscales about 2x, no back or pool photo exists, so its
   flag changed from back to front; Slot 4 ex-RIO, 7434 River Nine
   Dr, Modesto, FOR SALE $2,099,000, Photo 1 front, daytime, served
   960x720, upscales about 2x, its back Photo 12 is not used, this
   slot is front. Slot 1 ex-SER keeps the Unsplash fallback
   1583608205776, labeled Home in Folsom, STOCK PHOTO, not a toured
   home: the live browser pull Nov 9, 7:07 to 7:15 PM could not
   extract a direct CDN URL for Hyman House, 603 Figueroa St,
   Folsom, and its Instagram slide 1 front carries a large c. 1881
   text overlay in the lower third. Do not use a guessed CDN URL
   for Hyman House. Note: the two unused Zillow URLs from that pull
   returned 404 on re-check Nov 10, 3:15 AM, Ladd Rd Photo 1 front
   and Breaker Way Photo 3 second front/side, so neither is used
   anywhere. Stock and real slides are labeled by city only, no home
   or plan names. Only the home page uses this slideshow, in
   js/6-boot.js; every other page keeps its own photo. */
function heroSlidesData() {
  return [
    { label: 'Hazel', city: 'Folsom', src: 'https://shawood.com/wp-content/uploads/2025/03/SHAWOOD-at-Folsom-Hazel-Web-1-scaled.jpg', tag: 'REAL PHOTO, Builder photo, SHAWOOD, front view', view: 'front' },
    { label: 'Home in Loomis', city: 'Loomis', src: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1800&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home, back view', view: 'back' },
    { label: 'Home in Folsom', city: 'Folsom', src: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1800&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home, front view', view: 'front' },
    { label: 'Home in Rocklin', city: 'Rocklin', src: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1800&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home, back view', view: 'back' },
    { label: 'Home in Rescue', city: 'Rescue', src: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1800&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home, front view', view: 'front' },
    { label: 'Home in Stockton', city: 'Stockton', src: 'https://photos.zillowstatic.com/fp/485a93068adf09e0d306a372f1e63ce0-cc_ft_960.jpg', tag: 'REAL PHOTO, Zillow listing photo, not a toured home, front view', view: 'front' },
    { label: 'Home in Stockton', city: 'Stockton', src: 'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=1800&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home, front view', view: 'front' },
    { label: 'Home in Modesto', city: 'Modesto', src: 'https://photos.zillowstatic.com/fp/d76bef5a565ae73d4ef1894c9df66732-d_d.jpg', tag: 'REAL PHOTO, Zillow listing photo, not a toured home, back view', view: 'back' },
    { label: 'Home in Folsom', city: 'Folsom', src: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1800&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home, front view', view: 'front' },
    { label: 'Home in Modesto', city: 'Modesto', src: 'https://photos.zillowstatic.com/fp/1dbf404656db92687ef3531b67ae7abe-cc_ft_960.jpg', tag: 'REAL PHOTO, Zillow listing photo, not a toured home, front view', view: 'front' },
    { label: 'Home in Lincoln', city: 'Lincoln', src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1800&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home, front view', view: 'front' },
    { label: 'Home in Folsom', city: 'Folsom', src: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1800&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home, SHAWOOD at Folsom, front view', view: 'front' }
  ];
}
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
  if (p.aiNote) return p.aiNote;
  if (p.ai) return 'Photo of Darien edited with AI.';
  if (!p.by) return '';
  return p.site === 'pexels' ? 'Backdrop photo by <a href="https://www.pexels.com/photo/' + p.id + '/" target="_blank" rel="noopener">' + esc(p.by) + '</a> on Pexels.'
    : 'Backdrop photo by <a href="https://unsplash.com/photos/' + p.id + '" target="_blank" rel="noopener">' + esc(p.by) + '</a> on Unsplash.';
}

// A small round picture for each tab in the top bar (the colored dot when a page has no photo yet).
// Home gets a house icon, not a photo thumb, so Home and Find Your Home
// never look the same at the top of the page.
function navThumb(k) {
  const p = PHOTOS[k], c = (typeof COLORS !== 'undefined' && COLORS[k]) || '#888';
  if (k === 'home') return '<span class="kw-home-icon" style="background:' + c + '" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15"><path d="M12 3.5 3 10.5h2.2v9.2h5.4v-5.6h2.8v5.6h5.4v-9.2H21L12 3.5z" fill="#fff"/></svg></span>';
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
