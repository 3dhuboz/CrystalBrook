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
    rgb = Image.open(SRC).convert("RGB")
    w, h = rgb.size
    print(f"Source: {SRC.name}  {w}x{h}")

    # PIL's "L" conversion uses Rec. 601 (close enough to 709 for our purposes)
    # and is implemented in C — much faster than Python pixel iteration.
    luma = rgb.convert("L")

    # Boost the alpha so mid-tones still register and the emblem reads
    # cleanly when the watermark is later set to ~12-15% opacity in CSS.
    alpha = luma.point(lambda x: min(255, int(x * 1.25)))

    # Recombine the original RGB with luminance-as-alpha
    r, g, b = rgb.split()
    out = Image.merge("RGBA", (r, g, b, alpha))

    out.save(OUT, format="PNG", optimize=True)
    print(f"  -> {OUT.relative_to(REPO)}  {out.size}  (transparent bg)")

if __name__ == "__main__":
    main()
