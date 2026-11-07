"""Fetch a curated set of current Material Symbols from Google's pinned source."""

import argparse
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
UPSTREAM = "10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7"
STYLES = ("outlined", "rounded", "sharp")


def fetch(item):
    name, style, refresh = item
    family = "materialsymbols" + style
    source_path = f"symbols/web/{name}/{family}/{name}_24px.svg"
    url = f"https://raw.githubusercontent.com/google/material-design-icons/{UPSTREAM}/{source_path}"
    destination = ROOT / "official" / name / f"{style}.svg"
    if destination.exists() and not refresh:
        data = destination.read_bytes()
    else:
        for attempt in range(3):
            try:
                with urlopen(url, timeout=30) as response:
                    data = response.read()
                break
            except HTTPError as exc:
                if exc.code == 404:
                    return None
                if exc.code not in (429, 500, 502, 503, 504) or attempt == 2:
                    raise
                time.sleep(2 ** attempt)
    if b"<svg" not in data or b"<script" in data.lower():
        raise ValueError(f"Unexpected SVG data from {url}")
    return (destination, data, name, style, source_path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="Re-download existing SVGs from the pinned revision")
    args = parser.parse_args()
    selection_path = ROOT / "selection.json"
    selection = json.loads(selection_path.read_text(encoding="utf-8"))
    names = tuple(row["name"] for row in selection["icons"])
    if len(names) != len(set(names)):
        raise ValueError("Duplicate names in selection.json")
    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = [pool.submit(fetch, pair) for pair in ((name, style, args.refresh) for name in names for style in STYLES)]
        results = [future.result() for future in as_completed(futures)]
    complete = {name for name in names if sum(result is not None and result[2] == name for result in results) == len(STYLES)}
    skipped = set(names) - complete
    if skipped:
        print(f"Skipped {len(skipped)} names without all three SVG styles: {', '.join(sorted(skipped))}")
        selection["icons"] = [row for row in selection["icons"] if row["name"] in complete]
        selection_path.write_text(json.dumps(selection, separators=(",", ":")) + "\n", encoding="utf-8")
    rows = []
    for destination, data, name, style, source_path in (result for result in results if result is not None and result[2] in complete):
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
        rows.append({"name": name, "style": style,
                     "path": str(destination.relative_to(ROOT.parent)).replace("\\", "/"),
                     "upstream_path": source_path})
    rows.sort(key=lambda row: (row["name"], row["style"]))
    (ROOT / "manifest.json").write_text(json.dumps(rows, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Added {len(rows)} Material Symbols SVGs for {len(set(row['name'] for row in rows))} names")


if __name__ == "__main__":
    main()
