import Link from "next/link";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-emerald-950/30">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight text-white">
          KemisDisplay
        </span>
        <div className="flex gap-4 text-sm">
          <Link
            href="/login"
            className="text-zinc-400 transition hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-emerald-400"
          >
            Start trial
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/90">
          Browser-based digital signage
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Your menus and promos on every screen — no boxes, no installers.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-400">
          Upload images and video, arrange a playlist, open one URL on the TV.
          Built for restaurants, retail, and venues that want control without
          hardware overhead.
        </p>
        <p className="mt-6 max-w-xl rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/95">
          <span className="font-semibold text-emerald-300">Intro offer:</span>{" "}
          14-day free trial, then{" "}
          <span className="font-semibold text-white">$25.00/mo</span> — up to{" "}
          <span className="font-semibold text-white">4 screens</span>.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            Start 14-day free trial
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 hover:border-zinc-500"
          >
            Log in
          </Link>
        </div>

        <section className="mt-24 grid gap-8 sm:grid-cols-3">
          {[
            {
              t: "Self-serve",
              d: "Create screens, upload media, and pair displays yourself.",
            },
            {
              t: "Live updates",
              d: "Playlists refresh on a schedule so TVs stay current.",
            },
            {
              t: "Kemis Ecosystem",
              d: "Same as KemisPay, Lawbey, Grandbridge, Pileit, and other national tools.",
            },
          ].map((x) => (
            <div
              key={x.t}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
            >
              <h3 className="font-semibold text-white">{x.t}</h3>
              <p className="mt-2 text-sm text-zinc-400">{x.d}</p>
            </div>
          ))}
        </section>

      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        kemisdisplay.com · Part of the Kemis product family
      </footer>
    </div>
  );
}
