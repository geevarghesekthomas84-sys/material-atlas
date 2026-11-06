import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch
from zipfile import ZipFile

from update import update_repo as updater


class UpdaterTests(unittest.TestCase):
    def test_safe_extract_rejects_parent_escape(self):
        data = io.BytesIO()
        with ZipFile(data, "w") as archive:
            archive.writestr("../outside.txt", "bad")
        data.seek(0)
        with tempfile.TemporaryDirectory() as folder:
            with ZipFile(data) as archive:
                with self.assertRaises(ValueError):
                    updater.safe_extract(archive, Path(folder) / "assets")
            self.assertFalse((Path(folder) / "outside.txt").exists())

    def test_dry_run_keeps_versions_and_does_not_fetch_assets(self):
        catalog = {"host": "fonts.gstatic.com", "families": ["Material Icons"],
                   "icons": [{"name": "example", "categories": ["action"],
                              "version": 2, "sizes_px": [24], "unsupported_families": []}]}
        with tempfile.TemporaryDirectory() as folder:
            versions = Path(folder) / "versions.json"
            versions.write_text(json.dumps({}))
            with patch.object(updater, "VERSIONS", versions), patch.object(updater, "metadata", return_value=catalog), patch.object(updater, "write_asset") as write:
                with redirect_stdout(io.StringIO()) as output:
                    updater.main(["--dry-run", "--format", "svg", "--style", "Material Icons"])
            self.assertIn("24px.svg", output.getvalue())
            self.assertEqual(versions.read_text(), "{}")
            write.assert_not_called()

    def test_partial_update_keeps_version_manifest_unchanged(self):
        catalog = {"host": "fonts.gstatic.com", "families": ["Material Icons"],
                   "icons": [{"name": "example", "categories": ["action"],
                              "version": 2, "sizes_px": [24], "unsupported_families": []}]}
        with tempfile.TemporaryDirectory() as folder:
            versions = Path(folder) / "versions.json"
            versions.write_text("{}")
            with patch.object(updater, "VERSIONS", versions), patch.object(updater, "metadata", return_value=catalog), patch.object(updater, "write_asset"):
                with redirect_stdout(io.StringIO()):
                    updater.main(["--format", "svg"])
            self.assertEqual(versions.read_text(), "{}")


if __name__ == "__main__":
    unittest.main()
