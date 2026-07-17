"use client";

import { useState } from "react";
import Link from "next/link";

export function ScheduleDemoForm() {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/schedule-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          business,
          phone,
          email,
          area,
          notes,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) {
        setError(data.detail || "Could not submit. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not submit. Please try again or call us.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-6 text-brand-cream">
        <h2 className="font-heading text-xl font-semibold">Request received</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-text">
          Thanks — we&apos;ll reach out to schedule a demo at your store. Prefer
          to start now?{" "}
          <Link href="/signup" className="font-medium text-brand-amber hover:underline">
            Start your 14-day free trial
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="name" className="text-sm text-brand-muted">
          Your name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-amber/50"
        />
      </div>
      <div>
        <label htmlFor="business" className="text-sm text-brand-muted">
          Business name
        </label>
        <input
          id="business"
          required
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-amber/50"
        />
      </div>
      <div>
        <label htmlFor="phone" className="text-sm text-brand-muted">
          Phone / WhatsApp
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-amber/50"
        />
      </div>
      <div>
        <label htmlFor="email" className="text-sm text-brand-muted">
          Email <span className="text-brand-muted/70">(optional)</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-amber/50"
        />
      </div>
      <div>
        <label htmlFor="area" className="text-sm text-brand-muted">
          Island / area <span className="text-brand-muted/70">(optional)</span>
        </label>
        <input
          id="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Freeport, Nassau"
          className="mt-1 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-amber/50"
        />
      </div>
      <div>
        <label htmlFor="notes" className="text-sm text-brand-muted">
          Notes <span className="text-brand-muted/70">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Best times to visit, number of TVs, etc."
          className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-brand-warm px-3 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-amber/50"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand-amber px-6 py-3 text-sm font-semibold text-brand-deep transition hover:bg-brand-amber-bright disabled:opacity-50 sm:w-auto"
      >
        {pending ? "Sending…" : "Request store demo"}
      </button>
    </form>
  );
}
