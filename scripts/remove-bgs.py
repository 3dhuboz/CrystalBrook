"""Batch-remove backgrounds from Max's supplied images and save as transparent PNGs
named to match the `pimg` keys in assets/app.js.

Input:  C:/Users/Steve/Downloads/New folder/
Output: crystalbrook-mockup/assets/images/products/
"""
from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import io

SRC = Path(r"C:/Users/Steve/Downloads/New folder")
OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "products"
OUT.mkdir(parents=True, exist_ok=True)

# UUID -> output slug (matches pimg in app.js where a product exists;
# "bonus-*" are new subjects not yet in the catalogue — kept for Max's review)
MAP = {
    "01a17b5e-e375-487b-8f82-b0a04042f194.jpg": "mahi",
    "2b8b8071-335a-4f59-891d-645c258df893.jpg": "bonus-sea-turtle",
    "41a0b1d8-1b8e-4ac1-9e15-64668cceba79.jpg": "frenchie",
    "79e5096e-8c6a-4f1f-a293-9a39ff1ced73.jpg": "monaro",
    "7b7d2d30-ce5f-413f-871b-3e1f4683c7a0.jpg": "bonus-mackerel",
    "852d6b99-ada4-4f6e-b5c8-3b7873b47733.jpg": "coral",
    "89864208-fd15-4388-9b10-2a6d493494c2.jpg": "cod",
    "9d6d163f-5959-44ac-b81b-d82b9304513a.jpg": "barra",
    "9eaf822c-e45d-4957-ba3c-2c02401c9eff.jpg": "torana",
    "b8bcb158-1dc9-4684-aa36-7adf4f5c66cf.jpg": "bonus-ulysses-butterfly",
    "c352afad-069a-40d3-bd84-07848a25ffd5.jpg": "snapper",
    "c40e3c70-c243-4a6c-bff1-fee4b0136985.jpg": "lorikeet",
    "e19d0b17-e41b-4ca5-a7f4-d2b64476d9b9.jpg": "xygt",
    "f666ace0-6933-4311-b2c1-088fc1b494b5.jpg": "coral-alt",
}

# isnet-general-use gives cleaner edges than u2net for mixed subjects
session = new_session("isnet-general-use")

def trim(img: Image.Image) -> Image.Image:
    """Crop transparent margins so the product fills the frame."""
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img

for src_name, slug in MAP.items():
    src = SRC / src_name
    if not src.exists():
        print(f"SKIP (missing): {src_name}")
        continue
    with open(src, "rb") as f:
        data = f.read()
    cut = remove(data, session=session)
    img = Image.open(io.BytesIO(cut)).convert("RGBA")
    img = trim(img)
    dest = OUT / f"{slug}.png"
    img.save(dest, "PNG", optimize=True)
    print(f"OK: {src_name} -> {dest.name}  ({img.size[0]}x{img.size[1]})")

print("Done.")
