"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";

const TABS = [
  { label: "Profile", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
];

export default function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <Header />
      <main className="page-enter mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-8 sm:px-10">
        <h1 className="mb-6 mt-0 font-display text-[40px] font-medium">{title}</h1>
        <nav aria-label="Account" className="mb-8 flex flex-wrap gap-2.5">
          {TABS.map((t) => {
            const on = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full border-[1.5px] px-5 text-sm font-semibold ${
                  on ? "border-brand bg-brand text-white" : "border-edge bg-white hover:border-brand"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </main>
      <Footer />
    </>
  );
}
