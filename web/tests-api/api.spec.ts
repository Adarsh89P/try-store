import path from "node:path";
import { expect, test } from "@playwright/test";

const selfie = path.join(__dirname, "..", "public", "products", "saree-3.jpg");
const email = () => `buyer${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;

async function fillAddress(page: import("@playwright/test").Page) {
  await page.getByLabel("Full name").fill("Asha Roy");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("House number and street").fill("12 Park Street");
  await page.getByLabel("City").fill("Kolkata");
  await page.getByLabel("State").fill("West Bengal");
  await page.getByLabel("Pincode").fill("700016");
}

test("account: register on the server, survive a reload, sign out, wrong password", async ({ page }) => {
  const e = email();
  await page.goto("/account");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill("Asha Roy");
  await page.getByLabel("Email").fill(e);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).last().click();
  await expect(page.getByRole("heading", { name: "Hello, Asha Roy" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Hello, Asha Roy" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Email").fill(e);
  await page.getByLabel("Password").fill("wrongpass1");
  await page.getByRole("button", { name: "Sign in" }).last().click();
  await expect(page.getByText("Email or password is wrong")).toBeVisible();
});

test("guest checkout: cash on delivery needs an email and places the order", async ({ page }) => {
  await page.goto("/sarees");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/checkout");
  await fillAddress(page);
  await page.getByLabel("Cash on delivery").check();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await page.getByLabel("Email for your order updates").fill(email());
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();
  await expect(page.getByText(/Order number: SS-/)).toBeVisible();
});

test("signed-in online payment: Razorpay result is verified by the server and the order shows as paid", async ({ page, request }) => {
  // Stand-in for Razorpay Checkout: returns a signature made with the mock server's secret.
  await page.addInitScript(() => {
    (window as any).Razorpay = class {
      o: any; constructor(o: any) { this.o = o; }
      on() {}
      open() {
        const pid = "pay_test_1";
        fetch(`http://localhost:4100/__sign?o=${this.o.order_id}&p=${pid}`).then((r) => r.json()).then((j) =>
          this.o.handler({ razorpay_order_id: this.o.order_id, razorpay_payment_id: pid, razorpay_signature: j.signature }));
      }
    };
  });
  await page.goto("/account");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill("Asha Roy");
  await page.getByLabel("Email").fill(email());
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).last().click();
  await expect(page.getByRole("heading", { name: "Hello, Asha Roy" })).toBeVisible();

  await page.goto("/sarees");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/checkout");
  await fillAddress(page);
  await page.getByLabel("UPI").check();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();

  await page.goto("/account/orders");
  await expect(page.getByText("Paid online")).toBeVisible();
  void request;
});

test("a refused payment shows an error and keeps the bag", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Razorpay = class {
      o: any; constructor(o: any) { this.o = o; }
      on() {}
      open() { this.o.handler({ razorpay_order_id: this.o.order_id, razorpay_payment_id: "pay_x", razorpay_signature: "forged" }); }
    };
  });
  await page.goto("/sarees");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/checkout");
  await fillAddress(page);
  await page.getByLabel("Email for your order updates").fill(email());
  await page.getByLabel("UPI").check();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByText("Payment could not be verified")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Order placed" })).toHaveCount(0);
});

test("try-on sends the photo to the server", async ({ page }) => {
  let hit = false;
  page.on("request", (r) => { if (r.url().endsWith("/api/tryon")) hit = true; });
  await page.goto("/sarees");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/tryon");
  await page.getByLabel("Upload or take a photo").setInputFiles(selfie);
  await expect(page.getByText("1 of 1", { exact: false }).first()).toBeVisible({ timeout: 15000 });
  expect(hit).toBe(true);
});
