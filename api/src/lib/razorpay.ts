import crypto from "node:crypto";
import Razorpay from "razorpay";
import { HttpError } from "./errors.js";

export type GatewayOrder = { id: string; amountPaise: number; currency: "INR" };

/** The part of Razorpay this API uses. Tests replace it with a fake. */
export interface PaymentGateway {
  enabled: boolean;
  keyId: string;
  createOrder(amountPaise: number, receipt: string): Promise<GatewayOrder>;
  verifyPayment(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhook(rawBody: Buffer, signature: string): boolean;
}

function hmac(secret: string, data: string | Buffer): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function createRazorpayGateway(opts: { keyId: string; keySecret: string; webhookSecret: string }): PaymentGateway {
  const enabled = !!(opts.keyId && opts.keySecret);
  const client = enabled ? new Razorpay({ key_id: opts.keyId, key_secret: opts.keySecret }) : null;
  return {
    enabled,
    keyId: opts.keyId,
    async createOrder(amountPaise, receipt) {
      if (!client) throw new HttpError(503, "PAYMENTS_DISABLED", "Online payment is not set up");
      const o = await client.orders.create({ amount: amountPaise, currency: "INR", receipt });
      return { id: String(o.id), amountPaise, currency: "INR" };
    },
    // Razorpay signs "<order_id>|<payment_id>" with the key secret.
    verifyPayment: (orderId, paymentId, signature) => enabled && safeEqualHex(hmac(opts.keySecret, `${orderId}|${paymentId}`), signature),
    // Webhooks are signed over the raw request body with the webhook secret.
    verifyWebhook: (raw, signature) => !!opts.webhookSecret && safeEqualHex(hmac(opts.webhookSecret, raw), signature),
  };
}
