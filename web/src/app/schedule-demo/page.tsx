import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
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
      <MarketingHeader
        navLabel="Schedule demo"
        maxWidthClass="max-w-5xl"
        className="pb-6 pt-[max(1rem,env(safe-area-inset-top))]"
        links={[
          { href: "/demo", label: "Live demo", variant: "text" },
          { href: "/signup", label: "Start free trial", variant: "primary" },
        ]}
      />

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
