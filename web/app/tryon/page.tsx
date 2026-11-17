import type { Metadata } from "next";
import TryOnView from "@/components/TryOnView";

export const metadata: Metadata = { title: "Virtual try-on | [YOUR STORE]" };

export default function TryOnPage() {
  return <TryOnView />;
}
