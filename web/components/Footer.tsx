import Link from "next/link";

// TODO: replace every [BRACKETED] value with your real store details.
const linkClass = "inline-flex min-h-9 items-center text-sm text-[#e6c6d4] hover:text-white hover:underline";
const textClass = "inline-flex min-h-9 items-center text-sm text-[#e6c6d4]";
const headingClass = "text-[13px] font-bold tracking-[.06em] text-white";

export default function Footer() {
  return (
    <footer className="mt-auto bg-plum text-[#f6dce6]">
      <div className="mx-auto max-w-[1360px] px-5 pb-8 pt-14 sm:px-10">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-8">
          <div>
            <div className="font-display text-[26px] font-semibold text-white">[YOUR STORE]</div>
            <p className="mt-3 text-sm leading-relaxed text-[#e6c6d4]">[YOUR TAGLINE]</p>
          </div>
          <div>
            <div className={headingClass}>SHOP</div>
            <div className="mt-2 flex flex-col">
              <Link className={linkClass} href="/sarees">Sarees</Link>
              <Link className={linkClass} href="/#categories">Dresses</Link>
              <Link className={linkClass} href="/#categories">Women</Link>
              <Link className={linkClass} href="/#categories">Men</Link>
              <Link className={linkClass} href="/#categories">Earrings</Link>
            </div>
          </div>
          <div>
            <div className={headingClass}>HELP</div>
            <div className="mt-2 flex flex-col">
              <span className={textClass}>[SHIPPING INFO]</span>
              <span className={textClass}>[RETURNS POLICY]</span>
              <span className={textClass}>[SIZE GUIDE]</span>
            </div>
          </div>
          <div>
            <div className={headingClass}>CONTACT</div>
            <div className="mt-2 flex flex-col">
              <span className={textClass}>[CONTACT EMAIL]</span>
              <span className={textClass}>[PHONE NUMBER]</span>
              <span className={textClass}>[STORE ADDRESS]</span>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-[#4a2a3c] pt-5 text-[13px] text-[#e6c6d4]">
          © [YEAR] [YOUR STORE]
        </div>
      </div>
    </footer>
  );
}
