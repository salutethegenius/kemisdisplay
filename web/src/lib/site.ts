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
  "No extra hardware. Upload menus and promos, hit publish, and every screen updates instantly. 14-day trial, then $25/mo for up to 4 screens.";
