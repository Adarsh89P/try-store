import type { Metadata } from "next";
import OrdersView from "@/components/OrdersView";

export const metadata: Metadata = { title: "Orders | [YOUR STORE]" };

export default function Page() {
  return <OrdersView />;
}
