import { HttpError } from "../errors.js";

export type TryOnInput = { photo: Buffer; photoMime: string; garmentUrl: string; garmentName: string };
export type TryOnResult = { imageUrl?: string; imageDataUrl?: string };
export interface TryOnProvider {
  name: string;
  run(input: TryOnInput): Promise<TryOnResult>;
}

/** Checks the real file type from its first bytes, since the declared type can be faked. */
export function sniffImage(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

/** Returns the customer's own photo. Lets the website and app build the whole flow before a model is chosen. */
export const mockProvider: TryOnProvider = {
  name: "mock",
  async run({ photo, photoMime }) {
    return { imageDataUrl: `data:${photoMime};base64,${photo.toString("base64")}` };
  },
};

export type ReplicateOptions = { token: string; modelVersion: string; fetchImpl?: typeof fetch; pollMs?: number; timeoutMs?: number };

/**
 * Calls a virtual try-on model hosted on Replicate.
 * TODO: the input field names below (human_img, garm_img, garment_des) follow the common IDM-VTON layout.
 * Check them against the model you choose and set TRYON_MODEL_VERSION to its version id.
 */
export function createReplicateProvider(o: ReplicateOptions): TryOnProvider {
  const f = o.fetchImpl ?? fetch;
  const headers = { Authorization: `Bearer ${o.token}`, "Content-Type": "application/json" };
  return {
    name: "replicate",
    async run({ photo, photoMime, garmentUrl, garmentName }) {
      const create = await f("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: { ...headers, Prefer: "wait=30" },
        body: JSON.stringify({
          version: o.modelVersion,
          input: { human_img: `data:${photoMime};base64,${photo.toString("base64")}`, garm_img: garmentUrl, garment_des: garmentName },
        }),
      });
      if (!create.ok) throw new HttpError(502, "TRYON_FAILED", "The try-on service could not process this photo");
      let pred = (await create.json()) as { id: string; status: string; output?: unknown; urls?: { get: string } };
      const deadline = Date.now() + (o.timeoutMs ?? 90_000);
      while (pred.status === "starting" || pred.status === "processing") {
        if (Date.now() > deadline || !pred.urls?.get) throw new HttpError(504, "TRYON_TIMEOUT", "The try-on took too long. Try again.");
        await new Promise((r) => setTimeout(r, o.pollMs ?? 1500));
        const poll = await f(pred.urls.get, { headers });
        if (!poll.ok) throw new HttpError(502, "TRYON_FAILED", "The try-on service could not process this photo");
        pred = (await poll.json()) as typeof pred;
      }
      if (pred.status !== "succeeded") throw new HttpError(502, "TRYON_FAILED", "The try-on service could not process this photo");
      const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      if (typeof out !== "string") throw new HttpError(502, "TRYON_FAILED", "The try-on service returned no image");
      return { imageUrl: out };
    },
  };
}
