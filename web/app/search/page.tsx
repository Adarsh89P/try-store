import type { Metadata } from "next";
import { Suspense } from "react";
import SearchView from "@/components/SearchView";

export const metadata: Metadata = { title: "Search | [YOUR STORE]" };

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchView />
    </Suspense>
  );
}
