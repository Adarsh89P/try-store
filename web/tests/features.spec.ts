import { expect, test } from "@playwright/test";

test("every category page opens and browses", async ({ page }) => {
  for (const [href, first] of [
    ["/shop/dresses", "Sample Dress 1"],
    ["/shop/girls", "Sample Girls' outfit 1"],
    ["/shop/men", "Sample Men's outfit 1"],
    ["/shop/earrings", "Sample Earrings 1"],
    ["/shop/accessories", "Sample Accessory 1"],
  ] as const) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(first);
  }
  // Earrings have no size picker
  await page.goto("/shop/earrings");
  await expect(page.getByRole("button", { name: /^Size / })).toHaveCount(0);
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByTestId("bag-count")).toHaveText("1");
});

test("search finds products and filters", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search" }).fill("silk");
  await page.getByRole("searchbox", { name: "Search" }).press("Enter");
  await expect(page).toHaveURL(/\/search\?q=silk/);
  await expect(page.getByText("Banarasi Silk Saree")).toBeVisible();
  await expect(page.getByText("Olive Silk Saree")).toBeVisible();
  await expect(page.getByText("Ombré Net Saree")).toHaveCount(0);
  await page.getByRole("button", { name: "Cream & green" }).click();
  await expect(page.getByText("Olive Silk Saree")).toHaveCount(0);
  await page.goto("/search?q=zzzzqq");
  await expect(page.getByText("No products found")).toBeVisible();
});

test("search result opens the browser on that product", async ({ page }) => {
  await page.goto("/search?q=olive");
  await page.getByRole("link", { name: /Olive Silk Saree/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olive Silk Saree", { timeout: 5000 });
});

test("wishlist add, persist and remove", async ({ page }) => {
  await page.goto("/sarees");
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page.getByTestId("wishlist-count")).toHaveText("1");
  await page.goto("/wishlist");
  await expect(page.getByText("Ombré Net Saree")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Ombré Net Saree")).toBeVisible();
  await page.getByRole("button", { name: "Remove Ombré Net Saree from wishlist" }).click();
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
});

test("account: sign up, order shows in history, saved address used", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByRole("button", { name: "Create account" }).last().click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Password").fill("longenough1");
  await page.getByRole("button", { name: "Create account" }).last().click();
  await expect(page.getByText("Hello, Asha Rao")).toBeVisible();

  // Order as a signed-in user and save the address
  await page.goto("/sarees");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("House number and street").fill("12 Park Street");
  await page.getByLabel("City").fill("Kolkata");
  await page.getByLabel("State").fill("West Bengal");
  await page.getByLabel("Pincode").fill("700016");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Order placed");

  await page.getByRole("link", { name: "View my orders" }).click();
  await expect(page.getByText("Ombré Net Saree")).toBeVisible();
  await page.getByRole("link", { name: "Addresses" }).click();
  await expect(page.getByText("12 Park Street, Kolkata, West Bengal, 700016")).toBeVisible();

  // Saved address pre-fills checkout
  await page.goto("/sarees");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/checkout");
  await page.getByLabel("Use a saved address").selectOption({ index: 1 });
  await expect(page.getByLabel("City")).toHaveValue("Kolkata");

  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("tab", { name: "Sign in" })).toBeVisible();
});
