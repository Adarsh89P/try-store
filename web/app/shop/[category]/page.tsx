import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ProductBrowser from "@/components/ProductBrowser";
import { CATEGORIES, getCategory } from "@/lib/products";

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.filter((c) => c.id !== "sarees").map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const cat = getCategory((await params).category);
  return { title: `${cat?.label ?? "Shop"} | [YOUR STORE]` };
}

export default async function ShopPage({ params }: { params: Promise<{ category: string }> }) {
  const cat = getCategory((await params).category);
  if (!cat) notFound();
  return (
    <>
      <Header />
      <ProductBrowser category={cat} />
    </>
  );
}
