import crypto from "node:crypto";
import { loadConfig } from "../src/config.js";
import { createApp } from "../src/app.js";
import { createRazorpayGateway, type PaymentGateway } from "../src/lib/razorpay.js";
import { mockProvider } from "../src/lib/tryon/index.js";

export const SECRETS = { keyId: "rzp_test_x", keySecret: "key_secret_test", webhookSecret: "whsec_test" };
export const hmac = (secret: string, d: string | Buffer) => crypto.createHmac("sha256", secret).update(d).digest("hex");

export const testConfig = () =>
  loadConfig({ MONGODB_URI: "mongodb://localhost:27017/test", JWT_SECRET: "x".repeat(40), ADMIN_EMAILS: "boss@shop.in", DELIVERY_FEE_INR: "0" } as NodeJS.ProcessEnv);

export function testApp(gateway?: PaymentGateway) {
  const cfg = testConfig();
  const gw = gateway ?? createRazorpayGateway({ keyId: SECRETS.keyId, keySecret: SECRETS.keySecret, webhookSecret: SECRETS.webhookSecret });
  return createApp({ cfg, gateway: gw, tryon: mockProvider });
}

export const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 1)]);
