"""Build the preview index from SVG assets: python preview/build_manifest.py."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = Path(__file__).resolve().parent / "icons.json"


def build():
    icons = {}
    for path in sorted((ROOT / "src").glob("*/*/*/*.svg")):
        category, name, style, file = path.relative_to(ROOT / "src").parts
        key = (category, name, style)
        if key not in icons or file == "24px.svg":
            icons[key] = file
    rows = [[category, name, style, svg] for (category, name, style), svg in icons.items()]
    OUTPUT.write_text(json.dumps(rows, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Indexed {len(rows)} icon/style pairs in {OUTPUT}")


if __name__ == "__main__":
    build()
