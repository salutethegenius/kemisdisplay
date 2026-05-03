const DEFAULT_API_BASE = "http://localhost:8000";

/** Railway / local FastAPI base — never the marketing site (e.g. not www.kemisdisplay.com). */
function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  let base = (raw || DEFAULT_API_BASE).replace(/\/$/, "");
  if (base && !/^https?:\/\//i.test(base)) {
    base = `http://${base}`;
  }
  try {
    new URL(base);
  } catch {
    base = DEFAULT_API_BASE;
  }
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

/** Exposed for user-facing “can’t reach API” copy in login/signup. */
export function getApiBase(): string {
  return apiBase();
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

export type UploadProgressCallback = (percent: number | null) => void;
/** `null` percent means total size is unknown (show indeterminate). */

export function apiUploadWithProgress(
  path: string,
  opts: {
    token: string;
    body: FormData;
    onProgress?: UploadProgressCallback;
  },
): Promise<Response> {
  const url = apiUrl(path);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${opts.token}`);
    xhr.upload.onprogress = (ev) => {
      if (!opts.onProgress) return;
      if (ev.lengthComputable && ev.total > 0) {
        opts.onProgress(Math.round((100 * ev.loaded) / ev.total));
      } else {
        opts.onProgress(null);
      }
    };
    xhr.onload = () => {
      const h = new Headers();
      const ct = xhr.getResponseHeader("Content-Type");
      if (ct) h.set("Content-Type", ct);
      resolve(
        new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: h,
        }),
      );
    };
    xhr.onerror = () =>
      reject(new TypeError("Could not reach the API while uploading."));
    xhr.send(opts.body);
  });
}

/** Message when fetch() throws (API down, wrong host, connection refused). */
export function apiUnreachableMessage(): string {
  return `Could not reach the API at ${getApiBase()}. For local dev: run Postgres (\`docker compose up -d\`), start the API from \`api/\` (\`uvicorn app.main:app --reload --port 8000\`), and ensure web/.env.local NEXT_PUBLIC_API_URL matches.`;
}
