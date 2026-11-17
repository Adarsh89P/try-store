import { expect, test } from "@playwright/test";

test.describe("saree store flow", () => {
  test("home to order placed", async ({ page }) => {
    // Home
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your saree without ever going back.");
    await page.getByRole("link", { name: "Shop sarees" }).click();

    // Browse: first saree is in the main slot, the next arrow brings the next one forward
    await expect(page).toHaveURL(/\/sarees$/);
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toHaveText("Ombré Net Saree");
    await page.getByRole("button", { name: "Next saree" }).click();
    await expect(title).toHaveText("Banarasi Silk Saree", { timeout: 5000 });
    await expect(page.getByText("2 of 5", { exact: true })).toBeVisible();

    // Out-of-stock size is disabled, an available size can be picked
    await expect(page.getByRole("button", { name: "Size S, out of stock" })).toBeDisabled();
    await page.getByRole("button", { name: "Size L", exact: true }).click();

    // Add to bag and open the bag
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByTestId("bag-count")).toHaveText("1");
    await page.getByRole("link", { name: "View bag" }).click();

    // Bag: quantity and remove
    await expect(page).toHaveURL(/\/bag$/);
    await expect(page.getByText("Banarasi Silk Saree")).toBeVisible();
    await expect(page.getByText("Cream & green · Blouse size L")).toBeVisible();
    await page.getByRole("button", { name: "Increase quantity of Banarasi Silk Saree" }).click();
    await expect(page.getByTestId("qty")).toHaveText("2");
    await page.getByRole("button", { name: "Decrease quantity of Banarasi Silk Saree" }).click();
    await expect(page.getByTestId("qty")).toHaveText("1");

    // Bag survives a reload
    await page.reload();
    await expect(page.getByText("Banarasi Silk Saree")).toBeVisible();

    // Checkout: empty submit shows errors
    await page.getByRole("link", { name: "Proceed to checkout" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page.getByText("Enter a 10-digit mobile number")).toBeVisible();
    await expect(page.getByText("Please fix the fields marked above.")).toBeVisible();

    // Fill valid details and place the order
    await page.getByLabel("Full name").fill("Asha Rao");
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("House number and street").fill("12 Park Street");
    await page.getByLabel("City").fill("Kolkata");
    await page.getByLabel("State").fill("West Bengal");
    await page.getByLabel("Pincode").fill("700016");
    await page.getByLabel(/Cash on delivery/).check();
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Order placed");
    await expect(page.getByText(/Order number: SS-/)).toBeVisible();
    await expect(page.getByText("12 Park Street, Kolkata, West Bengal, 700016")).toBeVisible();
    await expect(page.getByText("Payment: Cash on delivery")).toBeVisible();

    // The bag was cleared
    await page.goto("/bag");
    await expect(page.getByText("Your bag is empty")).toBeVisible();
  });

  test("mouse wheel scrolls the page, not the sarees", async ({ page }) => {
    await page.goto("/sarees");
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toHaveText("Ombré Net Saree");
    await page.getByTestId("gallery-scroller").hover();
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);
    await expect(title).toHaveText("Ombré Net Saree");
  });

  test("dragging the gallery moves to the next saree", async ({ page }) => {
    await page.goto("/sarees");
    const title = page.getByRole("heading", { level: 1 });
    const box = await page.getByTestId("gallery-scroller").boundingBox();
    if (!box) throw new Error("gallery not found");
    const y = box.y + box.height / 3;
    await page.mouse.move(box.x + box.width * 0.7, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.3, y, { steps: 12 });
    await page.mouse.up();
    await expect(title).toHaveText("Banarasi Silk Saree", { timeout: 5000 });
  });
});
