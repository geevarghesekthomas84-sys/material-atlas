# Selected official Material Symbols

These SVGs are from [Google's Material Design Icons repository](https://github.com/google/material-design-icons), revision `10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7`. They are a small curated selection of the current Material Symbols set, not the complete collection. Each icon is included in outlined, rounded, and sharp 24 px versions.

Run `python symbols/sync.py` to fetch missing files and regenerate `manifest.json`. Add `--refresh` to download every selected SVG again from the pinned revision. To update the selection, review Google's repository and change the names in `sync.py`. If you change the pinned revision, run `python symbols/sync.py --refresh` so existing files come from the new revision too. The artwork remains Google's and is covered by the repository's Apache 2.0 license.
