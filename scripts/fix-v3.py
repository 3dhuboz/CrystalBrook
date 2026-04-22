"""Final fix-up pass.
- lorikeet: crop bottom 25% off to ditch the caption entirely
- frenchie: tighter crop (the person's right arm was showing through)
"""
from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import io

NEW = Path(r"C:/Users/Steve/Downloads/New folder")
OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "products"
session = new_session("isnet-general-use")


def process(src: Path, out_name: str, box):
    raw = Image.open(src).convert("RGB")
    w, h = raw.size
    l, t, r, b = box
    cropped = raw.crop((int(w * l), int(h * t), int(w * r), int(h * b)))
    buf = io.BytesIO()
    cropped.save(buf, "JPEG", quality=95)
    img = Image.open(io.BytesIO(remove(buf.getvalue(), session=session))).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save(OUT / out_name, "PNG", optimize=True)
    print(f"OK {out_name}  {img.size[0]}x{img.size[1]}")


process(NEW / "c40e3c70-c243-4a6c-bff1-fee4b0136985.jpg", "lorikeet.png",
        (0.0, 0.0, 1.0, 0.75))
process(NEW / "41a0b1d8-1b8e-4ac1-9e15-64668cceba79.jpg", "frenchie.png",
        (0.22, 0.03, 0.80, 0.74))
