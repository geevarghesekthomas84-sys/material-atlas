"""Add attribution, verify classic asset archives, and write SHA-256 checksums."""

import argparse
import hashlib
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
ASSETS = (
    "material-icons-android.zip",
    "material-icons-ios.zip",
    "material-icons-png.zip",
)
SOURCE_NOTES = (
    "Material Atlas v1.0.0 — classic platform assets\n\n"
    "These archives contain Google's classic Material Icons artwork from the "
    "Material Icons 4.0.0 archive. They do not contain the newer Material "
    "Symbols or the independent Material Atlas original icons.\n\n"
    "Source: https://github.com/google/material-design-icons\n"
    "License: Apache License 2.0 (see LICENSE.txt in this archive)\n"
    "Material Atlas is an independent project and is not endorsed by Google.\n"
).encode("utf-8")


def ensure_notes(archive, license_bytes):
    additions = {"LICENSE.txt": license_bytes, "SOURCE-NOTES.txt": SOURCE_NOTES}
    with zipfile.ZipFile(archive, "a", allowZip64=True) as bundle:
        existing = set(bundle.namelist())
        for name, data in additions.items():
            if name in existing:
                if bundle.read(name) != data:
                    raise ValueError(f"{archive}: {name} differs from the expected content")
            else:
                bundle.writestr(name, data, compress_type=zipfile.ZIP_DEFLATED)


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("asset_directory", type=Path, help="Directory containing the three classic ZIP archives")
    args = parser.parse_args()
    license_bytes = (ROOT / "LICENSE").read_bytes()
    checksum_lines = []
    for name in ASSETS:
        archive = args.asset_directory / name
        if not archive.is_file():
            raise FileNotFoundError(archive)
        ensure_notes(archive, license_bytes)
        with zipfile.ZipFile(archive) as bundle:
            bad = bundle.testzip()
            if bad:
                raise ValueError(f"{archive}: corrupt entry {bad}")
            print(f"Verified {name}: {len(bundle.infolist()):,} entries")
        checksum_lines.append(f"{sha256(archive)}  {name}")
    (ROOT / "release" / "SHA256SUMS.txt").write_text("\n".join(checksum_lines) + "\n", encoding="ascii")


if __name__ == "__main__":
    main()
