const DEFAULT_SITE = "https://kemisdisplay.com";

/** Production web origin (no trailing slash). Used for canonical URLs, OG, sitemap. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return DEFAULT_SITE;
  let base = raw.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  try {
    new URL(base);
    return base;
  } catch {
    return DEFAULT_SITE;
  }
}

export const SITE_NAME = "KemisDisplay";

export const DEFAULT_TITLE =
  "KemisDisplay — Turn Any TV Into a Revenue Screen";

/** Under 155 chars — homepage / default description */
export const DEFAULT_DESCRIPTION =
  "No extra hardware. Upload menus and promos, hit publish, and every screen updates instantly. 14-day trial, then $25/mo for up to 2 screens.";

/** Human-facing support address; override with NEXT_PUBLIC_SUPPORT_EMAIL. */
export function getSupportEmail(): string {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return raw || "legal@kemisdisplay.com";
}

/** Full WhatsApp URL (e.g. https://wa.me/15551234567). Omit from env to hide the button. */
export function getSupportWhatsAppUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL?.trim();
  return raw || null;
}

/** Full URL of the public display player embedded on `/demo` (same-origin iframe). */
export function getLiveDemoDisplayUrl(): string {
  const raw = process.env.NEXT_PUBLIC_LIVE_DEMO_URL?.trim();
  if (raw) {
    let u = raw.replace(/\/$/, "");
    if (!/^https?:\/\//i.test(u)) {
      u = `https://${u}`;
    }
    try {
      new URL(u);
      return u;
    } catch {
      /* fall through */
    }
  }
  return "https://www.kemisdisplay.com/display/home-0db836?token=4kAFq6u18itbuduziEeq76zF3r8Qp7Ye";
}
