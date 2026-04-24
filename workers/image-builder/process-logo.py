"""
Process Max's chosen logo into the asset set the site needs:

  1. Take Steve's cropped emblem image
  2. Paint over the small mountain icon overlay in the top-left corner
     (a screenshot-UI artefact, NOT part of the logo)
  3. Save a clean primary logo PNG
  4. Generate favicon + PWA icon sizes from it (square crops with the
     hexagon centred, dark warm-black background to match the brand)

Outputs land in assets/logos/ for the canonical brand asset, and
assets/ for the favicon/PWA icons that index.html + manifest.webmanifest
already point at.
"""
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SRC = Path(r"C:\Users\Steve\Downloads\8da5b685-a3f4-44de-98a7-eb944db238b9.jpg")
ASSETS = REPO_ROOT / "assets"
LOGOS = ASSETS / "logos"

# Brand background — the warm near-black behind the emblem
BG = (15, 11, 7)

def patch_overlay(im: Image.Image) -> Image.Image:
    """Cover the screenshot mountain-icon overlay with brand background."""
    out = im.copy()
    draw = ImageDraw.Draw(out)
    # Mountain overlay sits in a circle ~110x110 in the top-left corner.
    # Paint a 130x130 rectangle to cover it AND the small artefact below it.
    draw.rectangle([0, 0, 140, 140], fill=BG)
    return out

def square_crop(im: Image.Image, padding: int = 30) -> Image.Image:
    """Centre-crop on the wider axis, padding to a square with brand background."""
    w, h = im.size
    side = max(w, h) + padding * 2
    sq = Image.new("RGB", (side, side), BG)
    sq.paste(im, ((side - w) // 2, (side - h) // 2))
    return sq

def main():
    if not SRC.exists():
        print(f"Source not found: {SRC}", file=sys.stderr)
        sys.exit(1)

    LOGOS.mkdir(parents=True, exist_ok=True)

    raw = Image.open(SRC).convert("RGB")
    print(f"Source: {SRC.name}  {raw.size}")

    # === 1. Clean the overlay ==========================================
    clean = patch_overlay(raw)

    # === 2. Save canonical brand asset =================================
    primary = LOGOS / "logo-primary.png"
    clean.save(primary, format="PNG", optimize=True)
    print(f"  -> {primary.relative_to(REPO_ROOT)}  {clean.size}")

    # === 3. Square-cropped version (for icon work) =====================
    sq = square_crop(clean, padding=40)
    sq_path = LOGOS / "logo-square.png"
    sq.save(sq_path, format="PNG", optimize=True)
    print(f"  -> {sq_path.relative_to(REPO_ROOT)}  {sq.size}")

    # === 4. Favicon + PWA icon sizes ===================================
    sizes = {
        "favicon-16.png":           16,
        "favicon-32.png":           32,
        "favicon-48.png":           48,
        "apple-touch-icon.png":    180,
        "icon-192.png":            192,
        "icon-512.png":            512,
    }
    for name, px in sizes.items():
        ico = sq.resize((px, px), Image.Resampling.LANCZOS)
        path = ASSETS / name
        ico.save(path, format="PNG", optimize=True)
        print(f"  -> {path.relative_to(REPO_ROOT)}  {px}x{px}")

    # === 5. Header-friendly long-form (used in <header> on every page) ==
    # Width 1200, height 800 — natural emblem aspect, brand bg padded
    header = Image.new("RGB", (1200, 800), BG)
    cw, ch = clean.size
    scale = min(1100 / cw, 700 / ch)
    sw, sh = int(cw * scale), int(ch * scale)
    scaled = clean.resize((sw, sh), Image.Resampling.LANCZOS)
    header.paste(scaled, ((1200 - sw) // 2, (800 - sh) // 2))
    hpath = LOGOS / "logo-header.png"
    header.save(hpath, format="PNG", optimize=True)
    print(f"  -> {hpath.relative_to(REPO_ROOT)}  {header.size}")

    # === 6. Icon-only mark (just bass + top of hexagon, no wordmark) ====
    # The wordmark portion of the emblem is the bottom ~55% of the image.
    # Crop the top ~45% to get just the bass + upper hexagon — a clean
    # icon-only mark that scales to small header positions and squares.
    cw, ch = clean.size
    icon_only = clean.crop((
        int(cw * 0.10),          # left  — trim outer hexagon corners
        int(ch * 0.05),          # top   — small breathing room
        int(cw * 0.90),          # right
        int(ch * 0.50),          # bottom — cut just above CRYSTAL BROOK text
    ))
    iw, ih = icon_only.size
    # Now make it a square with brand bg padding so it works in a circle/square
    icon_side = max(iw, ih) + 20
    icon_sq = Image.new("RGB", (icon_side, icon_side), BG)
    icon_sq.paste(icon_only, ((icon_side - iw) // 2, (icon_side - ih) // 2))
    icon_path = LOGOS / "logo-mark-icon.png"
    icon_sq.save(icon_path, format="PNG", optimize=True)
    print(f"  -> {icon_path.relative_to(REPO_ROOT)}  {icon_sq.size}")

    # Also emit a small (96px) version specifically sized for header use
    icon_small = icon_sq.resize((96, 96), Image.Resampling.LANCZOS)
    icon_small_path = LOGOS / "logo-mark-96.png"
    icon_small.save(icon_small_path, format="PNG", optimize=True)
    print(f"  -> {icon_small_path.relative_to(REPO_ROOT)}  96x96")

    print("\nAll logo assets written.")

if __name__ == "__main__":
    main()
