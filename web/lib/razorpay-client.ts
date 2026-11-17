/** Opens Razorpay Checkout for an order created by the API. Resolves with the signed result, or rejects if the customer closes it. */
export type RazorpayResult = { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string };
type Opts = { keyId: string; razorpayOrderId: string; amountPaise: number; name: string; email: string; phone: string };

declare global {
  interface Window {
    Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(ev: string, cb: () => void): void };
  }
}

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window. Check your connection."));
    document.head.appendChild(s);
  });
}

export async function payWithRazorpay(o: Opts): Promise<RazorpayResult> {
  await loadScript();
  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay!({
      key: o.keyId,
      order_id: o.razorpayOrderId,
      amount: o.amountPaise,
      currency: "INR",
      name: "[YOUR STORE]", // TODO: store name
      prefill: { name: o.name, email: o.email, contact: o.phone },
      handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
        resolve({ razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature }),
      modal: { ondismiss: () => reject(new Error("Payment was cancelled. Your order is saved; you can try again from My orders.")) },
    });
    rz.on("payment.failed", () => reject(new Error("The payment failed. Please try again.")));
    rz.open();
  });
}
