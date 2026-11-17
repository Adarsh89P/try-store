import path from "node:path";
import { expect, test } from "@playwright/test";

const selfie = path.join(__dirname, "..", "assets", "products", "saree-3.jpg");
const vis = (l: import("@playwright/test").Locator) => l.locator("visible=true");

test("try-on: photo, analysing, swipe, remove, checkout", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Shop sarees", { exact: true }).click();
  await page.getByLabel("Add to bag").click();
  await page.getByLabel("Next saree").click();
  await expect(page.getByTestId("product-title")).toHaveText("Banarasi Silk Saree", { timeout: 5000 });
  await page.getByLabel("Add to bag").click();
  await page.getByLabel("View bag").click();

  await page.getByLabel("Try on with AI").click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByLabel("Choose a photo").click();
  await (await chooser).setFiles(selfie);

  await expect(vis(page.getByText("Analysing your photo", { exact: true }))).toBeVisible();
  await expect(vis(page.getByText("Fitting Banarasi Silk Saree"))).toBeVisible();

  await expect(page.getByTestId("tryon-title")).toHaveText("Ombré Net Saree", { timeout: 15000 });
  await vis(page.getByLabel("Next saree")).click();
  await expect(page.getByTestId("tryon-title")).toHaveText("Banarasi Silk Saree", { timeout: 5000 });

  await page.getByLabel("Remove from bag").click();
  await expect(page.getByText("Banarasi Silk Saree removed from your bag.")).toBeVisible();
  await expect(page.getByText("1 item in your bag")).toBeVisible();

  await vis(page.getByLabel("Proceed to checkout")).click();
  await expect(vis(page.getByLabel("Place order"))).toBeVisible();
});

test("try-on with an empty bag", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /Bag/ }).click();
  await expect(page.getByText("Your bag is empty")).toBeVisible();
});
