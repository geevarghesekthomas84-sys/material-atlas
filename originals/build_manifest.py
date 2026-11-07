"""Build the gallery index for independently created SVG icons."""

import json
import xml.etree.ElementTree as ET
from pathlib import Path


HERE = Path(__file__).resolve().parent


def main():
    rows = []
    for path in sorted(HERE.glob("*.svg")):
        if ET.parse(path).getroot().tag != "{http://www.w3.org/2000/svg}svg":
            raise ValueError(f"Not an SVG: {path}")
        rows.append({"name": path.stem, "path": f"originals/{path.name}"})
    (HERE / "manifest.json").write_text(
        json.dumps(rows, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    print(f"Indexed {len(rows)} original icons")


if __name__ == "__main__":
    main()
