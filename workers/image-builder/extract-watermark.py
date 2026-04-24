"""
Extract the gold emblem from the chosen logo with a transparent background,
suitable for use as a subtle watermark behind the hero on the homepage.

Approach:
  - Take logo-primary.png (gold emblem on warm-near-black background)
  - For every pixel, set ALPHA proportional to its LUMINANCE
    (bright gold pixels stay opaque, dark background pixels become
    transparent). This gives a clean knockout — no harsh edges, anti-
    aliasing preserved naturally.
  - Save as logo-watermark.png

Usage:  python extract-watermark.py
"""
from pathlib import Path
from PIL import Image

REPO = Path(__file__).resolve().parent.parent.parent
SRC = REPO / "assets" / "logos" / "logo-primary.png"
OUT = REPO / "assets" / "logos" / "logo-watermark.png"

def main():
    im = Image.open(SRC).convert("RGB")
    px = im.load()
    w, h = im.size
    print(f"Source: {SRC.name}  {w}x{h}")

    # Build RGBA where alpha = perceived luminance of the source.
    # Use Rec. 709 luma coefficients for natural-looking knockout.
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            # Luminance 0..255
            lum = int(0.2126 * r + 0.7152 * g + 0.0722 * b)
            # Boost slightly so faint shadows still show
            alpha = min(255, int(lum * 1.15))
            # Keep the gold colour (boost saturation slightly so it
            # doesn't go grey when faded out at low opacity)
            op[x, y] = (r, g, b, alpha)

    out.save(OUT, format="PNG", optimize=True)
    print(f"  -> {OUT.relative_to(REPO)}  {out.size}  (transparent bg)")

if __name__ == "__main__":
    main()
