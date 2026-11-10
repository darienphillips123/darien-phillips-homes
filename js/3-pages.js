/* ===== Page registry ===== */
const PAGES = {};
const PLACE_PAGES = ['assumable', 'new-builds', 'zero-down', 'payment'];
function def(key, o) { PAGES[key] = Object.assign({ key }, o); }
const opt = (v, t, cur) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>';
const sel = (id, opts, cur, label) => '<div class="field"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(([v, t]) => opt(v, t, cur)).join('') + '</select></div>';
const moneyField = (id, label, val, hint, ph) => '<div class="field"><label for="' + id + '">' + esc(label) + '</label><span class="money"><i>$</i><input id="' + id + '" type="text" inputmode="numeric" value="' + (val ? esc(comma(val)) : '') + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '></span>' + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</div>';
const pctField = (id, label, val, hint) => '<div class="field"><label for="' + id + '">' + esc(label) + '</label><span class="money suf"><input id="' + id + '" type="text" inputmode="decimal" value="' + esc(val) + '"><i>%</i></span>' + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</div>';
const PRICE_OPTS = [[0, 'Any price'], [400000, 'Up to $400k'], [500000, 'Up to $500k'], [600000, 'Up to $600k'], [700000, 'Up to $700k'], [800000, 'Up to $800k'], [1000000, 'Up to $1M']];
const LOT_OPTS = [[0, 'Any lot size'], [0.11, '5,000+ sq ft lot'], [0.25, '1/4 acre+'], [0.5, '1/2 acre+'], [1, '1 acre+'], [2, '2 acres+'], [5, '5 acres+']];
const LOT_SQFT_OPTS = [[0, 'Any lot size'], [5000, '5,000+ sq ft lot'], [10890, '1/4 acre+'], [21780, '1/2 acre+'], [43560, '1 acre+'], [87120, '2 acres+']];
const BED_OPTS = [[0, 'Any'], [2, '2+'], [3, '3+'], [4, '4+'], [5, '5+']];
const BATH_OPTS = [[0, 'Any'], [2, '2+'], [2.5, '2.5+'], [3, '3+']];
const SIZE_OPTS = [[0, 'Any'], [1200, '1,200+ sq ft'], [1500, '1,500+ sq ft'], [1800, '1,800+ sq ft'], [2000, '2,000+ sq ft'], [2500, '2,500+ sq ft'], [3000, '3,000+ sq ft']];
function countyChips(withAll, more) {
  const cur = placeCounty();
  const items = (withAll ? [['', 'All areas']] : []).concat(MAIN_COUNTIES.concat(more || []).map((c) => [c, c + ' County']));
  return '<div class="chips" role="group" aria-label="Area"><span class="mono">Area</span>' + items.map(([v, t]) => '<button type="button" class="chip" data-county="' + esc(v) + '" aria-pressed="' + ((v || null) === (cur || null) && !(S.place && S.place.k === 'town' && v === '') ? 'true' : 'false') + '">' + esc(t) + '</button>').join('') +
    (S.place && S.place.k === 'town' ? '<span class="place-pill">' + esc(S.place.n) + '<button type="button" data-clear-place aria-label="Show all areas">×</button></span>' : '') + '</div>';
}
function bindCounty(root, after) {
  root.querySelectorAll('[data-county]').forEach((b) => b.addEventListener('click', () => {
    setPlace(b.dataset.county ? { k: 'county', n: b.dataset.county } : null);
    after();
  }));
}
function bindMoney(id, fn) {
  const el = $(id);
  if (!el) return;
  el.addEventListener('input', () => fn(parseMoney(el.value)));
  el.addEventListener('blur', () => { const v = parseMoney(el.value); if (v > 0) el.value = comma(v); });
}
function pager(listId, moreId, items, cardFn, state) {
  const list = $(listId), more = $(moreId);
  if (!items.length) { list.innerHTML = state.empty; more.hidden = true; return; }
  list.innerHTML = items.slice(0, state.shown).map(cardFn).join('');
  const left = items.length - Math.min(state.shown, items.length);
  more.hidden = left <= 0;
  more.textContent = 'Show ' + Math.min(12, left) + ' more (' + left + ' left)';
}

/* ===== Home ===== */
const TILE_TEXT = {
  finder: 'Filter every home on this site by price, size, lot, stories and the words in the listings, all in one place.',
  portal: 'Tell Darien what you want once, and he builds your own custom MLS portal and emails it to you.',
  guide: 'New to buying? Every step from pre-approval to keys, plus every real estate word explained.',
  assumable: 'Take over a seller\'s low-rate FHA or VA loan. Learn how, then browse homes.',
  'zero-down': 'VA, FHA with California\'s MyHome loan, USDA and builder help in every county.',
  payment: 'Tell us your monthly budget and see the prices and homes that fit it.',
  'new-builds': 'Over 450 new-home communities in every city MetroList covers, with builder deals and move-in ready homes.',
  search: 'Every home for sale on a map, with filters for pool, single story, acreage and more.',
  refinance: 'See your new payment, break-even point and the refinance options that fit your loan.',
  adu: 'Can a home add a backyard cottage or in-law suite? Your city\'s rules, free plans and homes with room.',
  build: 'Estimate what it costs to build on your own lot, from land to move-in.',
  cart: 'Homes you put in your cart, like shopping. Ask Darien for more info on all of them at once.',
  about: 'Who Darien is, how he helps buyers, and how to reach him.'
};
const POPULAR = ['Loomis', 'Roseville', 'Rocklin', 'Lincoln', 'Auburn', 'Sacramento', 'Elk Grove', 'Folsom', 'Stockton', 'Lodi', 'Manteca', 'Lathrop', 'Tracy', 'Modesto', 'Salida', 'Turlock'];
def('home', {
  nav: 'Home', scene: 'home', kicker: 'Darien Phillips · REALTOR®',
  title: 'Come on in.',
  title2: 'The right home is waiting.',
  sub: 'Homes for sale in Placer, Sacramento, San Joaquin and Stanislaus, with real monthly costs and a local realtor who will walk you through them.',
  heroSearch: false,
  photoKey: () => HOME_BACKDROP_KEY,
  heroNote: () => 'Hero photos cycle through the homes Darien toured, one at a time. Real listing photos are labeled REAL PHOTO, builder and listing photos are labeled as such, and stock photos are labeled STOCK PHOTO, never as a real photo of the home.',
  ctas: () => '<button type="button" class="btn btn-pa" data-go="finder">Find your home</button><button type="button" class="hero-quiet" data-go="search">Search every home</button>',
  html() {
    const tiles = Object.keys(TILE_TEXT).map((k) => '<button type="button" class="tile" data-go="' + k + '" style="--tc:' + PAGES[k].color + '">' + thumbBox(k) + '<div class="body"><b>' + esc(PAGES[k].tileTitle || PAGES[k].nav) + '</b><span>' + esc(TILE_TEXT[k]) + '</span></div></button>').join('');
    return '<section class="blk g-start"><div class="wrap"><button type="button" class="panel g-banner" data-go="guide"><span class="g-banner-k">New to buying a home?</span><b>Start with the beginner\'s guide</b><span>Every step from pre-qualification to closing, what EMD, escrow and closing costs mean, and a chart of the whole process.</span><span class="g-banner-go">Read the guide →</span></button></div></section>' + helpHtml() + '<section class="blk" id="tiles"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Start here</p><h2>What are you looking for?</h2></div></div><div class="tiles">' + tiles + '</div></div></section>' + touredHtml() + touredMarqueeHtml() +
      sellerHtml() + '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Popular places</h2><p>Pick a town to see assumable homes, new builds, $0-down options and homes by payment there.</p></div></div>' +
      '<div class="places">' + POPULAR.map((n) => '<button type="button" class="chip" data-place="' + esc(n) + '">' + esc(n) + '</button>').join('') + '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="statrow">' +
        '<div class="panel"><div class="v num">' + DATA.assumables.length + '</div><div class="k">Homes with assumable loans in Darien\'s custom portal</div></div>' +
        '<div class="panel"><div class="v num">' + DATA.communities.length + '</div><div class="k">New-home communities across four counties</div></div>' +
        '<div class="panel"><div class="v num">$0</div><div class="k">Down payment possible with VA, USDA or FHA plus CalHFA MyHome</div></div>' +
        '<div class="panel"><div class="v num">' + RATES.conv + '%</div><div class="k">Average 30-year rate on Oct 29, 2026. Assumable loans are often half that.</div></div>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>How Darien helps</h2></div></div><div class="why">' +
        '<div class="panel"><b>Your own home search</b><p>Darien sets up a custom portal with every home in your range. New matches come by email each day, and you can save or pass on each one.</p></div>' +
        '<div class="panel"><b>Low-rate and $0-down know-how</b><p>He finds homes with assumable FHA and VA loans and lines up $0-down options, then walks you through the lender\'s approval.</p></div>' +
        '<div class="panel"><b>New builds without the runaround</b><p>Builders usually need your agent at the first visit. Text Darien first and he\'ll register you and compare builder offers.</p></div>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="panel accent bar"><div><b>Get homes by email</b><p class="note">Tell Darien what you want and get new matches every day, or ask for your own custom portal.</p></div><button type="button" class="btn btn-pa" data-go="alerts">Sign up</button></div></div></section>';
  }
});

/* ===== How Darien can help: four relatable situations, not client stories =====
   Replaces the old Instagram boxes on the home page.
   Each option opens a short warm answer plus a button to message Darien.
   The scenarios below it are common situations, labelled as such, with no
   fake names, no fake quotes and no client attributions. No buyer guide
   and no rent versus mortgage breakdown here. */
