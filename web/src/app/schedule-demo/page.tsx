import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { MarketingFooter } from "@/components/marketing-footer";
import { ScheduleDemoForm } from "@/components/schedule-demo-form";
import { DEFAULT_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();
const title = `Schedule a store demo — ${SITE_NAME}`;
const description =
  "Book a live KemisDisplay demo at your store. Or start a 14-day free trial online — then $25/mo for up to 2 screens.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${siteUrl}/schedule-demo` },
  openGraph: {
    url: `${siteUrl}/schedule-demo`,
    title,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default function ScheduleDemoPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-brand-deep via-brand-bar to-brand-warm">
      <header className="mx-auto flex max-w-5xl flex-nowrap items-center justify-between gap-2 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6">
        <BrandLockup markSize={36} className="min-w-0 sm:gap-3" href="/" />
        <nav
          aria-label="Schedule demo"
          className="flex shrink-0 items-center gap-2 sm:gap-4"
        >
          <Link
            href="/demo"
            className="whitespace-nowrap text-sm text-brand-muted transition hover:text-brand-cream"
          >
            Live demo
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-brand-amber px-3 py-2 text-xs font-semibold text-brand-deep transition hover:bg-brand-amber-bright sm:px-4 sm:text-sm"
          >
            Start free trial
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-24 pt-4 sm:px-6 sm:pt-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-brand-cream sm:text-4xl">
          Schedule a demo at your store
        </h1>
        <p className="mt-4 text-base leading-relaxed text-brand-text">
          We&apos;ll bring KemisDisplay to your location and walk through menus,
          promos, and publish on your TVs. Prefer self-serve?{" "}
          <Link href="/signup" className="font-medium text-brand-amber hover:underline">
            Start free for 14 days
          </Link>
          , then $25/month for up to 2 screens.
        </p>

        <div className="relative mt-10 rounded-2xl border border-white/10 bg-brand-warm/50 p-6">
          <ScheduleDemoForm />
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
