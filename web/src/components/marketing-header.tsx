"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLockup } from "@/components/brand-lockup";

export type MarketingNavLink = {
  href: string;
  label: string;
  variant?: "primary" | "outline" | "text";
  className?: string;
};

type MarketingHeaderProps = {
  links: MarketingNavLink[];
  tone?: "hero" | "default";
  navLabel?: string;
  markSize?: number;
  className?: string;
  maxWidthClass?: string;
};

function linkClassName(
  variant: MarketingNavLink["variant"],
  tone: MarketingHeaderProps["tone"],
): string {
  if (variant === "outline") {
    return "rounded-full border border-brand-amber/55 bg-brand-deep/40 px-4 py-2 text-sm font-semibold text-brand-amber backdrop-blur-sm transition hover:bg-brand-amber/15";
  }
  if (variant === "primary") {
    return "rounded-full bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-deep transition hover:bg-brand-amber-bright";
  }
  if (tone === "hero") {
    return "text-sm text-brand-cream/80 transition hover:text-brand-cream";
  }
  return "text-sm text-brand-muted transition hover:text-brand-cream";
}

function mobileLinkClassName(
  variant: MarketingNavLink["variant"],
  tone: MarketingHeaderProps["tone"],
): string {
  const base =
    "block rounded-xl px-4 py-3 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber/40";

  if (variant === "primary") {
    return `${base} bg-brand-amber text-brand-deep hover:bg-brand-amber-bright`;
  }
  if (variant === "outline") {
    return `${base} border border-brand-amber/55 bg-brand-amber/10 text-brand-amber hover:bg-brand-amber/15`;
  }
  if (tone === "hero") {
    return `${base} text-brand-cream hover:bg-white/5`;
  }
  return `${base} text-brand-cream hover:bg-white/5`;
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function MarketingHeader({
  links,
  tone = "default",
  navLabel = "Account",
  markSize = 36,
  className = "",
  maxWidthClass = "max-w-6xl",
}: MarketingHeaderProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const mobileMenu =
    open && mounted
      ? createPortal(
          <div className="md:hidden">
            <button
              type="button"
              className="fixed inset-0 z-[100] bg-brand-deep/85 backdrop-blur-sm"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <nav
              id={menuId}
              aria-label={navLabel}
              className="fixed inset-y-0 right-0 z-[110] flex w-[min(85vw,20rem)] flex-col border-l border-white/10 bg-brand-deep p-6 shadow-2xl shadow-black/50"
              style={{
                paddingTop: "max(1rem, env(safe-area-inset-top))",
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
                  Menu
                </span>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-cream transition hover:bg-white/5"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <MenuIcon open />
                </button>
              </div>
              <div className="mt-8 flex flex-col gap-3">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={mobileLinkClassName(link.variant, tone)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>,
          document.body,
        )
      : null;

  return (
    <header
      className={`relative z-20 mx-auto flex w-full items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 ${maxWidthClass} ${className}`}
    >
      <BrandLockup markSize={markSize} className="min-w-0 sm:gap-3" href="/" />

      <nav
        aria-label={navLabel}
        className="hidden shrink-0 items-center gap-4 md:flex"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap ${linkClassName(link.variant, tone)} ${link.className ?? ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-brand-deep/40 text-brand-cream backdrop-blur-sm transition hover:border-brand-amber/40 hover:bg-brand-amber/10 md:hidden"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <MenuIcon open={open} />
      </button>

      {mobileMenu}
    </header>
  );
}
