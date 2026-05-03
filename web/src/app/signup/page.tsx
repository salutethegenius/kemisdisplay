"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { apiFetch, apiUnreachableMessage } from "@/lib/api";
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
        if (res.status === 404) {
          setErr(
            "API not found. In Vercel set NEXT_PUBLIC_API_URL to your Railway API base URL (not this website), then redeploy.",
          );
          return;
        }
        setErr(
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail)
              ? data.detail
                  .map((d: { msg?: string }) => d.msg || JSON.stringify(d))
                  .join(" ")
              : data.message || "Signup failed",
        );
        return;
      }
      login(data.access_token, data.user);
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof TypeError) {
        setErr(apiUnreachableMessage());
        return;
      }
      throw e;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-brand-deep px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <BrandLockup markSize={40} href="/" />
        <h1 className="mt-8 font-heading text-2xl font-semibold text-brand-cream">
          Create account
        </h1>
        <p className="mt-2 text-sm text-brand-text">
          14-day free trial — up to 4 screens. Then $25.00/mo Starter. Already
          have an account?{" "}
          <Link href="/login" className="text-brand-amber hover:underline">
            Log in
          </Link>
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label-brand">Business name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="input-brand"
            />
          </div>
          <div>
            <label className="label-brand">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-brand"
            />
          </div>
          <div>
            <label className="label-brand">Password (min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-brand"
            />
          </div>
          {err && (
            <p className="text-sm text-brand-signal" role="alert">
              {typeof err === "string" ? err : JSON.stringify(err)}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="btn-brand-primary w-full py-2.5"
          >
            {pending ? "Creating…" : "Start trial"}
          </button>
        </form>
      </div>
    </div>
  );
}
