import Link from "next/link";
import { HeroDemoBackdrop } from "@/components/hero-demo-backdrop";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { getLiveDemoDisplayUrl } from "@/lib/site";

export function Landing() {
  const demoUrl = getLiveDemoDisplayUrl();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-brand-deep">
      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden">
        <HeroDemoBackdrop embedUrl={demoUrl} />
        {/* Dim video only — keep atmosphere, keep type readable */}
        <div
          className="absolute inset-0 bg-brand-deep/55"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/40 to-brand-deep/25"
          aria-hidden
        />

        <MarketingHeader
          tone="hero"
          className="pb-4 pt-[max(1rem,env(safe-area-inset-top))]"
          links={[
            {
              href: "/schedule-demo",
              label: "Schedule demo",
              variant: "outline",
            },
            { href: "/login", label: "Log in", variant: "text" },
            {
              href: "/signup",
              label: "Start free trial",
              variant: "primary",
            },
          ]}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <div className="hero-overlay-in max-w-3xl">
            <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              <span className="text-brand-amber">Kemis</span>
              <span className="text-brand-cream">Display</span>
            </p>
            <h1 className="mt-4 max-w-2xl text-balance font-heading text-3xl font-semibold leading-tight tracking-tight text-brand-cream sm:text-4xl md:text-5xl">
              Turn any TV into a revenue screen.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-cream/90 sm:text-lg">
              Upload menus and promos, hit publish, and every screen updates
              instantly — no hardware, no installers.
            </p>
          </div>
          <div className="hero-overlay-in-delay mt-8 flex flex-wrap gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-brand-amber px-6 py-3 text-sm font-semibold text-brand-deep transition hover:bg-brand-amber-bright"
            >
              Start free trial
            </Link>
            <Link
              href="/schedule-demo"
              className="rounded-full border border-brand-amber/60 bg-brand-deep/50 px-6 py-3 text-sm font-semibold text-brand-amber backdrop-blur-sm transition hover:border-brand-amber hover:bg-brand-amber/15"
            >
              Schedule a demo at your store
            </Link>
            <Link
              href="/demo"
              className="demo-cta-glow rounded-full border border-white/20 bg-brand-deep/40 px-6 py-3 text-sm font-medium text-brand-cream/90 backdrop-blur-sm transition hover:border-brand-amber/40 hover:text-brand-cream"
            >
              See live demo
            </Link>
          </div>
        </div>
      </section>

      <main className="bg-gradient-to-b from-brand-deep via-brand-bar to-brand-warm px-4 pb-24 pt-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="max-w-xl rounded-xl border border-brand-amber/25 bg-brand-amber/10 px-4 py-3 text-sm text-brand-cream/95">
            <span className="font-semibold text-brand-amber">14-day free trial.</span>{" "}
            Then{" "}
            <span className="font-semibold text-brand-cream">$25/month</span> for
            up to{" "}
            <span className="font-semibold text-brand-cream">2 screens</span>.
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-brand-muted">
            Built for restaurants, retail stores, bars, salons, and venues that
            need fast, reliable control over what&apos;s on screen.
          </p>

          <section
            id="how-it-works"
            className="scroll-mt-24 mt-20"
            aria-labelledby="how-heading"
          >
            <h2
              id="how-heading"
              className="font-heading text-xl font-semibold text-brand-cream"
            >
              How it works
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "Create a screen",
                  body: "Name your TV. You'll get a unique URL to open on it.",
                },
                {
                  n: "2",
                  title: "Add your menu or media",
                  body: "Build a chalkboard menu, or upload your own image or video.",
                },
                {
                  n: "3",
                  title: "Open the URL on your TV",
                  body: "That's it. Updates appear in seconds — no app required.",
                },
              ].map((s) => (
                <li
                  key={s.n}
                  className="rounded-2xl border border-white/10 bg-brand-warm/40 p-6"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-amber text-sm font-bold text-brand-deep">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-heading font-semibold text-brand-cream">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-brand-text">{s.body}</p>
                </li>
              ))}
            </ol>
          </section>

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
                  Built for restaurants, cafés, bars, and retail
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
              What you&apos;d otherwise spend on signage hardware. Gone.
            </h2>
            <p className="mt-4 text-lg text-brand-text">
              Most signage systems lock you into a media player, an installer, and
              ongoing maintenance. KemisDisplay removes all of that.
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

          <section className="mt-20" aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="font-heading text-xl font-semibold text-brand-cream"
            >
              Common questions
            </h2>
            <div className="mt-8 space-y-3">
              {[
                {
                  q: "What if my internet goes down?",
                  a: "Each TV caches the last playlist it received, so existing content keeps playing through short outages. New changes apply once the connection is back.",
                },
                {
                  q: "Does it work on smart TVs, Roku, or Chromecast?",
                  a: "Anything with a browser works — open the screen URL on your TV's built-in browser, on a Chromecast tab, or on a cheap mini-PC. There's no app to install.",
                },
                {
                  q: "How many screens can I run?",
                  a: "Up to 2 screens on the Starter plan ($25/mo). Need more? Get in touch and we'll size a plan that fits.",
                },
                {
                  q: "Can I use my own videos and images?",
                  a: "Yes. Upload MP4s or images, set how long each plays, and rotate as many as you want per screen.",
                },
                {
                  q: "How do I cancel?",
                  a: "Cancel any time from Manage billing on your account page. You keep access through the end of the period you've already paid for.",
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-white/10 bg-brand-warm/40 p-5 open:border-brand-amber/25"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-medium text-brand-cream">
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="mt-1 shrink-0 text-brand-amber transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-brand-text">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section
            className="mt-20 rounded-2xl border border-white/10 bg-brand-warm/30 p-8 text-center"
            aria-labelledby="customers-heading"
          >
            <h2
              id="customers-heading"
              className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-muted"
            >
              Customers
            </h2>
            <p className="mt-3 text-brand-text">
              Coming soon — early customer stories from the venues we&apos;re
              running with today.
            </p>
          </section>

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
              Start your free trial online, or book a live demo at your store.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-brand-amber px-8 py-3 text-sm font-semibold text-brand-deep transition hover:bg-brand-amber-bright"
              >
                Start free trial
              </Link>
              <Link
                href="/schedule-demo"
                className="rounded-full border border-brand-amber/50 bg-brand-amber/10 px-8 py-3 text-sm font-semibold text-brand-amber transition hover:border-brand-amber hover:bg-brand-amber/15"
              >
                Schedule a demo at your store
              </Link>
              <Link
                href="/demo"
                className="demo-cta-glow rounded-full border border-white/15 px-8 py-3 text-sm font-medium text-brand-cream transition hover:border-brand-amber/40 hover:bg-brand-amber/5"
              >
                See live demo
              </Link>
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
