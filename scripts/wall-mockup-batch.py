"""
Generate "on the wall" mockup images for each product.

Takes a transparent product PNG (the cutout), composites it onto a generated
warm-white wall background with a soft drop shadow, and saves as JPEG. Used
as the second image in the product detail page gallery so customers can see
the piece in a room context — not just floating on the storefront card.

Each product's `size` field (e.g. "68 × 32 cm") drives how much of the
mockup wall the piece occupies, so a 130 cm sailfish reads as bigger than a
40 cm Ulysses butterfly.

Run from the repo root:
    python scripts/wall-mockup-batch.py            # one test (coral trout)
    python scripts/wall-mockup-batch.py --all      # full catalogue
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "assets" / "images" / "products"
APP_JS = ROOT / "assets" / "app.js"


# ---------- Wall background ----------

WALL_W, WALL_H = 1600, 1100      # 16:11 — feels like a typical wall photo
WALL_TOP    = (242, 236, 226)    # warm cream — slightly darker up high
WALL_BOTTOM = (250, 245, 237)    # lifted closer to white near skirting
FLOOR_TOP   = (220, 205, 184)    # warm timber tone for the floor strip
FLOOR_BOT   = (190, 170, 144)
SKIRT_TOP   = (244, 240, 232)    # bright skirting board on top of floor
SKIRT_BOT   = (235, 228, 216)


def _vert_gradient(size: tuple[int, int], top: tuple[int, int, int], bot: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, top)
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return img


def make_wall() -> Image.Image:
    """Render a warm-cream wall + skirting board + floor strip.

    Real photos beat synthetic walls every time — but this is enough to
    read as "a wall in a room" rather than "a blank canvas." Max can drop
    a real wall photo at assets/images/walls/default.jpg and we'll switch
    to that when one's available.
    """
    floor_y = int(WALL_H * 0.82)
    skirt_y = int(WALL_H * 0.80)

    # Wall (top portion)
    wall = _vert_gradient((WALL_W, skirt_y), WALL_TOP, WALL_BOTTOM)

    # Skirting board strip
    skirt_h = floor_y - skirt_y
    if skirt_h > 0:
        skirt = _vert_gradient((WALL_W, skirt_h), SKIRT_TOP, SKIRT_BOT)
        wall = _paste_below(wall, skirt)

    # Floor (bottom portion)
    floor_h = WALL_H - floor_y
    if floor_h > 0:
        floor = _vert_gradient((WALL_W, floor_h), FLOOR_TOP, FLOOR_BOT)
        wall = _paste_below(wall, floor)

    # Skirting trim shadow (1-2 px line where skirt meets wall)
    draw = ImageDraw.Draw(wall, "RGBA")
    draw.line([(0, skirt_y), (WALL_W, skirt_y)], fill=(0, 0, 0, 28), width=1)
    # Skirting / floor join
    draw.line([(0, floor_y), (WALL_W, floor_y)], fill=(0, 0, 0, 38), width=1)

    # Soft side shadows so the wall doesn't read as a flat-colour rectangle
    side_shadow = Image.new("RGBA", (WALL_W, WALL_H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(side_shadow)
    edge_w = int(WALL_W * 0.16)
    for i in range(edge_w):
        a = int(28 * (1 - i / edge_w))
        sd.line([(i, 0), (i, WALL_H)], fill=(0, 0, 0, a))
        sd.line([(WALL_W - 1 - i, 0), (WALL_W - 1 - i, WALL_H)], fill=(0, 0, 0, a))
    side_shadow = side_shadow.filter(ImageFilter.GaussianBlur(60))
    wall = Image.alpha_composite(wall.convert("RGBA"), side_shadow).convert("RGB")

    return wall


def _paste_below(top_img: Image.Image, bottom_img: Image.Image) -> Image.Image:
    """Stack top_img above bottom_img into a single image."""
    w = max(top_img.width, bottom_img.width)
    h = top_img.height + bottom_img.height
    out = Image.new("RGB", (w, h), (255, 255, 255))
    out.paste(top_img, (0, 0))
    out.paste(bottom_img, (0, top_img.height))
    return out


# ---------- Sizing ----------

# Map the long-edge cm of the piece to a fraction of the wall image's width.
# A 70 cm coral trout fills ~46% of the wall. A 130 cm sailfish fills ~78%.
# Tweak the constant if pieces start feeling either oversized or postage-stamp.
CM_TO_WALL_FRACTION = 0.0066


def parse_long_edge_cm(size_label: str | None) -> int:
    """Pull the long edge in cm out of '68 × 32 cm'-style labels.

    Falls back to 70 cm — a sensible average — when nothing parseable is found.
    """
    if not size_label:
        return 70
    nums = [int(n) for n in re.findall(r"\d+", size_label)]
    if not nums:
        return 70
    return max(nums)


def target_wall_width(long_edge_cm: int) -> int:
    """Width in pixels the cutout should occupy on the wall image."""
    frac = max(0.30, min(0.78, long_edge_cm * CM_TO_WALL_FRACTION))
    return int(WALL_W * frac)


# ---------- Shadow ----------

def make_shadow(cutout: Image.Image, blur: int = 28, opacity: float = 0.45) -> Image.Image:
    """Soft drop-shadow shaped by the cutout's alpha channel."""
    alpha = cutout.split()[-1]
    shadow = Image.new("RGBA", cutout.size, (0, 0, 0, 0))
    fill = Image.new("RGBA", cutout.size, (15, 12, 10, int(255 * opacity)))
    shadow.paste(fill, (0, 0), mask=alpha)
    return shadow.filter(ImageFilter.GaussianBlur(blur))


