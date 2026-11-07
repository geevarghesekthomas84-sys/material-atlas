"use strict";

const {test} = require("node:test");
const assert = require("node:assert/strict");
const {spawn} = require("node:child_process");
const {once} = require("node:events");
const {searchIcons, getIcon, getSvg} = require("./index.js");

test("search finds Google metadata tags and reports an exact variant", () => {
  const result = searchIcons({query: "hamburger", collection: "symbols"});
  assert.ok(result.results.some(icon => icon.name === "menu"));
  const home = getIcon({name: "home", collection: "symbols"}).matches[0];
  assert.deepEqual(home.variants.map(variant => variant.style), ["outlined", "rounded", "sharp"]);
  assert.equal(home.license, "Apache-2.0");
});

test("SVG retrieval uses the selected asset URL", async () => {
  const previous = global.fetch;
  let requested;
  global.fetch = async url => {
    requested = url;
    return {ok: true, text: async () => '<svg xmlns="http://www.w3.org/2000/svg"/>'};
  };
  try {
    const result = await getSvg({name: "home", collection: "symbols", style: "outlined"});
    assert.equal(requested, result.url);
    assert.match(result.url, /symbols\/official\/home\/outlined\.svg$/);
    assert.match(result.svg, /^<svg/);
  } finally {
    global.fetch = previous;
  }
});

test("stdio MCP initializes, lists tools, and calls search", async () => {
  const child = spawn(process.execPath, [require.resolve("./index.js")], {stdio: ["pipe", "pipe", "pipe"]});
  const responses = [];
  let pending = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", chunk => {
    pending += chunk;
    let end;
    while ((end = pending.indexOf("\n")) !== -1) {
      responses.push(JSON.parse(pending.slice(0, end)));
      pending = pending.slice(end + 1);
    }
  });
  const send = (id, method, params) => child.stdin.write(JSON.stringify({jsonrpc: "2.0", id, method, params}) + "\n");
  send(1, "initialize", {protocolVersion: "2025-06-18", capabilities: {}, clientInfo: {name: "test", version: "1"}});
  send(2, "tools/list", {});
  send(3, "tools/call", {name: "search_icons", arguments: {query: "rocket launch", collection: "symbols"}});
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error("Timed out waiting for MCP responses")), 5000);
    const check = setInterval(() => { if (responses.length >= 3) { clearTimeout(timeout); clearInterval(check); resolve(); } }, 10);
  });
  child.stdin.end();
  await once(child, "exit");
  assert.equal(responses[0].result.serverInfo.name, "material-atlas");
  assert.deepEqual(responses[1].result.tools.map(tool => tool.name), ["search_icons", "get_icon", "get_svg"]);
  const result = JSON.parse(responses[2].result.content[0].text);
  assert.ok(result.results.some(icon => icon.name === "rocket_launch"));
});
