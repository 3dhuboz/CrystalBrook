"""Downsize any PNG whose longest edge exceeds 1600px so the mockup isn't
serving 8-10MB assets. Preserves transparency."""
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "products"
MAX_EDGE = 1600

for png in sorted(OUT.glob("*.png")):
    img = Image.open(png).convert("RGBA")
    w, h = img.size
    if max(w, h) > MAX_EDGE:
        img.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
    before = png.stat().st_size
    img.save(png, "PNG", optimize=True)
    after = png.stat().st_size
    kb = lambda b: f"{b/1024:.0f}KB"
    print(f"{png.name:32s}  {w}x{h} -> {img.size[0]}x{img.size[1]}  {kb(before)} -> {kb(after)}")
