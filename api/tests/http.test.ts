import { describe, expect, it } from "vitest";
import request from "supertest";
import { testApp, hmac, SECRETS, JPEG } from "./helpers.js";

// These requests are all rejected before any database call, so they run without MongoDB.
const app = testApp();

describe("HTTP (no database needed)", () => {
  it("health", async () => {
    const r = await request(app).get("/api/health");
    expect(r.body).toEqual({ ok: true });
    expect(r.headers["x-powered-by"]).toBeUndefined();
  });
  it("unknown route gives the error shape", async () => {
    const r = await request(app).get("/api/nope");
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("NOT_FOUND");
  });
  it("register validates input", async () => {
    const r = await request(app).post("/api/auth/register").send({ email: "bad", password: "123" });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION");
  });
  it("bad JSON is a 400", async () => {
    const r = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{oops");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("BAD_JSON");
  });
  it("protected routes need a token", async () => {
    expect((await request(app).get("/api/me/wishlist")).status).toBe(401);
    expect((await request(app).get("/api/orders/mine")).status).toBe(401);
  });
  it("admin routes reject anonymous and a garbage token", async () => {
    expect((await request(app).post("/api/products").send({})).status).toBe(401);
    expect((await request(app).post("/api/products").set("Authorization", "Bearer junk").send({})).status).toBe(401);
  });
  it("order creation validates before touching anything", async () => {
    const r = await request(app).post("/api/orders").send({ items: [], paymentMethod: "cod" });
    expect(r.status).toBe(400);
  });
  it("webhook rejects a bad signature and accepts a good one for unrelated events", async () => {
    const body = JSON.stringify({ event: "payment.authorized" });
    expect((await request(app).post("/api/webhooks/razorpay").set("x-razorpay-signature", "bad").set("Content-Type", "application/json").send(body)).status).toBe(400);
    const ok = await request(app).post("/api/webhooks/razorpay").set("x-razorpay-signature", hmac(SECRETS.webhookSecret, body)).set("Content-Type", "application/json").send(body);
    expect(ok.status).toBe(200);
  });
  it("try-on requires a photo, and checks the real file type", async () => {
    expect((await request(app).post("/api/tryon").field("slug", "s1")).body.error.code).toBe("PHOTO_REQUIRED");
    const fake = await request(app).post("/api/tryon").field("slug", "s1").attach("photo", Buffer.from("<script>alert(1)</script>"), { filename: "a.jpg", contentType: "image/jpeg" });
    expect(fake.status).toBe(415);
  });
  it("try-on rejects photos over 5 MB", async () => {
    const big = Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024 + 10)]);
    const r = await request(app).post("/api/tryon").field("slug", "s1").attach("photo", big, { filename: "a.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(413);
  });
});
