"""About page images from Darien's doorway photo.
Usage: portrait.py <src> <out dir>
  darien-card.jpg: portrait crop centered on Darien, 2:3, upscaled 3x with light sharpening
  about-me-1600.jpg / about-me-800.jpg: soft blurred backdrop for the About hero"""
import sys, os
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
src, out = sys.argv[1], sys.argv[2]
im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
W, H = im.size  # 213 x 320
card = im.crop((49, 50, 213, 296))  # 164 x 246, 2:3, Darien on the right
card = card.resize((492, 738), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.0, percent=60, threshold=2))
card.save(os.path.join(out, "darien-card.jpg"), quality=86, optimize=True, progressive=True)
band = im.crop((0, 70, W, 70 + round(W * 9 / 16)))  # 16:9 band through the room and doorway
for w in (1600, 800):
    h = round(w * 9 / 16)
    b = band.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(w / 70))
    b = ImageEnhance.Color(b).enhance(1.15)
    b.save(os.path.join(out, "about-me-%d.jpg" % w), quality=72, optimize=True, progressive=True)
print("ok")
