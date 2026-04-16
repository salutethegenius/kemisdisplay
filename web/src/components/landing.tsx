import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";

export function Landing() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-brand-deep via-brand-bar to-brand-warm">
      <header className="mx-auto flex max-w-5xl flex-nowrap items-center justify-between gap-2 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6">
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

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <h1 className="max-w-3xl text-balance font-heading text-4xl font-semibold leading-tight tracking-tight text-brand-cream sm:text-5xl">
          Turn any TV into a revenue screen.{" "}
          <span className="text-brand-amber">No hardware. No headaches.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-brand-text">
          Upload your menus, promos, or videos, hit publish, and your screens
          update instantly. No boxes to install, no technicians to call, no
          waiting.
        </p>
        <p className="mt-4 max-w-xl text-base font-medium text-brand-cream/95">
          Start in minutes. Run it from anywhere.
        </p>
        <p className="mt-6 max-w-xl rounded-xl border border-brand-amber/25 bg-brand-amber/10 px-4 py-3 text-sm text-brand-cream/95">
          <span className="font-semibold text-brand-amber">14-day free trial.</span>{" "}
          Then{" "}
          <span className="font-semibold text-brand-cream">$25/month</span> for
          up to{" "}
          <span className="font-semibold text-brand-cream">4 screens</span>.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-brand-amber px-6 py-3 text-sm font-semibold text-brand-deep transition hover:bg-brand-amber-bright"
          >
            Start free trial
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-brand-cream transition hover:border-brand-amber/40 hover:bg-brand-amber/5"
          >
            Log in
          </Link>
        </div>
        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-brand-muted">
          Built for restaurants, retail stores, bars, salons, and venues that
          need fast, reliable control over what&apos;s on screen.
        </p>

        <section className="mt-20" aria-labelledby="value-heading">
          <h2
            id="value-heading"
            className="font-heading text-xl font-semibold text-brand-cream"
          >
            Why owners switch to KemisDisplay
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-brand-amber/15 bg-brand-amber/[0.04] p-6">
              <h3 className="font-heading font-semibold text-brand-cream">
                Set up in minutes
              </h3>
              <p className="mt-2 text-sm text-brand-text">
                Create screens, upload content, and go live without any
                technical setup. If you can open a browser, you can run your
                displays.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-violet/15 bg-brand-violet/[0.04] p-6">
              <h3 className="font-heading font-semibold text-brand-cream">
                Always up to date
              </h3>
              <p className="mt-2 text-sm text-brand-text">
                Change a price, swap a promo, update a menu, and every screen
                reflects it instantly. No USB drives, no manual updates.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-heading font-semibold text-brand-cream">
                Built for real businesses
              </h3>
              <p className="mt-2 text-sm text-brand-text">
                Designed for busy owners and managers who need control, speed,
                and zero downtime — not another system to babysit.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20 max-w-3xl" aria-labelledby="mid-heading">
          <h2
            id="mid-heading"
            className="font-heading text-2xl font-semibold text-brand-cream sm:text-3xl"
          >
            Stop paying for boxes you don&apos;t need
          </h2>
          <p className="mt-4 text-lg text-brand-text">
            Most signage systems lock you into hardware, installers, and ongoing
            maintenance. KemisDisplay removes all of that.
          </p>
          <p className="mt-4 text-lg font-medium text-brand-cream">
            Open a single link on your TV and you&apos;re live.
          </p>
        </section>

        <section className="mt-20" aria-labelledby="use-cases-heading">
          <h2
            id="use-cases-heading"
            className="font-heading text-xl font-semibold text-brand-cream"
          >
            Perfect for
          </h2>
          <ul className="mt-6 max-w-xl list-inside list-disc space-y-2 text-brand-text marker:text-brand-amber">
            <li>Restaurants updating daily menus and specials</li>
            <li>Retail stores running promotions and offers</li>
            <li>Bars and lounges pushing events and drink specials</li>
            <li>Offices and waiting rooms displaying announcements</li>
          </ul>
        </section>

        <section
          className="mt-20 rounded-2xl border border-brand-amber/20 bg-brand-amber/[0.06] p-8 sm:p-10"
          aria-labelledby="menus-heading"
        >
          <h2
            id="menus-heading"
            className="font-heading text-xl font-semibold text-brand-cream sm:text-2xl"
          >
            Create menu videos in seconds
          </h2>
          <p className="mt-4 max-w-2xl text-brand-text">
            Design your menu, generate a clean video, and add it straight to your
            screen playlist.
          </p>
          <p className="mt-2 font-medium text-brand-cream">
            No designer. No video editor. No delays.
          </p>
          <p className="mt-6 text-sm text-brand-muted">
            Available in the dashboard under{" "}
            <span className="text-brand-cream/90">Menus</span> — build a board,
            then generate a ready-to-play clip.
          </p>
        </section>

        <p className="mt-16 max-w-2xl text-sm text-brand-muted">
          Part of the{" "}
          <span className="text-brand-text">Kemis ecosystem</span>, built
          alongside tools powering payments, legal access, and digital
          infrastructure.
        </p>

        <section
          className="mt-20 border-t border-white/10 pt-16 text-center"
          aria-labelledby="footer-cta-heading"
        >
          <h2
            id="footer-cta-heading"
            className="font-heading text-2xl font-semibold text-brand-cream sm:text-3xl"
          >
            Your screens should work for you, not slow you down.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-brand-text">
            Start your free trial and go live today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-brand-amber px-8 py-3 text-sm font-semibold text-brand-deep transition hover:bg-brand-amber-bright"
            >
              Start free trial
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-8 py-3 text-sm font-medium text-brand-cream transition hover:border-brand-amber/40 hover:bg-brand-amber/5"
            >
              Log in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-xs text-brand-muted sm:px-6">
        <nav
          aria-label="Footer"
          className="flex flex-wrap justify-center gap-x-4 gap-y-2"
        >
          <Link href="/login" className="hover:text-brand-cream">
            Log in
          </Link>
          <span aria-hidden>·</span>
          <Link href="/signup" className="hover:text-brand-cream">
            Start free trial
          </Link>
          <span aria-hidden>·</span>
          <span>kemisdisplay.com — Kemis product family</span>
        </nav>
      </footer>
    </div>
  );
}
