# Use Material Atlas with AI assistants

Material Atlas includes a reusable [AI skill](../skills/material-atlas/SKILL.md) and a local, read-only [MCP server](../mcp-server/index.js). The server searches 1,824 icon names across 7,654 SVG variants, reports styles and attribution, and retrieves the exact published SVG. It requires Node.js 20 or newer. No API key is needed.

Use an **absolute path** to `mcp-server/index.js` in the commands below. Replace `/absolute/path/to/material-atlas` with your checkout path; on Windows, a path such as `D:\projects\material-atlas\mcp-server\index.js` works. The server uses the bundled catalog and downloads SVG markup from the [public gallery](https://geevarghesekthomas84-sys.github.io/material-atlas/) only when `get_svg` is called.

## Codex

```sh
codex mcp add material-atlas -- node /absolute/path/to/material-atlas/mcp-server/index.js
codex mcp list
```

For icon selection guidance, install or reference the [Material Atlas skill](../skills/material-atlas/SKILL.md) in your Codex skill directory. The ZIP produced by `python plugin/build_package.py` contains the plugin manifest, skill, and MCP server for compatible desktop plugin installers. A local stdio plugin requires a desktop client that can run Node.js. See [Codex MCP documentation](https://developers.openai.com/codex/mcp) and [OpenAI's desktop plugin notes](https://developers.openai.com/plugins/deploy/desktop-only).

## ChatGPT and hosted Codex

ChatGPT web uses a hosted MCP connection. The [hosted MCP Worker](../hosted-mcp/README.md) provides the same read-only tools and can be published with Sites; Sites creates a private plugin for the Site owner. That private installation stays separate from the portable desktop plugin ZIP. The Worker reads the current public catalog, so publishing the GitHub Pages site is required before its new icons appear in ChatGPT.

## Claude Code

```sh
claude mcp add --transport stdio --scope user material-atlas -- node /absolute/path/to/material-atlas/mcp-server/index.js
claude mcp list
```

See [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp). You can also place the skill instructions in your project's agent guidance when choosing icons.

## Gemini CLI

```sh
gemini mcp add --scope user material-atlas node /absolute/path/to/material-atlas/mcp-server/index.js
gemini mcp list
```

See [Gemini CLI MCP documentation](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md).

## GitHub Copilot CLI

Add this to `~/.copilot/mcp-config.json`, or to `.github/mcp.json` in a project where the absolute path is valid:

```json
{
  "mcpServers": {
    "material-atlas": {
      "type": "local",
      "command": "node",
      "args": ["/absolute/path/to/material-atlas/mcp-server/index.js"],
      "tools": ["*"]
    }
  }
}
```

See [GitHub Copilot CLI MCP documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers). GitHub Copilot in VS Code has its own MCP configuration format.

## Tool examples

- `search_icons` with `{"query":"hamburger","collection":"symbols"}` finds `menu` through Google's metadata tags.
- `get_icon` with `{"name":"home","collection":"symbols"}` reports outlined, rounded, and sharp variants, URLs, source, and license.
- `get_svg` with `{"name":"home","collection":"symbols","style":"outlined"}` returns the published SVG markup.

The classic Google collection, newer Google Symbols, and independent original additions stay labeled separately. The included SVGs are static; Google's variable font is the option for adjustable Symbols axes.
