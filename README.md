# Darien Phillips Homes, darienphillips.com

Website for Darien Phillips, REALTOR, eXp Nor Cal, DRE 02439090.
Phone 209.882.6469, email darienphillips45@gmail.com.
Sacramento and greater areas: Placer, Sacramento, San Joaquin, and Stanislaus counties.

## Demo first, live site second

- **Demo:** https://darien-phillips-homes.pages.dev (Cloudflare Pages, free)
- **Live site:** darienphillips.com still points to Netlify. Do NOT move darienphillips.com
  to Cloudflare Pages, or deploy anything to it, until Darien approves the demo.

Test on the demo until it is perfect, then move the live domain only on his go-ahead.

## What is here

- `template.html`: page layout and all styles.
- `js/`: the site scripts, joined in name order when the site is built.
  `1-core.js` basics, payment math, tracking, and the "Get full details" form;
  `2-scenes.js` / `2b-photos.js` / `2c-sky.js` backdrops and time-of-day colors;
  `3-pages.js`, `4-pages.js`, `5-tools.js` the tab pages; `5b-admin.js` admin bar;
  `5c-props.js` a page for every home (`/p/<keyword>`) with the sign-in step;
  `5d-search.js` map search; `5e-match.js`, `5f-dream.js`, `5g-deals.js`,
  `5h-adu.js`, `5i-nbmap.js`; `6-boot.js` navigation and routing;
  `7-chat.js` the "Ask Darien" chatbot.
- `data.json`: homes, communities, towns, loan limits, and rates. Remake it with
  `python3 make_site_data.py inputs data.json` after updating `inputs/`
  (MLS export in `inputs/mls/homes.json`, Placer and Stockton homes, town list).
- `placer-assumable-homes.html`: holds Darien's small headshot used in the header and footer.
- `Darien-Website-Tracker.gs`: the Google Apps Script tracker, version 4
  (visits, clicks, sign-ins, Listings tab, leads, sign-ups, admin numbers).
  `test-tracker4.js` tests it.
- `build_site.py`: builds the site. `check.py`, `check_web.py`, `check_props.py`,
  and `check_similar.py`: automated page checks.
- `tools/`: `photos.py` and `portrait.py` make the page photos; `make_deals_js.py`
  and the `5g-`, `5h-`, `5i-` templates build the deals, ADU, and new-build map code.
- `MANYCHAT-REALTOR-FLOW.md`: the Instagram comment-keyword DM flow, realtor check first.
- `img/`: page photos. **Not in this repo yet.** They are binary and are added
  separately. See CLAUDE.md.
- `web/`: generated output. **Do not edit `web/index.html` directly.** Edit the
  source and rebuild.

## Build

```sh
python3 build_site.py placer-assumable-homes.html . preview.html web [TRACKER_URL]
```

That builds `preview.html` and the public folder `web/` (index.html plus img/).

## Tracker URL, do not commit it

The tracker is a Google Apps Script web app URL. It is **not in this repo**,
on purpose: this repo is public. The tracker URL is provided separately,
never committed, and never pasted into a file here.

- Build without it to build without tracking: leave off the last argument.
- Build with it to record visits and sign-ins: pass it as the last argument,
  or set it from an environment variable or a secret in the deploy step.
- If the tracker code changes, update the existing Apps Script deployment
  (Deploy, Manage deployments, Edit, New version) so the URL stays the same.

## Test

Run the checks in `check.py` / `check_web.py` after a rebuild, and open the
demo on a real phone and desktop before asking Darien to approve anything.
