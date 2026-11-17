import { expect, test } from "@playwright/test";

test("phone flow: home to order placed", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Shop sarees", { exact: true }).click();
  await expect(page.getByTestId("product-title")).toHaveText("Ombré Net Saree");
  await expect(page.getByText("1 of 5")).toBeVisible();

  await page.getByLabel("Next saree").click();
  await expect(page.getByText("2 of 5")).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("product-title")).toHaveText("Banarasi Silk Saree");
  await expect(page.getByLabel("Size S, out of stock")).toHaveAttribute("aria-disabled", "true");
  await page.getByLabel("Size L", { exact: true }).click();

  await page.getByLabel("Add to bag").click();
  await page.getByLabel("View bag").click();
  await expect(page.getByText("Cream & green · Blouse size L")).toBeVisible();
  await page.getByLabel("Increase quantity of Banarasi Silk Saree").click();
  await expect(page.getByTestId("qty")).toHaveText("2");

  await page.getByLabel("Proceed to checkout").click();
  await page.getByLabel("Place order").click();
  await expect(page.getByText("Enter a 10-digit mobile number")).toBeVisible();

  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("House number and street").fill("12 Park Street");
  await page.getByLabel("City").fill("Kolkata");
  await page.getByLabel("State").fill("West Bengal");
  await page.getByLabel("Pincode").fill("700016");
  await page.getByLabel(/Cash on delivery/).click();
  await page.getByLabel("Place order").click();
  await expect(page.getByText("Order placed")).toBeVisible();
  await expect(page.getByText("Payment: Cash on delivery")).toBeVisible();
});
