import json
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


class CatalogTests(unittest.TestCase):
    def test_every_catalog_entry_has_an_svg(self):
        classic = json.loads((ROOT / "preview/icons.json").read_text(encoding="utf-8"))
        symbols = json.loads((ROOT / "symbols/manifest.json").read_text(encoding="utf-8"))
        originals = json.loads((ROOT / "originals/manifest.json").read_text(encoding="utf-8"))
        paths = [ROOT / "src" / category / name / style / file
                 for category, name, style, file in classic]
        paths += [ROOT / item["path"] for item in symbols + originals]
        self.assertTrue(paths)
        self.assertEqual([], [str(path) for path in paths if not path.is_file()])
        for path in [ROOT / item["path"] for item in symbols + originals]:
            self.assertEqual("{http://www.w3.org/2000/svg}svg", ET.parse(path).getroot().tag)


if __name__ == "__main__":
    unittest.main()
