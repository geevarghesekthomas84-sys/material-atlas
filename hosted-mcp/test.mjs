import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import worker from "./worker.mjs";

const catalog = JSON.parse(readFileSync(new URL("../mcp-server/catalog.json", import.meta.url), "utf8"));
const previous = globalThis.fetch;
globalThis.fetch = async url => {
  if (String(url).endsWith("catalog.json")) return Response.json(catalog);
  return new Response('<svg xmlns="http://www.w3.org/2000/svg"/>', {headers: {"content-type": "image/svg+xml"}});
};

test("hosted MCP discovers tools, searches tags, and retrieves SVG", async () => {
  const call = async (id, method, params) => {
    const response = await worker.fetch(new Request("https://example.com/mcp", {method: "POST", body: JSON.stringify({jsonrpc: "2.0", id, method, params})}));
    assert.equal(response.status, 200);
    return (await response.json()).result;
  };
  assert.deepEqual((await call(1, "server/discover")).supportedVersions, ["2026-07-28"]);
  assert.deepEqual((await call(2, "tools/list")).tools.map(tool => tool.name), ["search_icons", "get_icon", "get_svg"]);
  const found = JSON.parse((await call(3, "tools/call", {name: "search_icons", arguments: {query: "hamburger", collection: "symbols"}})).content[0].text);
  assert.ok(found.results.some(icon => icon.name === "menu"));
  const svg = JSON.parse((await call(4, "tools/call", {name: "get_svg", arguments: {name: "home", collection: "symbols", style: "outlined"}})).content[0].text);
  assert.match(svg.svg, /^<svg/);
  globalThis.fetch = previous;
});
