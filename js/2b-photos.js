/* ===== Homepage backdrop =====
   HOME_BACKDROP_KEY is the photo key in PHOTOS below. The home page
   hero itself is now the 3D card flip stack in heroSlidesData() below,
   cycling through the toured homes one by one; the stock home-at-dusk
   photo ('payment') is only the fallback backdrop, labeled honestly
   in HOME_BACKDROP_NOTE and in the footer credit: a stock photo, not
   a home Darien toured. Headers, Nov 10, 2026, Darien's direction:
   one unique header photo per tab, top only, no header image used
   twice, no giant photo inside a tab. Finder is the keys photo,
   Custom Portal is a real Unsplash photo of a modern home with a
   pool, not the AI screen image, Shop by Payment is the digital-screen
   image with Darien as the helper in a black suit, looking at the
   screen, Cart is the Dream Home Shopping in the Suburbs image, a man
   pushing a shopping cart full of miniature houses, Assumable is
   Assumable Home 2 as its header only, and ADU is a stock modern home
   with a backyard from Unsplash, not Ridge Park and not a Home hero
   slide. To use a real tour-home photo later, add it to img/ as
   <key>-1920.jpg, <key>-960.jpg and <key>-tile.jpg, add a PHOTOS entry
   for it, and point this key at it. */
const HOME_BACKDROP_KEY = 'payment';
const HOME_BACKDROP_NOTE = 'Hero photos flip through 12 homes, two at a time, in a freshly shuffled order on every visit to the home page. All 12 are Unsplash stock photos, 3840 pixels wide, labeled STOCK PHOTO, never as a real photo of a home.';
/* ===== Stock fallback, v10, Nov 10, 2026 =====
   TOUR_STOCK_IMG was deleted in an earlier cleanup, which crashed the
   home page: touredMarqueeHtml, touredSimilarHtml, finderPhotoHtml
   and cartPhotoFor all read it, so render() threw a ReferenceError
   and the whole home page below the hero stayed blank. It is defined
   again here. It is a real Unsplash photo, a small house by a lake,
   3840 pixels wide, never a toured home, and everywhere it renders
   it is labeled STOCK PHOTO, not this home. It is NOT the old
   1613490493576 photo, which was wrongly shown as Brady and must
   never be used as Brady again. The toured marquee and similar-homes
   lists now only include homes with a verified real photo, so this
   fallback almost never renders for a toured home. */