const HELP_OPTIONS = [
  { t: 'I have been looking for months', a: 'Months of scrolling and starting over is tiring, and it is not your fault. The listings all start to look the same after a while. Tell me what matters most and I will narrow it to homes that actually fit, and keep the new matches coming to you.', sms: 'Hi Darien, I have been looking for months and I could use your help.' },
  { t: 'I have been looking for years', a: 'Two years of looking, and being outbid or priced out more than once, wears anyone down. It is fair to wonder if buying is even worth it. Let me look at your numbers and your must-haves with fresh eyes, and we will find a path that fits.', sms: 'Hi Darien, I have been looking for years and I feel stuck.' },
  { t: 'I do not know where to start', a: 'Not knowing where to start is the best place to start. We will go one step at a time: what you can afford each month, what matters most in a home, and what the first step looks like. No pressure, just a clear plan.', sms: 'Hi Darien, I do not know where to start with buying a home.' },
  { t: 'Is buying worth it for me', a: 'That is a fair question, and the answer is different for everyone. We will look at your rent, your income, and what a home would really cost each month, and then you can decide with real numbers in front of you.', sms: 'Hi Darien, is buying worth it for me? Can we look at my numbers?' }
];
const HELP_SCENARIOS = [
  'A household making around $100,000 a year, looking for 8 months, spending every weekend scrolling listings and starting over, tired and no closer to a home.',
  'A renter paying $2,400 a month who would rather keep renting than go through the whole buying process, the paperwork, the showings, the waiting.',
  'A family looking for 2 years, feeling stuck, outbid and priced out more than once, wondering if buying is even worth it.',
  'A first-time buyer with steady income who does not know where to start, rent keeps going up, and dreads how much energy buying seems to take.'
];
function helpHtml() {
  const msgBtn = (body, label) => '<a class="btn btn-pa btn-sm" href="sms:+12098826469?&body=' + encodeURIComponent(body) + '">' + esc(label || 'Message Darien') + '</a>';
  return '<section class="blk" id="help"><div class="wrap">' +
    '<div class="shead" data-grow><div><p class="mono eyebrow">How I can help</p><h2>This Is How I Can Be More Helpful to You</h2><p>Pick the one that sounds like you. There is no wrong answer, and no pressure after.</p></div></div>' +
    '<div class="help-opts">' + HELP_OPTIONS.map((o) => '<details class="help-opt" data-grow><summary>' + esc(o.t) + '</summary><p>' + esc(o.a) + '</p><div class="help-msg">' + msgBtn(o.sms) + '<p class="note">Darien Phillips, REALTOR, 209.882.6469, DRE 02439090</p></div></details>').join('') + '</div>' +
    '<div class="help-scen" data-grow><p class="help-label"><b>Sound familiar? These are common situations, not client stories.</b></p>' +
    '<div class="help-scenarios">' + HELP_SCENARIOS.map((s) => '<p class="help-scenario" data-grow>' + esc(s) + '</p>').join('') + '</div></div>' +
    '<p class="help-close" data-grow>Let me show you how I can find you the right home with less energy involved. Message me and we will get started on your search.</p>' +
    '<div class="actions" data-grow>' + msgBtn('Hi Darien, can you help me find the right home with less energy involved?') + '<a class="btn btn-line" href="tel:+12098826469">Call 209.882.6469</a></div>' +
    '<p class="note" style="margin-top:8px">Darien Phillips, REALTOR, DRE 02439090</p>' +
    '</div></section>';
}

/* ===== Homes I toured =====
   Only homes verified still for sale on Nov 7, 2026, plus BRADY, toured
   Nov 9, 2026. Sheet listings (RIO, SER, PALM, HAVEN) and the site-data
   Plan 7 quick move-in render from their real property records. The
   Hazel quick move-in, three resales and one Carlsberg quick move-in
   are custom cards with real facts verified live the same day; the
   Hazel and Carlsberg homes have no property page of their own on this
   site (only Stockton homes and communities do), so those cards link
   to the community page, and the resales link to Zillow. Toured order
   is by traction, not price: Ridge Park, Cornwall, SER, PALM, HAVEN,
   Plan 7, Oak Rock, Hazel, Carlsberg 835 only, RIO, BRADY last.
   Left out: Candlewood (in contract), Black Oak (pending), Glacier
   (Estates sold out), Plan 3 / Plan 6 / Plan 4 (availability
   unverified), Aspen and El Dorado (model only), 1905 Ralston (tour
   not confirmed), 2773 Via Fiori (sold), and the second Carlsberg
   quick move-in (same plan tour as 835, so only 835 is kept). */
const TOURED_CUSTOM = [
  { key: 't:ridge-park-loomis', title: '5-bedroom home in Loomis', addr: '5846 Ridge Park Dr, Loomis', price: '$2,980,000', priceNum: 2980000, beds: 5, baths: 4, sqft: 3877, facts: '5 bd · 4 ba · 3,877 sq ft · 5 acres', hook: 'Gated Sierra Ridge Estates on 5 acres with a pool. Price shown is the live price, cut Oct 29, 2026. The stored price on file is still $3,099,000, Darien has not yet confirmed updating it.', city: 'Loomis, CA', z: 'https://www.zillow.com/homedetails/5846-Ridge-Park-Dr-Loomis-CA-95650/17676184_zpid/' },
  { key: 't:cornwall-rocklin', title: '5-bedroom home in Rocklin', addr: '4022 Cornwall Ct, Rocklin', price: '$2,100,000', priceNum: 2100000, beds: 5, baths: 6, sqft: 4675, facts: '5 bd · 6 ba · 4,675 sq ft · 0.42 acre', hook: 'Frank Lloyd Wright Prairie style on an elevated lot, with a pool and putting green.', city: 'Rocklin, CA', z: 'https://www.zillow.com/homedetails/4022-Cornwall-Ct-Rocklin-CA-95677/188166793_zpid/' },
  { key: 't:oak-rock-folsom', title: '4-bedroom home in Folsom', addr: '117 Oak Rock Cir, Folsom', price: '$1,040,000', priceNum: 1040000, beds: 4, baths: 2.5, sqft: 2657, facts: '4 bd · 2.5 ba · 2,657 sq ft · 0.39 acre', hook: 'Extensively remodeled single story in American River Canyon.', city: 'Folsom, CA', z: 'https://www.zillow.com/homedetails/117-Oak-Rock-Cir-Folsom-CA-95630/25988487_zpid/' },
  { key: 'q:shawood-at-folsom-4681-dehone-circle', title: 'Hazel home in Folsom', addr: '4681 Dehone Circle, Folsom', price: '$1,797,888', priceNum: 1797888, beds: 5, baths: 5.5, sqft: 4346, facts: '5 bd · 5.5 ba · 4,346 sq ft', hook: 'SHAWOOD at Folsom, Homesite 52. Move-in ready, est. Nov 2026.', city: 'Folsom, CA', page: 'shawood-at-folsom', pageLabel: 'See SHAWOOD at Folsom' },
  { key: 't:carlsberg-835-ridgeline-dr', title: 'Carlsberg home in Lincoln', addr: '835 Ridgeline Dr, Lincoln', price: '$1,345,000', priceNum: 1345000, beds: 4, baths: 4.5, sqft: 3328, facts: '4 bd · 4.5 ba · 3,328 sq ft · 1 story', hook: 'One-story Carlsberg at Ridgeline at Bickford, ready in December.', city: 'Lincoln, CA', page: 'ridgeline-at-bickford-ranch', pageLabel: 'See Ridgeline at Bickford' },
  { key: 't:brady-modesto', title: '5-bedroom home in Modesto', addr: '829 Brady Ave, Modesto', price: '$1,299,950', priceNum: 1299950, beds: 5, baths: 3.5, sqft: 3150, facts: '5 bd · 3 full + 1 half ba · 3,150 sq ft · 10,794 sq ft lot', hook: 'Hyper modern new build, built 2026, with a detached ADU about 450 sq ft and paid solar. Tour filmed Nov 9, 2026, reel link to be added.', city: 'Modesto, CA', z: zillowFor('829 Brady Ave', 'Modesto', '95354') }
];
/* ===== Toured cards: real photo + Darien's tour video, side by side =====
   Photos were visually checked in the workspace on Nov 7, 2026, and the
   Zillow front photos for RIO, Ridge Park and Cornwall were verified live
   Nov 9, 2026. RIO, Ridge Park and Cornwall show real Zillow listing
   photos, labeled REAL PHOTO. Cornwall has four real photos, A, B, C and
   D, mixed together as Darien picked Nov 9, with a Prev/Next carousel
   on its card. Oak Rock's photo is an aerial from the prior listing of
   the same house, pre-remodel, and is labelled as such. Builder photos
   are labelled as builder photos. Videos are Darien's own reels,
   verified Nov 7, 2026. BRADY has no verified front photo on file and
   no reel link yet, so its card says so plainly instead of showing a
   photo that is not the home. The Carlsberg video is one plan-level
   tour; its December move-in line points to 835 Ridgeline Dr, the only
   Carlsberg card kept. No card ever renders a gold panel: a home with
   no photo shows its tour video link instead, and a home with no photo
   and no video link yet shows a plain note. */
