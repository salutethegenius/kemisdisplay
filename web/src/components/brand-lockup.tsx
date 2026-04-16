import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type BrandLockupProps = {
  markSize?: number;
  href?: string;
  className?: string;
};

/**
 * Concept 02 mark + Concept 01-style Unbounded wordmark (amber/cream) +
 * Instrument Sans tagline.
 */
export function BrandLockup({
  markSize = 44,
  href = "/",
  className = "",
}: BrandLockupProps) {
  const inner = (
    <div className={`flex items-center gap-3 ${className}`}>
      <BrandMark size={markSize} className="shrink-0" />
      <div className="min-w-0 text-left leading-tight">
        <div className="font-display text-lg font-bold tracking-tight sm:text-xl">
          <span className="text-brand-amber">Kemis</span>
          <span className="text-brand-cream">Display</span>
        </div>
        <p className="mt-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-brand-amber/70 sm:text-[11px]">
          Digital Signage Platform
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex min-w-0 rounded-lg outline-none ring-brand-amber/0 focus-visible:ring-2 focus-visible:ring-brand-amber/40"
        aria-label="KemisDisplay — home"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
