# Contributing to Material Atlas

Material Atlas has three collections. Keep their sources separate so visitors know which artwork is Google's and which is independent.

## Suggest an icon

Open an **Icon idea** issue with a short name, the interface action it represents, and examples of where it would be used. Search existing icons and issues first. Ideas for Google's official library should follow [Google's icon request guidance](docs/google-collaboration.md); this repository cannot promise Google will adopt them.

## Add an original icon

1. Create a uniquely named `originals/<snake_case_name>.svg` with a `24 × 24` viewBox. Keep the image legible at 24 px and use the existing original icons as a style reference.
2. Use only artwork you created or have permission to contribute under Apache 2.0. Do not trace or relabel a Google icon as an original.
3. Run `python originals/build_manifest.py` and include the updated `originals/manifest.json`.
4. In the pull request, explain the name, intended use, and how the design differs from existing icons.

## Update official assets

Classic Material Icons are maintained with `update/update_repo.py`; run `python update/update_repo.py --help`, start with `--dry-run --icon-limit 1`, and regenerate the index with `python preview/build_manifest.py` after changing SVGs.

The selected Material Symbols are pinned in `symbols/sync.py`. Add names there and run `python symbols/sync.py`. If you change the pinned revision, use `python symbols/sync.py --refresh`. Keep Google's SVG content and its upstream path in the generated manifest.

## Check your change

```sh
python -m unittest discover -s tests -v
node --check site.js
node --check studio.js
```

For website changes, serve the repository locally with `python -m http.server 8000` and check search, icon details, Studio, downloads, keyboard navigation, and a narrow mobile viewport. The GitHub workflow also checks manifests and runs browser smoke tests. Describe any visual or interaction changes in the pull request.
