import type { Metadata } from "next";
import AddressesView from "@/components/AddressesView";

export const metadata: Metadata = { title: "Saved addresses | [YOUR STORE]" };

export default function Page() {
  return <AddressesView />;
}
