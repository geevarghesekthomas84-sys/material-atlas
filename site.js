const $ = selector => document.querySelector(selector);
const grid = $("#icon-grid");
const search = $("#search");
const category = $("#category");
const style = $("#style");
const format = $("#format");
const pngSize = $("#png-size");
const dialog = $("#icon-dialog");
let catalog = [];
let matches = [];
let activeCollection = "all";
let shown = 0;
let selected = null;
let toastTimer;

const styleNames = {
  materialicons: "Filled", materialiconsoutlined: "Outlined",
  materialiconsround: "Round", materialiconssharp: "Sharp",
  materialiconstwotone: "Two tone", outlined: "Outlined",
  rounded: "Rounded", sharp: "Sharp", original: "Original"
};
const sourceNames = {classic: "Classic Material Icons", symbols: "Material Symbols", originals: "Original addition"};
const fontFiles = {
  materialicons: "MaterialIcons-Regular.ttf",
  materialiconsoutlined: "MaterialIconsOutlined-Regular.otf",
  materialiconsround: "MaterialIconsRound-Regular.otf",
  materialiconssharp: "MaterialIconsSharp-Regular.otf",
  materialiconstwotone: "MaterialIconsTwoTone-Regular.otf"
};

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("visible"), 2500);
}

function setOptions(element, values, label) {
  const current = element.value;
  element.replaceChildren(new Option(label, ""));
  for (const value of values) element.add(new Option(styleNames[value] || value.replaceAll("_", " "), value));
  element.value = values.includes(current) ? current : "";
}

function available() {
  return catalog.filter(item => (activeCollection === "all" || item.collection === activeCollection)
    && (format.value !== "font" || item.collection === "classic"));
}

function updateFilters() {
  const scope = available();
  setOptions(category, [...new Set(scope.map(item => item.category))].sort(), "All categories");
  setOptions(style, [...new Set(scope.map(item => item.style))].sort(), "All styles");
}

function setCollection(value) {
  if (format.value === "font" && value !== "classic" && value !== "all") format.value = "svg";
  activeCollection = value;
  for (const tab of document.querySelectorAll("[data-tab]")) {
    const active = tab.dataset.tab === value;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  }
  updateFilters();
  update();
}

function card(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-card";
  button.dataset.collection = item.collection;
  button.setAttribute("aria-label", `Inspect ${item.name.replaceAll("_", " ")} in ${sourceNames[item.collection]}, ${styleNames[item.style]}`);
  const art = document.createElement("span");
  art.className = "icon-art";
  const image = document.createElement("img");
  image.src = item.path;
  image.alt = "";
  image.loading = "lazy";
  art.append(image);
  const meta = document.createElement("span");
  meta.className = "icon-meta";
  const title = document.createElement("strong");
  title.textContent = item.name;
  const labels = document.createElement("small");
  const source = document.createElement("span");
  source.textContent = item.collection === "classic" ? item.category : item.collection;
  const kind = document.createElement("span");
  kind.textContent = styleNames[item.style];
  labels.append(source, kind);
  meta.append(title, labels);
  button.append(art, meta);
  button.addEventListener("click", () => inspect(item));
  return button;
}

function renderNext() {
  const next = matches.slice(shown, shown + 96);
  const fragment = document.createDocumentFragment();
  next.forEach(item => fragment.append(card(item)));
  grid.append(fragment);
  shown += next.length;
  $("#load-more").hidden = shown >= matches.length;
}

function update() {
  $("#size-field").hidden = format.value !== "png";
  const q = search.value.trim().toLowerCase();
  matches = available().filter(item =>
    (!q || item.name.includes(q) || item.category.includes(q))
    && (!category.value || item.category === category.value)
    && (!style.value || item.style === style.value));
  grid.replaceChildren();
  shown = 0;
  $("#result-count").textContent = `${matches.length.toLocaleString()} icon variants${q ? ` matching “${q}”` : ""}`;
  renderNext();
}

