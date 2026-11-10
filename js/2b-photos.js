/* ===== Homepage backdrop =====
   HOME_BACKDROP_KEY is the photo key in PHOTOS below. The home page
   hero itself is now the fading slideshow in heroSlidesData() below,
   cycling through the toured homes one by one; the stock home-at-dusk
   photo ('payment') is only the fallback backdrop, labeled honestly
   in HOME_BACKDROP_NOTE and in the footer credit: a stock photo, not
   a home Darien toured. Headers, Nov 10, 2026, Darien's direction:
   one unique header photo per tab, top only, no header image used
   twice, no giant photo inside a tab. Finder is the keys photo,
   Custom Portal is the homes-popping-out-of-a-screen image, Shop by
   Payment is the digital-screen image with Darien as the helper, Cart
   is the family-with-cart image, Assumable is Assumable Home 2 as its
   header only, and ADU is the Ridge Park Zillow listing photo. To use
   a real tour-home photo later, add it to img/ as <key>-1920.jpg,
   <key>-960.jpg and <key>-tile.jpg, add a PHOTOS entry for it, and
   point this key at it. */
const HOME_BACKDROP_KEY = 'payment';
const HOME_BACKDROP_NOTE = 'Hero photos cycle through the homes Darien toured, one at a time. Real listing photos are labeled REAL PHOTO, builder and listing photos are labeled as such, and stock photos are labeled STOCK PHOTO, never as a real photo of the home.';
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
  adu: { pos: '50% 50%', aiNote: 'Front photo: Zillow listing photo, Ridge Park, 5846 Ridge Park Dr, Loomis, 5 acres. Real listing photo, not stock.' },
  cart: { pos: '50% 50%', ai: true, aiNote: 'AI-generated image, ChatGPT, Dream Home Family Tour, not a real photo, not a real home. A family with a shopping cart full of miniature homes in front of a modern luxury home, dad pointing at the home. The FOR SALE sign reads $1,295,000, AI-invented, not a real home price, do not quote it as real. Cart tab header only, removed from Shop by Payment.' },
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
/* ===== Homepage hero slideshow, Nov 9, 2026 =====
   The home page hero cycles through the toured homes one by one,
   crossfading every 6 seconds, in traction order: Ridge Park first,
   then Cornwall photos A, B, C and D, then SER, PALM, HAVEN, Plan 7,
   Oak Rock, Hazel, Carlsberg 835, RIO and BRADY last. Real Zillow
   listing photos are labeled REAL PHOTO. Builder and listing photos
   from TOURED_MEDIA are labeled as builder or listing photos, never
   as real photos. A home with no verified photo uses the stock
   home-at-dusk photo below, labeled STOCK PHOTO. Only the home page
   uses this slideshow, in js/6-boot.js; every other page keeps its
   own photo. */
const TOUR_STOCK_IMG = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1800&q=80&auto=format&fit=crop';
function heroSlidesData() {
  const media = (typeof TOURED_MEDIA !== 'undefined') ? TOURED_MEDIA : {};
  const mediaPhoto = (k) => { const m = media[k]; return m ? (m.photo || (m.photos && m.photos[0]) || '') : ''; };
  return [
    { label: 'Ridge Park', city: 'Loomis', src: 'https://photos.zillowstatic.com/fp/cac6e1c31cfe3d7565b45a729b2028c0-d_d.jpg', tag: 'REAL PHOTO, Zillow listing photo' },
    { label: 'Cornwall, Photo A', city: 'Rocklin', src: 'https://photos.zillowstatic.com/fp/ac07c90610729589746756f36bd5036e-d_d.jpg', tag: 'REAL PHOTO, Zillow listing photo, dusk front, elevated' },
    { label: 'Cornwall, Photo B', city: 'Rocklin', src: 'https://photos.zillowstatic.com/fp/5dc51bd67ab2fd8a30808208e84b1baa-d_d.jpg', tag: 'REAL PHOTO, Zillow listing photo, dusk front, second angle' },
    { label: 'Cornwall, Photo C', city: 'Rocklin', src: 'https://photos.zillowstatic.com/fp/a60c046de98fbc09ac9fa05de42d9aaa-d_d.jpg', tag: 'REAL PHOTO, Zillow listing photo, daytime rear from pool' },
    { label: 'Cornwall, Photo D', city: 'Rocklin', src: 'https://photos.zillowstatic.com/fp/eb319e25af0ccd3fe1fe5c255577ce18-d_d.jpg', tag: 'REAL PHOTO, Zillow listing photo, dusk front, best of 77 to 82' },
    { label: 'SER', city: 'Folsom', src: mediaPhoto('ser') || TOUR_STOCK_IMG, tag: mediaPhoto('ser') ? 'Listing photo via MetroList' : 'STOCK PHOTO, not a toured home' },
    { label: 'PALM', city: 'Oakdale', src: mediaPhoto('palm') || TOUR_STOCK_IMG, tag: mediaPhoto('palm') ? 'Aerial listing photo via MetroList' : 'STOCK PHOTO, not a toured home' },
    { label: 'HAVEN', city: 'Rescue', src: mediaPhoto('haven') || TOUR_STOCK_IMG, tag: mediaPhoto('haven') ? 'Builder photo, Blue Mountain Communities' : 'STOCK PHOTO, not a toured home' },
    { label: 'Plan 7', city: 'Stockton', src: mediaPhoto('10732-stevie-dr') || TOUR_STOCK_IMG, tag: mediaPhoto('10732-stevie-dr') ? 'Builder photo, Century Communities' : 'STOCK PHOTO, not a toured home' },
    { label: 'Oak Rock', city: 'Folsom', src: mediaPhoto('t:oak-rock-folsom') || TOUR_STOCK_IMG, tag: mediaPhoto('t:oak-rock-folsom') ? 'Aerial photo from the prior listing of this home' : 'STOCK PHOTO, not a toured home' },
    { label: 'Hazel', city: 'Folsom', src: mediaPhoto('q:shawood-at-folsom-4681-dehone-circle') || TOUR_STOCK_IMG, tag: mediaPhoto('q:shawood-at-folsom-4681-dehone-circle') ? 'Builder photo, SHAWOOD' : 'STOCK PHOTO, not a toured home' },
    { label: 'Carlsberg, 835 Ridgeline Dr', city: 'Lincoln', src: mediaPhoto('t:carlsberg-835-ridgeline-dr') || TOUR_STOCK_IMG, tag: mediaPhoto('t:carlsberg-835-ridgeline-dr') ? 'Builder photo, Toll Brothers' : 'STOCK PHOTO, not a toured home' },
    { label: 'RIO', city: 'Modesto', src: 'https://photos.zillowstatic.com/fp/02ffcbe525dd66aa93bba03512df8ce9-cc_ft_960.jpg', tag: 'REAL PHOTO, Zillow listing photo, dusk front view' },
    { label: 'BRADY', city: 'Modesto', src: TOUR_STOCK_IMG, tag: 'STOCK PHOTO, not a toured home, no verified front photo on file yet' }
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
