const {test, expect} = require("@playwright/test");
const fs = require("node:fs/promises");
const {execFileSync} = require("node:child_process");

test("synonym search finds icons", async ({page}) => {
  await page.goto("/");
  await expect(page.locator("#result-count")).toContainText("7,018 icon variants");
  await page.locator("#search").fill("heart");
  await expect(page.getByRole("button", {name: /Inspect favorite in/}).first()).toBeVisible();
  await page.locator("#search").fill("setings");
  await expect(page.getByRole("button", {name: /Inspect settings in/}).first()).toBeVisible();
});

test("studio compares styles and exports a ZIP", async ({page}) => {
  await page.goto("/");
  await page.locator("#search").fill("settings");
  await page.getByRole("button", {name: /Inspect settings in/}).first().click();
  await page.getByRole("button", {name: "Open in Studio"}).click();
  await expect(page.locator("#studio-name")).toHaveText("settings");
  await expect(page.locator("#studio-variants button")).toHaveCount(3);
  await page.locator("#studio-color").fill("#d95063");
  await expect(page.locator("#studio-image")).toHaveAttribute("src", /^blob:/);
  await page.locator("#studio-add-pack").click();
  await expect(page.locator("#pack-count")).toHaveText("1");
  const waitDownload = page.waitForEvent("download");
  await page.locator("#pack-download").click();
  const download = await waitDownload;
  expect(download.suggestedFilename()).toBe("material-atlas-pack.zip");
  const data = await fs.readFile(await download.path());
  expect(data.toString("ascii", 0, 2)).toBe("PK");
  execFileSync("python", ["-c", "import sys, zipfile; z=zipfile.ZipFile(sys.argv[1]); assert 'symbols/settings-outlined.svg' in z.namelist(); assert 'LICENSE.txt' in z.namelist(); assert z.testzip() is None", await download.path()]);
});

test("shared link opens a specific icon and saved filter works", async ({page}) => {
  await page.goto("/?icon=home&source=symbols&style=outlined");
  await expect(page.locator("#icon-dialog")).toBeVisible();
  await expect(page.locator("#detail-name")).toHaveText("home");
  await page.locator("#save-favorite").click();
  await page.locator("#close-dialog").click();
  await page.locator("#favorites-only").check();
  await expect(page.locator("#result-count")).toContainText("1 icon variant");
  await expect(page.getByRole("button", {name: /Inspect home in Material Symbols, Outlined/})).toBeVisible();
  await page.reload();
  await page.locator("#close-dialog").click();
  await page.locator("#favorites-only").check();
  await expect(page.locator("#result-count")).toContainText("1 icon variant");
});

test("studio fits a narrow screen", async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto("/");
  await expect(page.locator("#studio-title")).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(391);
});

test("Symbols font controls update the live preview", async ({page}) => {
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({status: 200, contentType: "text/css", body: ""}));
  await page.goto("/?icon=home&source=symbols&style=outlined");
  await page.locator("#compare-styles").click();
  await page.locator("#symbol-live").check();
  await expect(page.locator("#symbol-font-link")).toHaveAttribute("href", /icon_names=home/);
  await page.locator("#symbol-weight").fill("700");
  await expect(page.locator("#symbol-weight-output")).toHaveText("700");
  await expect(page.locator("#studio-symbol-glyph")).toHaveCSS("font-variation-settings", /"wght" 700/);
});

test("Studio copies customized SVG and a shareable link", async ({page, context}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?icon=home&source=symbols&style=outlined");
  await page.locator("#compare-styles").click();
  await page.locator("#studio-color").fill("#d95063");
  await page.locator("#studio-copy-svg").click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("#d95063");
  await page.locator("#studio-share").click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("icon=home&source=symbols&style=outlined");
});