const TOUR_STOCK_IMG = 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1800&q=80&auto=format&fit=crop';
const PV = '?v=__PHOTO_V__'; // changes whenever a photo changes, so browsers never show an old cached one
const PHOTOS = {
  home: { pos: '30% 30%', aiNote: 'Stock photo, a realtor handing keys to a couple, Pexels. Not Darien, not a real closing.' },
  guide: { pos: '70% 30%', ai: true },
  search: { pos: '50% 50%', by: 'Kindel Media', id: '9716228', site: 'pexels', src: 'https://images.pexels.com/photos/9716228/pexels-photo-9716228.jpeg?auto=compress&cs=tinysrgb' },
  assumable: { pos: '50% 50%', ai: true, aiNote: 'AI-generated image, ChatGPT, Assumable Home 2, not a real photo, not a real home. Sign text in the image is AI-generated.' },
  'zero-down': { pos: '52% 50%', by: 'Brian Zajac', id: 'g6LLnC-rn0E' },
  payment: { pos: '50% 50%', ai: true, aiNote: 'AI-generated image, ChatGPT, Modern Home Search Showroom, not a real photo. Darien is the helper in the black suit, looking at the screen with the customer, showing homes by monthly payment. A different man presses the Monthly Payment button. Prices on the screen, $725,000, $849,000 and $1,195,000, are AI-invented, not real homes, do not quote them as real.' },
  'new-builds': { pos: '56% 45%', by: 'Troy Mortier', id: '9GAdLexoV7U' },
  placer: { pos: '52% 55%', by: 'Roger Starnes Sr', id: 'pGH1-iHveX0' },
  stockton: { pos: '50% 50%', by: 'Cosmin Gurau', id: '3cDza1lTxCQ' },
  refinance: { pos: '62% 50%', by: 'Luca Bravo', id: 'zAjdgNXsMeg' },
  build: { pos: '74% 53%', by: 'Lili Kovac', id: 'BSQq5dRT_KU' },
  about: { pos: '50% 62%', by: 'Get Lost Mike', id: '6267516', site: 'pexels', src: 'https://images.pexels.com/photos/6267516/pexels-photo-6267516.jpeg?auto=compress&cs=tinysrgb' },
  alerts: { pos: '50% 50%', by: 'Roger Starnes Sr', id: 'LUdiEvMAyQ8' },
  adu: { pos: '50% 50%', aiNote: 'Stock photo, modern home with a backyard, Unsplash. Not a real ADU, not a home Darien toured.' },
  cart: { pos: '50% 50%', ai: true, aiNote: 'AI-generated image, ChatGPT, Dream Home Shopping in the Suburbs, not a real photo, not a real home. A man pushes a shopping cart full of miniature houses down a suburban street, pointing at a modern home. Cart tab header only.' },
  /* Headers, Nov 10, 2026, Darien's direction: one unique header photo
     per tab, top only, no header image used twice. Finder is the keys
     photo, Darien handing keys to a couple. Custom Portal is now a
     real Unsplash photo, a modern home with a swimming pool, not the
     AI homes-popping-out-of-a-screen image. The old Dream Home
     Shopping Adventure family-pushing-cart image is retired from
     headers, a backup copy is in ~/workspace/preview-v10/. */
  portal: { pos: '50% 50%', src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop', aiNote: 'Stock photo, modern home with a swimming pool, Unsplash. Not a real home Darien toured, not a Custom Portal listing. Custom Portal header only.' },
  finder: { pos: '50% 40%', ai: true, aiNote: 'AI-generated image of Darien handing over the keys to a couple. It is not a photo of a real closing.' },
};
/* ===== Homepage hero slideshow, v10, Nov 10, 2026 =====
   Hero v10, mix of G and D plus dual-card pan, picked Nov 9. 3D card
   flip stack plus parallax scroll, no plain fade. Two homes are
   visible at once, left and right, both coming into the screen, the
   left home pans left and the right home pans right over the 8
   second hold, so you see more of each home, and they rotate with
   the cards. 12 slides, ALL Unsplash only, all w=3840, every one
   visually checked Nov 10, 2026 as a sharp daytime or dusk house
   exterior, no interiors, no cars, no portraits. Darien's Nov 10
   direction: only Unsplash in the hero, because Unsplash is the only
   source that is 4K. The v9 Zillow photos (2561 Ladd Rd, 2503
   Breaker Way, 7434 River Nine Dr, 960x720 and 800x532, blurry
   upscaled) are OUT, Hazel the SHAWOOD builder photo is OUT, and
   SER, BRADY, PALM and RIO stay OUT. Base order, front/back in
   order: front, back, front, back, front, back, front, back, front,
   front, front, front. Only 4 back views exist, so front views
   follow in a row at the end, the allowed exception. Never 2 backs
   in a row. The order is reshuffled on every home page mount, see
   heroShuffleOrder in js/6-boot.js, fronts shuffle among front slots
   and backs among back slots, so the pattern above always holds and
   a click on Home never shows the same starting pair. Random start
   on every load, never the same start twice in a row, stored in
   sessionStorage. Labels are city only, no home or plan names,
   except slide 12, the Birch placeholder: Home in Folsom, SHAWOOD
   at Folsom, 4641 Dehone Cir, to-be-built, no real front photo
   exists yet, not the Hazel photo. */
function heroSlidesData() {
  return [
    { label: 'Home in Sacramento', city: 'Sacramento', src: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'front' },
    { label: 'Home in Rocklin', city: 'Rocklin', src: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'back' },
    { label: 'Home in Folsom', city: 'Folsom', src: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'front' },
    { label: 'Home in Modesto', city: 'Modesto', src: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'back' },
    { label: 'Home in Lincoln', city: 'Lincoln', src: 'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'front' },
    { label: 'Home in Stockton', city: 'Stockton', src: 'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'back' },
    { label: 'Home in Loomis', city: 'Loomis', src: 'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'front' },
    { label: 'Home in Oakdale', city: 'Oakdale', src: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'back' },
    { label: 'Home in Roseville', city: 'Roseville', src: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'front' },
    { label: 'Home in El Dorado Hills', city: 'El Dorado Hills', src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'front' },
    { label: 'Home in Lodi', city: 'Lodi', src: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home', view: 'front' },
    { label: 'Home in Folsom', city: 'Folsom', src: 'https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?w=3840&q=80&auto=format&fit=crop', tag: 'STOCK PHOTO, not a toured home, SHAWOOD at Folsom, Birch placeholder, 4641 Dehone Cir', view: 'front' }
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
