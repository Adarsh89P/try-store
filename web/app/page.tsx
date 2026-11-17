import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import TrendingRail from "@/components/TrendingRail";
import { CATEGORIES, products } from "@/lib/products";

// Sarees use a real photo; the other tiles use their tint until you have category photos (TODO).
const TILE_IMAGE: Record<string, string | undefined> = { sarees: products[0].colours[0].image };

export default function HomePage() {
  const olive = products[2].colours[0].image;
  const ombre = products[0].colours[0].image;
  const banarasi = products[1].colours[0].image;

  return (
    <>
      <Header />

      <section
        aria-label="Welcome"
        className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center gap-12 px-5 pb-10 pt-14 sm:px-10"
      >
        <div className="flex min-w-0 flex-[1_1_440px] flex-col items-start gap-6">
          <span className="rounded-full bg-[#ffe3ee] px-3.5 py-1.5 text-[13px] font-bold tracking-[.04em] text-brand-dark">
            NEW IN SAREES
          </span>
          <h1 className="m-0 text-balance font-display text-5xl font-medium leading-[1.05] sm:text-[64px]">
            Find your saree without ever going back.
          </h1>
          <p className="m-0 max-w-[480px] text-pretty text-lg leading-relaxed text-[#4a3340]">
            Browse the whole collection on one page. Drag to the next saree and its colours, photos and sizes follow
            along.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Link
              href="/sarees"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-brand px-8 text-base font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Shop sarees
            </Link>
            <Link
              href="#categories"
              className="inline-flex min-h-14 items-center justify-center rounded-full border-[1.5px] border-brand px-8 text-base font-bold text-brand hover:bg-blush"
            >
              Shop by category
            </Link>
          </div>
        </div>

        <div className="relative h-[560px] max-w-[580px] flex-[1_1_440px]" aria-hidden="true">
          <div className="absolute left-0 top-[60px] h-[360px] w-[36%] overflow-hidden rounded-[20px] bg-white shadow-[0_18px_40px_rgba(43,18,32,.14)]">
            <img src={olive} alt="" className="block h-full w-full object-cover object-top" />
          </div>
          <div className="absolute left-[30%] top-0 z-[2] h-[470px] w-[42%] overflow-hidden rounded-[20px] bg-white shadow-[0_24px_50px_rgba(43,18,32,.2)]">
            <img src={ombre} alt="" className="block h-full w-full object-cover object-top" />
          </div>
          <div className="absolute right-0 top-[130px] h-[400px] w-[36%] overflow-hidden rounded-[20px] bg-white shadow-[0_18px_40px_rgba(43,18,32,.14)]">
            <img src={banarasi} alt="" className="block h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section
        id="categories"
        aria-label="Shop by category"
        className="mx-auto w-full max-w-[1360px] px-5 py-12 sm:px-10"
      >
        <h2 className="mb-6 mt-0 font-display text-4xl font-medium">Shop by category</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="relative block aspect-[4/5] overflow-hidden rounded-[20px] border border-line transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(43,18,32,.14)]"
              style={{ background: c.tint }}
            >
              {TILE_IMAGE[c.id] ? (
                <img src={TILE_IMAGE[c.id]} alt="" className="block h-full w-full object-cover object-top" />
              ) : (
                <span className="absolute left-3 top-3 text-xs font-semibold text-muted">Photo placeholder</span>
              )}
              <span className="absolute bottom-3 left-3 rounded-full bg-white px-4 py-2.5 text-[15px] font-bold">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <TrendingRail />
      <Footer />
    </>
  );
}