function inspect(item) {
  selected = item;
  $("#detail-image").src = item.path;
  $("#detail-image").alt = `${item.name.replaceAll("_", " ")} icon`;
  $("#detail-source").textContent = sourceNames[item.collection];
  $("#detail-name").textContent = item.name;
  $("#detail-meta").textContent = `${styleNames[item.style]} · ${item.category.replaceAll("_", " ")} · SVG artwork`;
  $("#detail-path").textContent = item.path;
  $("#download-svg").href = item.path;
  $("#download-svg").download = `${item.name}-${item.style}.svg`;
  const font = $("#download-font");
  font.hidden = item.collection !== "classic";
  if (!font.hidden) {
    font.href = `font/${fontFiles[item.style]}`;
    font.download = fontFiles[item.style];
  }
  dialog.showModal();
}

function downloadPng(item) {
  const image = new Image();
  image.onload = () => {
    const size = Number(pngSize.value);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return toast("PNG export is unavailable in this browser");
    context.drawImage(image, 0, 0, size, size);
    canvas.toBlob(blob => {
      if (!blob) return toast("PNG export failed");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${item.name}-${item.style}-${size}px.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("PNG downloaded");
    }, "image/png");
  };
  image.onerror = () => toast("Could not load the SVG");
  image.src = item.path;
}

$("#hero-search").addEventListener("submit", event => {
  event.preventDefault();
  category.value = "";
  style.value = "";
  setCollection("all");
  $("#explore").scrollIntoView({behavior: "smooth"});
});
for (const button of document.querySelectorAll("[data-query]")) {
  button.addEventListener("click", () => {
    search.value = button.dataset.query;
    category.value = "";
    style.value = "";
    setCollection("all");
    $("#explore").scrollIntoView({behavior: "smooth"});
  });
}
for (const button of document.querySelectorAll("[data-collection]")) {
  button.addEventListener("click", () => {
    search.value = "";
    setCollection(button.dataset.collection);
    $("#explore").scrollIntoView({behavior: "smooth"});
  });
}
for (const tab of document.querySelectorAll("[data-tab]")) tab.addEventListener("click", () => setCollection(tab.dataset.tab));
search.addEventListener("input", update);
category.addEventListener("change", update);
style.addEventListener("change", update);
format.addEventListener("change", () => { updateFilters(); update(); });
pngSize.addEventListener("change", update);
$("#load-more").addEventListener("click", renderNext);
$("#close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
$("#download-png").addEventListener("click", () => { if (selected) downloadPng(selected); });
$("#copy-path").addEventListener("click", async () => {
  if (!selected) return;
  try { await navigator.clipboard.writeText(selected.path); toast("Path copied"); }
  catch { toast("Clipboard unavailable"); }
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !dialog.open && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
    event.preventDefault();
    search.focus();
  }
});

Promise.all([
  fetch("preview/icons.json").then(response => { if (!response.ok) throw Error("Classic icon index unavailable"); return response.json(); }),
  fetch("symbols/manifest.json").then(response => { if (!response.ok) throw Error("Material Symbols index unavailable"); return response.json(); }),
  fetch("originals/manifest.json").then(response => { if (!response.ok) throw Error("Original icon index unavailable"); return response.json(); })
]).then(([classic, symbols, originals]) => {
  catalog = [
    ...classic.map(([category, name, style, file]) => ({collection: "classic", category, name, style, path: `src/${category}/${name}/${style}/${file}`})),
    ...symbols.map(({name, style, path}) => ({collection: "symbols", category: "current symbols", name, style, path})),
    ...originals.map(({name, path}) => ({collection: "originals", category: "independent additions", name, style: "original", path}))
  ];
  const weight = {symbols: 0, originals: 1, classic: 2};
  catalog.sort((a, b) => weight[a.collection] - weight[b.collection] || a.name.localeCompare(b.name) || a.style.localeCompare(b.style));
  $("#all-count").textContent = catalog.length.toLocaleString();
  updateFilters();
  update();
}).catch(error => {
  $("#result-count").textContent = error.message;
  toast("Could not load the icon index");
});
