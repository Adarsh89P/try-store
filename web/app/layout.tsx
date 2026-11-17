import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AccountProvider } from "@/lib/account";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";

export const metadata: Metadata = {
  title: "[YOUR STORE] | Sarees, dresses and more",
  description: "Browse sarees without ever going back. Colours, photos and sizes follow the saree you are looking at.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <AccountProvider>
          <WishlistProvider>
            <CartProvider>{children}</CartProvider>
          </WishlistProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
