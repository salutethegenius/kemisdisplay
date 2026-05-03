import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { DemoLiveTv } from "@/components/demo-live-tv";
import { MarketingFooter } from "@/components/marketing-footer";
import { DEFAULT_DESCRIPTION, SITE_NAME, getLiveDemoDisplayUrl, getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();
const title = `Live demo — ${SITE_NAME}`;

export const metadata: Metadata = {
  title: { absolute: title },
  description:
    "Watch a real KemisDisplay screen running in your browser—no install, no hardware.",
  alternates: { canonical: `${siteUrl}/demo` },
  openGraph: {
    url: `${siteUrl}/demo`,
    title,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    title,
    description: DEFAULT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function DemoPage() {
  const embedUrl = getLiveDemoDisplayUrl();

  return (
    <div className="min-h-screen min-h-[100dvh] overflow-x-hidden bg-gradient-to-b from-brand-deep via-brand-bar to-brand-warm">
      <header className="mx-auto flex max-w-[min(100vw-1rem,1920px)] flex-nowrap items-center justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6">
        <BrandLockup markSize={32} className="min-w-0 sm:gap-3" href="/" />
        <nav
          aria-label="Demo"
          className="flex shrink-0 items-center gap-1.5 sm:gap-4"
        >
          <Link
            href="/"
            className="whitespace-nowrap py-2 text-xs text-brand-muted transition hover:text-brand-cream sm:text-sm"
          >
            Home
          </Link>
          <Link
            href="/login"
            className="whitespace-nowrap py-2 text-xs text-brand-muted transition hover:text-brand-cream sm:text-sm"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-brand-amber px-3 py-2 text-[11px] font-semibold leading-tight text-brand-deep transition hover:bg-brand-amber-bright sm:min-h-0 sm:min-w-0 sm:px-4 sm:text-sm"
          >
            Start free trial
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[min(100vw-1rem,1920px)] px-3 pb-[max(3.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-16 sm:pt-4">
        <h1 className="text-center font-heading text-[clamp(1.65rem,5.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-brand-amber sm:text-5xl md:text-6xl sm:leading-tight">
          See it live on a TV or
          <span className="mt-0.5 block text-brand-amber-bright sm:mt-1">
            in your browser.
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-xl px-1 text-center text-sm leading-snug text-brand-text sm:mt-4 sm:px-0 sm:text-base">
          This is a real KemisDisplay screen. Watch the playlist crossfade and
          loop—exactly what customers see on location.
        </p>

        <div className="mt-4 sm:mt-5">
          <DemoLiveTv embedUrl={embedUrl} />
        </div>

        <p className="mx-auto mt-4 max-w-lg px-1 text-center text-sm leading-snug text-brand-muted sm:mt-5 sm:px-0 sm:text-base sm:text-lg">
          Opens the public demo player in the frame above. Having trouble?{" "}
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-amber underline-offset-2 hover:underline"
          >
            Open full screen
          </a>
          .
        </p>

        <div className="mt-6 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
          <Link
            href="/signup"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand-amber px-8 py-3 text-center text-sm font-semibold text-brand-deep transition hover:bg-brand-amber-bright"
          >
            Start free trial
          </Link>
          <Link
            href="/#how-it-works"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/15 px-8 py-3 text-center text-sm font-medium text-brand-cream transition hover:border-brand-amber/40 hover:bg-brand-amber/5"
          >
            How it works
          </Link>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
