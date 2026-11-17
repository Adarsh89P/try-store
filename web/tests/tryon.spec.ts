import path from "node:path";
import { expect, test } from "@playwright/test";

const selfie = path.join(__dirname, "..", "public", "products", "saree-3.jpg");

test("try-on: photo, analysing screen, swipe, remove, checkout", async ({ page }) => {
  // Two items in the bag
  await page.goto("/sarees");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.getByRole("button", { name: "Next saree" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Banarasi Silk Saree", { timeout: 5000 });
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByTestId("bag-count")).toHaveText("2");

  await page.goto("/bag");
  await page.getByRole("link", { name: /Try on with AI/ }).click();
  await expect(page).toHaveURL(/\/tryon$/);
  await expect(page.getByText("Take a selfie or choose a photo")).toBeVisible();

  await page.getByLabel("Upload or take a photo").setInputFiles(selfie);
  await expect(page.getByRole("heading", { name: "Analysing your photo" })).toBeVisible();
  await expect(page.getByText("Fitting Banarasi Silk Saree")).toBeVisible();

  // Results: swipe gallery of both items
  await expect(page.getByText("1 of 2", { exact: false }).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Ombré Net Saree", level: 2 })).toBeVisible();
  await page.getByRole("button", { name: "Next saree" }).click();
  await expect(page.getByRole("heading", { name: "Banarasi Silk Saree", level: 2 })).toBeVisible({ timeout: 5000 });

  // Remove the one on screen
  await page.getByRole("button", { name: "Remove from bag" }).click();
  await expect(page.getByText("Banarasi Silk Saree removed from your bag.")).toBeVisible();
  await expect(page.getByText("1 item in your bag")).toBeVisible();
  await expect(page.getByTestId("bag-count")).toHaveText("1");

  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText("Ombré Net Saree")).toBeVisible();
});

test("try-on with an empty bag", async ({ page }) => {
  await page.goto("/tryon");
  await expect(page.getByText("Your bag is empty")).toBeVisible();
});

test("try-on rejects a file that is not an image", async ({ page }) => {
  await page.goto("/sarees");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/tryon");
  await page.getByLabel("Upload or take a photo").setInputFiles({ name: "x.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not an image") });
  await expect(page.getByRole("alert").filter({ hasText: "could not use that photo" })).toBeVisible({ timeout: 10000 });
});
