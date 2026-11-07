"""Builds Darien's website two ways from the same files:
  1. The preview page on Claude (an Artifact). No tracking; forms fall back to text, email and copy.
  2. The public website folder (index.html + img/) that anyone can open, with the Google tracker when its URL is given.
Usage: build_site.py <page with the agent photo> <site dir> <artifact out .html> <web out dir> [tracker URL]"""
import json
import re
import shutil
import sys
from pathlib import Path

site_path, here, out_path, web_dir = sys.argv[1], Path(sys.argv[2]), sys.argv[3], Path(sys.argv[4])
tracker = sys.argv[5] if len(sys.argv) > 5 else ""
if tracker and not re.fullmatch(r"https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec", tracker):
    sys.exit("tracker URL doesn't look like an Apps Script web app URL")

# page: accent, text on accent, accent text (light), soft (light), accent text (dark), soft (dark)
THEMES = {
    "home": ("#F06A3B", "#FFFFFF", "#BB532E", "#FDEAE4", "#F1764B", "#3D221C"),
    "guide": ("#7B5CD6", "#FFFFFF", "#7B5CD6", "#EDE8F9", "#A08AE2", "#251F3B"),
    "search": ("#1C8DC9", "#FFFFFF", "#1877AA", "#DFEFF7", "#3F9FD1", "#122938"),
    "assumable": ("#0E9C90", "#FFFFFF", "#0B7970", "#DDF1EF", "#33ABA1", "#102C2D"),
    "placer": ("#E9A23B", "#2A1700", "#8F5A00", "#FBEBCF", "#F5C46E", "#3A2A10"),
    "payment": ("#2E9E5B", "#FFFFFF", "#247B47", "#E2F1E8", "#4EAD74", "#162C22"),
    "zero-down": ("#3B5BDB", "#FFFFFF", "#3B5BDB", "#E4E8FA", "#7E93E7", "#191F3C"),
    "new-builds": ("#D9901A", "#1A1206", "#9B6713", "#FAEFDF", "#D9901A", "#382A15"),
    "stockton": ("#F2A33A", "#2A1600", "#9A5400", "#FDEBD0", "#F7C47A", "#3A2A12"),
    "refinance": ("#C2367A", "#FFFFFF", "#C2367A", "#F6E3EC", "#D77BA7", "#341828"),
    "build": ("#7E8F1F", "#FFFFFF", "#6B791A", "#EDEFE0", "#92A041", "#262916"),
    "about": ("#D93A4E", "#FFFFFF", "#C83548", "#FAE3E6", "#E47280", "#381820"),
    "adu": ("#4F6D7A", "#FFFFFF", "#4F6D7A", "#E7ECEE", "#93AEBA", "#1C2529"),
    "alerts": ("#8A5A3C", "#FFFFFF", "#8A5A3C", "#EFE8E4", "#B2927E", "#281F1C"),
    "cart": ("#0F2E44", "#FFFFFF", "#0F2E44", "#E4E9EC", "#7FA3B8", "#101E28"),
}


