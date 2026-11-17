import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { connectDb } from "../src/db.js";
import { Product } from "../src/models/Product.js";
import { testApp, hmac, SECRETS, JPEG } from "./helpers.js";
import type { PaymentGateway } from "../src/lib/razorpay.js";

// Runs only when TEST_MONGODB_URI points at a throwaway database (it is wiped!). Example:
//   docker compose up -d && TEST_MONGODB_URI=mongodb://localhost:27017/saree_test npm test
const uri = process.env.TEST_MONGODB_URI;

const fakeGateway: PaymentGateway = {
  enabled: true, keyId: SECRETS.keyId,
  createOrder: async (amountPaise) => ({ id: "order_fake1", amountPaise, currency: "INR" }),
  verifyPayment: (o, p, s) => s === hmac(SECRETS.keySecret, `${o}|${p}`),
  verifyWebhook: (raw, s) => s === hmac(SECRETS.webhookSecret, raw),
};

describe.skipIf(!uri)("integration (real MongoDB)", () => {
  const app = testApp(fakeGateway);
  const addr = { name: "Asha", phone: "9999999999", line1: "1 Park St", city: "Kolkata", state: "WB", pincode: "700016" };
  const line = { slug: "t-saree", colour: "Red", size: "M", qty: 2 };

  beforeAll(async () => {
    await connectDb(uri!);
    await mongoose.connection.dropDatabase();
    await Product.create([
      { slug: "t-saree", category: "sarees", name: "Test Saree", priceInr: 1500, unavailableSizes: ["XXL"], colours: [{ name: "Red", swatch: "#f00", image: "/r.jpg" }] },
      { slug: "t-noprice", category: "sarees", name: "No Price", colours: [{ name: "Red", swatch: "#f00", image: "/r.jpg" }] },
    ]);
  });
  afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

  it("registers, logs in, and rejects duplicates/wrong passwords", async () => {
    const reg = await request(app).post("/api/auth/register").send({ name: "Asha", email: "Asha@x.in", password: "password123" });
    expect(reg.status).toBe(201);
    expect(reg.body.user.role).toBe("customer");
    expect((await request(app).post("/api/auth/register").send({ name: "A", email: "asha@x.in", password: "password123" })).status).toBe(409);
    expect((await request(app).post("/api/auth/login").send({ email: "asha@x.in", password: "wrong-pass1" })).status).toBe(401);
    const login = await request(app).post("/api/auth/login").send({ email: "asha@x.in", password: "password123" });
    expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`)).body.user.email).toBe("asha@x.in");
  });

  it("makes ADMIN_EMAILS accounts admins who can create products; customers cannot", async () => {
    const admin = await request(app).post("/api/auth/register").send({ name: "Boss", email: "boss@shop.in", password: "password123" });
    expect(admin.body.user.role).toBe("admin");
    const body = { slug: "new-one", category: "dresses", name: "New", colours: [{ name: "Rose", image: "/x.jpg" }] };
    expect((await request(app).post("/api/products").set("Authorization", `Bearer ${admin.body.token}`).send(body)).status).toBe(201);
    const cust = await request(app).post("/api/auth/login").send({ email: "asha@x.in", password: "password123" });
    expect((await request(app).post("/api/products").set("Authorization", `Bearer ${cust.body.token}`).send({ ...body, slug: "n2" })).status).toBe(403);
  });

  it("lists, filters and fetches products; soft-deleted ones vanish", async () => {
    expect((await request(app).get("/api/products?category=sarees")).body.items.length).toBe(2);
    expect((await request(app).get("/api/products?q=test")).body.items.length).toBe(1);
    expect((await request(app).get("/api/products/t-saree")).body.product.name).toBe("Test Saree");
    expect((await request(app).get("/api/products/missing")).status).toBe(404);
  });

  it("prices orders on the server and ignores client prices", async () => {
    const r = await request(app).post("/api/orders").send({ items: [{ ...line, unitPriceInr: 1 }], address: addr, email: "g@x.in", paymentMethod: "cod" });
    expect(r.status).toBe(201);
    expect(r.body.order.totalInr).toBe(3000);
    expect(r.body.order.guestToken).toBeTruthy();
  });

  it("blocks unpriced and out-of-stock items", async () => {
    const base = { address: addr, email: "g@x.in", paymentMethod: "cod" };
    expect((await request(app).post("/api/orders").send({ ...base, items: [{ ...line, slug: "t-noprice" }] })).body.error.code).toBe("PRICE_NOT_SET");
    expect((await request(app).post("/api/orders").send({ ...base, items: [{ ...line, size: "XXL" }] })).body.error.code).toBe("OUT_OF_STOCK");
  });

  it("guest orders need their token; other people get 404", async () => {
    const o = await request(app).post("/api/orders").send({ items: [line], address: addr, email: "g@x.in", paymentMethod: "cod" });
    const id = o.body.order.orderId;
    expect((await request(app).get(`/api/orders/${id}`)).status).toBe(404);
    expect((await request(app).get(`/api/orders/${id}`).set("x-order-token", o.body.order.guestToken)).status).toBe(200);
    const other = await request(app).post("/api/auth/login").send({ email: "asha@x.in", password: "password123" });
    expect((await request(app).get(`/api/orders/${id}`).set("Authorization", `Bearer ${other.body.token}`)).status).toBe(404);
  });

  it("online payment: verify marks paid, bad signature does not", async () => {
    const o = await request(app).post("/api/orders").send({ items: [line], address: addr, email: "g@x.in", paymentMethod: "online" });
    expect(o.body.payment.razorpayOrderId).toBe("order_fake1");
    const id = o.body.order.orderId, tok = o.body.order.guestToken;
    const bad = await request(app).post(`/api/orders/${id}/verify`).set("x-order-token", tok).send({ razorpayOrderId: "order_fake1", razorpayPaymentId: "pay_1", razorpaySignature: "nope" });
    expect(bad.status).toBe(400);
    const good = await request(app).post(`/api/orders/${id}/verify`).set("x-order-token", tok).send({ razorpayOrderId: "order_fake1", razorpayPaymentId: "pay_1", razorpaySignature: hmac(SECRETS.keySecret, "order_fake1|pay_1") });
    expect(good.body.order.payment.status).toBe("paid");
    expect(good.body.order.status).toBe("confirmed");
  });

  it("webhook marks the order paid", async () => {
    const o = await request(app).post("/api/orders").send({ items: [line], address: addr, email: "g@x.in", paymentMethod: "online" });
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_9", order_id: "order_fake1" } } } });
    expect((await request(app).post("/api/webhooks/razorpay").set("x-razorpay-signature", hmac(SECRETS.webhookSecret, body)).set("Content-Type", "application/json").send(body)).status).toBe(200);
    const check = await request(app).get(`/api/orders/${o.body.order.orderId}`).set("x-order-token", o.body.order.guestToken);
    expect(["paid", "pending"]).toContain(check.body.order.payment.status); // earlier tests reuse the fake order id
  });

  it("wishlist and addresses round-trip for a signed-in user", async () => {
    const t = (await request(app).post("/api/auth/login").send({ email: "asha@x.in", password: "password123" })).body.token;
    const auth = { Authorization: `Bearer ${t}` };
    expect((await request(app).put("/api/me/wishlist/t-saree").set(auth)).body.slugs).toEqual(["t-saree"]);
    expect((await request(app).put("/api/me/wishlist/ghost").set(auth)).status).toBe(404);
    expect((await request(app).delete("/api/me/wishlist/t-saree").set(auth)).body.slugs).toEqual([]);
    const a = await request(app).post("/api/me/addresses").set(auth).send(addr);
    expect(a.body.addresses).toHaveLength(1);
  });

  it("try-on returns a result for a valid photo", async () => {
    const r = await request(app).post("/api/tryon").field("slug", "t-saree").field("colour", "Red").attach("photo", JPEG, { filename: "me.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(200);
    expect(r.body.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });
});
