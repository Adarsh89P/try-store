import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const selfie = path.join(__dirname, "..", "assets", "products", "saree-3.jpg");
const vis = (l: import("@playwright/test").Locator) => l.locator("visible=true");
const email = () => `app${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;

async function addSareeAndOpenCheckout(page: Page) {
  await page.goto("/");
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
}

async function signUp(page: Page) {
  await page.goto("/");
  await page.getByRole("tab", { name: /Account/ }).click();
  await page.getByLabel("Create account tab").click();
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Email").fill(email());
  await page.getByLabel("Password").fill("longenough1");
  await page.getByLabel("Create account", { exact: true }).click();
  await expect(page.getByText("Hello, Asha Rao")).toBeVisible();
}

test("account: server sign-up survives a reload; wrong password is refused", async ({ page }) => {
  await signUp(page);
  await page.reload();
  await page.getByRole("tab", { name: /Account/ }).click();
  await expect(page.getByText("Hello, Asha Rao")).toBeVisible();
  await page.getByLabel("Sign out").click();
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrongpass1");
  await page.getByLabel("Sign in", { exact: true }).click();
  await expect(page.getByText("Email or password is wrong")).toBeVisible();
});

test("guest cash-on-delivery order needs an email", async ({ page }) => {
  await addSareeAndOpenCheckout(page);
  await page.getByLabel("Cash on delivery").click();
  await page.getByLabel("Place order").click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await page.getByLabel("Email for your order updates").fill(email());
  await page.getByLabel("Place order").click();
  await expect(page.getByText("Order placed")).toBeVisible();
});

test("online payment is verified by the server and shows as paid", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Razorpay = class {
      o: any; constructor(o: any) { this.o = o; }
      on() {}
      open() {
        fetch(`http://localhost:4100/__sign?o=${this.o.order_id}&p=pay_app_1`).then((r) => r.json()).then((j) =>
          this.o.handler({ razorpay_order_id: this.o.order_id, razorpay_payment_id: "pay_app_1", razorpay_signature: j.signature }));
      }
    };
  });
  await signUp(page);
  await page.getByRole("tab", { name: /Home/ }).click();
  await addSareeAndOpenCheckout(page);
  await page.getByLabel("UPI").click();
  await page.getByLabel("Place order").click();
  await expect(page.getByText("Order placed")).toBeVisible();
  await vis(page.getByText("View my orders")).click();
  await expect(vis(page.getByText("Paid online"))).toBeVisible();
});

test("a forged payment signature is rejected", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Razorpay = class {
      o: any; constructor(o: any) { this.o = o; }
      on() {}
      open() { this.o.handler({ razorpay_order_id: this.o.order_id, razorpay_payment_id: "pay_x", razorpay_signature: "forged" }); }
    };
  });
  await addSareeAndOpenCheckout(page);
  await page.getByLabel("Email for your order updates").fill(email());
  await page.getByLabel("UPI").click();
  await page.getByLabel("Place order").click();
  await expect(page.getByText("Payment could not be verified")).toBeVisible();
  await expect(page.getByText("Order placed")).toHaveCount(0);
});

test("try-on uploads the photo to the server", async ({ page }) => {
  let hit = false;
  page.on("request", (r) => { if (r.url().endsWith("/api/tryon")) hit = true; });
  await page.goto("/");
  await page.getByLabel("Shop sarees", { exact: true }).click();
  await page.getByLabel("Add to bag").click();
  await page.getByLabel("View bag").click();
  await page.getByLabel("Try on with AI").click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByLabel("Choose a photo").click();
  await (await chooser).setFiles(selfie);
  await expect(page.getByTestId("tryon-title")).toHaveText("Ombré Net Saree", { timeout: 20000 });
  expect(hit).toBe(true);
});
