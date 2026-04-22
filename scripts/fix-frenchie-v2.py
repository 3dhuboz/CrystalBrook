"""Last pass on frenchie with alpha matting for crisper edges around the ear
where the patterned throw keeps bleeding through."""
from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import io

SRC = Path(r"C:/Users/Steve/Downloads/New folder/41a0b1d8-1b8e-4ac1-9e15-64668cceba79.jpg")
OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "products" / "frenchie.png"

raw = Image.open(SRC).convert("RGB")
# Downscale first so alpha matting doesn't OOM
raw.thumbnail((1000, 1000), Image.LANCZOS)
w, h = raw.size
cropped = raw.crop((int(w * 0.22), int(h * 0.03), int(w * 0.80), int(h * 0.74)))

buf = io.BytesIO()
cropped.save(buf, "JPEG", quality=95)

session = new_session("isnet-general-use")
img_bytes = remove(
    buf.getvalue(),
    session=session,
    alpha_matting=True,
    alpha_matting_foreground_threshold=245,
    alpha_matting_background_threshold=15,
    alpha_matting_erode_size=12,
)
img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
img.save(OUT, "PNG", optimize=True)
print(f"OK frenchie.png  {img.size[0]}x{img.size[1]}")
