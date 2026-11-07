"""Create a portable Material Atlas plugin ZIP from the checked-in source."""

import json
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
FILES = (
    "plugin.json", "mcp.json", "LICENSE", "skills/material-atlas/SKILL.md",
    "mcp-server/index.js", "mcp-server/catalog.json",
)


def main():
    manifest = json.loads((ROOT / "plugin.json").read_text(encoding="utf-8"))
    output_dir = ROOT / "dist"
    output_dir.mkdir(exist_ok=True)
    output = output_dir / f"material-atlas-plugin-v{manifest['version']}.zip"
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as package:
        for name in FILES:
            path = ROOT / name
            if not path.is_file():
                raise FileNotFoundError(path)
            package.write(path, name)
    with zipfile.ZipFile(output) as package:
        if package.testzip():
            raise ValueError("Plugin package failed integrity check")
        if set(package.namelist()) != set(FILES):
            raise ValueError("Plugin package contents do not match expected files")
    print(output)


if __name__ == "__main__":
    main()
