import type { Metadata } from "next";
import CheckoutView from "@/components/CheckoutView";

export const metadata: Metadata = { title: "Checkout | [YOUR STORE]" };

export default function CheckoutPage() {
  return <CheckoutView />;
}
