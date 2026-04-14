const API =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:8000";

export function apiUrl(path: string): string {
  const base = API.replace(/\/$/, "");
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
