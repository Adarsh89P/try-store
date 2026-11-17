"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Footer from "./Footer";
import Gallery from "./Gallery";
import Header from "./Header";
import { CheckIcon } from "./Icons";
import { useCart, type CartItem } from "@/lib/cart";
import { sizeText, type Product } from "@/lib/products";
import { tryOn, readFile } from "@/lib/tryon";

type Stage = "photo" | "analysing" | "results";

const btnPrimary = "inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-8 text-base font-bold text-white transition-colors hover:bg-brand-dark";
const btnGhost = "inline-flex min-h-[52px] items-center justify-center rounded-full border-[1.5px] border-brand px-7 text-[15px] font-bold text-brand hover:bg-blush";

export default function TryOnView() {
  const { ready, items, remove } = useCart();
  const [stage, setStage] = useState<Stage>("photo");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(0);
  const [removed, setRemoved] = useState("");

  const steps = useMemo(
    () => ["Detecting your face and pose", "Matching skin tone and lighting", ...items.map((i) => `Fitting ${i.product.name}`), "Finishing your preview"],
    // The list is fixed when the analysis starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage === "analysing"],
  );

  const analyse = useCallback(
    async (dataUrl: string) => {
      setPhoto(dataUrl);
      setError("");
      setStep(0);
      setStage("analysing");
      const started = Date.now();
      try {
        const entries = await Promise.all(
          items.map(async (it) => {
            const colour = it.product.colours.find((c) => c.name === it.colour) ?? it.product.colours[0];
            return [it.key, await tryOn(dataUrl, colour.image, it.product.slug, colour.name)] as const;
          }),
        );
        // Keep the analysing screen up long enough to read it.
        const minimum = 700 * (items.length + 3);
        await new Promise((r) => setTimeout(r, Math.max(0, minimum - (Date.now() - started))));
        setResults(Object.fromEntries(entries));
        setActive(0);
        setStage("results");
      } catch {
        setError("We could not use that photo. Try a different one.");
        setStage("photo");
      }
    },
    [items],
  );

  // Advance the progress list while analysing.
  useEffect(() => {
    if (stage !== "analysing") return;
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 700);
    return () => window.clearInterval(id);
  }, [stage, steps.length]);

  const empty = ready && items.length === 0;

  return (
    <>
      <Header />
      <main className="page-enter mx-auto w-full max-w-[1360px] flex-1 px-5 pb-10 pt-8 sm:px-10">
        <h1 className="mb-2 mt-0 font-display text-[40px] font-medium">Virtual try-on</h1>

        {empty ? (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
            <h2 className="m-0 font-display text-[28px] font-medium">Your bag is empty</h2>
            <p className="m-0 text-[#4a3340]">Add something to your bag, then come back to try it on.</p>
            <Link href="/sarees" className={btnPrimary}>Browse sarees</Link>
          </div>
        ) : stage === "photo" ? (
          <PhotoStage count={items.length} error={error} onPhoto={analyse} />
        ) : stage === "analysing" && photo ? (
          <AnalysingStage photo={photo} steps={steps} step={step} />
        ) : (
          <ResultsStage
            items={items}
            results={results}
            active={active}
            setActive={setActive}
            removed={removed}
            onRemove={(it) => {
              remove(it.key);
              setRemoved(`${it.product.name} removed from your bag.`);
            }}
            onRetake={() => setStage("photo")}
          />
        )}
      </main>
      {stage !== "results" && <Footer />}
    </>
  );
}

