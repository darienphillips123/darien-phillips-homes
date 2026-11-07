"""Make hero (1920 + 960 wide) and tile (760x300) JPEGs per page from the staged Unsplash photos.
Usage: python3 -I photos.py <source dir> <output dir>; prints the hero focal points as JSON."""
import json
import os
import sys
from PIL import Image, ImageOps

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
# page: file, pre-crop (fractions l, t, r, b) or None, mirror, hero focal (x, y), tile focal (x, y), tile zoom (share of width)
PHOTOS = {
    "home": ("pexels-8482871-thirdman.jpg", None, False, (0.40, 0.26), (0.40, 0.24), 0.80),
    "assumable": ("roger-starnes-sr-1XRV7Z4lhGo-unsplash.jpg", None, False, (0.52, 0.60), (0.52, 0.60), 0.86),
    "zero-down": ("brian-zajac-g6LLnC-rn0E-unsplash.jpg", None, False, (0.52, 0.54), (0.52, 0.52), 0.86),
    "payment": ("michael-brown-G48h926L2qo-unsplash.jpg", None, False, (0.48, 0.50), (0.48, 0.52), 0.86),
    "new-builds": ("troy-mortier-9GAdLexoV7U-unsplash.jpg", (0, 0, 1, 0.578), False, (0.56, 0.45), (0.56, 0.48), 0.80),
    "placer": ("roger-starnes-sr-pGH1-iHveX0-unsplash.jpg", None, False, (0.52, 0.56), (0.55, 0.57), 0.72),
    "stockton": ("cosmin-gurau-3cDza1lTxCQ-unsplash.jpg", None, False, (0.50, 0.45), (0.50, 0.42), 0.80),
    "refinance": ("luca-bravo-zAjdgNXsMeg-unsplash.jpg", None, False, (0.62, 0.56), (0.64, 0.62), 0.78),
    "build": ("lili-kovac-BSQq5dRT_KU-unsplash.jpg", None, True, (0.74, 0.60), (0.72, 0.60), 0.80),
    "about": ("michael-brown-q6eSeT3euLU-unsplash.jpg", None, False, (0.45, 0.52), (0.45, 0.55), 0.86),
    "alerts": ("roger-starnes-sr-LUdiEvMAyQ8-unsplash.jpg", None, False, (0.50, 0.55), (0.50, 0.52), 0.86),
}
TW, TH = 760, 300
SAVE = dict(format="JPEG", optimize=True, progressive=True)
focal = {}
for page, (name, pre, mirror, (hx, hy), (tx, ty), zoom) in PHOTOS.items():
    im = Image.open(os.path.join(SRC, name))
    if im.format != "JPEG":
        sys.exit(name + " is not a JPEG")
    im = ImageOps.exif_transpose(im).convert("RGB")
    W, H = im.size
    if pre:
        im = im.crop((round(pre[0] * W), round(pre[1] * H), round(pre[2] * W), round(pre[3] * H)))
        W, H = im.size
    if mirror:
        im = ImageOps.mirror(im)
    # hero: no taller than 16:9, centered on the focal point
    ch = min(H, round(W * 9 / 16))
    top = min(max(round(hy * H - ch / 2), 0), H - ch)
    hero = im.crop((0, top, W, top + ch))
    fy = (hy * H - top) / ch
    focal[page] = "%d%% %d%%" % (round(hx * 100), round(fy * 100))
    big = hero.resize((1920, round(ch * 1920 / W)), Image.LANCZOS) if W > 1920 else hero
    big.save(os.path.join(OUT, page + "-1920.jpg"), quality=68, **SAVE)
    half = hero.resize((960, round(hero.height * 960 / hero.width)), Image.LANCZOS)
    half.save(os.path.join(OUT, page + "-960.jpg"), quality=70, **SAVE)
    # tile: zoomed 760x300 band around the tile focal point
    rw = round(W * zoom)
    rh = round(rw * TH / TW)
    if rh > H:
        rh = H
        rw = round(rh * TW / TH)
    left = min(max(round(tx * W - rw / 2), 0), W - rw)
    ttop = min(max(round(ty * H - rh / 2), 0), H - rh)
    tile = im.crop((left, ttop, left + rw, ttop + rh)).resize((TW, TH), Image.LANCZOS)
    tile.save(os.path.join(OUT, page + "-tile.jpg"), quality=72, **SAVE)
print(json.dumps(focal, indent=1))
