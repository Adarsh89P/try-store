// Stand-in API for previews and front-end tests when MongoDB is not available.
// Same routes and response shapes as the real API, but data lives in memory and resets on restart.
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import multer from "multer";

const PORT = Number(process.env.PORT ?? 4100);
const KEY_SECRET = "mock_secret";
const hmac = (d: string) => crypto.createHmac("sha256", KEY_SECRET).update(d).digest("hex");

type U = { id: string; name: string; email: string; password: string; addresses: Record<string, unknown>[] };
const users = new Map<string, U>();
const orders: Record<string, any>[] = [];
const err = (res: express.Response, status: number, code: string, message: string) => res.status(status).json({ error: { code, message } });

const app = express();
app.use(cors({ allowedHeaders: ["Content-Type", "Authorization", "x-order-token"], methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] }));
app.use(express.json());
const who = (req: express.Request) => users.get((req.headers.authorization ?? "").replace("Bearer ", ""));

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !/^\S+@\S+\.\S+$/.test(email ?? "") || (password ?? "").length < 8) return err(res, 400, "VALIDATION", "Invalid request");
  if ([...users.values()].some((u) => u.email === email.toLowerCase())) return err(res, 409, "EMAIL_TAKEN", "An account with this email already exists");
  const u: U = { id: crypto.randomUUID(), name, email: email.toLowerCase(), password, addresses: [] };
  users.set(u.id, u); // the token is simply the user id here
  res.status(201).json({ token: u.id, user: { id: u.id, name, email: u.email, role: "customer" } });
});
app.post("/api/auth/login", (req, res) => {
  const u = [...users.values()].find((x) => x.email === String(req.body?.email ?? "").toLowerCase());
  if (!u || u.password !== req.body?.password) return err(res, 401, "BAD_CREDENTIALS", "Email or password is wrong");
  res.json({ token: u.id, user: { id: u.id, name: u.name, email: u.email, role: "customer" } });
});
app.get("/api/auth/me", (req, res) => { const u = who(req); u ? res.json({ user: { id: u.id, name: u.name, email: u.email, role: "customer" } }) : err(res, 401, "UNAUTHENTICATED", "Please sign in"); });

app.get("/api/me/addresses", (req, res) => { const u = who(req); u ? res.json({ addresses: u.addresses }) : err(res, 401, "UNAUTHENTICATED", "Please sign in"); });
app.post("/api/me/addresses", (req, res) => { const u = who(req); if (!u) return err(res, 401, "UNAUTHENTICATED", "Please sign in"); u.addresses.push({ _id: crypto.randomUUID(), ...req.body }); res.status(201).json({ addresses: u.addresses }); });
app.delete("/api/me/addresses/:id", (req, res) => { const u = who(req); if (!u) return err(res, 401, "UNAUTHENTICATED", "Please sign in"); u.addresses = u.addresses.filter((a) => a._id !== req.params.id); res.json({ addresses: u.addresses }); });

app.post("/api/orders", (req, res) => {
  const u = who(req);
  const b = req.body ?? {};
  const email = u?.email ?? b.email;
  if (!email) return err(res, 400, "EMAIL_REQUIRED", "An email is needed for the order");
  if (!Array.isArray(b.items) || !b.items.length || !b.address) return err(res, 400, "VALIDATION", "Invalid request");
  const orderId = `SS-${Date.now().toString(36).toUpperCase()}`;
  const guestToken = u ? undefined : crypto.randomBytes(8).toString("hex");
  const razorpayOrderId = b.paymentMethod === "online" ? `order_${crypto.randomBytes(5).toString("hex")}` : undefined;
  const o = {
    orderId, user: u?.id, guestToken, email, createdAt: new Date().toISOString(), status: "placed",
    items: b.items.map((i: any) => ({ ...i, name: String(i.slug).split("-").map((w: string) => w[0]!.toUpperCase() + w.slice(1)).join(" "), image: "/products/saree-1.jpg", unitPriceInr: 0 })),
    address: b.address, payment: { method: b.paymentMethod, status: "pending", razorpayOrderId },
  };
  orders.push(o);
  res.status(201).json({ order: o, ...(razorpayOrderId ? { payment: { keyId: "rzp_test_mock", razorpayOrderId, amountPaise: 100, currency: "INR" } } : {}) });
});
app.get("/api/orders/mine", (req, res) => { const u = who(req); u ? res.json({ orders: orders.filter((o) => o.user === u.id).reverse() }) : err(res, 401, "UNAUTHENTICATED", "Please sign in"); });
app.post("/api/orders/:id/verify", (req, res) => {
  const o = orders.find((x) => x.orderId === req.params.id);
  const b = req.body ?? {};
  if (!o) return err(res, 404, "ORDER_NOT_FOUND", "Order not found");
  if (b.razorpaySignature !== hmac(`${b.razorpayOrderId}|${b.razorpayPaymentId}`)) return err(res, 400, "BAD_SIGNATURE", "Payment could not be verified");
  o.payment.status = "paid"; o.status = "confirmed";
  res.json({ order: o });
});

const upload = multer({ storage: multer.memoryStorage() });
app.post("/api/tryon", upload.single("photo"), (req, res) => {
  if (!req.file) return err(res, 400, "PHOTO_REQUIRED", "Add a photo to try on");
  res.json({ provider: "mock", imageDataUrl: `data:image/jpeg;base64,${req.file.buffer.toString("base64")}` });
});

// Test helper: the signature a real Razorpay checkout would return.
app.get("/__sign", (req, res) => res.json({ signature: hmac(`${req.query.o}|${req.query.p}`) }));

app.listen(PORT, () => console.log(`mock API on :${PORT}`));
