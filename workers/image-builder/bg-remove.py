"""
Remove white-ish backgrounds from product photos and save as
transparent PNGs into assets/images/products/.

Approach (edge-connected flood-fill, NOT naive distance keying):
  - Read input JPG (RGB)
  - Build a binary mask of "near-white" pixels
  - Find connected components in that mask
  - Any component that TOUCHES THE EDGE of the image = real background
  - Components that DON'T touch the edge = interior white (e.g. a
    fish belly) — keep them OPAQUE
  - For the surviving background pixels, soft falloff at the boundary
    gives natural anti-aliased edges
  - Saves to <repo>/assets/images/products/<dest>.png

This is the standard 'sticky-tape' technique product photographers
use to drop white studio backgrounds without damaging light interior
features. Much more reliable than per-pixel keying for fish on white.
"""
import sys
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

REPO = Path(__file__).resolve().parent.parent.parent
OUT_DIR = REPO / "assets" / "images" / "products"

# Each batch is (source folder, [(src_filename, dest_stem), ...]).
# Dest stem gets .png appended and lands in OUT_DIR.
BATCHES = [
    # ---- Saltwater (Apr 24) ----
    (Path(r"C:\Users\Steve\Downloads\Saltwater Fish"), [
        ("112bf3c5-d921-4fc4-84f7-3494c197269f.jpg", "estuary-cod"),
        ("5c39d66f-caef-467f-84ea-05dbb1102639.jpg", "cobia"),
        ("6bc31bf5-4e9a-4cd0-b184-afdd2ee14794.jpg", "coral-trout-vivid"),
        ("75b42b8d-38a4-4b8d-8f6f-6ebea9dd4001.jpg", "whaleshark"),
        ("783c2d47-d860-4897-8bf1-20bf6a782635.jpg", "whaleshark-aerial"),
        ("7d56ad55-afad-423c-a7df-fd8f3021eff7.jpg", "spangled-emperor"),
        ("91da30ea-71fd-4ba1-8ce5-7207bcf7af70.jpg", "coral-trout-hunter"),
        ("992eab9f-2cde-4101-8bd5-3824baefdcec.jpg", "banded-cod"),
        ("a641db16-2f52-43bd-ab44-28850da5ffa9.jpg", "pink-snapper"),
        ("b45cb27c-c3a0-4a46-adc0-1d204b83ba77.jpg", "dusky-flathead"),
        ("c5f5c817-165c-42be-bd86-3edd100ae5d9.jpg", "yellowfin-tuna"),
        ("cd759ed7-bb17-43ab-a360-54805fbd6404.jpg", "sailfish"),
        ("fc1ddfa6-0cbc-4007-9d6c-bb9fd4df3cf7.jpg", "tiger-shark"),
    ]),
    # ---- Birds and Animals (Apr 25) ----
    (Path(r"C:\Users\Steve\Downloads\Birds and Animals"), [
        ("0b0576da-dd30-47ab-9de8-c61eb615bd56.jpg", "koala"),
        ("2b9cc81b-2d81-413b-b8bc-a06e1cadfc97.jpg", "saltwater-croc"),
        ("4822183e-cdef-44d9-a0e4-52b8d0376cab.jpg", "cairns-birdwing"),
        ("9095b09b-d09e-4fee-b37c-21f162ad4e18.jpg", "kanga"),
        ("ea6d7124-d812-4561-8a67-5444da0ffab4.jpg", "bilby"),
        ("53fad489-bde9-4526-9a90-b085c7cb4f79.jpg", "eagle"),
        ("9a034cfc-76a3-43d0-8546-dee99a6976bb.jpg", "lorikeet-new"),
        ("ba3b8f1a-9a93-4b0c-84c6-ff819e9cdb04.jpg", "cocky"),
        ("c292ccf3-6164-4fa1-81f6-a77f6dc878f3.jpg", "galah-new"),
        ("e4e8c112-edd1-4f7d-8db9-126c3f9fecb4.jpg", "kooka"),
    ]),
    # ---- Freshwater (Apr 25) ----
    (Path(r"C:\Users\Steve\Downloads\Freshwater"), [
        ("461d6bf5-39ee-40bc-ad79-cdee8f2eb39e.jpg", "saratoga"),
        ("a65eeee7-5073-4219-8069-9453679cdfcf.jpg", "cod-new"),
        ("dd629598-c056-4775-8f5e-cb802c87ca69.jpg", "yellowbelly"),
        ("e32e0767-df1a-46be-9098-d4531ad81db6.jpg", "sooty-grunter"),
        ("fc223344-2d95-4e9a-88d8-84c90d0a564a.jpg", "tilapia"),
    ]),
]

# A pixel is considered "near-white" for flood-fill purposes if its
# distance from (255,255,255) is below this. Generous so the edge
# component picks up cream-tinted JPEG compression halos around the
# subject.
NEAR_WHITE_DIST = 60       # 0..441 (sqrt(255^2*3))
# Soft alpha falloff at the boundary for anti-aliased edges
EDGE_INNER = 25            # within this dist of pure white -> alpha 0
EDGE_OUTER = 60            # beyond this dist -> alpha 255

def remove_white_bg(im: Image.Image) -> Image.Image:
    rgb = np.asarray(im.convert("RGB"), dtype=np.int16)
    h, w, _ = rgb.shape

    # Per-pixel distance from pure white
    diff = 255 - rgb
    dist = np.sqrt((diff ** 2).sum(axis=2).astype(np.float32))

    # 1. Binary near-white mask
    near_white = dist < NEAR_WHITE_DIST                    # bool array

    # 2. Find connected components in the near-white mask
    labelled, n_components = ndimage.label(near_white)

    # 3. Identify components that touch the image edge
    edge_labels = set()
    edge_labels.update(np.unique(labelled[0, :]))          # top row
    edge_labels.update(np.unique(labelled[-1, :]))         # bottom row
    edge_labels.update(np.unique(labelled[:, 0]))          # left col
    edge_labels.update(np.unique(labelled[:, -1]))         # right col
    edge_labels.discard(0)                                 # 0 = not-near-white

    # 4. Background mask = pixels in any edge-connected near-white component
    if edge_labels:
        bg_mask = np.isin(labelled, list(edge_labels))
    else:
        bg_mask = np.zeros_like(near_white)

    # 5. Build alpha:
    #    - Background pixels: use soft falloff based on white-distance
    #      so the boundary anti-aliases naturally
    #    - Non-background pixels (subject + interior whites): full opaque
    alpha_falloff = np.clip(
        (dist - EDGE_INNER) * (255.0 / (EDGE_OUTER - EDGE_INNER)),
        0, 255,
    ).astype(np.uint8)
    alpha = np.where(bg_mask, alpha_falloff, 255).astype(np.uint8)

    out = np.dstack([rgb.astype(np.uint8), alpha])
    return Image.fromarray(out, mode="RGBA")

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    for src_dir, mappings in BATCHES:
        if not src_dir.exists():
            print(f"SKIP batch (missing folder): {src_dir}\n")
            continue
        print(f"=== Batch: {src_dir.name} ===")
        for src_name, dest_stem in mappings:
            src = src_dir / src_name
            if not src.exists():
                print(f"  SKIP  {src_name}  (not found)")
                continue
            im = Image.open(src)
            out = remove_white_bg(im)
            dest = OUT_DIR / f"{dest_stem}.png"
            out.save(dest, format="PNG", optimize=True)
            print(f"  OK    {src_name}  ->  {dest.name}  {out.size}")
            total += 1
        print()
    print(f"Processed {total} images total.")

if __name__ == "__main__":
    main()
