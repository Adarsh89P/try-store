import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ADMIN_EMAILS: z.string().default(""),
  CORS_ORIGINS: z.string().default(""),
  ASSET_BASE_URL: z.string().default(""),
  DELIVERY_FEE_INR: z.coerce.number().int().min(0).default(0),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
  TRYON_PROVIDER: z.enum(["mock", "replicate"]).default("mock"),
  REPLICATE_API_TOKEN: z.string().default(""),
  TRYON_MODEL_VERSION: z.string().default(""),
});

export type Config = z.infer<typeof schema> & { adminEmails: string[]; corsOrigins: string[] };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.parse(env);
  const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  return { ...parsed, adminEmails: list(parsed.ADMIN_EMAILS).map((e) => e.toLowerCase()), corsOrigins: list(parsed.CORS_ORIGINS) };
}