function PhotoStage({ count, error, onPhoto }: { count: number; error: string; onPhoto: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camera, setCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCamera(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraError("The camera is not available. Choose a photo instead.");
    }
  };

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror so the saved photo matches the preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    onPhoto(url);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    onPhoto(await readFile(file));
  };

  return (
    <section aria-label="Add your photo" className="mt-4 flex flex-wrap items-center gap-10">
      <div className="min-w-0 flex-[1_1_380px]">
        <p className="mt-0 max-w-[520px] text-lg leading-relaxed text-[#4a3340]">
          Take a selfie or choose a photo of yourself and we will preview {count === 1 ? "the item" : `all ${count} items`} in your bag on you.
        </p>
        <ul className="mb-6 ml-5 list-disc space-y-1.5 p-0 text-[15px] text-[#4a3340]">
          <li>Stand in good light, facing the camera.</li>
          <li>Keep your full face and shoulders in the photo.</li>
        </ul>
        {error && <p role="alert" className="mb-4 rounded-xl bg-[#fdecef] px-4 py-3 text-sm font-semibold text-[#8c0f2f]">{error}</p>}
        <div className="flex flex-wrap gap-3.5">
          <button type="button" onClick={startCamera} className={btnPrimary}>Take a selfie</button>
          <button type="button" onClick={() => fileRef.current?.click()} className={btnGhost}>Choose a photo</button>
          <input ref={fileRef} type="file" accept="image/*" capture="user" aria-label="Upload or take a photo" className="sr-only" tabIndex={-1} onChange={onFile} />
        </div>
        {cameraError && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{cameraError}</p>}
        {/* TODO: state where the photo is sent and how long it is kept once the backend exists. */}
        <p className="mb-0 mt-6 max-w-[520px] text-[13px] text-muted">
          Your photo stays on this device and is not uploaded. The preview is simulated until the AI try-on service is connected.
        </p>
      </div>

      <div className="flex-[1_1_320px]">
        {camera ? (
          <div className="mx-auto flex max-w-[380px] flex-col items-center gap-4">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[24px] bg-plum">
              <video ref={videoRef} playsInline muted aria-label="Camera preview" className="h-full w-full -scale-x-100 object-cover" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-6 rounded-[50%/42%] border-2 border-dashed border-white/70" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={snap} className={btnPrimary}>Capture</button>
              <button type="button" onClick={stopCamera} className={btnGhost}>Cancel</button>
            </div>
          </div>
        ) : (
          <div aria-hidden="true" className="mx-auto flex aspect-[3/4] max-w-[380px] items-center justify-center rounded-[24px] border-2 border-dashed border-edge bg-blush text-center text-sm font-semibold text-muted">
            Your photo appears here
          </div>
        )}
      </div>
    </section>
  );
}

