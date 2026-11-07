// A stateless MCP endpoint for a Sites-hosted Material Atlas plugin.
const gallery = "https://geevarghesekthomas84-sys.github.io/material-atlas/";
const catalogUrl = new URL("mcp-server/catalog.json", gallery).href;
let catalogPromise;

async function catalog() {
  if (!catalogPromise) catalogPromise = fetch(catalogUrl).then(async response => {
    if (!response.ok) throw Error(`Catalog unavailable (${response.status})`);
    return response.json();
  }).catch(error => { catalogPromise = undefined; throw error; });
  return catalogPromise;
}

const aliases = {heart: "favorite", trash: "delete", bin: "delete", gear: "settings", cog: "settings", house: "home", robot: "smart_toy", magnifier: "search"};
const priority = {symbols: 0, originals: 1, classic: 2};
const assetUrl = path => new URL(path, gallery).href;

function score(icon, query) {
  if (!query) return 1;
  const name = icon.name.toLowerCase();
  const category = icon.category.toLowerCase();
  const parts = name.split("_");
  const values = query.toLowerCase().trim().split(/\s+/).map(token => aliases[token] || token).map(token => {
    if (name === token) return 100;
    if (name.startsWith(token)) return 80;
    if (parts.includes(token)) return 70;
    if (name.includes(token) || category.includes(token)) return 50;
    if ((icon.tags || []).some(tag => tag === token || tag.startsWith(token))) return 35;
    return 0;
  });
  return values.every(Boolean) ? values.reduce((sum, value) => sum + value, 0) : 0;
}

async function searchIcons(args = {}) {
  const data = await catalog();
  const query = typeof args.query === "string" ? args.query.trim() : "";
  const collection = args.collection || "all";
  const category = args.category || "all";
  const limit = Math.min(50, Math.max(1, Number.isInteger(args.limit) ? args.limit : 20));
  const matched = data.icons.map(icon => ({icon, rank: score(icon, query)}))
    .filter(({icon, rank}) => rank && (collection === "all" || icon.collection === collection) && (category === "all" || icon.category === category))
    .sort((a, b) => b.rank - a.rank || priority[a.icon.collection] - priority[b.icon.collection] || a.icon.name.localeCompare(b.icon.name));
  return {query, total: matched.length, results: matched.slice(0, limit).map(({icon}) => ({
    name: icon.name, collection: icon.collection, category: icon.category,
    styles: icon.variants.map(variant => variant.style), preview_url: assetUrl(icon.variants[0].path),
  }))};
}

async function getIcon(args = {}) {
  if (typeof args.name !== "string" || !args.name.trim()) throw Error("name is required");
  const data = await catalog();
  const name = args.name.trim().toLowerCase();
  const matches = data.icons.filter(icon => icon.name === name && (!args.collection || icon.collection === args.collection));
  if (!matches.length) throw Error(`Icon not found: ${name}`);
  return {name, matches: matches.map(icon => ({
    collection: icon.collection, category: icon.category, tags: icon.tags,
    source: icon.collection === "originals" ? "Independent Material Atlas artwork" : "Google Material Design Icons repository",
    license: "Apache-2.0", symbols_revision: icon.collection === "symbols" ? data.symbols_revision : undefined,
    variants: icon.variants.map(variant => ({style: variant.style, url: assetUrl(variant.path), path: variant.path})),
  }))};
}

async function getSvg(args = {}) {
  if (!args.collection || !args.style) throw Error("collection and style are required for an exact SVG");
  const details = (await getIcon(args)).matches[0];
  const variant = details.variants.find(item => item.style === args.style);
  if (!variant) throw Error(`Style not found: ${args.style}`);
  const response = await fetch(variant.url);
  if (!response.ok) throw Error(`SVG request failed (${response.status})`);
  const svg = await response.text();
  if (svg.length > 64_000 || !svg.includes("<svg") || /<script\b/i.test(svg)) throw Error("Unexpected SVG content");
  return {name: args.name, collection: args.collection, style: args.style, url: variant.url,
    license: details.license, source: details.source, svg};
}

const tools = [
  {name: "search_icons", description: "Search Material Atlas icons by name, category, or synonym.",
    inputSchema: {type: "object", properties: {query: {type: "string"}, collection: {type: "string", enum: ["all", "classic", "symbols", "originals"]}, category: {type: "string"}, limit: {type: "integer", minimum: 1, maximum: 50}}}, annotations: {readOnlyHint: true}},
  {name: "get_icon", description: "Get exact icon variants, source attribution, license, and URLs.",
    inputSchema: {type: "object", properties: {name: {type: "string"}, collection: {type: "string", enum: ["classic", "symbols", "originals"]}}, required: ["name"]}, annotations: {readOnlyHint: true}},
  {name: "get_svg", description: "Fetch the exact included SVG artwork for an icon and style.",
    inputSchema: {type: "object", properties: {name: {type: "string"}, collection: {type: "string", enum: ["classic", "symbols", "originals"]}, style: {type: "string"}}, required: ["name", "collection", "style"]}, annotations: {readOnlyHint: true, openWorldHint: true}},
];

async function callTool(params = {}) {
  try {
    const args = params.arguments || {};
    let result;
    if (params.name === "search_icons") result = await searchIcons(args);
    else if (params.name === "get_icon") result = await getIcon(args);
    else if (params.name === "get_svg") result = await getSvg(args);
    else throw Error(`Unknown tool: ${params.name}`);
    return {content: [{type: "text", text: JSON.stringify(result)}]};
  } catch (error) {
    return {content: [{type: "text", text: error.message}], isError: true};
  }
}

async function dispatch(message) {
  if (message.method === "server/discover") return {supportedVersions: ["2026-07-28"], capabilities: {tools: {}}};
  if (message.method === "initialize") return {protocolVersion: message.params?.protocolVersion || "2026-07-28", capabilities: {tools: {}}, serverInfo: {name: "material-atlas", version: "1.1.0"}};
  if (message.method === "tools/list") return {tools};
  if (message.method === "tools/call") return callTool(message.params);
  if (message.method === "ping") return {};
  throw Error(`Unsupported method: ${message.method}`);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/" && request.method === "GET") return Response.redirect(gallery, 302);
    if (url.pathname !== "/mcp" || request.method !== "POST") return new Response("Not found", {status: 404});
    try {
      const message = await request.json();
      if (message.id === undefined || message.id === null) return new Response(null, {status: 204});
      const result = await dispatch(message);
      return Response.json({jsonrpc: "2.0", id: message.id, result});
    } catch (error) {
      return Response.json({jsonrpc: "2.0", id: null, error: {code: -32603, message: error.message}}, {status: 200});
    }
  },
};

export {dispatch, searchIcons, getIcon, getSvg};
