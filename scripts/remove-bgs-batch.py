"""
Bulk background removal for all .jpg files in assets/images/products/.

Rationale: when images are processed via PIL with a white-background composite
(see the Apr 27 ingestion of Max's iCloud zips), the white rectangle is baked
in and shows up against the white category cards on the homepage. Re-running
each image through rembg gives us transparent PNGs that float cleanly.

The output keeps the same basename but with a .png extension, so updating
the PRODUCTS array references is a single sed away.

Run from the repo root:
    python scripts/remove-bgs-batch.py
"""

from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import io
import sys

PRODUCTS = Path(__file__).resolve().parent.parent / "assets" / "images" / "products"

# isnet-general-use is fast and works well on subjects on a white background.
# Use birefnet-general only as a fallback for tricky shots.
SESSION = new_session("isnet-general-use")


def trim(img: Image.Image) -> Image.Image:
    """Crop transparent margins so the subject fills the frame."""
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def process(src: Path) -> tuple[Path, int, int]:
    """Run rembg on src, save trimmed PNG next to it. Returns (path, w, h)."""
    raw = src.read_bytes()
    out = remove(raw, session=SESSION)
    img = Image.open(io.BytesIO(out)).convert("RGBA")
    img = trim(img)
    dst = src.with_suffix(".png")
    img.save(dst, "PNG", optimize=True)
    return dst, img.size[0], img.size[1]


def main() -> int:
    jpgs = sorted(PRODUCTS.glob("*.jpg")) + sorted(PRODUCTS.glob("*.jpeg"))
    if not jpgs:
        print("No .jpg files found in", PRODUCTS)
        return 1

    print(f"Processing {len(jpgs)} files…")
    for i, src in enumerate(jpgs, 1):
        try:
            dst, w, h = process(src)
            sz = dst.stat().st_size / 1024
            print(f"  [{i:>2}/{len(jpgs)}] {src.name:36s} -> {dst.name:36s}  {w}x{h}  {sz:>5.0f} KB")
        except Exception as e:
            print(f"  [{i:>2}/{len(jpgs)}] {src.name:36s}  FAILED: {e}")
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
