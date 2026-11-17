import type { Metadata } from "next";
import BagView from "@/components/BagView";
import Header from "@/components/Header";

export const metadata: Metadata = { title: "Your bag | [YOUR STORE]" };

export default function BagPage() {
  return (
    <>
      <Header />
      <BagView />
    </>
  );
}
