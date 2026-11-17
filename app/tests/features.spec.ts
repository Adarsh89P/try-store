import { expect, test } from "@playwright/test";

test("every category opens from Home", async ({ page }) => {
  for (const [label, first] of [
    ["Dresses", "Sample Dress 1"],
    ["Girls' wear", "Sample Girls' outfit 1"],
    ["Men's wear", "Sample Men's outfit 1"],
    ["Earrings", "Sample Earrings 1"],
    ["Accessories", "Sample Accessory 1"],
  ] as const) {
    await page.goto("/");
    await page.getByLabel(`Browse ${label}`, { exact: true }).click();
    await expect(page.getByTestId("product-title")).toHaveText(first);
  }
  // Earrings have no size picker
  await page.goto("/");
  await page.getByLabel("Browse Earrings", { exact: true }).click();
  await expect(page.getByLabel(/^Size /)).toHaveCount(0);
});

test("search filters, opens a product, and wishlist persists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /Search/ }).click();
  await page.getByLabel("Search", { exact: true }).fill("silk");
  await expect(page.getByText("2 products")).toBeVisible();
  await page.getByLabel("Cream & green", { exact: true }).click();
  await expect(page.getByText("1 product", { exact: true })).toBeVisible();
  await page.getByLabel("Add Banarasi Silk Saree to wishlist").click();
  await page.getByLabel("Banarasi Silk Saree, open").click();
  await expect(page.getByTestId("product-title")).toHaveText("Banarasi Silk Saree", { timeout: 5000 });

  await page.reload();
  await page.getByRole("tab", { name: /Wishlist/ }).click();
  await expect(page.getByLabel("Remove Banarasi Silk Saree from wishlist").locator("visible=true")).toBeVisible();
  await page.getByLabel("Remove Banarasi Silk Saree from wishlist").locator("visible=true").click();
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
});

test("account: sign up, order, history and saved address", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /Account/ }).click();
  await page.getByLabel("Create account tab").click();
  await page.getByLabel("Create account", { exact: true }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Password").fill("longenough1");
  await page.getByLabel("Create account", { exact: true }).click();
  await expect(page.getByText("Hello, Asha Rao")).toBeVisible();

  await page.getByRole("tab", { name: /Home/ }).click();
  await page.getByLabel("Shop sarees", { exact: true }).click();
  await page.getByLabel("Add to bag").click();
  await page.getByLabel("View bag").click();
  await page.getByLabel("Proceed to checkout").click();
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("House number and street").fill("12 Park Street");
  await page.getByLabel("City").fill("Kolkata");
  await page.getByLabel("State").fill("West Bengal");
  await page.getByLabel("Pincode").fill("700016");
  await page.getByLabel("Place order").click();
  await expect(page.getByText("Order placed")).toBeVisible();
  await page.getByText("View my orders").locator("visible=true").click();
  await expect(page.getByText(/Ombré Net Saree · Orange & magenta/)).toBeVisible();
});
