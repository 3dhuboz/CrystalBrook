"""Third pass on the French bulldog: crop tightly around just the dog so rembg
doesn't try to keep the person's arms as foreground."""
from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import io

SRC = Path(r"C:/Users/Steve/Downloads/New folder/41a0b1d8-1b8e-4ac1-9e15-64668cceba79.jpg")
OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "products" / "frenchie.png"

raw = Image.open(SRC).convert("RGB")
w, h = raw.size  # 1368 x 1758
# Tight crop to the dog: centred, leaves out the forearms and torso behind
left   = int(w * 0.18)
right  = int(w * 0.86)
top    = int(h * 0.05)
bottom = int(h * 0.78)
cropped = raw.crop((left, top, right, bottom))

buf = io.BytesIO()
cropped.save(buf, "JPEG", quality=95)

session = new_session("isnet-general-use")
img = Image.open(io.BytesIO(remove(buf.getvalue(), session=session))).convert("RGBA")
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
img.save(OUT, "PNG", optimize=True)
print(f"OK frenchie.png  {img.size[0]}x{img.size[1]}")
