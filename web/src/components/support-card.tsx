"use client";

import { getSupportEmail, getSupportWhatsAppUrl } from "@/lib/site";

export function SupportCard() {
  const email = getSupportEmail();
  const whatsappUrl = getSupportWhatsAppUrl();

  return (
    <div className="rounded-xl border border-white/10 bg-brand-warm/60 p-6 text-sm text-brand-cream">
      <h2 className="font-heading text-lg font-semibold text-brand-cream">Support</h2>
      <p className="mt-2 text-brand-muted">
        Questions, billing, or display issues — reach us here and we&apos;ll get back to you.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center justify-center rounded-lg border border-brand-amber/30 bg-brand-amber/10 px-4 py-2.5 font-medium text-brand-amber transition hover:bg-brand-amber/20"
        >
          Email {email}
        </a>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 font-medium text-brand-cream transition hover:bg-brand-warm"
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
