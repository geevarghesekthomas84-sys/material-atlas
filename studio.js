/* Material Atlas studio: local collections, share links, previews, and ZIP export. */
(() => {
  const $ = selector => document.querySelector(selector);
  const atlas = window.Atlas;
  const labels = {materialicons: "Filled", materialiconsoutlined: "Outlined", materialiconsround: "Round", materialiconssharp: "Sharp", materialiconstwotone: "Two tone", outlined: "Outlined", rounded: "Rounded", sharp: "Sharp", original: "Original"};
  const storageKey = "material-atlas-v1";
  const svgCache = new Map();
  let chosen = null;
  let previewUrl = null;
  let previewRequest = 0;
  let fontKey = "";
  let fontReady = false;

  function readSaved() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return {favorites: Array.isArray(value.favorites) ? value.favorites : [], pack: Array.isArray(value.pack) ? value.pack : []};
    } catch { return {favorites: [], pack: []}; }
  }
  const saved = readSaved();
  const key = item => `${item.collection}:${item.name}:${item.style}`;
  const find = id => atlas.getCatalog().find(item => key(item) === id);
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
    catch { atlas.toast("Browser storage is unavailable"); }
  }
  function updateFavoriteButton() {
    const item = atlas.getSelected();
    if (item) $("#save-favorite").textContent = saved.favorites.includes(key(item)) ? "Remove saved" : "Save icon";
    $("#favorite-count").textContent = saved.favorites.length;
  }
  function toggleFavorite() {
    const item = atlas.getSelected();
    if (!item) return;
    const id = key(item);
    saved.favorites = saved.favorites.includes(id) ? saved.favorites.filter(value => value !== id) : [...saved.favorites, id];
    persist(); updateFavoriteButton(); atlas.update();
    atlas.toast(saved.favorites.includes(id) ? "Icon saved" : "Icon removed from saved");
  }
  function renderPack() {
    const list = $("#pack-list");
    list.replaceChildren();
    const items = saved.pack.map(find).filter(Boolean);
    $("#pack-count").textContent = items.length;
    $("#pack-download").disabled = $("#pack-clear").disabled = !items.length;
    $("#studio-add-pack").textContent = chosen && saved.pack.includes(key(chosen)) ? "Remove from pack" : "Add to pack";
    const detail = atlas.getSelected();
    if (detail) $("#add-to-pack").textContent = saved.pack.includes(key(detail)) ? "Remove from pack" : "Add to pack";
    if (!items.length) {
      const empty = document.createElement("li"); empty.className = "empty-pack";
      empty.textContent = "Your pack is empty. Add icons from the explorer."; list.append(empty);
      return;
    }
    for (const item of items) {
      const li = document.createElement("li");
      li.append(document.createTextNode(`${item.name} / ${labels[item.style]}`));
      const remove = document.createElement("button"); remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${item.name} ${labels[item.style]} from pack`);
      remove.textContent = "×"; remove.addEventListener("click", () => togglePack(item));
      li.append(remove); list.append(li);
    }
  }
  function togglePack(item) {
    if (!item) return;
    const id = key(item);
    if (saved.pack.includes(id)) saved.pack = saved.pack.filter(value => value !== id);
    else {
      if (saved.pack.length >= 40) return atlas.toast("A pack can hold up to 40 icons");
      saved.pack.push(id);
    }
    persist(); renderPack();
    atlas.toast(saved.pack.includes(id) ? "Added to pack" : "Removed from pack");
  }

  function renderVariants() {
    const box = $("#studio-variants"); box.replaceChildren();
    if (!chosen) return;
    const variants = atlas.getCatalog().filter(item => item.name === chosen.name && item.collection === chosen.collection);
    for (const item of variants) {
      const button = document.createElement("button"); button.type = "button";
      button.textContent = labels[item.style]; button.setAttribute("aria-pressed", String(key(item) === key(chosen)));
      button.addEventListener("click", () => select(item)); box.append(button);
    }
  }
  async function rawSvg(item) {
    if (!svgCache.has(item.path)) {
      const response = await fetch(item.path);
      if (!response.ok) throw Error("SVG could not be loaded");
      svgCache.set(item.path, await response.text());
    }
    return svgCache.get(item.path);
  }
  function coloredSvg(source, color) {
    const documentSvg = new DOMParser().parseFromString(source, "image/svg+xml");
    const root = documentSvg.documentElement;
    if (root.nodeName === "parsererror" || root.localName !== "svg" || root.querySelector("script")) throw Error("Invalid SVG");
    for (const element of [root, ...root.querySelectorAll("*")]) {
      for (const attribute of ["fill", "stroke"]) {
        if (element.hasAttribute(attribute) && element.getAttribute(attribute) !== "none") element.setAttribute(attribute, color);
      }
    }
    if (!root.hasAttribute("fill")) root.setAttribute("fill", color);
    return new XMLSerializer().serializeToString(root);
  }
  function updateFontAxes() {
    const glyph = $("#studio-symbol-glyph");
    glyph.style.fontVariationSettings = `"FILL" ${$("#symbol-fill").value}, "wght" ${$("#symbol-weight").value}, "GRAD" ${$("#symbol-grade").value}, "opsz" ${$("#symbol-optical").value}`;
    glyph.style.fontSize = `${$("#studio-size").value}px`;
    glyph.style.color = $("#studio-color").value;
    for (const name of ["fill", "weight", "grade", "optical"]) $(`#symbol-${name}-output`).textContent = $(`#symbol-${name}`).value;
  }
  function showFont() {
    $("#studio-image").hidden = true;
    $("#studio-symbol-glyph").hidden = false;
    updateFontAxes();
  }
  function loadFont() {
    if (!chosen || chosen.collection !== "symbols" || !$("#symbol-live").checked) return;
    const family = `Material Symbols ${labels[chosen.style]}`;
    const nextKey = `${family}:${chosen.name}`;
    $("#studio-symbol-glyph").textContent = chosen.name;
    $("#studio-symbol-glyph").style.fontFamily = `"${family}"`;
    if (fontKey === nextKey && fontReady) return showFont();
    fontKey = nextKey; fontReady = false;
    $("#symbol-font-link")?.remove();
    const link = document.createElement("link"); link.id = "symbol-font-link"; link.rel = "stylesheet";
    const params = new URLSearchParams({family: `${family}:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`, icon_names: chosen.name, display: "block"});
    link.href = `https://fonts.googleapis.com/css2?${params}`;
    link.onload = () => { if (fontKey === nextKey) { fontReady = true; if (chosen?.collection === "symbols" && $("#symbol-live").checked) showFont(); } };
    link.onerror = () => { if (fontKey === nextKey) atlas.toast("Live font unavailable; showing included SVG"); };
    document.head.append(link);
  }
  async function renderPreview() {
    if (!chosen) return;
    const request = ++previewRequest;
    const stage = $("#studio-stage"); stage.className = `studio-stage ${$("#studio-bg").value}`;
    const size = Number($("#studio-size").value);
    $("#studio-size-output").textContent = `${size} px`;
    $("#studio-image").style.width = $("#studio-image").style.height = `${size}px`;
    if (chosen.collection === "symbols" && $("#symbol-live").checked) {
      loadFont(); if (fontReady) { showFont(); return; }
    } else $("#studio-symbol-glyph").hidden = true;
    try {
      const svg = coloredSvg(await rawSvg(chosen), $("#studio-color").value);
      if (request !== previewRequest) return;
      const url = URL.createObjectURL(new Blob([svg], {type: "image/svg+xml"}));
      $("#studio-image").src = url;
      $("#studio-image").alt = `${chosen.name.replaceAll("_", " ")} preview`;
      $("#studio-image").hidden = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = url;
    } catch { atlas.toast("Could not preview this SVG"); }
  }
  function select(item) {
    chosen = item;
    $("#studio-name").textContent = item.name.replaceAll("_", " ");
    $("#studio-source").textContent = `${item.collection === "classic" ? "Classic Material Icons" : item.collection === "symbols" ? "Material Symbols" : "Original addition"} · ${labels[item.style]}`;
    $("#symbols-controls").hidden = item.collection !== "symbols";
    for (const id of ["studio-copy-svg", "studio-copy-code", "studio-add-pack", "studio-share"]) $(`#${id}`).disabled = false;
    renderVariants(); renderPack(); renderPreview();
  }
  function shareUrl(item) {
    const url = new URL(location.href);
    url.searchParams.set("icon", item.name);
    url.searchParams.set("source", item.collection);
    url.searchParams.set("style", item.style);
    url.hash = "";
    return url.href;
  }
  async function copy(value, success) {
    try { await navigator.clipboard.writeText(value); atlas.toast(success); }
    catch { atlas.toast("Clipboard unavailable"); }
  }

  // A small ZIP writer using stored entries; it needs no third-party script or network service.
  const crcTable = Array.from({length: 256}, (_, n) => {
    let value = n;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    return value >>> 0;
  });
  function crc32(bytes) {
    let value = 0xffffffff;
    for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
    return (value ^ 0xffffffff) >>> 0;
  }
  function makeZip(files) {
    const encoder = new TextEncoder();
    const bodies = [], directory = [];
    let offset = 0, directorySize = 0;
    for (const file of files) {
      const name = encoder.encode(file.name), data = encoder.encode(file.text), crc = crc32(data);
      const local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x800, true);
      lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
      lv.setUint16(26, name.length, true); local.set(name, 30);
      const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x800, true); cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
      cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true); central.set(name, 46);
      bodies.push(local, data); directory.push(central);
      offset += local.length + data.length; directorySize += central.length;
    }
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true); ev.setUint32(12, directorySize, true);
    ev.setUint32(16, offset, true);
    return new Blob([...bodies, ...directory, end], {type: "application/zip"});
  }
  async function downloadPack() {
    const button = $("#pack-download"); button.disabled = true; button.textContent = "Preparing…";
    try {
      const items = saved.pack.map(find).filter(Boolean);
      const files = await Promise.all(items.map(async item => ({name: `${item.collection}/${item.name}-${item.style}.svg`, text: await rawSvg(item)})));
      const license = await fetch("LICENSE"); if (!license.ok) throw Error("License unavailable");
      files.push({name: "LICENSE.txt", text: await license.text()});
      files.push({name: "SOURCE-NOTES.txt", text: "Material Atlas icon pack\n\nClassic Material Icons and Material Symbols are Google artwork from https://github.com/google/material-design-icons under Apache 2.0. Original additions are independent work from Material Atlas under Apache 2.0. This project is not endorsed by Google.\n"});
      const url = URL.createObjectURL(makeZip(files));
      const link = document.createElement("a"); link.href = url; link.download = "material-atlas-pack.zip";
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
      atlas.toast(`${items.length} icons downloaded`);
    } catch { atlas.toast("Could not create the icon pack"); }
    finally { button.textContent = "Download ZIP"; renderPack(); }
  }

  atlas.isFavorite = item => saved.favorites.includes(key(item));
  atlas.onInspect = item => { select(item); updateFavoriteButton(); };
  atlas.onReady = () => {
    saved.favorites = saved.favorites.filter(find); saved.pack = saved.pack.filter(find);
    updateFavoriteButton(); renderPack();
    const params = new URLSearchParams(location.search);
    const linked = atlas.getCatalog().find(item => item.name === params.get("icon") && item.collection === params.get("source") && item.style === params.get("style"));
    if (linked) { atlas.setCollection(linked.collection); atlas.inspect(linked); }
  };

  $("#save-favorite").addEventListener("click", toggleFavorite);
  $("#add-to-pack").addEventListener("click", () => togglePack(atlas.getSelected()));
  $("#studio-add-pack").addEventListener("click", () => togglePack(chosen));
  $("#pack-clear").addEventListener("click", () => { saved.pack = []; persist(); renderPack(); atlas.toast("Pack cleared"); });
  $("#pack-download").addEventListener("click", downloadPack);
  $("#compare-styles").addEventListener("click", () => { $("#icon-dialog").close(); $("#studio").scrollIntoView({behavior: "smooth"}); });
  $("#share-icon").addEventListener("click", () => { const item = atlas.getSelected(); if (item) copy(shareUrl(item), "Link copied"); });
  $("#studio-share").addEventListener("click", () => { if (chosen) copy(shareUrl(chosen), "Link copied"); });
  $("#studio-copy-svg").addEventListener("click", async () => {
    if (!chosen) return;
    try { copy(coloredSvg(await rawSvg(chosen), $("#studio-color").value), "SVG copied"); }
    catch { atlas.toast("Could not copy SVG"); }
  });
  $("#studio-copy-code").addEventListener("click", () => {
    if (!chosen) return;
    const url = new URL(chosen.path, location.href).href;
    copy(`<img src="${url}" alt="${chosen.name.replaceAll("_", " ")}" />`, "HTML / JSX copied");
  });
  for (const id of ["studio-color", "studio-bg", "studio-size", "symbol-live"]) $(`#${id}`).addEventListener("input", renderPreview);
  for (const name of ["fill", "weight", "grade", "optical"]) $(`#symbol-${name}`).addEventListener("input", updateFontAxes);
  if (atlas.ready) atlas.onReady();
})();
