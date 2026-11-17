import { describe, expect, it } from "vitest";
import { priceBag, type ProductLike } from "../src/lib/pricing.js";
import { createRazorpayGateway, safeEqualHex } from "../src/lib/razorpay.js";
import { createReplicateProvider, sniffImage } from "../src/lib/tryon/index.js";
import { createOrderBody } from "../src/routes/orders.js";
import { loadConfig } from "../src/config.js";
import { SECRETS, hmac, JPEG } from "./helpers.js";

const saree: ProductLike = {
  slug: "s1", name: "Saree", category: "sarees", priceInr: 1000, unavailableSizes: ["XXL"],
  colours: [{ name: "Red", image: "/a.jpg" }], active: true,
};
const earring: ProductLike = { ...saree, slug: "e1", name: "Ear", category: "earrings", priceInr: 250, unavailableSizes: [] };

describe("priceBag", () => {
  it("totals from catalogue prices and adds delivery", () => {
    const p = priceBag([{ slug: "s1", colour: "Red", size: "M", qty: 2 }, { slug: "e1", colour: "Red", size: "One size", qty: 1 }], [saree, earring], 50);
    expect(p.subtotalInr).toBe(2250);
    expect(p.totalInr).toBe(2300);
  });
  it.each([
    [{ slug: "nope", colour: "Red", size: "M", qty: 1 }, "PRODUCT_NOT_FOUND"],
    [{ slug: "s1", colour: "Blue", size: "M", qty: 1 }, "COLOUR_NOT_FOUND"],
    [{ slug: "s1", colour: "Red", size: "XS", qty: 1 }, "SIZE_INVALID"],
    [{ slug: "s1", colour: "Red", size: "XXL", qty: 1 }, "OUT_OF_STOCK"],
    [{ slug: "e1", colour: "Red", size: "M", qty: 1 }, "SIZE_INVALID"],
  ])("rejects %j", (line, code) => {
    expect(() => priceBag([line], [saree, earring], 0)).toThrow(expect.objectContaining({ code }));
  });
  it("refuses items with no price yet", () => {
    expect(() => priceBag([{ slug: "s1", colour: "Red", size: "M", qty: 1 }], [{ ...saree, priceInr: null }], 0)).toThrow(expect.objectContaining({ code: "PRICE_NOT_SET" }));
  });
  it("ignores inactive products", () => {
    expect(() => priceBag([{ slug: "s1", colour: "Red", size: "M", qty: 1 }], [{ ...saree, active: false }], 0)).toThrow(expect.objectContaining({ code: "PRODUCT_NOT_FOUND" }));
  });
});

describe("razorpay signatures", () => {
  const gw = createRazorpayGateway(SECRETS);
  it("accepts a correct payment signature and rejects tampering", () => {
    const sig = hmac(SECRETS.keySecret, "order_1|pay_1");
    expect(gw.verifyPayment("order_1", "pay_1", sig)).toBe(true);
    expect(gw.verifyPayment("order_1", "pay_2", sig)).toBe(false);
    expect(gw.verifyPayment("order_1", "pay_1", "short")).toBe(false);
  });
  it("verifies webhooks over the raw body", () => {
    const raw = Buffer.from('{"event":"payment.captured"}');
    expect(gw.verifyWebhook(raw, hmac(SECRETS.webhookSecret, raw))).toBe(true);
    expect(gw.verifyWebhook(Buffer.from('{"event":"x"}'), hmac(SECRETS.webhookSecret, raw))).toBe(false);
  });
  it("is disabled without keys and never verifies", () => {
    const off = createRazorpayGateway({ keyId: "", keySecret: "", webhookSecret: "" });
    expect(off.enabled).toBe(false);
    expect(off.verifyPayment("a", "b", hmac("", "a|b"))).toBe(false);
    expect(off.verifyWebhook(Buffer.from("x"), hmac("", "x"))).toBe(false);
  });
  it("safeEqualHex handles different lengths", () => expect(safeEqualHex("ab", "abc")).toBe(false));
});

describe("try-on", () => {
  it("sniffs real image types and rejects others", () => {
    expect(sniffImage(JPEG)).toBe("image/jpeg");
    expect(sniffImage(Buffer.from("<html>not an image at all</html>"))).toBeNull();
  });
  const input = { photo: JPEG, photoMime: "image/jpeg", garmentUrl: "https://x/g.jpg", garmentName: "Saree" };
  it("replicate provider returns the output url", async () => {
    const calls: string[] = [];
    const f = (async (url: string) => {
      calls.push(url);
      return calls.length === 1
        ? new Response(JSON.stringify({ id: "p", status: "processing", urls: { get: "https://poll" } }))
        : new Response(JSON.stringify({ id: "p", status: "succeeded", output: ["https://out/img.png"] }));
    }) as unknown as typeof fetch;
    const out = await createReplicateProvider({ token: "t", modelVersion: "v", fetchImpl: f, pollMs: 1 }).run(input);
    expect(out.imageUrl).toBe("https://out/img.png");
  });
  it("maps provider failure to TRYON_FAILED", async () => {
    const f = (async () => new Response(JSON.stringify({ id: "p", status: "failed" }))) as unknown as typeof fetch;
    await expect(createReplicateProvider({ token: "t", modelVersion: "v", fetchImpl: f }).run(input)).rejects.toMatchObject({ code: "TRYON_FAILED" });
  });
});

describe("validation and config", () => {
  const addr = { name: "A", phone: "9999999999", line1: "x", city: "Kolkata", state: "WB", pincode: "700001" };
  it("order body limits quantity and requires a 6-digit pincode", () => {
    const ok = { items: [{ slug: "s", colour: "c", size: "M", qty: 1 }], address: addr, paymentMethod: "cod" };
    expect(createOrderBody.safeParse(ok).success).toBe(true);
    expect(createOrderBody.safeParse({ ...ok, items: [{ slug: "s", colour: "c", size: "M", qty: 11 }] }).success).toBe(false);
    expect(createOrderBody.safeParse({ ...ok, address: { ...addr, pincode: "12" } }).success).toBe(false);
    expect(createOrderBody.safeParse({ ...ok, items: [] }).success).toBe(false);
  });
  it("config rejects a short JWT secret", () => {
    expect(() => loadConfig({ MONGODB_URI: "m", JWT_SECRET: "short" } as NodeJS.ProcessEnv)).toThrow();
  });
});