def rgb(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def lum(h):
    c = [v / 255 for v in rgb(h)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hover(accent, ink):
    """A clearly darker shade of the accent for hovered buttons, with text that stays readable on it."""
    for f in (0.82, 0.78, 0.74, 0.70, 0.66, 0.62, 0.58):
        h = "#%02X%02X%02X" % tuple(int(v * f) for v in rgb(accent))
        for text in (ink, "#FFFFFF"):
            if contrast(text, h) >= 4.5:
                return h, text
    return "#0F2E44", "#FFFFFF"


HOVER = {k: hover(a, i) for k, (a, i, *_rest) in THEMES.items()}
light = "\n".join(':root[data-page="%s"] { --pa: %s; --pa-ink: %s; --pa-text: %s; --pa-soft: %s; --pa-hover: %s; --pa-hover-ink: %s; }' % (k, a, i, t, s, *HOVER[k])
                  for k, (a, i, t, s, _, _) in THEMES.items())
dark_auto = "\n".join('  :root:not([data-theme="light"])[data-page="%s"] { --pa-text: %s; --pa-soft: %s; }' % (k, dt, ds) for k, (_, _, _, _, dt, ds) in THEMES.items())
dark_set = "\n".join(':root[data-theme="dark"][data-page="%s"] { --pa-text: %s; --pa-soft: %s; }' % (k, dt, ds) for k, (_, _, _, _, dt, ds) in THEMES.items())
base = ':root { --pa-hover: %s; --pa-hover-ink: %s; }' % HOVER["home"]
dark_base_auto = '  :root:not([data-theme="light"]) { --pa-text: #FFAD95; --pa-soft: #3A1E15; }'
dark_base_set = ':root[data-theme="dark"] { --pa-text: #FFAD95; --pa-soft: #3A1E15; }'
themes_css = base + "\n" + light + "\n@media (prefers-color-scheme: dark) {\n" + dark_base_auto + "\n" + dark_auto + "\n}\n" + dark_base_set + "\n" + dark_set

m = re.search(r'<img src="(data:image/[a-z]+;base64,[^"]+)"', open(site_path, encoding="utf-8").read())
if not m:
    sys.exit("photo not found")
photo = re.sub(r"\s+", "", m.group(1))
if (here / "img" / "avatar.jpg").is_file():  # the small round photo in the top bar
    import base64 as _b64
    photo = "data:image/jpeg;base64," + _b64.b64encode((here / "img" / "avatar.jpg").read_bytes()).decode()

data = json.load(open(here / "data.json", encoding="utf-8"))
data_json = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
parts = [open(p, encoding="utf-8").read() for p in sorted((here / "js").glob("*.js"))]
import hashlib as _h
_pv = _h.md5(b"".join(p.read_bytes() for p in sorted((here / "img").glob("*.jpg")))).hexdigest()[:8]
source = ("(() => {\n'use strict';\n" + "\n".join(parts) + "\n})();").replace("__PHOTO_V__", _pv)

photo_keys = [k for k, rest in re.findall(r"^\s*'?([a-z-]+)'?: \{ pos: '(.*)$", open(here / "js" / "2b-photos.js", encoding="utf-8").read(), re.M) if "src:" not in rest and "optional:" not in rest]  # hotlinked or not-yet-added photos are skipped
need = [k + s for k in photo_keys for s in ("-1920.jpg", "-960.jpg", "-tile.jpg")] + ["darien-card.jpg"]
missing = [n for n in need if not (here / "img" / n).is_file()]
if not photo_keys or missing:
    sys.exit("photos missing: " + (", ".join(missing) or "no photo keys found"))

template = open(here / "template.html", encoding="utf-8").read()


def page(mode, tracker_url):
    script = source.replace("__MODE__", mode).replace("__TRACKER__", tracker_url)
    if "</script" in script.lower():
        sys.exit("script contains a closing script tag")
    out = (template.replace("__THEMES__", themes_css).replace("__PHOTO__", photo)
           .replace("__DATA__", data_json).replace("__SCRIPT__", script))
    for ph in ("__THEMES__", "__PHOTO__", "__DATA__", "__SCRIPT__", "__TRACKER__", "__MODE__"):
        if ph in out:
            sys.exit("placeholder left: " + ph)
    return out, script


# 1. Preview on Claude
artifact, script_a = page("artifact", "")
open(out_path, "w", encoding="utf-8").write(artifact)
open(here / "app-artifact.js", "w", encoding="utf-8").write(script_a)

# 2. Public website: a full HTML document plus the photos
web, script_w = page("web", tracker)
cut = web.index("</style>") + len("</style>")
head, body = web[:cut], web[cut:]
head = re.sub(r"<title>.*?</title>\s*", "", head, count=1, flags=re.S)
head = re.sub(r'<meta name="claude:[^"]*"[^>]*>\s*', "", head)
SITE = "https://darienphillips.com"
TITLE = "Darien Phillips, REALTOR® | Homes in Placer, Sacramento, San Joaquin and Stanislaus"
DESC = ("Find homes with low-rate assumable loans, $0-down options, new builds and homes by monthly payment across "
        "Placer, Sacramento, San Joaquin and Stanislaus counties with Darien Phillips, REALTOR® at eXp Realty of Northern California.")
ICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230F2E44'/%3E"
        "%3Cpath d='M12 33 32 15l20 18v17H40V38H24v12H12z' fill='%23FF7A59'/%3E%3C/svg%3E")
doc = ("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
       "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
       "<title>" + TITLE + "</title>\n<meta name=\"description\" content=\"" + DESC + "\">\n"
       "<meta name=\"google-site-verification\" content=\"hLjf4AQ-nnWe5trIb_zzT3FX1EEy1cJhcGrGFHrG3tk\" />\n<meta name=\"theme-color\" content=\"#0F2E44\">\n<meta property=\"og:type\" content=\"website\">\n"
       "<meta property=\"og:title\" content=\"Darien Phillips, REALTOR® | Looking for the right home? You're in the right place.\">\n"
       "<meta property=\"og:description\" content=\"" + DESC + "\">\n<meta property=\"og:image\" content=\"" + SITE + "/img/home-960.jpg\">\n<meta property=\"og:url\" content=\"" + SITE + "/\">\n"
       "<link rel=\"icon\" href=\"" + ICON + "\">\n"
       "<style>[hidden]{display:none!important}body{margin:0}img{max-width:100%}</style>\n"
       + head.strip() + "\n</head>\n<body>\n" + body.strip() + "\n</body>\n</html>\n")
if web_dir.exists():
    shutil.rmtree(web_dir)
(web_dir / "img").mkdir(parents=True)
open(web_dir / "index.html", "w", encoding="utf-8").write(doc)
for n in need:
    shutil.copy2(here / "img" / n, web_dir / "img" / n)
open(web_dir / "_headers", "w", encoding="utf-8").write("/img/*\n  Cache-Control: public, max-age=86400\n")
# Links to a home, like /p/encino, open the same page; the page then shows that home
open(web_dir / "_redirects", "w", encoding="utf-8").write("/p/*  /index.html  200\n")
# Sitemap for Google: the home page plus a page for every community, Stockton plan and home on the site
import re as _re
_slug = lambda x: _re.sub(r"^-|-$", "", _re.sub(r"[^a-z0-9]+", "-", str(x).lower()))
_d = json.load(open(here / "data.json", encoding="utf-8"))
_keys = []
_keys += [_slug(c["name"]) for c in _d["communities"]]
_comm = {c["key"]: c for c in _d["stockton"]["communities"]}
_keys += [_slug(h.get("street") or (_comm[h["comm"]]["name"] + " " + h["plan"])) for h in _d["stockton"]["homes"] if h.get("comm") in _comm]
for _extra in ("SHAWOOD at Folsom", "Oakhaven", "Ridgeline at Bickford Ranch", "Summit Estates", "Preserve at Folsom Ranch - Heritage Trails"):
    _keys.append(_slug(_extra))
_seen, _urls = set(), ["https://darienphillips.com/"]
for _k in _keys:
    if _k and _k not in _seen:
        _seen.add(_k); _urls.append("https://darienphillips.com/p/" + _k)
open(web_dir / "sitemap.xml", "w", encoding="utf-8").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join("  <url><loc>" + u + "</loc></url>\n" for u in _urls) + "</urlset>\n")
open(web_dir / "robots.txt", "w", encoding="utf-8").write("User-agent: *\nAllow: /\nSitemap: https://darienphillips.com/sitemap.xml\n")
open(here / "app.js", "w", encoding="utf-8").write(script_w)
print("built | preview bytes:", len(artifact), "| website:", web_dir, len(doc), "bytes +", len(need), "photos | tracker:", "on" if tracker else "off")
print("hover colors:", {k: v for k, v in HOVER.items()})
