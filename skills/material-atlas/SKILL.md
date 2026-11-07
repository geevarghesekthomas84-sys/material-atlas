---
name: material-atlas
description: Use when choosing, comparing, or adding Material Atlas icons to an interface, including requests for SVG artwork, styles, and source attribution.
---

# Material Atlas icons

Material Atlas combines three labeled collections: Google's classic Material Icons, selected Google Material Symbols, and independent original icons. Its public gallery is https://geevarghesekthomas84-sys.github.io/material-atlas/.

When the Material Atlas MCP tools are available, use `search_icons` to find candidates and `get_icon` to compare their styles and source. Use `get_svg` only when the exact SVG markup is needed. Search by interface concept or category; Google metadata tags are included for the Symbols collection.

Choose an icon for the user's actual action or state. Prefer a consistent collection and style within one interface. For decorative icons use an empty `alt` or `aria-hidden`; for meaningful icons provide a useful accessible name that describes the action or meaning.

Before placing an icon in a project, check its collection, style, and license. Classic Material Icons and Material Symbols are Google artwork under Apache 2.0. Original additions are independent Atlas artwork under Apache 2.0. Do not imply Google endorses Material Atlas or its original icons. Preserve license and copyright notices when redistributing assets.

The included SVGs are static. For adjustable Material Symbols fill, weight, grade, or optical size, use Google's variable font rather than claiming the pinned SVG has those controls. If MCP is unavailable, inspect the repository manifests or public gallery instead of inventing an icon path.
