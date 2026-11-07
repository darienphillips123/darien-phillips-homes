# CLAUDE.md, instructions for Claude Code working on this site

## Project overview

This is the source for Darien Phillips' home search website.
Darien Phillips, REALTOR, eXp Nor Cal, DRE 02439090.
Phone 209.882.6469, email darienphillips45@gmail.com.
Sacramento and greater areas: Placer, Sacramento, San Joaquin, Stanislaus.

The site is a single self-contained page, hash-routed, with 12 tabs plus a cart:
Home, Beginner's guide, Map search, Assumable, $0 down, By payment, New builds,
ADUs, Refinance, Build a home, About Darien, Get homes by email, plus Your Cart.
Property pages live at `/p/<keyword>`, created from rows in the Google Sheet
"Client home activity", Listings tab, via the tracker.

## Source layout

- `template.html`: page layout and all styles. Edit styles here, not in output.
- `js/`: scripts, joined in name order at build time. `1-core.js` is the core
  (payment math, tracking, "Get full details" gate). `5c-props.js` builds
  every property page. `5d-search.js` is map search. `7-chat.js` is the
  "Ask Darien" chatbot, client-side only, no AI service, no API key, no cost.
- `data.json`: homes, communities, towns, loan limits, rates. Regenerate with
  `python3 make_site_data.py inputs data.json` after editing `inputs/`.
- `inputs/`: `mls/homes.json` (MLS export), `placer/homes.json`,
  `stockton/homes.json`, `adu.json`, `nb-geo.json`, `new-build-deals.json`,
  `new-build-models.json`, `inputs/build/template.html`.
- `placer-assumable-homes.html`: Darien's headshot for header and footer.
- `Darien-Website-Tracker.gs`: Google Apps Script tracker v4. `test-tracker4.js` tests it.
- `build_site.py`, `check.py`, `check_web.py`, `check_props.py`,
  `check_similar.py`, `make_site_data.py`, `tools/`.

## Build

```sh
python3 build_site.py placer-assumable-homes.html . preview.html web [TRACKER_URL]
```

Output is `preview.html` and `web/` (index.html plus img/).
`web/` is generated. **Never edit `web/index.html` directly.** Edit source and rebuild.

## Test

Run the checks in `check.py` / `check_web.py` after a rebuild, and verify the
demo on a real phone and desktop. Do not claim a fix is verified from a build
log alone.

## Deploy, demo only

- Deploy to Cloudflare Pages project `darien-phillips-homes`, demo URL
  https://darien-phillips-homes.pages.dev
- **Never deploy to darienphillips.com or Netlify without Darien's explicit
  approval.** darienphillips.com still points to Netlify. The demo stays the
  testing site until he says it is perfect.

## Tracker, do not commit it

The tracker URL (a Google Apps Script web app URL) is **not in this repo**.
It is provided separately, never committed, and never pasted into a file here.
Build without it for a no-tracking build, or pass it as the last build argument
or from an environment variable / secret at deploy time.

## Photos, not in this push

`img/` page photos are **not in this repo yet**. They are binary files and were
not part of this first push. They must be added separately before a full
rebuild from this repo works: `img/` at the repo root, plus `web/img/`
generated at build time. Do not invent or generate replacement photos of
homes, people, or Darien. Use only the real photos from the live source.

## Rules to preserve, do not break these

- Preserve all data and prices. Never invent a listing, price, bed/bath count,
  square footage, lot size, or community. If a fact is unverified, leave it
  out and say so.
- Phone 209.882.6469, email darienphillips45@gmail.com, DRE 02439090.
  Brokerage is eXp Nor Cal. Never use the old Rachel Adams Lee Group /
  Keller Williams names.
- Never use em dashes in copy or captions. Use commas, colons, or periods.
- Home-info requests show the details and link FIRST, then ask "Are you
  working with an agent?" at the end (RIO ManyChat style, Nov 7, 2026).
  If yes, collect agent name, brokerage, and agent phone or email, and say
  Darien will be in contact soon to send all home info to their agent to
  share with them. If no, they already have the details, just confirm and
  offer Text/Call/Email Darien. On the Yes path the visitor has already
  seen the preview details and links, but the full address, payment and
  loan figures behind a property-page sign-in still go to the agent, not
  the visitor. Direct Text, Call, and Email links to Darien himself are
  not gated.
- The cart is a rotating circle at the top (front home largest, pause on
  hover or button, static with prefers-reduced-motion). No backdrop image on
  the cart page, and never reuse the New builds image there.
- Map search heading is "Search every home near you". Do not change the
  BoldTrail IDX map itself.
- The ADU tab uses a photo hero, not a blueprint. There is no "Two homes on
  one lot" Main home / Second home section.
- Never include price, square footage, or bed/bath counts in Instagram or
  TikTok captions. That is a caption rule, separate from site copy, which
  does show prices and specs.
- The "Ask Darien" chatbot is client-side only. Reviews and problems are sent
  via the visitor's own text or email app, and are not stored on the site.
- `MANYCHAT-REALTOR-FLOW.md` is the Instagram DM flow. It is a reference doc,
  not site code.
