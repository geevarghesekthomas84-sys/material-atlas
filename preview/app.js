const search = document.querySelector("#search");
const category = document.querySelector("#category");
const style = document.querySelector("#style");
const format = document.querySelector("#format");
const pngSize = document.querySelector("#png-size");
const sizeLabel = document.querySelector("#size-label");
const grid = document.querySelector("#grid");
const count = document.querySelector("#count");
const more = document.querySelector("#more");
let icons = [];
let matches = [];
let visible = 0;

const styleNames = {
  materialicons: "Filled", materialiconsoutlined: "Outlined",
  materialiconsround: "Round", materialiconssharp: "Sharp",
  materialiconstwotone: "Two tone"
};

function option(select, value, label) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  select.append(item);
}

function assetFor(icon) {
  const [group, name, family, size] = icon;
  const selected = format.value;
  if (selected === "svg") return `../src/${encodeURIComponent(group)}/${encodeURIComponent(name)}/${encodeURIComponent(family)}/${size}`;
  if (selected === "font") {
    const extension = family === "materialicons" ? "ttf" : "otf";
    const suffix = {materialicons: "", materialiconsoutlined: "Outlined", materialiconsround: "Round",
      materialiconssharp: "Sharp", materialiconstwotone: "TwoTone"}[family];
    const fontName = "MaterialIcons" + suffix;
    return `../font/${fontName}-Regular.${extension}`;
  }
  return null;
}

function downloadPng(icon) {
  const [group, name, family, svg] = icon;
  const picture = new Image();
  picture.onload = () => {
    const size = Number(pngSize.value);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.getContext("2d").drawImage(picture, 0, 0, size, size);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}-${family}-${size}px.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };
  picture.onerror = () => alert("Could not load this SVG.");
  picture.src = `../src/${group}/${name}/${family}/${svg}`;
}

function renderNext() {
  const batch = matches.slice(visible, visible + 120);
  visible += batch.length;
  const fragment = document.createDocumentFragment();
  for (const icon of batch) {
    const [group, name, family] = icon;
    const card = document.createElement("article");
    card.className = "card";
    const picture = document.createElement("img");
    picture.src = `../src/${group}/${name}/${family}/${icon[3]}`;
    picture.alt = "";
    picture.loading = "lazy";
    const title = document.createElement("span");
    title.className = "name";
    title.textContent = name;
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${group} · ${styleNames[family] || family}`;
    const actions = document.createElement("div");
    actions.className = "actions";
    const asset = assetFor(icon);
    if (format.value === "png") {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Download PNG";
      button.addEventListener("click", () => downloadPng(icon));
      actions.append(button);
    } else if (asset) {
      const link = document.createElement("a");
      link.href = asset;
      link.textContent = "Open asset";
      link.target = "_blank";
      link.rel = "noopener";
      actions.append(link);
    } else {
      actions.textContent = "Unavailable";
    }
    card.append(picture, title, meta, actions);
    fragment.append(card);
  }
  grid.append(fragment);
  more.hidden = visible >= matches.length;
}

function update() {
  sizeLabel.hidden = format.value !== "png";
  const query = search.value.trim().toLowerCase();
  matches = icons.filter(icon =>
    (!query || icon[1].includes(query)) &&
    (!category.value || icon[0] === category.value) &&
    (!style.value || icon[2] === style.value));
  grid.replaceChildren();
  visible = 0;
  count.textContent = `${matches.length.toLocaleString()} matching icon styles`;
  renderNext();
}

fetch("icons.json").then(response => {
  if (!response.ok) throw new Error("Could not load icon index");
  return response.json();
}).then(data => {
  icons = data;
  for (const value of [...new Set(icons.map(icon => icon[0]))].sort()) option(category, value, value);
  for (const value of [...new Set(icons.map(icon => icon[2]))].sort()) option(style, value, styleNames[value] || value);
  update();
}).catch(error => { count.textContent = error.message + "; run python preview/build_manifest.py"; });

for (const control of [search, category, style, format]) control.addEventListener("input", update);
more.addEventListener("click", renderNext);
