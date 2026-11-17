import express from "express";
import helmet from "helmet";
import cors from "cors";
import type { Config } from "./config.js";
import { errorHandler, notFound } from "./lib/errors.js";
import { optionalAuth } from "./lib/auth.js";
import type { PaymentGateway } from "./lib/razorpay.js";
import type { TryOnProvider } from "./lib/tryon/index.js";
import { authRoutes } from "./routes/auth.js";
import { productRoutes } from "./routes/products.js";
import { meRoutes } from "./routes/me.js";
import { orderRoutes } from "./routes/orders.js";
import { webhookRoutes } from "./routes/webhook.js";
import { tryonRoutes } from "./routes/tryon.js";

export type Deps = { cfg: Config; gateway: PaymentGateway; tryon: TryOnProvider };

export function createApp({ cfg, gateway, tryon }: Deps) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: cfg.corsOrigins.length ? cfg.corsOrigins : false, allowedHeaders: ["Content-Type", "Authorization", "x-order-token"] }));

  // Raw-body webhook first, before the JSON parser.
  app.use("/api/webhooks", webhookRoutes(gateway));
  app.use(express.json({ limit: "100kb" }));
  app.use(optionalAuth(cfg.JWT_SECRET));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRoutes(cfg));
  app.use("/api/products", productRoutes());
  app.use("/api/me", meRoutes());
  app.use("/api/orders", orderRoutes(cfg, gateway));
  app.use("/api/tryon", tryonRoutes(cfg, tryon));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
