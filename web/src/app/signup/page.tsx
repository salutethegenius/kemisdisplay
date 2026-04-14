"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      const res = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          business_name: businessName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.detail || data.message || "Signup failed");
        return;
      }
      login(data.access_token, data.user);
      router.push("/dashboard");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-lg font-semibold text-white">
          KemisDisplay
        </Link>
        <h1 className="mt-8 text-2xl font-semibold text-white">
          Create account
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          14-day free trial — up to 4 screens. Then $25.00/mo Starter. Already have
          an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Log in
          </Link>
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400">
              Business name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400">
              Password (min 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
          {err && (
            <p className="text-sm text-red-400" role="alert">
              {typeof err === "string" ? err : JSON.stringify(err)}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {pending ? "Creating…" : "Start trial"}
          </button>
        </form>
      </div>
    </div>
  );
}
