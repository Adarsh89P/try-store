import express, { Router } from "express";
import { Order } from "../models/Order.js";
import { HttpError } from "../lib/errors.js";
import type { PaymentGateway } from "../lib/razorpay.js";

type Event = { event: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };

/** Must be mounted before express.json(): the signature covers the raw bytes. */
export function webhookRoutes(gateway: PaymentGateway) {
  const r = Router();
  r.post("/razorpay", express.raw({ type: "*/*", limit: "1mb" }), async (req, res) => {
    const sig = req.header("x-razorpay-signature") ?? "";
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!gateway.verifyWebhook(raw, sig)) throw new HttpError(400, "BAD_SIGNATURE", "Invalid signature");
    let ev: Event;
    try { ev = JSON.parse(raw.toString("utf8")) as Event; } catch { throw new HttpError(400, "BAD_JSON", "Invalid body"); }
    const p = ev.payload?.payment?.entity;
    if (p?.order_id) {
      if (ev.event === "payment.captured" || ev.event === "order.paid") {
        const o = await Order.findOne({ "payment.razorpayOrderId": p.order_id });
        if (o && o.payment) {
          o.payment.status = "paid";
          if (p.id) o.payment.razorpayPaymentId = p.id;
          if (o.status === "placed") o.status = "confirmed";
          await o.save();
        }
      } else if (ev.event === "payment.failed") {
        // Only mark failed if it was not already paid (a retry may succeed).
        await Order.updateOne({ "payment.razorpayOrderId": p.order_id, "payment.status": "pending" }, { "payment.status": "failed" });
      }
    }
    res.json({ ok: true });
  });
  return r;
}
