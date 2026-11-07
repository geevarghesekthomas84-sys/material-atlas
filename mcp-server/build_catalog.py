"""Build the compact, read-only catalog distributed with the MCP plugin."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
HERE = Path(__file__).resolve().parent


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def main():
    rows = {}

    def add(name, collection, category, style, path, tags=()):
        key = (collection, name)
        item = rows.setdefault(key, {"name": name, "collection": collection, "category": category,
                                     "tags": list(tags), "variants": []})
        item["variants"].append({"style": style, "path": path})

    for category, name, style, file in read("preview/icons.json"):
        add(name, "classic", category, style, f"src/{category}/{name}/{style}/{file}")
    selection = read("symbols/selection.json")
    metadata = {item["name"]: item for item in selection["icons"]}
    for item in read("symbols/manifest.json"):
        details = metadata[item["name"]]
        add(item["name"], "symbols", details["category"], item["style"], item["path"], details["tags"])
    for item in read("originals/manifest.json"):
        add(item["name"], "originals", "independent additions", "original", item["path"])

    catalog = sorted(rows.values(), key=lambda item: (item["collection"], item["name"]))
    for item in catalog:
        item["variants"].sort(key=lambda variant: variant["style"])
    output = {"site": "https://geevarghesekthomas84-sys.github.io/material-atlas/",
              "metadata_source": selection.get("source"),
              "symbols_revision": "10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7", "icons": catalog}
    (HERE / "catalog.json").write_text(json.dumps(output, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Indexed {len(catalog)} collection entries, {len({item['name'] for item in catalog})} distinct names, and {sum(len(item['variants']) for item in catalog)} variants for MCP")


if __name__ == "__main__":
    main()
