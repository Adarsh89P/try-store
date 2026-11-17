"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import ProductCard from "./ProductCard";
import { CATEGORIES, products, type CategoryId } from "@/lib/products";

const chip = (on: boolean) =>
  `inline-flex min-h-11 items-center rounded-full border-[1.5px] px-4 text-sm font-semibold ${
    on ? "border-brand bg-brand text-white" : "border-edge bg-white text-plum hover:border-brand"
  }`;

export default function SearchView() {
  const q = (useSearchParams().get("q") ?? "").trim();
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [colour, setColour] = useState<string>("");
  const [size, setSize] = useState<string>("");

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  // Matches every word of the search against name, description, category and colour names.
  const matches = useMemo(
    () =>
      products.filter((p) => {
        const cat = CATEGORIES.find((c) => c.id === p.category);
        const hay = [p.name, p.blurb, cat?.label, ...p.colours.map((c) => c.name)].join(" ").toLowerCase();
        return tokens.every((t) => hay.includes(t));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  );

  const colourNames = useMemo(() => [...new Set(matches.flatMap((p) => p.colours.map((c) => c.name)))], [matches]);
  const sizeNames = useMemo(
    () => [...new Set(matches.flatMap((p) => CATEGORIES.find((c) => c.id === p.category)?.sizes ?? []))],
    [matches],
  );
  const categoryIds = useMemo(() => new Set(matches.map((p) => p.category)), [matches]);

  const shown = matches.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (!colour || p.colours.some((c) => c.name === colour)) &&
      (!size || (CATEGORIES.find((c) => c.id === p.category)?.sizes.includes(size) && !p.unavailableSizes.includes(size))),
  );

  return (
    <>
      <Header />
      <main className="page-enter mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-8 sm:px-10">
        <h1 className="mb-2 mt-0 font-display text-[40px] font-medium">{q ? `Results for “${q}”` : "Search"}</h1>
        <p className="mb-6 mt-0 text-muted" aria-live="polite">
          {q ? `${shown.length} ${shown.length === 1 ? "product" : "products"}` : "Type in the search box above to find sarees, dresses, earrings and more."}
        </p>

        {q && matches.length > 0 && (
          <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-line bg-white p-5">
            <FilterRow label="Category">
              <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")} className={chip(category === "all")}>All</button>
              {CATEGORIES.filter((c) => categoryIds.has(c.id)).map((c) => (
                <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)} className={chip(category === c.id)}>
                  {c.label}
                </button>
              ))}
            </FilterRow>
            <FilterRow label="Colour">
              <button type="button" aria-pressed={colour === ""} onClick={() => setColour("")} className={chip(colour === "")}>Any</button>
              {colourNames.map((n) => (
                <button key={n} type="button" aria-pressed={colour === n} onClick={() => setColour(n)} className={chip(colour === n)}>
                  {n}
                </button>
              ))}
            </FilterRow>
            {sizeNames.length > 0 && (
              <FilterRow label="Size in stock">
                <button type="button" aria-pressed={size === ""} onClick={() => setSize("")} className={chip(size === "")}>Any</button>
                {sizeNames.map((n) => (
                  <button key={n} type="button" aria-pressed={size === n} onClick={() => setSize(n)} className={chip(size === n)}>
                    {n}
                  </button>
                ))}
              </FilterRow>
            )}
          </div>
        )}

        {q && shown.length === 0 ? (
          <div className="rounded-3xl border border-line bg-white px-6 py-14 text-center">
            <h2 className="m-0 font-display text-[28px] font-medium">No products found</h2>
            <p className="mt-2 text-[#4a3340]">Try a different word, or clear the filters.</p>
          </div>
        ) : (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-6 p-0">
            {shown.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="w-28 text-[13px] font-semibold uppercase tracking-[.04em] text-muted">{label}</span>
      {children}
    </div>
  );
}
