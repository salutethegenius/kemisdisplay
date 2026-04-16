/** Railway / local FastAPI base — never the marketing site (e.g. not www.kemisdisplay.com). */
function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  const base = (raw || "http://localhost:8000").replace(/\/$/, "");
  if (typeof window !== "undefined") {
    try {
      if (new URL(base).origin === window.location.origin) {
        console.error(
          "[KemisDisplay] NEXT_PUBLIC_API_URL points at this website. In Vercel set it to your API URL (e.g. https://….up.railway.app) and redeploy.",
        );
      }
    } catch {
      /* invalid URL */
    }
  }
  return base;
}

export function apiUrl(path: string): string {
  const base = apiBase();
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

export type ApiFetchOptions = RequestInit & { token?: string | null };

export async function apiFetch(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<Response> {
  const { token, headers: hdr, ...rest } = opts;
  const headers = new Headers(hdr);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    rest.body &&
    typeof rest.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (typeof FormData !== "undefined" && rest.body instanceof FormData) {
    headers.delete("Content-Type");
  }
  return fetch(apiUrl(path), { ...rest, headers });
}
