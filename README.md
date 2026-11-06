# Material Icons Explorer

A searchable gallery of Google's Material Design Icons, with 7,687 SVG files, five icon styles, and local icon fonts. Download an SVG or export a PNG directly from the gallery.

This is a compact copy prepared for GitHub. The artwork comes from [Google's Material Design Icons](https://github.com/google/material-design-icons); the gallery and maintenance tools are additions to this copy. This project is not endorsed by Google.

## Try the gallery

From the repository root, start a local server:

```sh
python -m http.server 8000
```

Open **http://localhost:8000/preview/**. A server is needed because the gallery loads `preview/icons.json`; opening the HTML file directly may prevent that request.

Search by icon name, filter by category and style, and choose an output:

| Output | What the gallery does |
| --- | --- |
| SVG | Opens the included vector file. |
| PNG | Downloads a PNG rendered in your browser at 24, 48, 96, or 192 px. |
| Icon font | Opens the included font file for that style. |

The included styles are filled, outlined, round, sharp, and two tone, where available for an icon.

## Use an icon in a project

SVG files live at `src/<category>/<icon>/<style>/<size>px.svg`. For example:

```html
<img src="src/action/home/materialicons/24px.svg" alt="Home">
```

The `font/` directory contains the five local font files. You can also use the [Google Fonts hosted Material Icons](https://fonts.google.com/icons):

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Icons">
<span class="material-icons" aria-hidden="true">home</span>
```

## What is in this repository?

- `src/` — the SVG artwork, grouped by category, icon name, and style.
- `font/` — filled, outlined, round, sharp, and two tone fonts.
- `preview/` — the static gallery and its generated icon index.
- `update/` — a Python tool for checking Google Fonts metadata and downloading updated assets.
- `tests/` and `.github/workflows/` — updater tests and a manifest validation workflow.

Android, iOS, and pre-rendered PNG folders are left out of this Git repository to keep it quick to clone. They can be distributed as separate release ZIPs. The gallery's PNG export works without those folders. No Android or iOS links are shown in the compact gallery.

## Update the assets

Use Python 3.9 or newer. The updater has no third party dependencies and needs an internet connection.

```sh
python update/update_repo.py --help
python update/update_repo.py --dry-run --icon-limit 1
python update/update_repo.py --skip-existing
python preview/build_manifest.py
python -m unittest discover -s tests -v
```

By default, the updater fetches SVGs and fonts. Use `--category`, `--style`, `--icon-limit`, or repeated `--format` options to narrow a run. For example:

```sh
python update/update_repo.py --category action --style "Material Icons Round" --format svg --refresh
```

Explicitly filtered runs leave `update/current_versions.json` unchanged. Run `python preview/build_manifest.py` after changing SVGs and commit the refreshed `preview/icons.json`. The validation workflow checks that index and runs the tests.

## License and attribution

The original artwork is by Google and is provided under the [Apache License 2.0](LICENSE). Preserve the license and copyright notices when redistributing this repository. See [CONTRIBUTING.md](CONTRIBUTING.md) for maintenance notes.