function AnalysingStage({ photo, steps, step }: { photo: string; steps: string[]; step: number }) {
  const pct = Math.round(((step + 1) / steps.length) * 100);
  return (
    <section aria-label="Analysing your photo" className="mt-4 flex flex-wrap items-center gap-10">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[380px] flex-[1_1_320px] overflow-hidden rounded-[24px] bg-plum shadow-[0_24px_60px_rgba(214,25,107,.28)]">
        <img src={photo} alt="Your photo" className="h-full w-full object-cover object-top" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,18,32,.15),rgba(214,25,107,.25))]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div aria-hidden="true" className="scan-pulse absolute inset-5 rounded-[50%/42%] border-2 border-white/80" />
        <div aria-hidden="true" className="scan-line absolute left-0 right-0 h-1 bg-[linear-gradient(90deg,transparent,#ff7ab5,#fff,#ff7ab5,transparent)] shadow-[0_0_24px_6px_rgba(255,122,181,.8)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="scan-sweep absolute inset-y-0 w-1/3 bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent)]" />
        </div>
        {(["left-4 top-4 border-l-4 border-t-4", "right-4 top-4 border-r-4 border-t-4", "bottom-4 left-4 border-b-4 border-l-4", "bottom-4 right-4 border-b-4 border-r-4"] as const).map((c) => (
          <span key={c} aria-hidden="true" className={`absolute h-8 w-8 rounded-sm border-white ${c}`} />
        ))}
      </div>

      <div className="min-w-0 max-w-[460px] flex-[1_1_320px]">
        <h2 className="mb-1 mt-0 font-display text-[32px] font-medium">Analysing your photo</h2>
        <p className="mb-6 mt-0 text-[#4a3340]">Fitting everything in your bag. This takes a few seconds.</p>
        <div role="progressbar" aria-label="Analysis progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mb-6 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-live="polite">
          {steps.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 text-[15px] ${i > step ? "text-[#a8949d]" : "text-plum"}`}>
              <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${i < step ? "bg-brand text-white" : i === step ? "scan-pulse border-2 border-brand" : "border-2 border-edge"}`}>
                {i < step && <CheckIcon width={14} height={14} />}
              </span>
              <span className={i === step ? "font-bold" : ""}>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ResultsStage({
  items,
  results,
  active,
  setActive,
  removed,
  onRemove,
  onRetake,
}: {
  items: CartItem[];
  results: Record<string, string>;
  active: number;
  setActive: (i: number) => void;
  removed: string;
  onRemove: (it: CartItem) => void;
  onRetake: () => void;
}) {
  // Each bag line becomes its own card, using the try-on image in place of the product photo.
  const cards = useMemo<Product[]>(
    () =>
      items.map((it) => {
        const colour = it.product.colours.find((c) => c.name === it.colour) ?? it.product.colours[0];
        return { ...it.product, slug: it.key, colours: [{ ...colour, image: results[it.key] ?? colour.image, fit: "cover" as const }] };
      }),
    [items, results],
  );
  const idx = Math.min(active, Math.max(0, items.length - 1));
  const cur = items[idx];

  if (!cur) {
    return (
      <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
        <h2 className="m-0 font-display text-[28px] font-medium">Your bag is empty</h2>
        <p role="status" className="m-0 text-[#4a3340]">{removed}</p>
        <Link href="/sarees" className={btnPrimary}>Browse sarees</Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 mt-0 text-sm text-muted">
        <strong className="text-plum">{idx + 1} of {items.length}</strong> · Drag, swipe or use the arrows to see each item on you. Preview is simulated.
      </p>
      <div className="flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[999_1_600px]">
          <Gallery products={cards} colourIndex={{}} onActiveChange={setActive} />
          <p className="sr-only" aria-live="polite">Showing {cur.product.name}, {idx + 1} of {items.length}</p>
        </div>

        <section aria-label="Item details" className="mt-2 flex min-w-0 max-w-[520px] flex-[1_1_440px] flex-col gap-5 rounded-3xl border border-line bg-white p-8">
          <div>
            <h2 className="m-0 text-balance font-display text-[30px] font-medium leading-[1.15]">{cur.product.name}</h2>
            <p className="mb-0 mt-2 text-[15px] text-muted">
              {[cur.colour, sizeText(cur.product, cur.size), `Qty ${cur.qty}`].filter(Boolean).join(" · ")}
            </p>
          </div>
          <p className="m-0 text-pretty text-[15px] leading-relaxed">{cur.product.blurb}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => onRemove(cur)} className="inline-flex min-h-[52px] items-center justify-center rounded-full border-[1.5px] border-danger px-6 text-[15px] font-bold text-danger hover:bg-[#fdecef]">
              Remove from bag
            </button>
            <button type="button" onClick={onRetake} className={btnGhost}>Use a different photo</button>
          </div>
          <p role="status" className="m-0 min-h-5 text-sm font-semibold text-brand">{removed}</p>
        </section>
      </div>

      <div className="sticky bottom-0 z-40 mt-8 border-t border-line bg-white shadow-[0_-8px_24px_rgba(43,18,32,.06)]">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-1 py-3.5">
          <div className="text-[15px] font-bold">{items.length} {items.length === 1 ? "item" : "items"} in your bag</div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/bag" className={btnGhost}>Back to bag</Link>
            <Link href="/checkout" className={btnPrimary}>Proceed to checkout</Link>
          </div>
        </div>
      </div>
    </>
  );
}
