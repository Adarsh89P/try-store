import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col items-center justify-center gap-4 px-5 py-24 text-center">
        <h1 className="m-0 font-display text-5xl font-medium">Page not found</h1>
        <p className="m-0 text-[#4a3340]">That page does not exist, or it has moved.</p>
        <Link href="/" className="inline-flex min-h-14 items-center justify-center rounded-full bg-brand px-8 text-base font-bold text-white hover:bg-brand-dark">
          Back to home
        </Link>
      </main>
    </>
  );
}