const TOURED_MEDIA = {
  'rio': { photo: 'https://photos.zillowstatic.com/fp/02ffcbe525dd66aa93bba03512df8ce9-cc_ft_960.jpg', credit: 'REAL PHOTO, Zillow listing photo, dusk front view, Zillow photo 1', video: 'https://www.tiktok.com/embed/v2/7703266645698989326', watch: 'https://www.tiktok.com/@realtordarien/video/7703266645698989326', plat: 'TikTok' },
  't:ridge-park-loomis': { photo: 'https://photos.zillowstatic.com/fp/cac6e1c31cfe3d7565b45a729b2028c0-d_d.jpg', credit: 'REAL PHOTO, Zillow listing photo, aerial front view, Zillow photo 3 of 86', video: 'https://www.instagram.com/reel/De7Q5GZyqYJ/embed/', watch: 'https://www.instagram.com/reel/De7Q5GZyqYJ/', plat: 'Instagram' },
  't:cornwall-rocklin': { photo: 'https://photos.zillowstatic.com/fp/ac07c90610729589746756f36bd5036e-d_d.jpg', photos: ['https://photos.zillowstatic.com/fp/ac07c90610729589746756f36bd5036e-d_d.jpg', 'https://photos.zillowstatic.com/fp/5dc51bd67ab2fd8a30808208e84b1baa-d_d.jpg', 'https://photos.zillowstatic.com/fp/a60c046de98fbc09ac9fa05de42d9aaa-d_d.jpg', 'https://photos.zillowstatic.com/fp/eb319e25af0ccd3fe1fe5c255577ce18-d_d.jpg'], photoLabels: ['A dusk front elevated', 'B dusk front second angle', 'C daytime rear from pool', 'D dusk front best of 77-82'], credit: 'REAL PHOTO, Zillow listing photos. A: photo 1 of 83, dusk front, elevated. B: photo 2 of 83, dusk front, second angle. C: photo 28 of 83, daytime rear from pool. D: photo 82 of 83, dusk front, best of photos 77 to 82. Darien picked all four, mixed together, Nov 9.', video: 'https://www.instagram.com/reel/DfbX0B1STYQ/embed/', watch: 'https://www.instagram.com/reel/DfbX0B1STYQ/', plat: 'Instagram' },
  'ser': { photo: 'https://mediarem.metrolist.net/metrolist/listingpics/bigphoto/2026/09/21/16a81d77-1658-4c22-b2b9-2c013064d826.jpg', credit: 'Listing photo via MetroList', video: 'https://www.instagram.com/reel/DfSUUIJyqGq/embed/', watch: 'https://www.instagram.com/reel/DfSUUIJyqGq/', plat: 'Instagram' },
  'palm': { photo: 'https://mediarem.metrolist.net/metrolist/listingpics/bigphoto/2026/10/15/65fe65dd-29aa-41f2-ae83-a54e37dbf999.jpg', credit: 'Aerial listing photo via MetroList', video: 'https://www.instagram.com/reel/DfQIcvGyUNP/embed/', watch: 'https://www.instagram.com/reel/DfQIcvGyUNP/', plat: 'Instagram' },
  'haven': { photo: 'https://bluemountaincommunities.com/wp-content/uploads/2024/02/BMC_Oakhaven_-Plan2_B_CS_07-1600x1120.jpg', credit: 'Builder photo, Blue Mountain Communities', video: 'https://www.instagram.com/reel/DfQzh2jyHQo/embed/', watch: 'https://www.instagram.com/reel/DfQzh2jyHQo/', plat: 'Instagram' },
  '10732-stevie-dr': { photo: 'https://www.centurycommunities.com/globalassets/century/assets/elevations--amenities/ccs/ccs--ca/nor-cal/heritage/updated-elevations/plan-7-b-55x100-plan-7-8-9-elev-b-craftsman-22.jpg?width=1155&height=650&mode=crop&format=webp&v=409', credit: 'Builder photo, Century Communities', video: 'https://www.instagram.com/reel/DfYhGrmyWOC/embed/', watch: 'https://www.instagram.com/reel/DfYhGrmyWOC/', plat: 'Instagram' },
  't:oak-rock-folsom': { photo: 'https://pi.movoto.com/p/102/226095956_0_mu6iZv_p.webp', credit: 'Aerial photo from the prior listing of this home', video: 'https://www.instagram.com/reel/DfKiQROyqLb/embed/', watch: 'https://www.instagram.com/reel/DfKiQROyqLb/', plat: 'Instagram' },
  'q:shawood-at-folsom-4681-dehone-circle': { photo: 'https://shawood.com/wp-content/uploads/2025/03/SHAWOOD-at-Folsom-Hazel-Web-1-scaled.jpg', credit: 'Builder photo, SHAWOOD', video: 'https://www.tiktok.com/embed/v2/7705246029641157902', watch: 'https://www.tiktok.com/@realtordarien/video/7705246029641157902', plat: 'TikTok' },
  't:carlsberg-835-ridgeline-dr': { photo: 'https://cdn.tollbrothers.com/communities/14457/plans/265600/exteriors-resized/CLSBG_MODF_CA-SAC_3FE_1_920.jpg', credit: 'Builder photo, Toll Brothers, Modern Farmhouse elevation', video: 'https://www.tiktok.com/embed/v2/7704918374584732941', watch: 'https://www.tiktok.com/@realtordarien/video/7704918374584732941', plat: 'TikTok' },
  't:brady-modesto': { video: '', watch: '', plat: 'Instagram', credit: 'Tour filmed Nov 9, 2026, reel link to be added. No verified front photo on file for this home yet' }
};
/* The video cell shows the home photo as its poster, with a big play
   button and no profile picture. There is no embedded player on the
   card: tapping the poster opens the exact tour on Instagram or TikTok
   in a new tab, no login needed. A home with more than one verified
   photo, Cornwall with its four Zillow photos A, B, C and D, gets a
   Prev/Next photo carousel on the poster, starting with the first
   photo. A home with no verified photo never gets a gold panel: its
   poster is the tour video link itself, on a plain background, and a
   home with no photo and no video link yet, BRADY, shows a plain note
   saying the reel link is to be added. */
function touredVideoCell(m, poster) {
  const photos = (m.photos && m.photos.length) ? m.photos : ((poster || m.photo) ? [poster || m.photo] : []);
  const labels = m.photoLabels || [];
  const plat = m.plat.split(',')[0];
  if (!photos.length) {
    const note = '<span class="lux-fallback-note">' + esc(m.credit || 'Tour video link to be added') + '</span>';
    if (m.watch) return '<div class="lux-video"><a class="lux-video-poster lux-video-fallback" href="' + esc(m.watch) + '" target="_blank" rel="noopener" aria-label="Watch Darien\'s tour on ' + esc(plat) + ', opens in a new tab"><span class="lux-play"><span aria-hidden="true">▶</span> Watch the tour on ' + esc(plat) + '</span>' + note + '</a></div>';
    return '<div class="lux-video"><div class="lux-video-fallback">' + note + '</div></div>';
  }
  const nav = photos.length > 1 ? '<div class="photo-nav"><button type="button" data-photo-prev>Prev photo</button><span data-photo-count>Photo 1 of ' + photos.length + (labels[0] ? ', ' + esc(labels[0]) : '') + '</span><button type="button" data-photo-next>Next photo</button></div>' : '';
  const posterHtml = '<img src="' + esc(photos[0]) + '" alt="" loading="lazy" referrerpolicy="no-referrer" data-tour-photo>';
  const play = m.watch ? '<span class="lux-play"><span aria-hidden="true">▶</span> Watch the tour on ' + esc(plat) + '</span>' : '<span class="lux-play">' + esc(m.credit || 'Tour filmed Nov 9, 2026, reel link to be added') + '</span>';
  const posterLink = m.watch
    ? '<a class="lux-video-poster" href="' + esc(m.watch) + '" target="_blank" rel="noopener" aria-label="Watch Darien\'s tour on ' + esc(plat) + ', opens in a new tab">' + posterHtml + play + '</a>'
    : '<div class="lux-video-poster">' + posterHtml + play + '</div>';
  return '<div class="lux-video" data-tour-photos="' + photos.map(esc).join('|') + '" data-tour-labels="' + labels.map(esc).join('|') + '" data-tour-idx="0">' + posterLink + nav + '</div>';
}
/* Prev/Next on a toured photo carousel, Cornwall only for now. Swaps
   the poster photo and the Photo N of M label, and leaves the tour
   video link alone. */
document.addEventListener('click', (e) => {
  const btn = e.target.closest ? (e.target.closest('[data-photo-prev]') || e.target.closest('[data-photo-next]')) : null;
  if (!btn) return;
  const cell = btn.closest('[data-tour-photos]');
  if (!cell) return;
  const imgs = cell.dataset.tourPhotos.split('|');
  const labels = (cell.dataset.tourLabels || '').split('|');
  if (imgs.length < 2) return;
  let idx = parseInt(cell.dataset.tourIdx || '0', 10);
  idx = (idx + (btn.hasAttribute('data-photo-prev') ? -1 : 1) + imgs.length) % imgs.length;
  cell.dataset.tourIdx = String(idx);
  const imgEl = cell.querySelector('[data-tour-photo]');
  if (imgEl) imgEl.src = imgs[idx];
  const countEl = cell.querySelector('[data-photo-count]');
  if (countEl) countEl.textContent = 'Photo ' + (idx + 1) + ' of ' + imgs.length + (labels[idx] ? ', ' + labels[idx] : '');
});
function touredCredit(m) { return '<p class="note">' + esc(m.credit) + '. Video: <a href="' + esc(m.watch) + '" target="_blank" rel="noopener">Watch Darien\'s tour on ' + esc(m.plat.split(',')[0]) + '</a>.</p>'; }
/* A tap on a tour poster opens the reel in a new tab. The click is still
   tracked, best effort, so Darien can see which tours get watched. */
document.addEventListener('click', (e) => {
  const a = e.target.closest ? e.target.closest('.lux-video-poster') : null;
  if (!a) return;
  if (typeof beacon === 'function') { try { beacon('click', { h: 'Watched video tour: ' + a.href, s: 'Video', u: a.href }); } catch (x) { /* tracking is best effort */ } }
});