# ---------- Compose ----------

def composite_on_wall(cutout_path: Path, out_path: Path, long_edge_cm: int) -> tuple[int, int]:
    """Place a single product cutout onto the wall, return (W, H) of output."""
    cutout = Image.open(cutout_path).convert("RGBA")
    cw, ch = cutout.size

    # Wall area available above the skirting board
    wall_top_h = int(WALL_H * 0.80)

    # Two scaling constraints: width-on-wall (driven by piece dimensions) and
    # max height (so tall montages don't clip out the top of the canvas).
    # Take the smaller scale of the two — whichever's the binding constraint.
    target_w = target_wall_width(long_edge_cm)
    max_h = int(wall_top_h * 0.78)
    scale_w = target_w / cw
    scale_h = max_h / ch
    scale = min(scale_w, scale_h)

    new_size = (max(1, int(cw * scale)), max(1, int(ch * scale)))
    cutout = cutout.resize(new_size, Image.LANCZOS)

    wall = make_wall().convert("RGBA")

    # Position roughly centred horizontally, sitting at hung-art height —
    # vertical centre lands at ~46% from the top of the wall portion (above
    # the skirting), which is roughly eye level for a viewer. Clamp so we
    # never go above y=20 (need a small breathing strip at the top).
    x = (WALL_W - cutout.width) // 2
    y = max(20, int(wall_top_h * 0.48) - cutout.height // 2)

    # Shadow first, then cutout on top
    shadow = make_shadow(cutout)
    sx, sy = x + 12, y + 18
    wall.alpha_composite(shadow, dest=(sx, sy))
    wall.alpha_composite(cutout, dest=(x, y))

    rgb = wall.convert("RGB")
    rgb.save(out_path, "JPEG", quality=88, optimize=True, progressive=True)
    return rgb.size


# ---------- Catalogue ----------

ID_RE    = re.compile(r"id\s*:\s*'(p-[\w-]+)'")
SIZE_RE  = re.compile(r"size\s*:\s*'([^']+)'")
IMAGE_RE = re.compile(r"image\s*:\s*IMG\s*\+\s*'([^']+)'")


def load_products() -> list[dict]:
    """Pull (id, image, size) tuples directly out of app.js.

    Walks balanced `{ … }` blocks inside the PRODUCTS array (the field order
    in each entry varies, so we can't use one big regex). Saves us hand-
    maintaining a parallel list — the source of truth stays PRODUCTS.
    """
    text = APP_JS.read_text(encoding="utf-8")

    # Find the PRODUCTS array body
    start = text.find("const PRODUCTS = [")
    if start < 0:
        return []
    cursor = text.find("[", start)
    depth = 1
    i = cursor + 1
    while depth > 0 and i < len(text):
        if text[i] == "[":
            depth += 1
        elif text[i] == "]":
            depth -= 1
        i += 1
    body = text[cursor + 1 : i - 1]

    # Walk balanced top-level { … } blocks within the array
    products = []
    depth = 0
    block_start = None
    for j, ch in enumerate(body):
        if ch == "{":
            if depth == 0:
                block_start = j
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and block_start is not None:
                block = body[block_start : j + 1]
                m_id = ID_RE.search(block)
                m_size = SIZE_RE.search(block)
                m_image = IMAGE_RE.search(block)
                if m_id and m_size and m_image:
                    products.append({
                        "id": m_id.group(1),
                        "size": m_size.group(1),
                        "image": m_image.group(1),
                    })
                block_start = None
    return products


# ---------- Main ----------

def render(products: list[dict], dry_run: bool = False) -> None:
    print(f"Rendering wall mockups for {len(products)} pieces…")
    for i, p in enumerate(products, 1):
        src = PRODUCTS / Path(p["image"]).name
        if not src.exists():
            print(f"  [{i:>2}/{len(products)}] {p['id']:32s}  SKIP (no source: {src.name})")
            continue
        long_edge = parse_long_edge_cm(p.get("size"))
        out = src.with_name(src.stem + "-wall.jpg")
        if dry_run:
            print(f"  [{i:>2}/{len(products)}] {p['id']:32s}  would render -> {out.name}")
            continue
        try:
            w, h = composite_on_wall(src, out, long_edge)
            sz = out.stat().st_size / 1024
            print(f"  [{i:>2}/{len(products)}] {p['id']:32s}  -> {out.name:36s}  long {long_edge:>3d}cm  {sz:>5.0f} KB")
        except Exception as e:
            print(f"  [{i:>2}/{len(products)}] {p['id']:32s}  FAILED: {e}")
    print("Done.")


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--all", action="store_true", help="render the full catalogue (default: just p-coral)")
    ap.add_argument("--id", help="render a single product by id (e.g. p-monaro)")
    ap.add_argument("--dry-run", action="store_true", help="list intended outputs without writing files")
    args = ap.parse_args(argv)

    products = load_products()
    if not products:
        print("No products parsed from app.js — check PRODUCT_RE.", file=sys.stderr)
        return 1

    if args.id:
        products = [p for p in products if p["id"] == args.id]
    elif not args.all:
        products = [p for p in products if p["id"] == "p-coral"]

    render(products, dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
