import { Platform } from "react-native";

export type RazorpayResult = { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string };
type Opts = { keyId: string; razorpayOrderId: string; amountPaise: number; name: string; email: string; phone: string };

/**
 * Opens Razorpay Checkout. On the web build this loads checkout.js.
 * TODO: on iOS and Android install `react-native-razorpay` (needs a development build, it does not run in Expo Go)
 * and call RazorpayCheckout.open(...) here. Until then online payment on a phone returns a clear error.
 */
export async function payWithRazorpay(o: Opts): Promise<RazorpayResult> {
  if (Platform.OS !== "web") throw new Error("Online payment on the phone app is not set up yet. Choose cash on delivery.");
  const w = globalThis as unknown as { Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(e: string, cb: () => void): void }; document: Document };
  if (!w.Razorpay) {
    await new Promise<void>((resolve, reject) => {
      const s = w.document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Could not load the payment window. Check your connection."));
      w.document.head.appendChild(s);
    });
  }
  return new Promise((resolve, reject) => {
    const rz = new w.Razorpay!({
      key: o.keyId, order_id: o.razorpayOrderId, amount: o.amountPaise, currency: "INR",
      name: "[YOUR STORE]", // TODO: store name
      prefill: { name: o.name, email: o.email, contact: o.phone },
      handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
        resolve({ razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature }),
      modal: { ondismiss: () => reject(new Error("Payment was cancelled. Your order is saved; you can try again from Your orders.")) },
    });
    rz.on("payment.failed", () => reject(new Error("The payment failed. Please try again.")));
    rz.open();
  });
}
