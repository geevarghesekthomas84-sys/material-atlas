#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "catalog.json"), "utf8"));
const icons = catalog.icons;
const aliases = {heart: "favorite", trash: "delete", bin: "delete", gear: "settings", cog: "settings", house: "home", robot: "smart_toy", magnifier: "search"};
const priority = {symbols: 0, originals: 1, classic: 2};
const urlFor = assetPath => new URL(assetPath, catalog.site).href;

function score(icon, query) {
  if (!query) return 1;
  const tokens = query.toLowerCase().trim().split(/\s+/).map(token => aliases[token] || token);
  const name = icon.name.toLowerCase();
  const category = icon.category.toLowerCase();
  const tags = icon.tags || [];
  const parts = name.split("_");
  const values = tokens.map(token => {
    if (name === token) return 100;
    if (name.startsWith(token)) return 80;
    if (parts.includes(token)) return 70;
    if (name.includes(token) || category.includes(token)) return 50;
    if (tags.some(tag => tag === token || tag.startsWith(token))) return 35;
    return 0;
  });
  return values.every(Boolean) ? values.reduce((a, b) => a + b, 0) : 0;
}

function searchIcons(args = {}) {
  const query = typeof args.query === "string" ? args.query.trim() : "";
  const collection = args.collection || "all";
  const category = args.category || "all";
  const limit = Math.min(50, Math.max(1, Number.isInteger(args.limit) ? args.limit : 20));
  const matched = icons.map(icon => ({icon, rank: score(icon, query)}))
    .filter(({icon, rank}) => rank && (collection === "all" || icon.collection === collection)
      && (category === "all" || icon.category === category))
    .sort((a, b) => b.rank - a.rank || priority[a.icon.collection] - priority[b.icon.collection] || a.icon.name.localeCompare(b.icon.name));
  return {query, total: matched.length, results: matched.slice(0, limit).map(({icon}) => ({
    name: icon.name, collection: icon.collection, category: icon.category,
    styles: icon.variants.map(variant => variant.style),
    preview_url: urlFor(icon.variants[0].path),
  }))};
}

function getIcon(args = {}) {
  if (typeof args.name !== "string" || !args.name.trim()) throw Error("name is required");
  const name = args.name.trim().toLowerCase();
  const matches = icons.filter(icon => icon.name === name && (!args.collection || icon.collection === args.collection));
  if (!matches.length) throw Error(`Icon not found: ${name}`);
  return {name, matches: matches.map(icon => ({
    collection: icon.collection, category: icon.category, tags: icon.tags,
    source: icon.collection === "originals" ? "Independent Material Atlas artwork" : "Google Material Design Icons repository",
    license: "Apache-2.0", symbols_revision: icon.collection === "symbols" ? catalog.symbols_revision : undefined,
    variants: icon.variants.map(variant => ({style: variant.style, url: urlFor(variant.path), path: variant.path})),
  }))};
}

async function getSvg(args = {}) {
  if (!args.collection || !args.style) throw Error("collection and style are required for an exact SVG");
  const details = getIcon(args).matches[0];
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
  {name: "search_icons", description: "Search Material Atlas by icon name, category, or synonym; returns official and original collections with available styles.",
    inputSchema: {type: "object", properties: {query: {type: "string"}, collection: {type: "string", enum: ["all", "classic", "symbols", "originals"]}, category: {type: "string"}, limit: {type: "integer", minimum: 1, maximum: 50}}},
    annotations: {readOnlyHint: true}},
  {name: "get_icon", description: "Get exact icon variants, source attribution, license, and URLs for a named Material Atlas icon.",
    inputSchema: {type: "object", properties: {name: {type: "string"}, collection: {type: "string", enum: ["classic", "symbols", "originals"]}}, required: ["name"]},
    annotations: {readOnlyHint: true}},
  {name: "get_svg", description: "Fetch the exact included SVG artwork for a named icon, collection, and style.",
    inputSchema: {type: "object", properties: {name: {type: "string"}, collection: {type: "string", enum: ["classic", "symbols", "originals"]}, style: {type: "string"}}, required: ["name", "collection", "style"]},
    annotations: {readOnlyHint: true, openWorldHint: true}},
];

async function callTool(name, args) {
  let value;
  if (name === "search_icons") value = searchIcons(args);
  else if (name === "get_icon") value = getIcon(args);
  else if (name === "get_svg") value = await getSvg(args);
  else throw Error(`Unknown tool: ${name}`);
  return {content: [{type: "text", text: JSON.stringify(value)}]};
}

async function handle(message) {
  const {method, params = {}} = message;
  if (method === "initialize") return {protocolVersion: params.protocolVersion || "2025-06-18",
    capabilities: {tools: {}}, serverInfo: {name: "material-atlas", version: "1.1.0"}};
  if (method === "ping") return {};
  if (method === "tools/list") return {tools};
  if (method === "tools/call") return callTool(params.name, params.arguments || {});
  if (method === "resources/list") return {resources: []};
  throw Error(`Unsupported method: ${method}`);
}

function start() {
  const input = readline.createInterface({input: process.stdin, crlfDelay: Infinity});
  input.on("line", async line => {
    let message;
    try { message = JSON.parse(line); }
    catch { return; }
    if (message.id === undefined || message.id === null) return;
    try {
      const result = await handle(message);
      process.stdout.write(JSON.stringify({jsonrpc: "2.0", id: message.id, result}) + "\n");
    } catch (error) {
      process.stdout.write(JSON.stringify({jsonrpc: "2.0", id: message.id,
        error: {code: -32603, message: error.message}}) + "\n");
    }
  });
}

if (require.main === module) start();
module.exports = {searchIcons, getIcon, getSvg, handle, tools};
