"""Download Material Icons assets. Run `python update/update_repo.py --help`."""

import argparse
import io
import json
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
VERSIONS = Path(__file__).resolve().parent / "current_versions.json"
METADATA_URL = "https://fonts.google.com/metadata/icons?incomplete=1"
FORMATS = ("svg", "android", "ios", "png", "font")
DEFAULT_FORMATS = ("svg", "font")


def download(url, timeout=30, retries=2):
    for attempt in range(retries + 1):
        try:
            with urlopen(url, timeout=timeout) as response:
                return response.read()
        except (HTTPError, URLError, TimeoutError):
            if attempt == retries:
                raise
            time.sleep(min(2 ** attempt, 4))


def metadata():
    body = download(METADATA_URL).decode("utf-8")
    return json.loads(body[body.index("{"):])


def safe_extract(archive, target):
    root = target.resolve()
    for member in archive.infolist():
        name = member.filename.replace("\\", "/")
        path = (root / name).resolve()
        if name.startswith("/") or re.match(r"^[A-Za-z]:", name) or not path.is_relative_to(root):
            raise ValueError(f"Unsafe archive entry: {member.filename}")
        if (member.external_attr >> 16) & 0o170000 == 0o120000:
            raise ValueError(f"Archive symlink not allowed: {member.filename}")
    archive.extractall(root)


def write_asset(url, destination, kind, skip_existing):
    extracted = destination.with_suffix("") if kind in ("android", "ios", "png") else None
    if skip_existing and (extracted.is_dir() if extracted else destination.is_file()):
        return
    data = download(url)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if extracted:
        with ZipFile(io.BytesIO(data)) as archive:
            safe_extract(archive, extracted)
    elif kind == "font":
        css = data.decode("utf-8")
        match = re.search(r"src:\s*url\(([^)]+\.(?:otf|ttf))\)", css)
        if not match:
            raise ValueError(f"No font URL found for {destination.name}")
        font_url = match.group(1).strip("\"'")
        font = destination.with_suffix(Path(font_url).suffix)
        if not (skip_existing and font.is_file()):
            font.write_bytes(download(font_url))
    else:
        destination.write_bytes(data)


def selected_assets(icon, family, host, formats):
    category, name, version = icon["categories"][0], icon["name"], icon["version"]
    style = family.replace(" ", "").lower()
    base = f"https://{host}/s/i/{style}/{name}/v{version}"
    relative = Path(category) / name / style
    if "svg" in formats:
        for size in icon["sizes_px"]:
            yield base + f"/{size}px.svg", ROOT / "src" / relative / f"{size}px.svg", "svg"
    for kind in ("android", "ios"):
        if kind in formats:
            yield base + f"/black-{kind}.zip", ROOT / kind / relative / "black.zip", kind
    if "png" in formats:
        for size in (18, 24, 36, 48):
            yield base + f"/black-{size}dp.zip", ROOT / "png" / relative / f"{size}dp.zip", "png"


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", help="Only update one icon category")
    parser.add_argument("--style", help="Only update one style, e.g. Material Icons Round")
    parser.add_argument("--format", dest="formats", choices=FORMATS, action="append",
                        help="Repeat for multiple output formats")
    parser.add_argument("--icon-limit", type=int, default=0)
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Show work without changing assets")
    parser.add_argument("--refresh", action="store_true", help="Recheck current icons")
    args = parser.parse_args(argv)
    if args.icon_limit < 0:
        parser.error("--icon-limit must be nonnegative")
    formats = set(args.formats or DEFAULT_FORMATS)
    current = json.loads(VERSIONS.read_text(encoding="utf-8"))
    catalog = metadata()
    families = catalog["families"]
    if args.style:
        families = [f for f in families if f.lower().replace(" ", "") == args.style.lower().replace(" ", "")]
        if not families:
            parser.error("Unknown style")
    host = catalog["host"]
    if not re.fullmatch(r"[A-Za-z0-9.-]+", host):
        raise ValueError("Unexpected asset host in metadata")
    count = 0
    for icon in catalog["icons"]:
        if args.category and args.category not in icon["categories"]:
            continue
        key = f'{icon["categories"][0]}::{icon["name"]}'
        if not args.refresh and icon["version"] <= current.get(key, 0):
            continue
        if args.icon_limit and count >= args.icon_limit:
            break
        count += 1
        for family in families:
            if family in icon["unsupported_families"]:
                continue
            for url, destination, kind in selected_assets(icon, family, host, formats):
                if args.dry_run:
                    print(f"GET {url} -> {destination.relative_to(ROOT)}")
                else:
                    write_asset(url, destination, kind, args.skip_existing)
        if not args.dry_run and not args.formats and not args.style and not args.category and not args.icon_limit:
            current[key] = icon["version"]
    if "font" in formats:
        for family in families:
            family_url = family.replace(" ", "+")
            name = family.replace(" ", "") + "-Regular"
            url = f"https://fonts.googleapis.com/css2?family={family_url}"
            destination = ROOT / "font" / f"{name}.css"
            if args.dry_run:
                print(f"GET {url} -> font/{name}.otf or .ttf")
            else:
                write_asset(url, destination, "font", args.skip_existing)
    if not args.dry_run and not args.formats and not args.style and not args.category and not args.icon_limit:
        VERSIONS.write_text(json.dumps(current, indent=4, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Processed {count} icons")


if __name__ == "__main__":
    main()
