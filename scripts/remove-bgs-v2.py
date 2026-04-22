"""Fix-ups for two images that the first pass didn't cleanly handle:

- lorikeet.jpg has a "Rainbow Lorikeet / Trichoglossus moluccanus" caption baked
  in under the bird — crop it off before we trim transparent margins.
- frenchie.jpg is the puppy on a person's lap; rembg keeps the person as
  foreground. Re-run with birefnet-general (higher fidelity) and crop to the
  upper portion where only the dog sits.
"""
from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import io

SRC = Path(r"C:/Users/Steve/Downloads/New folder")
OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "products"


def cut(src_bytes: bytes, model: str) -> Image.Image:
    session = new_session(model)
    return Image.open(io.BytesIO(remove(src_bytes, session=session))).convert("RGBA")


def trim(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


# --- lorikeet: drop the caption before trimming ---
src = SRC / "c40e3c70-c243-4a6c-bff1-fee4b0136985.jpg"
raw = Image.open(src).convert("RGB")
w, h = raw.size
# Caption sits in the bottom ~18% — crop it away first
cropped_in = raw.crop((0, 0, w, int(h * 0.82)))
buf = io.BytesIO()
cropped_in.save(buf, "JPEG", quality=95)
img = cut(buf.getvalue(), "isnet-general-use")
img = trim(img)
img.save(OUT / "lorikeet.png", "PNG", optimize=True)
print(f"OK lorikeet.png  {img.size[0]}x{img.size[1]}")


# --- frenchie: crop to upper portion (dog only), then birefnet-general ---
src = SRC / "41a0b1d8-1b8e-4ac1-9e15-64668cceba79.jpg"
raw = Image.open(src).convert("RGB")
w, h = raw.size
# The dog fills roughly the top-centre; drop the bottom where arms/legs sit
# and crop a little off the sides to remove visible forearms.
cropped_in = raw.crop((int(w * 0.12), 0, int(w * 0.88), int(h * 0.82)))
buf = io.BytesIO()
cropped_in.save(buf, "JPEG", quality=95)
img = cut(buf.getvalue(), "birefnet-general")
img = trim(img)
img.save(OUT / "frenchie.png", "PNG", optimize=True)
print(f"OK frenchie.png  {img.size[0]}x{img.size[1]}")

print("Done.")
