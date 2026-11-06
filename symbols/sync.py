"""Fetch a curated set of current Material Symbols from Google's pinned source."""

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
UPSTREAM = "10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7"
BASE = f"https://raw.githubusercontent.com/google/material-design-icons/{UPSTREAM}/symbols/web"
NAMES = (
    "18_up_rating", "2d", "3d", "abc", "accessible_menu", "account_child",
    "account_child_invert", "account_circle_off", "action_key", "activity_zone",
    "acupuncture", "acute", "adaptive_audio_mic", "adaptive_audio_mic_off",
)
STYLES = ("outlined", "rounded", "sharp")


def fetch(item):
    name, style = item
    family = "materialsymbols" + style
    source_path = f"symbols/web/{name}/{family}/{name}_24px.svg"
    url = f"https://raw.githubusercontent.com/google/material-design-icons/{UPSTREAM}/{source_path}"
    try:
        with urlopen(url, timeout=30) as response:
            data = response.read()
    except HTTPError as exc:
        if exc.code == 404:
            return None
        raise
    if b"<svg" not in data or b"<script" in data.lower():
        raise ValueError(f"Unexpected SVG data from {url}")
    destination = ROOT / "official" / name / f"{style}.svg"
    return (destination, data, name, style, source_path)


def main():
    rows = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(fetch, pair) for pair in ((name, style) for name in NAMES for style in STYLES)]
        for future in as_completed(futures):
            result = future.result()
            if result is None:
                continue
            destination, data, name, style, source_path = result
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
