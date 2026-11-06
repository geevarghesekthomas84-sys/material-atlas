# Contributing

The icon artwork comes from Google's Material Design Icons collection. Keep existing names and directory conventions when updating assets.

To update assets, use Python 3.9 or newer and run `python update/update_repo.py --help` from any working directory. Run a small `--dry-run --icon-limit 1` first. After changing SVGs, regenerate the explorer index with `python preview/build_manifest.py`.

Before a pull request, run `python -m unittest discover -s tests -v` and check that `preview/icons.json` is current. Please describe changed assets and the source version in the pull request.
