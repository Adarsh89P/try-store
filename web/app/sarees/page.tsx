import type { Metadata } from "next";
import Header from "@/components/Header";
import ProductBrowser from "@/components/ProductBrowser";
import { getCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Sarees | [YOUR STORE]",
  description: "Browse every saree on one page. Drag to the next saree and its colours, photos and sizes follow along.",
};

export default function SareesPage() {
  return (
    <>
      <Header />
      <ProductBrowser category={getCategory("sarees")!} />
    </>
  );
}
