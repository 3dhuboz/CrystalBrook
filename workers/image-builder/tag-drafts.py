"""
Tag products that are using stand-in images as `draft:true` so the
storefront can hide them until Max sends through real photos.

Idempotent — re-running is a no-op if drafts are already tagged.
When Max sends a real photo for any of these IDs, drop it from the
DRAFTS set and re-run.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
APP_JS = REPO / "assets" / "app.js"

DRAFTS = {
    # Saltwater stand-ins (using mahi.png / snapper.png / coral.png)
    'p-marlin', 'p-gt', 'p-mangrove', 'p-mulloway', 'p-dhu', 'p-king',
    'p-bream', 'p-tusk', 'p-permit', 'p-wahoo', 'p-threadfin', 'p-finger',
    'p-longtail', 'p-bluefin', 'p-ruby', 'p-bone',
    # Freshwater stand-ins (using cod.png / barra.png / coral-alt.png)
    'p-bass', 'p-trout', 'p-rainbow', 'p-redfin', 'p-jungle',
    # Cars stand-ins (mustang uses monaro, fastback uses torana)
    'p-mustang', 'p-fastback',
    # Animals stand-ins (heeler + dingo using frenchie)
    'p-heeler', 'p-dingo',
}

src = APP_JS.read_text(encoding='utf-8')
patched = 0
already = 0

for pid in sorted(DRAFTS):
    pattern = re.compile(
        r"(\{ id:'" + re.escape(pid) + r"',[^}]*?)(\s*\})",
        re.DOTALL,
    )
    m = pattern.search(src)
    if not m:
        print(f"  NOT FOUND  {pid}")
        continue
    body = m.group(1)
    if 'draft:true' in body or 'draft: true' in body:
        already += 1
        continue
    replacement = m.group(1).rstrip() + ", draft:true " + m.group(2)
    src = src[:m.start()] + replacement + src[m.end():]
    patched += 1
    print(f"  TAGGED  {pid}")

APP_JS.write_text(src, encoding='utf-8')
print(f"\nTagged {patched} products as draft. {already} already tagged.")
