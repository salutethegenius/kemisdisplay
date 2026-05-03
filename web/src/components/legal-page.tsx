import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { MarketingFooter } from "@/components/marketing-footer";

export function LegalPage({
  title,
  effectiveDate,
  intro,
  children,
}: {
  title: string;
  effectiveDate: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-brand-deep via-brand-bar to-brand-warm">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6">
        <BrandLockup markSize={36} className="min-w-0 sm:gap-3" href="/" />
        <nav
          aria-label="Account"
          className="flex shrink-0 items-center gap-2 sm:gap-4"
        >
          <Link
            href="/login"
            className="whitespace-nowrap text-sm text-brand-muted transition hover:text-brand-cream"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-brand-amber px-3 py-2 text-xs font-semibold text-brand-deep transition hover:bg-brand-amber-bright sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Start trial</span>
            <span className="hidden sm:inline">Start free trial</span>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-amber">
          Legal
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-brand-cream sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-brand-muted">
          Effective date: {effectiveDate}
        </p>
        {intro && (
          <div className="mt-6 text-base leading-relaxed text-brand-text">
            {intro}
          </div>
        )}

        <div className="legal-prose mt-10 space-y-8 text-base leading-relaxed text-brand-text">
          {children}
        </div>

        <p className="mt-12 rounded-xl border border-white/10 bg-brand-warm/40 p-4 text-xs text-brand-muted">
          This document describes how KemisDisplay LLC operates today. It is
          provided for transparency and is not legal advice. If anything here
          conflicts with a separate written agreement you have with us, the
          written agreement controls.
        </p>
      </main>

      <MarketingFooter />
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-brand-cream sm:text-2xl">
        {heading}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
