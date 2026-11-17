import { api, apiEnabled } from "./api";

/**
 * Virtual try-on. With NEXT_PUBLIC_API_URL set, the photo goes to the API (`tryOn`); otherwise
 * `composeTryOn` places the product photo next to the customer's photo as a stand-in.
 */
export async function tryOn(selfieDataUrl: string, productUrl: string, slug: string, colour: string): Promise<string> {
  if (!apiEnabled) return composeTryOn(selfieDataUrl, productUrl);
  const blob = await (await fetch(selfieDataUrl)).blob();
  const form = new FormData();
  form.append("photo", blob, "photo");
  form.append("slug", slug);
  form.append("colour", colour);
  const r = await api<{ imageUrl?: string; imageDataUrl?: string }>("/api/tryon", { form });
  const out = r.imageUrl ?? r.imageDataUrl;
  if (!out) throw new Error("No image came back");
  return out;
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = src;
  });
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) * 0.3, dw, dh);
}

export async function composeTryOn(selfieUrl: string, productUrl: string): Promise<string> {
  const [selfie, product] = await Promise.all([load(selfieUrl), load(productUrl)]);
  const W = 680;
  const H = 1040;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  cover(ctx, selfie, 0, 0, W, H);

  // Product photo as an inset so the customer can compare it with their own photo.
  const iw = 230;
  const ih = 310;
  const x = 44;
  const y = H - ih - 44;
  ctx.save();
  ctx.shadowColor = "rgba(43,18,32,.35)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(x - 8, y - 8, iw + 16, ih + 16, 22);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, iw, ih, 16);
  ctx.clip();
  cover(ctx, product, x, y, iw, ih);
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.88);
}

/** Reads a chosen file as a data URL. */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read that file"));
    r.readAsDataURL(file);
  });
}
