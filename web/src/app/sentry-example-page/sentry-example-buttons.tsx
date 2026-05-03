"use client";

export function SentryExampleButtons() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16 text-brand-cream">
      <h1 className="font-heading text-2xl font-semibold">Sentry verification</h1>
      <p className="text-sm text-brand-muted">
        This route exists only in development, or when{" "}
        <code className="text-brand-text">NEXT_PUBLIC_SENTRY_TEST_PAGE=1</code> is set
        (remove after you confirm events in Sentry).
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="rounded-lg border border-brand-amber/40 bg-brand-amber/10 px-4 py-2.5 text-sm font-medium text-brand-amber hover:bg-brand-amber/20"
          onClick={() => {
            throw new Error("Sentry example — explicit throw (Next.js client)");
          }}
        >
          Throw test error
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium hover:bg-brand-warm"
          onClick={() => {
            const myUndefinedFunction = undefined as unknown as () => void;
            myUndefinedFunction();
          }}
        >
          Call undefined function
        </button>
      </div>
    </div>
  );
}
