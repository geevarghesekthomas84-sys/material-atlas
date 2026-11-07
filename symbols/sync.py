"""Fetch a curated set of current Material Symbols from Google's pinned source."""

import argparse
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
UPSTREAM = "10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7"
NAMES = (
    "18_up_rating", "2d", "3d", "abc", "accessible_menu", "account_child",
    "account_child_invert", "account_circle_off", "action_key", "activity_zone",
    "acupuncture", "acute", "adaptive_audio_mic", "adaptive_audio_mic_off",
    "add", "arrow_back", "arrow_forward", "auto_awesome", "calendar_today",
    "check_circle", "close", "cloud_download", "dashboard", "dark_mode",
    "delete", "download", "edit", "favorite", "filter_list", "home", "info",
    "language", "lock", "menu", "more_vert", "notifications", "palette",
    "search", "settings", "share", "shopping_cart", "smart_toy", "star",
    "upload", "visibility", "warning",
)
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
        try:
            with urlopen(url, timeout=30) as response:
                data = response.read()
        except HTTPError as exc:
            if exc.code == 404:
                raise FileNotFoundError(f"Official SVG is missing: {url}") from exc
            raise
    if b"<svg" not in data or b"<script" in data.lower():
        raise ValueError(f"Unexpected SVG data from {url}")
    return (destination, data, name, style, source_path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="Re-download existing SVGs from the pinned revision")
    args = parser.parse_args()
    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = [pool.submit(fetch, pair) for pair in ((name, style, args.refresh) for name in NAMES for style in STYLES)]
        results = [future.result() for future in as_completed(futures)]
    rows = []
    for destination, data, name, style, source_path in results:
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
