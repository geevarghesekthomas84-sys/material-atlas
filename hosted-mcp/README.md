# Hosted Material Atlas MCP

`worker.mjs` implements the same three read-only icon tools as the local MCP server for a stateless HTTP endpoint. It reads the generated catalog and SVGs from the public Material Atlas gallery, so the hosted tools use the latest published repository content.

For a Sites deployment, put this file at `dist/server/index.js` and use an `.openai/hosting.json` with the Site's real `project_id` and `"capabilities": ["mcp"]`. Publish it through the Sites source and deployment workflow. Sites authenticates requests to `POST /mcp` and provisions a private plugin for the Site owner. The source checkout for the owner's private deployment is separate from this public GitHub repository.

The Worker handles `server/discover`, `tools/list`, and `tools/call` with MCP 2026-07-28. Run `node --test hosted-mcp/test.mjs` to check the protocol and tool behavior locally.
