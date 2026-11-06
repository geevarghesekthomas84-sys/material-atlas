# Material Atlas — Icon Explorer

A searchable web page for Google's classic Material Icons, selected current Material Symbols, and independent additions. Download an SVG or export a PNG directly from the page.

This is a compact copy prepared for GitHub. Google's artwork comes from [Material Design Icons](https://github.com/google/material-design-icons); the web page and original icons are additions to this copy. This project is not endorsed by Google.

## Try the gallery

From the repository root, start a local server:

```sh
python -m http.server 8000
```

Open **http://localhost:8000/**. A server is needed because the page loads the collection indexes; opening the HTML file directly may prevent those requests.

Search by icon name, switch collections, filter by category and style, and inspect an icon to choose an output:

| Output | What the gallery does |
| --- | --- |
| SVG | Opens the included vector file. |
| PNG | Downloads a PNG rendered in your browser at 24, 48, 96, or 192 px. |
| Icon font | Opens the included font file for that style. |

Classic Icons have filled, outlined, round, sharp, and two tone styles where available. The selected Material Symbols have outlined, rounded, and sharp styles. The original icons form a separate independent set.

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
- `symbols/` — selected current Material Symbols from a pinned Google revision.
- `originals/` — six independent SVGs created for this project.
- `index.html`, `site.css`, and `site.js` — the main web page, designed with Stitch and implemented as a static site.
- `update/` — a Python tool for checking Google Fonts metadata and downloading updated assets.
- `tests/` and `.github/workflows/` — updater tests and a manifest validation workflow.

Android, iOS, and pre-rendered PNG folders are left out of this Git repository to keep it quick to clone. They can be distributed as separate release ZIPs. The web page's PNG export works without those folders. No Android or iOS links are shown in the compact gallery.

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

For the selected newer official artwork, see [symbols/README.md](symbols/README.md). For a sensible way to suggest icon concepts or discuss this project with Google, see [docs/google-collaboration.md](docs/google-collaboration.md).

## License and attribution

The original artwork is by Google and is provided under the [Apache License 2.0](LICENSE). Preserve the license and copyright notices when redistributing this repository. See [CONTRIBUTING.md](CONTRIBUTING.md) for maintenance notes.
