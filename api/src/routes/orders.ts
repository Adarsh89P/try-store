import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { HttpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { priceBag } from "../lib/pricing.js";
import type { PaymentGateway } from "../lib/razorpay.js";
import type { Config } from "../config.js";

const addressBody = z.object({
  name: z.string().min(1), phone: z.string().regex(/^[0-9+\- ]{7,15}$/),
  line1: z.string().min(1), line2: z.string().default(""),
  city: z.string().min(1), state: z.string().min(1), pincode: z.string().regex(/^[0-9]{6}$/),
});
export const createOrderBody = z.object({
  items: z.array(z.object({
    slug: z.string(), colour: z.string(), size: z.string(), qty: z.number().int().min(1).max(10),
  })).min(1).max(50),
  address: addressBody,
  email: z.string().email().optional(),
  paymentMethod: z.enum(["cod", "online"]),
});
const verifyBody = z.object({
  razorpayOrderId: z.string(), razorpayPaymentId: z.string(), razorpaySignature: z.string(),
});

const newOrderId = () => `SS-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

type OrderLike = { toObject(): Record<string, unknown> };
/** Hides the guest token unless it is being handed to the creator. */
const present = (o: OrderLike, withToken = false) => {
  const { guestToken, __v, ...rest } = o.toObject() as Record<string, unknown>;
  void __v;
  return withToken ? { ...rest, guestToken } : rest;
};

export function orderRoutes(cfg: Config, gateway: PaymentGateway) {
  const r = Router();

  r.post("/", async (req, res) => {
    const b = createOrderBody.parse(req.body);
    let email = b.email;
    if (req.auth) {
      const u = await User.findById(req.auth.id).lean();
      email = u?.email ?? email;
    }
    if (!email) throw new HttpError(400, "EMAIL_REQUIRED", "An email is needed for the order");
    if (b.paymentMethod === "online" && !gateway.enabled) throw new HttpError(503, "PAYMENTS_DISABLED", "Online payment is not set up");

    const products = await Product.find({ slug: { $in: b.items.map((i) => i.slug) } }).lean();
    const priced = priceBag(b.items, products, cfg.DELIVERY_FEE_INR);

    const orderId = newOrderId();
    const guestToken = req.auth ? undefined : crypto.randomBytes(24).toString("hex");
    let razorpayOrderId: string | undefined;
    if (b.paymentMethod === "online") {
      razorpayOrderId = (await gateway.createOrder(priced.totalInr * 100, orderId)).id;
    }
    const order = await Order.create({
      orderId, user: req.auth?.id, guestToken, email,
      items: priced.lines, address: b.address,
      payment: { method: b.paymentMethod, status: "pending", razorpayOrderId },
      subtotalInr: priced.subtotalInr, deliveryInr: priced.deliveryInr, totalInr: priced.totalInr,
    });
    res.status(201).json({
      order: present(order, true),
      ...(razorpayOrderId ? { payment: { keyId: gateway.keyId, razorpayOrderId, amountPaise: priced.totalInr * 100, currency: "INR" } } : {}),
    });
  });

  r.get("/mine", requireAuth, async (req, res) => {
    const orders = await Order.find({ user: req.auth!.id }).sort({ createdAt: -1 });
    res.json({ orders: orders.map((o) => present(o)) });
  });

  async function loadOwned(req: import("express").Request) {
    const o = await Order.findOne({ orderId: req.params.id });
    if (!o) throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
    const owner = !!req.auth && !!o.user && String(o.user) === req.auth.id;
    const token = req.header("x-order-token");
    const guest = !!o.guestToken && !!token && token.length === o.guestToken.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(o.guestToken));
    // Admins can look up any order; everyone else needs ownership. 404 keeps order ids private.
    if (!owner && !guest && req.auth?.role !== "admin") throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
    return o;
  }

  r.get("/:id", async (req, res) => {
    res.json({ order: present(await loadOwned(req)) });
  });

  // Called by the checkout page after Razorpay returns. The webhook is the backup if the customer closes the tab.
  r.post("/:id/verify", async (req, res) => {
    const b = verifyBody.parse(req.body);
    const o = await loadOwned(req);
    if (o.payment?.method !== "online" || o.payment.razorpayOrderId !== b.razorpayOrderId) throw new HttpError(400, "PAYMENT_MISMATCH", "This payment does not belong to the order");
    if (!gateway.verifyPayment(b.razorpayOrderId, b.razorpayPaymentId, b.razorpaySignature)) {
      throw new HttpError(400, "BAD_SIGNATURE", "Payment could not be verified");
    }
    o.payment.status = "paid";
    o.payment.razorpayPaymentId = b.razorpayPaymentId;
    if (o.status === "placed") o.status = "confirmed";
    await o.save();
    res.json({ order: present(o) });
  });

  return r;
}
