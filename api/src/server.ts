import { loadConfig } from "./config.js";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";
import { createRazorpayGateway } from "./lib/razorpay.js";
import { createReplicateProvider, mockProvider } from "./lib/tryon/index.js";

const cfg = loadConfig();
if (cfg.TRYON_PROVIDER === "replicate" && !(cfg.REPLICATE_API_TOKEN && cfg.TRYON_MODEL_VERSION)) {
  throw new Error("TRYON_PROVIDER=replicate needs REPLICATE_API_TOKEN and TRYON_MODEL_VERSION");
}
const tryon = cfg.TRYON_PROVIDER === "replicate"
  ? createReplicateProvider({ token: cfg.REPLICATE_API_TOKEN, modelVersion: cfg.TRYON_MODEL_VERSION })
  : mockProvider;
const gateway = createRazorpayGateway({ keyId: cfg.RAZORPAY_KEY_ID, keySecret: cfg.RAZORPAY_KEY_SECRET, webhookSecret: cfg.RAZORPAY_WEBHOOK_SECRET });

await connectDb(cfg.MONGODB_URI);
createApp({ cfg, gateway, tryon }).listen(cfg.PORT, () => console.log(`API on :${cfg.PORT} (payments ${gateway.enabled ? "on" : "off"}, try-on ${tryon.name})`));