/* Wide square card: details on the left, the tour video on the right
   filling the full height of the card. The details stack: Click to get
   the details, Add to cart, See this home. */
function touredPropCard(p, cartKey) {
  const info = { h: propTitle(p, true), p: propPrice(p), b: propFacts(p), l: p.hook, city: p.city, z: p.addr && p.city ? zillowFor(p.addr, p.city, p.zip) : '', m: p.addr ? mapFor(p.addr + (p.city ? ', ' + p.city : '') + ', CA') : '' };
  const tour = (typeof toursFor === 'function' && toursFor(commOf(p)).length) ? '<span class="pill ok">▶ Video tour</span>' : '';
  const m = TOURED_MEDIA[p.key];
  // The home's own photo when the sheet has one is the video poster;
  // otherwise the verified photo from TOURED_MEDIA is. No video means
  // the photo itself fills the right side, never a stock photo passed
  // off as the home. No photo and no video means a plain note, never
  // a gold panel.
  const sheetPhoto = (p.img && /^https:\/\//i.test(p.img)) ? p.img : '';
  const media = m ? touredVideoCell(m, sheetPhoto) :
    ((sheetPhoto || (p.img && ON_WEB)) ? '<a class="lux-photo" href="#p/' + esc(p.key) + '" aria-label="' + esc(propTitle(p, true)) + '">' + photoImg('home', false, p.img) + '</a>' : '<div class="lux-photo"><div class="lux-video-fallback"><span class="lux-fallback-note">No verified photo on file for this home yet</span></div></div>');
  return '<article class="lux-card" data-grow><div class="lux-body">' +
    '<span class="lux-pill-static"><span class="pill ' + (p.kind === 'listing' ? 'ok' : 'pa') + '">' + esc(KIND_LABEL[p.kind]) + '</span>' + tour + '</span>' +
    '<h3>' + esc(propTitle(p, false)) + '</h3><p class="lux-hook">' + esc(p.hook || '') + '</p>' +
    (m ? touredCredit(m) : '') +
    '<p class="note">Price, facts, photos and links for this home are behind one tap.</p>' +
    '<div class="actions">' + details(info) + cartBtn(cartKey, propTitle(p, true), propPrice(p)) + '<a class="btn btn-line btn-sm" href="#p/' + esc(p.key) + '">See this home</a></div>' +
    '<div class="actions"><button type="button" class="btn btn-line btn-sm" data-toured-similar="' + esc(p.key) + '">Homes like this</button></div>' +
    '<div class="similar-panel" data-similar-panel="' + esc(p.key) + '" hidden></div></div>' +
    '<div class="lux-media">' + media + '</div></article>';
}
function touredCustomCard(t) {
  const info = { h: t.addr, p: t.price, b: t.facts, l: t.hook, city: t.city, z: t.z || '', m: mapFor(t.addr + ', CA') };
  // Click to get the details: no price, facts, hook or Zillow button open
  // on landing. The button opens the details first, then the agent
  // question at the end. See this home goes to Zillow for the resales
  // and to the community page for the builder homes.
  const see = t.z ? '<a class="btn btn-line btn-sm" href="' + esc(track(t.z, { h: info.h, s: 'Zillow', p: info.p })) + '" target="_blank" rel="noopener">See this home</a>' : '<a class="btn btn-line btn-sm" href="#p/' + esc(t.page) + '">' + esc(t.pageLabel) + '</a>';
  const m = TOURED_MEDIA[t.key];
  const media = m ? touredVideoCell(m, '') : '<div class="lux-photo"><div class="lux-video-fallback"><span class="lux-fallback-note">No verified photo on file for this home yet</span></div></div>';
  return '<article class="lux-card" data-grow><div class="lux-body">' +
    '<span class="lux-pill-static"><span class="pill ok">Toured</span><span class="pill">' + esc(t.city) + '</span></span>' +
    '<h3>' + esc(t.title) + '</h3><p class="lux-hook">' + esc(t.hook) + '</p>' +
    (m ? touredCredit(m) : '') + '<p class="note">Price, facts, photos and links for this home are behind one tap.</p>' +
    '<div class="actions">' + details(info) + cartBtn(t.key, t.addr, t.price) + see + '</div>' +
    '<div class="actions"><button type="button" class="btn btn-line btn-sm" data-toured-similar="' + esc(t.key) + '">Homes like this</button></div>' +
    '<div class="similar-panel" data-similar-panel="' + esc(t.key) + '" hidden></div></div>' +
    '<div class="lux-media">' + media + '</div></article>';
}
/* ===== Homes like this, toured homes only =====
   Every toured card has a Homes like this button that opens a panel
   with the top 3 similar homes from the toured list only, scored by
   same city, price within 25 to 50 percent, beds within 1, and sq ft
   within 25 percent. No facts are invented: every number comes from
   the property record or the verified custom card. Each similar home
   shows its photo, price, city, beds, baths and sq ft, plus a Click
   to get the details button that reuses the existing details() flow,
   details first and the agent question at the end, unchanged. A home
   with no verified photo, BRADY, shows the stock photo in the similar
   card, labeled STOCK PHOTO, never as a real photo of the home. */
function touredSimList() {
  const list = [];
  const pushProp = (key, cartKey) => {
    const p = (typeof PROP_BY !== 'undefined') ? PROP_BY[key] : null;
    if (!p) return;
    const m = TOURED_MEDIA[p.key];
    const img = (p.img && /^https:\/\//i.test(p.img)) ? p.img : (m ? (m.photo || (m.photos && m.photos[0]) || '') : '');
    list.push({
      id: p.key, title: propTitle(p, true), city: p.city || '', priceNum: p.price || 0, price: propPrice(p),
      beds: parseFloat(p.beds) || 0, baths: parseFloat(p.baths) || 0, sqft: p.sqft || 0,
      img, imgTag: img ? (m && m.credit ? m.credit : 'Listing photo') : '',
      info: { h: propTitle(p, true), p: propPrice(p), b: propFacts(p), l: p.hook, city: p.city, z: p.addr && p.city ? zillowFor(p.addr, p.city, p.zip) : '', m: p.addr ? mapFor(p.addr + (p.city ? ', ' + p.city : '') + ', CA') : '' },
      cartKey
    });
  };
  const pushCustom = (t) => {
    const m = TOURED_MEDIA[t.key];
    const img = m ? (m.photo || (m.photos && m.photos[0]) || '') : '';
    list.push({
      id: t.key, title: t.addr, city: t.city || '', priceNum: t.priceNum || 0, price: t.price,
      beds: t.beds || 0, baths: t.baths || 0, sqft: t.sqft || 0,
      img, imgTag: img ? (m && m.credit ? m.credit : 'Listing photo') : '',
      info: { h: t.addr, p: t.price, b: t.facts, l: t.hook, city: t.city, z: t.z || '', m: mapFor(t.addr + ', CA') },
      cartKey: t.key
    });
  };
  pushProp('rio', 'l:rio');
  pushProp('ser', 'l:ser');
  pushProp('palm', 'l:palm');
  pushProp('haven', 'l:haven');
  pushProp('10732-stevie-dr', 's:h39');
  TOURED_CUSTOM.forEach(pushCustom);
  return list;
}
function touredSimilarFor(entry) {
  const scored = touredSimList().filter((o) => o.id !== entry.id).map((o) => {
    let s = 0;
    if (o.city && entry.city && o.city === entry.city) s += 3;
    const pr = entry.priceNum ? Math.abs(o.priceNum - entry.priceNum) / entry.priceNum : 1;
    if (pr <= 0.25) s += 2; else if (pr <= 0.5) s += 1;
    if (Math.abs(o.beds - entry.beds) <= 1) s += 1;
    if (entry.sqft && Math.abs(o.sqft - entry.sqft) / entry.sqft <= 0.25) s += 1;
    return { o, s };
  }).sort((a, b) => b.s - a.s).slice(0, 3);
  return scored.map((x) => x.o);
}
function touredSimilarHtml(entry) {
  const sims = touredSimilarFor(entry);
  if (!sims.length) return '<p class="note">No similar toured home on file yet.</p>';
  return '<div class="similar-grid">' + sims.map((o) => {
    const img = o.img || TOUR_STOCK_IMG;
    const tag = o.img ? o.imgTag : 'STOCK PHOTO, not a toured home';
    return '<article class="similar-card">' +
      '<img src="' + esc(img) + '" alt="' + esc(tag + ', ' + o.title) + '" loading="lazy" referrerpolicy="no-referrer">' +
      '<div><span class="price">' + esc(o.price) + '</span><br><b>' + esc(o.title) + '</b><br>' + esc(o.city + ', ' + o.beds + ' bd, ' + o.baths + ' ba, ' + comma(o.sqft) + ' sq ft') +
      '<br><span class="note">' + esc(tag) + '</span><br>' + details(o.info) + '</div></article>';
  }).join('') + '</div>';
}
document.addEventListener('click', (e) => {
  const b = e.target.closest ? e.target.closest('[data-toured-similar]') : null;
  if (!b) return;
  const panel = document.querySelector('[data-similar-panel="' + b.dataset.touredSimilar + '"]');
  if (!panel) return;
  if (!panel.dataset.built) {
    const entry = touredSimList().find((x) => x.id === b.dataset.touredSimilar);
    if (!entry) return;
    panel.innerHTML = '<h4>Homes like this</h4><p class="note">Similar by city, price, beds and size, from the toured homes on this page only. No prices or facts are invented.</p>' + touredSimilarHtml(entry);
    panel.dataset.built = '1';
  }
  panel.hidden = !panel.hidden;
  b.textContent = panel.hidden ? 'Homes like this' : 'Hide homes like this';
});
/* ===== v5: full-width leftward marquee, Nov 9, 2026 =====
   Toured homes only, scored the same way as Homes like this. The
   strip is full width, not in a box, moves slowly left, loops to the
   other side, pauses on hover, and each card has a photo, price,
   city, beds, baths, sq ft, Click to get the details and Add to cart. */
function touredMarqueeHtml() {
  const list = touredSimList();
  if (!list.length) return '';
  const card = (o) => '<article class="card marquee-card">' +
    '<img src="' + esc(o.img || TOUR_STOCK_IMG) + '" alt="' + esc((o.img ? o.imgTag : 'STOCK PHOTO, not a toured home') + ', ' + o.title) + '" loading="lazy" referrerpolicy="no-referrer">' +
    '<div><span class="price">' + esc(o.price) + '</span><br><b>' + esc(o.title) + '</b><br>' + esc(o.city + ', ' + o.beds + ' bd, ' + o.baths + ' ba, ' + comma(o.sqft) + ' sq ft') +
    '<br><span class="note">' + esc(o.img ? o.imgTag : 'STOCK PHOTO, not a toured home') + '</span><br>' + details(o.info) + ' ' + cartBtn(o.cartKey, o.title, o.price) + '</div></article>';
  const cards = list.map(card).join('');
  return '<section class="blk marquee-blk" aria-label="Homes I toured, scrolling"><div class="marquee-wrap"><div class="marquee-track">' + cards + cards + '</div></div></section>';
}
/* ===== Homes with photos strip, Nov 10, 2026 =====
   Darien's direction: every tab has homes to see, with a real photo,
   price, city, beds, baths, sq ft, Click to get the details and Add to
   cart. This strip reuses the toured homes with a verified real photo
   (Zillow listing photos, MetroList listing photos and builder photos
   from TOURED_MEDIA). Homes with no verified photo are left out, never
   shown with a stock or AI photo passed off as the home. */
function touredStripHtml() {
  if (typeof touredSimList !== 'function') return '';
  const list = touredSimList().filter((o) => o.img).slice(0, 6);
  if (!list.length) return '';
  return '<section class="blk"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Homes I toured</p><h2>Homes I toured, with photos</h2><p>Every home here has a real photo, price, city, beds, baths and sq ft. Tap Click to get the details for the full rundown, or Add to cart to save it.</p></div></div>' +
    '<div class="cards">' + list.map((o) => '<article class="card">' +
      '<img src="' + esc(o.img) + '" alt="' + esc(o.imgTag + ', ' + o.title) + '" loading="lazy" referrerpolicy="no-referrer" style="width:100%;height:180px;object-fit:cover;border-radius:14px">' +
      '<div><h3>' + esc(o.title) + '</h3><div class="sub">' + esc(o.city) + '</div></div>' +
      '<div class="price num">' + esc(o.price) + '</div><div class="facts">' + esc(o.beds + ' bd, ' + o.baths + ' ba, ' + comma(o.sqft) + ' sq ft') + '</div>' +
      '<span class="note">' + esc(o.imgTag) + '</span>' +
      '<div class="actions">' + details(o.info) + ' ' + cartBtn(o.cartKey, o.title, o.price) + '</div></article>').join('') +
    '</div></div></section>';
}
function touredHtml() {
  if (typeof PROPS === 'undefined') return '';
  if (typeof CARD_PROP !== 'undefined') {
    if (PROP_BY['ridgeline-at-bickford-ranch']) CARD_PROP['t:carlsberg-835-ridgeline-dr'] = 'ridgeline-at-bickford-ranch';
    if (PROP_BY['shawood-at-folsom']) CARD_PROP['q:shawood-at-folsom-4681-dehone-circle'] = 'shawood-at-folsom';
  }
  const customByKey = {};
  TOURED_CUSTOM.forEach((t) => { customByKey[t.key] = t; });
  const items = [];
  const addProp = (key, cartKey) => { const p = PROP_BY[key]; if (p) items.push(touredPropCard(p, cartKey)); };
  const addCustom = (key) => { const t = customByKey[key]; if (t) items.push(touredCustomCard(t)); };
  // Traction order, Nov 9, 2026: Ridge Park first, then Cornwall, then
  // the rest in their existing order, with BRADY last. Only one
  // Carlsberg card is kept, 835 Ridgeline Dr, Dec 2026 move-in.
  addCustom('t:ridge-park-loomis');
  addCustom('t:cornwall-rocklin');
  addProp('ser', 'l:ser');
  addProp('palm', 'l:palm');
  addProp('haven', 'l:haven');
  addProp('10732-stevie-dr', 's:h39');
  addCustom('t:oak-rock-folsom');
  addCustom('q:shawood-at-folsom-4681-dehone-circle');
  addCustom('t:carlsberg-835-ridgeline-dr');
  addProp('rio', 'l:rio');
  addCustom('t:brady-modesto');
  if (!items.length) return '';
  return '<section class="blk" id="toured"><div class="wrap"><div class="shead" data-grow><div><p class="mono eyebrow">Homes I toured</p><h2>Homes I toured, still for sale</h2><p>Every home here was checked on Nov 7, 2026 and is still on the market, except BRADY, toured Nov 9, 2026. Prices and status change, so ask Darien to confirm before you visit. Homes I toured that went pending or sold since filming are not listed here. Only one Carlsberg card is kept, 835 Ridgeline Dr.</p></div></div>' +
    '<div class="lux-list">' + items.join('') + '</div></div></section>';
}

/* ===== Assumable homes, v5, Nov 9, 2026 =====
   Banner image is Assumable Home 2, AI-generated, not a real home.
   The two example homes below are from the Nov 5 assumable list,
   and their figures are flagged to verify before quoting. No tour
   videos on this tab, just pictures in a carousel. */
const ASSUMABLE_BANNER = '<section class="blk"><div class="wrap"><div class="panel" style="display:grid;gap:12px">' +
  '<div><span class="assumable-sign">Assumable Home</span><p><b>Low interest rate, low monthly payment.</b></p>' +
  '<p>An assumable home lets you take over the seller\'s loan, often at a lower rate than a new loan today. Ask Darien to run exact numbers for you, he will not guess a payment.</p>' +
  '<p class="note">AI-generated image, ChatGPT, Assumable Home 2, not a real photo, not a real home. The sign text in the image is AI-generated. Alternate: Assumable Home 1, a two story modern home with an "Assumable Home" sign.</p>' +
  '<p class="note">Two recent examples, from the Nov 5 assumable list, verify before quoting: 9544 Mirandy Dr, Sacramento 95827, 4 bd, 2 ba, 2.89% rate, about $2,300 a month, about $136,000 down. 5461 28th St, Sacramento 95820, 3 bd, 1 ba, 6.81% rate, about $2,900 a month, about $43,000 down.</p></div>' +
  '</div></div></section>';
/* ===== Assumable homes ===== */
def('assumable', {
  nav: 'Assumable', scene: 'assumable', kicker: 'Assumable loans', tileTitle: 'Assumable homes',
  title: 'Take over a seller\'s low-rate loan',
  sub: 'Some FHA, VA and USDA loans can move to the next buyer, rate and all. Here is how to find them, and the homes that have them now.',
  html() {
    const A = sub('assum', { type: 'all', max: 0, beds: 0, baths: 0, sqft: 0, lot: 0, sort: 'rate', text: '' });
    return ASSUMABLE_BANNER + '<section class="blk"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">How it works</p><h2>How to find an assumable home</h2></div></div>' +
      '<ol class="steps">' +
        '<li><b>Look for FHA, VA or USDA loans</b><span>Most conventional loans can\'t be taken over. FHA, VA and USDA loans usually can, with the lender\'s approval.</span></li>' +
        '<li><b>Search listings for "assumable"</b><span>Agents mention it in the listing remarks. This page, Roots and Darien\'s custom portal pull those homes for you.</span></li>' +
        '<li><b>Get the loan details</b><span>Ask for the rate, balance, payment and years left. The listing agent can get them from the seller\'s statement.</span></li>' +
        '<li><b>Cover the gap</b><span>Pay the difference between the price and the loan balance in cash, or with a second loan on top.</span></li>' +
        '<li><b>Apply with the seller\'s lender</b><span>The loan servicer approves you, so closing often takes 45 to 90 days.</span></li>' +
      '</ol>' +
      '<div class="scroll" style="margin-top:14px"><table class="tbl"><thead><tr><th>Loan</th><th>Who can take it over</th><th>Good to know</th></tr></thead><tbody>' +
        '<tr><td><b>FHA</b></td><td>Buyers who qualify and will live in the home</td><td>The servicer charges a processing fee. FHA mortgage insurance stays with the loan.</td></tr>' +
        '<tr><td><b>VA</b></td><td>Anyone who qualifies, veteran or not</td><td>VA charges a 0.5% funding fee on an assumption. The seller\'s VA entitlement stays with the loan unless a veteran buyer swaps in their own.</td></tr>' +
        '<tr><td><b>USDA</b></td><td>Buyers who meet USDA income limits and will live in the home</td><td>The home must be in a USDA-eligible area.</td></tr>' +
      '</tbody></table></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><p class="mono eyebrow">Homes now</p><h2>Homes with assumable loans</h2><p>From Darien\'s own home search of listings that mention an assumable loan, checked ' + esc(DATA.assumablesChecked) + '. Ask for the full loan details on any of them.</p></div></div>' +
      '<div class="panel" style="display:grid;gap:12px">' + countyChips(true) +
        '<div class="chips" role="group" aria-label="Loan type"><span class="mono">Loan</span>' + [['all', 'All'], ['FHA', 'FHA'], ['VA', 'VA'], ['', 'Not listed']].map(([v, t]) => '<button type="button" class="chip" data-type="' + v + '" aria-pressed="' + (A.type === v) + '">' + t + '</button>').join('') + '</div>' +
        '<div class="fields">' + sel('as-max', PRICE_OPTS, A.max, 'Price') + sel('as-beds', BED_OPTS, A.beds, 'Bedrooms') + sel('as-baths', BATH_OPTS, A.baths, 'Bathrooms') + sel('as-sqft', SIZE_OPTS, A.sqft, 'Home size') +
          sel('as-lot', LOT_OPTS, A.lot, 'Lot size') +
          sel('as-sort', [['rate', 'Lowest rate'], ['price', 'Lowest price'], ['gap', 'Least cash to take over'], ['new', 'Newest listing']], A.sort, 'Sort') + '</div>' +
        '<div class="fields"><div class="field wide"><label for="as-q">Search the listing remarks</label><input id="as-q" type="search" autocomplete="off" value="' + esc(A.text) + '" placeholder="Try pool, open floor plan, single story, ADU"></div></div>' +
        '<p class="note">The search above looks through the street, city and the remarks in each listing. Remarks are the short text from the MLS listing, so a feature only shows up if the listing mentions it. Want to search everything at once, including lot size and home size? <button type="button" class="linkbtn" data-go="finder">Find exactly what you are looking for</button></p>' +
        '<p class="count" id="as-count" aria-live="polite"></p></div>' +
      '<div class="cards" id="as-list"></div><div class="more-row"><button type="button" class="btn btn-line" id="as-more" hidden></button></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Search live assumable listings</h2><p>These open Roots, which estimates each seller\'s rate and balance from public records, and include homes listed after Darien\'s last MLS check.</p></div></div><div class="tiles" id="as-live"></div></div></section>' + touredStripHtml();
  },
  mount(root) {
    const A = S.assum;
    const st = { shown: 12, empty: '<div class="empty"><h3>No homes match these filters</h3><p>Try another area, a higher price or fewer bedrooms. Darien\'s custom portal finds new assumable listings every day.</p></div>' };
    const draw = () => {
      root.querySelectorAll('[data-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === A.type)));
      const q = A.text.toLowerCase();
      const items = DATA.assumables.filter((h) => inPlace(h) &&
        (A.type === 'all' || h.type === A.type) && (!A.max || h.price <= A.max) && (!A.beds || (h.beds || 0) >= A.beds) &&
        (!A.baths || (h.baths || 0) >= A.baths) && (!A.sqft || (h.sqft || 0) >= A.sqft) && (!A.lot || (h.acres || 0) >= A.lot) &&
        (!q || (h.street + ' ' + h.city + ' ' + (h.zip || '') + ' ' + (h.remarks || '') + ' ' + (h.tags || []).map((t) => t[1]).join(' ')).toLowerCase().includes(q)));
      const sorts = {
        rate: (a, b) => (a.rate || 99) - (b.rate || 99) || a.price - b.price,
        price: (a, b) => a.price - b.price,
        gap: (a, b) => (a.gap == null ? 1e9 : a.gap) - (b.gap == null ? 1e9 : b.gap) || a.price - b.price,
        new: (a, b) => (a.dom || 999) - (b.dom || 999)
      };
      items.sort(sorts[A.sort] || sorts.rate);
      $('as-count').innerHTML = plural(items.length, 'home') + ' <span class="sub">in ' + esc(placeLabel(S.place)) + ' · ' + items.filter((h) => h.rate).length + ' with the rate listed' + (A.lot ? ' · homes with no lot size listed are not shown' : '') + '</span>';
      pager('as-list', 'as-more', items, assumableCard, st);
      const towns = S.place && S.place.k === 'town' ? [S.place.n] : TOWNS.filter((t) => !S.place || t.c === S.place.n).filter((t) => MAIN_COUNTIES.includes(t.c)).slice(0, 8).map((t) => t.n);
      $('as-live').innerHTML = towns.map((n) => '<a class="tile" style="--tc:' + PAGES.assumable.color + ';grid-template-rows:auto" target="_blank" rel="noopener" href="' + esc(track(rootsFor(n), { h: 'Assumable search: ' + n, s: 'Roots' })) + '"><div class="body"><b>' + esc(n) + ' assumable homes</b><span>Live on Roots ↗</span></div></a>').join('');
    };
    const change = () => { st.shown = 12; save(); draw(); };
    bindCounty(root, () => { render(CURRENT, true); });
    root.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => { A.type = b.dataset.type; change(); }));
    [['as-max', 'max'], ['as-beds', 'beds'], ['as-baths', 'baths'], ['as-sqft', 'sqft'], ['as-lot', 'lot']].forEach(([id, k]) => $(id).addEventListener('change', () => { A[k] = parseFloat($(id).value) || 0; change(); }));
    $('as-sort').addEventListener('change', () => { A.sort = $('as-sort').value; change(); });
    $('as-q').addEventListener('input', () => { A.text = $('as-q').value.trim(); st.shown = 12; save(); draw(); });
    $('as-more').addEventListener('click', () => { st.shown += 12; draw(); });
    draw();
  }
});
function assumableCard(h) {
  const title = h.street + ', ' + h.city;
  const loan = (h.type ? h.type + ' ' : '') + (h.rate ? h.rate + '%' : h.rateText || 'Rate: ask');
  const pillCls = h.type === 'VA' ? 'va' : h.type === 'FHA' ? 'fha' : 'pa';
  const facts = [h.beds != null ? h.beds + ' bd' : '', h.baths != null ? h.baths + ' ba' : '', h.sqft ? comma(h.sqft) + ' sq ft' : '', h.acres ? (h.acres >= 0.5 ? h.acres + ' acres' : comma(h.acres * 43560) + ' sq ft lot') : '', h.year ? 'Built ' + h.year : ''].filter(Boolean).join(' · ');
  const tags = (h.tags || []).map(([k, t]) => '<span class="tag ' + (k === 'ok' ? 'ok' : k === 'credit' ? 'pa' : '') + '">' + esc(t) + '</span>').join('');
  const info = { h: title, p: money(h.price), b: facts, l: loan + ' assumable', r: h.mls ? 'MLS# ' + h.mls : '', city: h.city,
    z: zillowFor(h.street, h.city, h.zip), m: mapFor(h.street.replace(/#.*$/, '') + ', ' + h.city + ', CA ' + (h.zip || '')), x: rootsFor(h.city), xs: 'Assumable homes nearby on Roots' };
  return '<article class="card"><div class="head"><span class="pill ' + pillCls + '">' + esc(loan) + '</span>' + heart('a:' + h.id, title, money(h.price)) + '</div>' +
    '<div><h3>' + esc(h.street) + '</h3><div class="sub">' + esc(h.city + ' ' + (h.zip || '') + ' · ' + (h.county || '') + ' County') + '</div></div>' +
    '<div class="price num">' + money(h.price) + '</div><div class="facts">' + esc(facts) + '</div>' +
    '<div class="stats3"><div><span>Rate</span><b>' + esc(h.rate ? h.rate + '%' : h.rateText || 'Ask') + '</b><small>' + esc(h.type || 'Loan type not listed') + '</small></div>' +
      '<div><span>Loan balance</span><b>' + (h.balance ? short(h.balance) : 'Ask') + '</b><small>' + (h.matures ? 'Paid off ' + esc(h.matures) : h.balance ? 'Per the listing' : 'Not in the listing') + '</small></div>' +
      '<div><span>Cash to take over</span><b>' + (h.gap != null ? money(h.gap) : 'Ask') + '</b><small>' + (h.gap != null ? 'Price minus balance' : 'Price minus balance') + '</small></div></div>' +
    (tags ? '<div class="tags">' + tags + '</div>' : '') +
    '<div class="actions">' + details(info) + simBtn(slug(h.street)) + cartBtn('a:' + h.id, title, money(h.price)) + askBtn('a:' + h.id, title, money(h.price)) + '</div>' +
    '<div class="src">' + (h.src === 'pick' ? 'Darien\'s pick' : 'MLS# ' + esc(h.mls || '')) + ' · ' + (h.dom != null ? plural(h.dom, 'day') + ' on market · ' : '') + 'checked ' + esc(DATA.assumablesChecked) + '</div></article>';
}

/* ===== Placer and Loomis under $2,500 ===== */
const PLACER = DATA.placer.homes;
const PL_DEFAULTS = { budget: 2500, cash: null, r2: 9.5, town: 'all', band: 'all', beds: 0, lot: 0, sort: 'pay' };
function placerFigure(h, P) {
  const ti = Math.max(h.price * 0.0145 / 12, h.rootsTI || 0);
  const mip = h.type === 'FHA' ? h.balance * 0.0055 / 12 : 0;
  const gap = h.price - h.balance;
  let cash = gap, second = 0, p2 = 0;
  if (P.cash != null && P.cash < gap) { cash = Math.max(P.cash, 0); second = gap - cash; p2 = pmt(second, P.r2, 360); }
  return { ti, mip, gap, cash, second, p2, total: h.pi + ti + mip + (h.hoa || 0) + p2 };
}
def('placer', {
  nav: 'Placer under $2,500', scene: 'placer', kicker: 'Loomis · Rocklin · Roseville · Lincoln', tileTitle: 'Placer under $2,500',
  title: 'Placer homes around $2,500 a month',
  sub: 'Homes in Loomis and Placer County where you can take over the seller\'s low-rate FHA or VA loan. Change the budget to see what fits you.',
  html() {
    const P = sub('pl', PL_DEFAULTS);
    const towns = ['all'].concat(Array.from(new Set(PLACER.map((h) => h.city))).sort());
    return '<section class="blk"><div class="wrap"><div class="panel accent" style="display:grid;gap:12px">' +
      '<div class="fields">' + moneyField('pl-budget', 'Monthly budget', P.budget, 'Loan, taxes, insurance, mortgage insurance and HOA') +
        moneyField('pl-cash', 'Cash you can bring', P.cash, 'Blank means you pay the whole gap in cash', 'Optional') +
        pctField('pl-r2', '2nd loan rate', P.r2, 'Used when your cash doesn\'t cover the gap') +
        sel('pl-beds', BED_OPTS, P.beds, 'Bedrooms') + sel('pl-lot', LOT_SQFT_OPTS, P.lot, 'Lot size') +
        sel('pl-sort', [['pay', 'Lowest monthly payment'], ['price', 'Lowest price'], ['cash', 'Least cash needed'], ['rate', 'Lowest rate']], P.sort, 'Sort') + '</div>' +
      '<div class="chips" role="group" aria-label="Town"><span class="mono">Town</span>' + towns.map((t) => '<button type="button" class="chip" data-pltown="' + esc(t) + '" aria-pressed="' + (P.town === t) + '">' + esc(t === 'all' ? 'All Placer' : t) + '<span class="n"></span></button>').join('') + '</div>' +
      '<p class="count" id="pl-count" aria-live="polite"></p></div>' +
      '<div class="shead" style="margin-top:22px"><div><h2 id="pl-fit-h">Homes that fit your budget</h2></div></div><div class="cards" id="pl-fit"></div>' +
      '<div id="pl-over-wrap"><div class="shead" style="margin-top:22px"><div><h2>Just over your budget</h2><p>Worth a look if you can stretch or bring more cash.</p></div></div><div class="cards" id="pl-over"></div></div>' +
      '<div class="shead" style="margin-top:26px"><div><h2>Search for more in Placer</h2><p>Live on Roots, filtered to your monthly budget. Roots uses the seller\'s current tax bill, so the real payment can run a little higher.</p></div></div><div class="tiles" id="pl-live"></div>' +
      '<p class="src" style="margin-top:14px">Homes checked ' + esc(DATA.placer.checked) + ' from MetroList listings shown on Roots.homes. Rates and balances are Roots estimates from public records unless marked verified. Payments add property tax at 1.1% of the price, insurance at 0.35% a year and FHA mortgage insurance at 0.55% a year.</p></div></section>' + touredStripHtml();
  },
  mount(root) {
    const P = S.pl;
    const draw = () => {
      const all = PLACER.map((h) => ({ h, f: placerFigure(h, P) }));
      root.querySelectorAll('[data-pltown]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.pltown === P.town));
        b.querySelector('.n').textContent = all.filter((x) => (b.dataset.pltown === 'all' || x.h.city === b.dataset.pltown) && x.f.total <= P.budget).length;
      });
      const sorts = { pay: (a, b) => a.f.total - b.f.total, price: (a, b) => a.h.price - b.h.price, cash: (a, b) => a.f.cash - b.f.cash, rate: (a, b) => a.h.rate - b.h.rate };
      const scoped = all.filter((x) => (P.town === 'all' || x.h.city === P.town) && (!P.beds || (x.h.beds || 0) >= P.beds) && (!P.lot || (x.h.lot || 0) >= P.lot)).sort(sorts[P.sort] || sorts.pay);
      const fit = scoped.filter((x) => x.f.total <= P.budget), over = scoped.filter((x) => x.f.total > P.budget);
      $('pl-count').innerHTML = plural(fit.length, 'home') + ' fit ' + money(P.budget) + ' a month <span class="sub">in ' + esc(P.town === 'all' ? 'Placer County' : P.town) + (P.cash != null ? ' with ' + money(P.cash) + ' cash' : ' paying the gap in cash') + '</span>';
      $('pl-fit-h').textContent = 'Homes that fit ' + money(P.budget) + ' a month';
      $('pl-fit').innerHTML = fit.length ? fit.map((x) => placerCard(x.h, x.f, P)).join('') : '<div class="empty"><h3>No homes here fit ' + esc(money(P.budget)) + ' right now</h3><p>Try a higher budget, more cash, or All Placer.</p></div>';
      $('pl-over').innerHTML = over.map((x) => placerCard(x.h, x.f, P)).join('');
      $('pl-over-wrap').hidden = !over.length;
      const places = [['West Placer', 'Placer County', 38.84, -121.2, 10.5], ['Loomis', 'Loomis', 38.8213, -121.193, 13], ['Rocklin', 'Rocklin', 38.7907, -121.2358, 12], ['Roseville', 'Roseville', 38.7521, -121.288, 11.5], ['Lincoln', 'Lincoln', 38.8916, -121.293, 12], ['Granite Bay', 'Granite Bay', 38.7632, -121.1638, 12.5], ['Auburn', 'Auburn', 38.8966, -121.0769, 12], ['Colfax and foothills', 'Colfax', 39.05, -120.98, 11.5]];
      $('pl-live').innerHTML = places.map(([n, place, lat, lng, z]) => {
        const url = 'https://www.roots.homes/listings?' + new URLSearchParams({ lat, lng, zoom: z, place: place + ', CA', isAssumable: 'true', view: 'list', monthlyPaymentMax: Math.round(P.budget) }).toString();
        return '<a class="tile" style="--tc:' + PAGES.placer.color + ';grid-template-rows:auto" target="_blank" rel="noopener" href="' + esc(track(url, { h: n + ' under ' + money(P.budget) + '/mo', s: 'Roots' })) + '"><div class="body"><b>' + esc(n) + ' under ' + money(P.budget) + '/mo</b><span>Live on Roots ↗</span></div></a>';
      }).join('');
    };
    bindMoney('pl-budget', (v) => { if (v > 0) { P.budget = v; save(); draw(); } });
    bindMoney('pl-cash', (v) => { P.cash = isNaN(v) ? null : Math.max(v, 0); save(); draw(); });
    $('pl-r2').addEventListener('input', () => { const v = parseNum($('pl-r2').value); if (v >= 0) { P.r2 = v; save(); draw(); } });
    $('pl-sort').addEventListener('change', () => { P.sort = $('pl-sort').value; save(); draw(); });
    [['pl-beds', 'beds'], ['pl-lot', 'lot']].forEach(([id, k]) => $(id).addEventListener('change', () => { P[k] = parseFloat($(id).value) || 0; save(); draw(); }));
    root.querySelectorAll('[data-pltown]').forEach((b) => b.addEventListener('click', () => { P.town = b.dataset.pltown; save(); draw(); }));
    draw();
  }
});
function placerCard(h, f, P) {
  const fits = f.total <= P.budget;
  const title = h.street + ', ' + h.city;
  const facts = [h.beds + ' bd', h.baths + ' ba', comma(h.sqft) + ' sq ft', h.kind === 'Single family' ? (h.lot >= 21780 ? (Math.round(h.lot / 43560 * 10) / 10) + ' acres' : comma(h.lot) + ' sq ft lot') : h.kind, 'Built ' + h.year].join(' · ');
  const tags = [];
  if (h.dom <= 7) tags.push('<span class="tag pa">New this week</span>');
  if (h.verified) tags.push('<span class="tag ok">Rate verified</span>');
  if (h.nonvet) tags.push('<span class="tag va">Non-veterans can assume</span>');
  if (h.note) tags.push('<span class="tag warn">' + esc(h.note) + '</span>');
  (h.feats || []).slice(0, 3).forEach((t) => tags.push('<span class="tag">' + esc(t) + '</span>'));
  const info = { h: title, p: money(h.price), b: facts, l: h.type + ' ' + h.rate + '% assumable', r: 'MLS# ' + h.id, city: h.city,
    z: zillowFor(h.street, h.city, h.zip), x: h.roots, xs: 'Loan details on Roots', m: mapFor(h.street.replace(/#.*$/, '') + ', ' + h.city + ', CA ' + h.zip) };
  const extra = [f.p2 ? ['2nd loan (' + short(f.second) + ' at ' + P.r2 + '%)', f.p2] : null];
  const base = { pi: h.pi, mi: f.mip, tax: f.ti * (0.011 / 0.0145), ins: f.ti * (0.0035 / 0.0145), hoa: h.hoa || 0, special: 0, total: h.pi + f.mip + f.ti + (h.hoa || 0) };
  return '<article class="card"' + (fits ? '' : ' style="border-style:dashed"') + '><div class="head"><span class="pill ' + (h.type === 'VA' ? 'va' : 'fha') + '">' + esc(h.type + ' ' + h.rate + '%') + '</span>' + heart('p:' + h.id, title, money(h.price)) + '</div>' +
    '<div><h3>' + esc(h.street) + '</h3><div class="sub">' + esc(h.city + ' ' + h.zip) + '</div></div><div class="price num">' + money(h.price) + '</div><div class="facts">' + esc(facts) + '</div>' +
    '<div class="stats3"><div><span>Est. monthly</span><b class="' + (fits ? 'fit' : 'over') + '">' + money(f.total) + '</b><small>' + (fits ? money(P.budget - f.total) + ' under budget' : money(f.total - P.budget) + ' over') + '</small></div>' +
      '<div><span>Cash needed</span><b>' + money(f.cash) + '</b><small>' + (f.second ? '+ ' + short(f.second) + ' 2nd loan' : 'Price minus loan') + '</small></div>' +
      '<div><span>Seller\'s loan</span><b>' + short(h.balance) + '</b><small>' + h.years + ' years left</small></div></div>' +
    (tags.length ? '<div class="tags">' + tags.join('') + '</div>' : '') +
    '<details class="more"><summary>Monthly payment breakdown</summary>' + breakdown(base, extra) + '</details>' +
    '<div class="actions">' + details(info) + simBtn(slug(h.street)) + cartBtn('p:' + h.id, title, money(h.price)) + askBtn('p:' + h.id, title, money(h.price)) + '</div>' +
    '<div class="src">Listing by ' + esc(h.office) + ' · MLS# ' + esc(h.id) + ' · ' + plural(h.dom, 'day') + ' on market</div></article>';
}

/* ===== Shop by monthly payment ===== */
def('payment', {
  nav: 'By payment', scene: 'payment', kicker: 'Shop by monthly payment', tileTitle: 'Shop by payment',
  title: 'Start with the payment, then find the home',
  sub: 'Enter what you want to pay each month. See the price you can shop up to with each loan, and the homes in that range.',
  html() {
    const Y = sub('pay', { budget: 3000, cash: 20000, loan: 'fha', rate: '', county: 'Sacramento', hoa: 0, price: 450000 });
    if (placeCounty() && MAIN_COUNTIES.includes(placeCounty())) Y.county = placeCounty();
    return '<section class="blk"><div class="wrap"><div class="calc">' +
      '<div class="panel accent" style="display:grid;gap:12px"><div class="fields">' +
        moneyField('py-budget', 'Monthly budget', Y.budget, 'Everything: loan, tax, insurance, HOA') +
        moneyField('py-cash', 'Cash for the down payment', Y.cash, 'Keep closing costs aside, often 2% to 3%') +
        sel('py-loan', Object.keys(LOANS).map((k) => [k, LOANS[k].label + (k === 'va' || k === 'usda' || k === 'myhome' ? ' ($0 down)' : k === 'fha' ? ' (3.5% down)' : ' (3% down)')]), Y.loan, 'Loan') +
        pctField('py-rate', 'Interest rate', Y.rate || LOANS[Y.loan].rate, 'Recent average for this loan') +
        sel('py-county', MAIN_COUNTIES.map((c) => [c, c + ' County']), Y.county, 'County') +
        moneyField('py-hoa', 'HOA per month', Y.hoa, 'Leave 0 if none') +
      '</div><p class="note" id="py-loan-note"></p></div>' +
      '<div class="result" aria-live="polite"><span class="lbl">You can shop up to</span><div class="big num" id="py-max">$0</div><div id="py-break"></div><p class="note" id="py-note"></p></div>' +
      '</div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2 id="py-homes-h">Homes in your range</h2><p>New builds, assumable homes and the Placer and Stockton picks that fit the price you can shop up to.</p></div></div><div id="py-groups"></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Check a specific price</h2></div></div><div class="calc"><div class="panel"><div class="fields">' + moneyField('py-price', 'Home price', Y.price) + '</div></div><div class="result"><span class="lbl">Monthly payment</span><div class="big num" id="py-p-total">$0</div><div id="py-p-break"></div></div></div></div></section>' +
      '<section class="blk"><div class="wrap"><div class="shead"><div><h2>Search every home in your range</h2><p>Opens Zillow with your top price set, or ask Darien for your own custom portal with every match.</p></div></div><div class="tiles" id="py-live"></div></div></section>' + touredStripHtml();
  },
  mount() {
    const Y = S.pay;
    const opts = () => ({ loan: Y.loan, cash: Y.loan === 'va' || Y.loan === 'usda' || Y.loan === 'myhome' ? 0 : Y.cash, rate: parseNum(Y.rate) || LOANS[Y.loan].rate, county: Y.county, hoa: Y.hoa || 0 });
    const draw = () => {
      const o = opts();
      const max = maxPrice(Y.budget, o);
      $('py-max').textContent = max ? money(max) : 'Raise the budget or cash';
      $('py-loan-note').textContent = Y.loan === 'myhome' ? 'For first-time buyers with income under $' + comma(LIMITS[Y.county].calhfa) + ' in ' + Y.county + ' County. MyHome covers the 3.5% down payment.' :
        Y.loan === 'usda' ? 'USDA is only for eligible rural areas, not most city addresses.' : Y.loan === 'va' ? 'For veterans and service members. Includes the 2.15% funding fee, added to the loan.' :
        Y.loan === 'fha' ? 'FHA loans go up to ' + money(LIMITS[Y.county].fha) + ' in ' + Y.county + ' County.' : 'Mortgage insurance applies with less than 20% down.';
      if (max) {
        const f = payment(Object.assign({}, o, { price: max }));
        $('py-break').innerHTML = breakdown(f);
        $('py-note').textContent = 'Search roughly ' + short(max * 0.85) + ' to ' + short(max) + '. ' + (f.note || (cashNeeded(max, Y.loan) > 0 ? 'Down payment: ' + money(Math.max(f.down, cashNeeded(max, Y.loan))) + '.' : 'Down payment: $0.'));
      } else { $('py-break').innerHTML = ''; $('py-note').textContent = 'At this budget, add more cash or pick a loan with a lower down payment.'; }
      $('py-homes-h').textContent = max ? 'Homes up to ' + money(max) + ' in ' + Y.county + ' County' : 'Homes in your range';
      const groups = [];
      const nb = DATA.communities.filter((c) => c.county === Y.county && c.min && c.min <= max).sort((a, b) => b.min - a.min);
      groups.push(['New-build communities', nb.length, nb.slice(0, 6).map((c) => communityCard(c, { loan: Y.loan, rate: o.rate, cash: o.cash })).join(''), () => { setPlace({ k: 'county', n: Y.county }); sub('nb', {}).max = max; S.nb.max = max; }, 'new-builds']);
      const as = DATA.assumables.filter((h) => h.county === Y.county && h.price <= max).sort((a, b) => (a.rate || 99) - (b.rate || 99));
      groups.push(['Assumable homes', as.length, as.slice(0, 6).map(assumableCard).join(''), () => { setPlace({ k: 'county', n: Y.county }); sub('assum', {}); S.assum.max = 0; }, 'assumable']);
      if (Y.county === 'Placer') {
        const P = sub('pl', PL_DEFAULTS);
        const pl = PLACER.map((h) => ({ h, f: placerFigure(h, { cash: Y.cash, r2: P.r2 }) })).filter((x) => x.f.total <= Y.budget);
        groups.push(['Placer homes with assumable loans that fit ' + money(Y.budget) + '/mo', pl.length, pl.slice(0, 6).map((x) => placerCard(x.h, x.f, { budget: Y.budget, r2: P.r2 })).join(''), () => { P.budget = Y.budget; P.cash = Y.cash; }, 'assumable']);
      }
      if (Y.county === 'San Joaquin') {
        const sk = STK.homes.filter((h) => h.price <= max);
        const K2 = { route: Y.loan === 'va' ? 'va' : 'myhome', rate: o.rate };
        groups.push(['Stockton new homes and plans', sk.length, sk.slice(0, 6).map((h) => stocktonCard(h, stkFig(h, K2), K2)).join(''), () => { const K = sub('stk', {}); K.price = String(Math.floor(max / 50000) * 50000 || 'any'); }, 'stockton']);
      }
      $('py-groups').innerHTML = groups.map(([t, n, cards, , page], i) => '<div class="panel" style="margin-top:12px"><div class="bar"><div><b>' + esc(t) + '</b><p class="note">' + plural(n, 'match', 'matches') + '</p></div>' + (n ? '<button type="button" class="btn btn-line btn-sm" data-group="' + i + '">See all on the ' + esc(PAGES[page].nav) + ' page</button>' : '') + '</div>' + (cards ? '<div class="cards">' + cards + '</div>' : '') + '</div>').join('');
      $('py-groups').querySelectorAll('[data-group]').forEach((b) => b.addEventListener('click', () => { const g = groups[+b.dataset.group]; g[3](); save(); go(g[4]); }));
      const towns = TOWNS.filter((t) => t.c === Y.county).slice(0, 8);
      $('py-live').innerHTML = towns.map((t) => '<a class="tile" style="--tc:' + PAGES.payment.color + ';grid-template-rows:auto" target="_blank" rel="noopener" href="' + esc(track(zillowCity(t.n, { max }), { h: t.n + ' homes up to ' + short(max), s: 'Zillow' })) + '"><div class="body"><b>' + esc(t.n) + ' up to ' + short(max) + '</b><span>On Zillow ↗</span></div></a>').join('') +
        '<button type="button" class="tile" style="--tc:' + PAGES.payment.color + ';grid-template-rows:auto" data-go="alerts"><div class="body"><b>Your own custom portal</b><span>Every home in your range, emailed daily</span></div></button>';
      const pf = payment(Object.assign({}, opts(), { price: Y.price || 0 }));
      $('py-p-total').textContent = Y.price ? money(pf.total) : '$0';
      $('py-p-break').innerHTML = Y.price ? breakdown(pf) + (pf.note ? '<p class="note">' + esc(pf.note) + '</p>' : '') : '';
    };
    bindMoney('py-budget', (v) => { if (v > 0) { Y.budget = v; save(); draw(); } });
    bindMoney('py-cash', (v) => { Y.cash = isNaN(v) ? 0 : v; save(); draw(); });
    bindMoney('py-hoa', (v) => { Y.hoa = isNaN(v) ? 0 : v; save(); draw(); });
    bindMoney('py-price', (v) => { Y.price = isNaN(v) ? 0 : v; save(); draw(); });
    $('py-loan').addEventListener('change', () => { Y.loan = $('py-loan').value; Y.rate = ''; $('py-rate').value = LOANS[Y.loan].rate; save(); draw(); });
    $('py-rate').addEventListener('input', () => { Y.rate = $('py-rate').value; save(); draw(); });
    $('py-county').addEventListener('change', () => { Y.county = $('py-county').value; setPlace({ k: 'county', n: Y.county }); save(); draw(); });
    draw();
  }
});
