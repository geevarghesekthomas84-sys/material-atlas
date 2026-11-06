## Material Icons Explorer

Explore and download a compact copy of Google's [Material Design Icons](https://github.com/google/material-design-icons). This repository includes SVGs, fonts, a searchable gallery, and update tools.

This copy adds an icon explorer, a Python updater, and validation for the included assets. Original icon artwork is by Google; see [LICENSE](LICENSE). The added tools do not imply Google endorsement.

## Getting Started

Browse `src/` for SVGs and `font/` for fonts. Styles include filled, outlined, round, sharp, and two tone where supplied by Google. Android, iOS, and pre-rendered PNG assets are excluded from this compact copy. They remain in the source archive and can be packaged separately as release downloads.

For a searchable local gallery, run `python -m http.server 8000` in the repository root, then open `http://localhost:8000/preview/`. The gallery filters by name, category, and style. It opens SVGs and fonts and exports PNGs at 24, 48, 96, or 192 pixels in your browser. Rebuild its index after asset changes with `python preview/build_manifest.py`.

For example, the filled SVG for Home is at `src/action/home/materialicons/24px.svg`.

### Updating assets

Use Python 3.9 or newer; the updater has no third party dependencies. From the repository root, `python update/update_repo.py --help` lists all options. Examples:

```sh
python update/update_repo.py --dry-run --icon-limit 1
python update/update_repo.py --category action --style "Material Icons Round" --format svg --refresh
python update/update_repo.py --skip-existing
python preview/build_manifest.py
python -m unittest discover -s tests -v
```

The default updater refreshes SVGs and fonts. The `--format` option can be repeated to explicitly request SVG, PNG, Android, iOS, or font assets. Explicitly filtered updates leave `update/current_versions.json` unchanged. The updater uses Google Fonts metadata and needs an internet connection.

Read the [developer guide](https://google.github.io/material-design-icons/) on how to use the material design icons in your project.

### Using a font

The `font` folder contains pre-generated font files that can be included in a project. This is especially convenient for the web; however, it is generally better to link to the web font hosted on Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Icons"
      rel="stylesheet">
```

Read more in the [font portion](https://google.github.io/material-design-icons/#icon-font-for-the-web) of our full developer guide.


## License

The original icon artwork is provided under the [Apache License 2.0](LICENSE). Keep the license and copyright notices when redistributing this repository.
