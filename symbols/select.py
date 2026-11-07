"""Choose a useful Material Symbols subset from Google's icon metadata."""

import argparse
import json
from pathlib import Path
from urllib.request import urlopen


HERE = Path(__file__).resolve().parent
METADATA_URL = "https://fonts.google.com/metadata/icons?incomplete=1&key=material_symbols"
REQUIRED_FAMILIES = {"Material Symbols Outlined", "Material Symbols Rounded", "Material Symbols Sharp"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--popular", type=int, default=240, help="Number of popular names to include before retaining existing names")
    args = parser.parse_args()
    if args.popular < 1:
        parser.error("--popular must be positive")

    with urlopen(METADATA_URL, timeout=45) as response:
        raw = response.read().decode("utf-8")
    metadata = json.loads(raw[raw.index("{"):])
    supported = [icon for icon in metadata["icons"]
                 if not REQUIRED_FAMILIES.intersection(icon.get("unsupported_families", []))]
    supported.sort(key=lambda icon: (-icon.get("popularity", 0), icon["name"]))
    existing_manifest = HERE / "manifest.json"
    retained = {row["name"] for row in json.loads(existing_manifest.read_text(encoding="utf-8"))} if existing_manifest.exists() else set()
    selected = {icon["name"] for icon in supported[:args.popular]} | retained
    by_name = {icon["name"]: icon for icon in metadata["icons"]}
    missing = selected - by_name.keys()
    if missing:
        raise ValueError(f"Previously selected names are missing from Google metadata: {sorted(missing)}")

    icons = []
    for name in sorted(selected):
        source = by_name[name]
        category = (source.get("categories") or ["other"])[0].replace("&", " & ").lower()
        tags = sorted({tag.lower().strip() for tag in source.get("tags", []) if isinstance(tag, str) and tag.strip()})
        icons.append({"name": name, "category": category, "tags": tags, "popularity": source.get("popularity", 0)})
    output = {"source": METADATA_URL, "popular_target": args.popular, "icons": icons}
    (HERE / "selection.json").write_text(json.dumps(output, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Selected {len(icons)} Material Symbols names ({args.popular} popular plus retained names)")


if __name__ == "__main__":
    main()
