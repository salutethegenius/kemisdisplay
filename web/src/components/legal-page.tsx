import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";

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
      <MarketingHeader
        maxWidthClass="max-w-5xl"
        className="pb-6 pt-[max(1rem,env(safe-area-inset-top))]"
        links={[
          { href: "/login", label: "Log in", variant: "text" },
          { href: "/signup", label: "Start free trial", variant: "primary" },
        ]}
      />

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
