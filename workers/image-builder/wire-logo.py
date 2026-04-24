"""
Wire Max's chosen logo across the site:

  1. Replace favicon links in <head> with the new PNG set
  2. Replace the inline SVG brand-mark in the header with the new
     icon-only emblem PNG
  3. Replace the inline SVG brand-mark in the mobile nav drawer
     with the new icon-only emblem PNG
  4. Update manifest.webmanifest to point at the new icons

Idempotent — safe to re-run.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent

PAGES = [
    "index.html",
    "shop.html",
    "product.html",
    "about.html",
    "order.html",
    "policies.html",
    "404.html",
    "admin/index.html",
]

# Brand-mark replacement — both the full desktop variant (with comments)
# and the compact mobile-drawer variant. Both end with </span> after </svg>.
BRAND_MARK_RE = re.compile(
    r'<span class="brand-mark">\s*<svg[^>]*>.*?</svg>\s*</span>',
    re.DOTALL,
)
BRAND_MARK_NEW = (
    '<span class="brand-mark">'
    '<img src="assets/logos/logo-mark-96.png?v=20260424-4" '
    'alt="Crystal Brook Wall Mounts emblem" width="40" height="40" '
    'style="display:block;border-radius:6px;" />'
    '</span>'
)

# Favicon block replacement — match the existing two icon links and
# replace with the full PNG icon set + retained SVG fallback for browsers
# that prefer it.
FAVICON_RE = re.compile(
    r'<link rel="icon"[^>]*?favicon\.svg"[^>]*/>\s*'
    r'<link rel="apple-touch-icon"[^>]*?icon-192\.svg"[^>]*/>',
    re.DOTALL,
)
FAVICON_NEW = (
    '<link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png?v=20260424-4" />\n'
    '<link rel="icon" type="image/png" sizes="16x16" href="assets/favicon-16.png?v=20260424-4" />\n'
    '<link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png?v=20260424-4" />'
)

def edit(path: Path) -> tuple[bool, list[str]]:
    notes = []
    text = path.read_text(encoding="utf-8")
    original = text

    # 1. Brand-mark swaps (could be 1 or 2 occurrences per file)
    new_text, n_brand = BRAND_MARK_RE.subn(BRAND_MARK_NEW, text)
    if n_brand:
        notes.append(f"brand-mark x{n_brand}")
        text = new_text

    # 2. Favicon swap
    new_text, n_fav = FAVICON_RE.subn(FAVICON_NEW, text)
    if n_fav:
        notes.append(f"favicon x{n_fav}")
        text = new_text

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True, notes
    return False, notes

def main():
    for rel in PAGES:
        p = REPO / rel
        if not p.exists():
            print(f"SKIP {rel} (missing)")
            continue
        changed, notes = edit(p)
        flag = "OK " if changed else "no-op"
        print(f"{flag} {rel}  {' '.join(notes) if notes else '(no matches)'}")

    # 3. Manifest
    manifest_path = REPO / "manifest.webmanifest"
    if manifest_path.exists():
        manifest = manifest_path.read_text(encoding="utf-8")
        new_manifest = manifest
        # Replace icon entries
        new_manifest = re.sub(
            r'"src":\s*"assets/icon-192\.svg"',
            '"src": "assets/icon-192.png?v=20260424-4"',
            new_manifest,
        )
        new_manifest = re.sub(
            r'"src":\s*"assets/icon-512\.svg"',
            '"src": "assets/icon-512.png?v=20260424-4"',
            new_manifest,
        )
        # Replace icon types
        new_manifest = re.sub(
            r'"type":\s*"image/svg\+xml"',
            '"type": "image/png"',
            new_manifest,
        )
        if new_manifest != manifest:
            manifest_path.write_text(new_manifest, encoding="utf-8")
            print("OK manifest.webmanifest  icons swapped")
        else:
            print("no-op manifest.webmanifest  (nothing to change)")

if __name__ == "__main__":
    main()
