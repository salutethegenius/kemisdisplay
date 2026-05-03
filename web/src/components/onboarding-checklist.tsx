"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Step = {
  id: string;
  title: string;
  description: string;
  cta_label: string;
  cta_href: string;
  done: boolean;
};

type Onboarding = {
  steps: Step[];
  percent: number;
  completed: boolean;
  dismissed: boolean;
};

const POLL_MS = 30_000;

async function fireConfetti(big: boolean) {
  try {
    const mod = await import("canvas-confetti");
    const confetti = mod.default;
    if (big) {
      // Burst from both bottom corners for the "all done" moment.
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.15, y: 0.9 },
      });
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.85, y: 0.9 },
      });
    } else {
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { x: 0.5, y: 0.4 },
      });
    }
  } catch {
    // canvas-confetti is optional — checklist still works without it.
  }
}

export function OnboardingChecklist() {
  const { token } = useAuth();
  const [data, setData] = useState<Onboarding | null>(null);
  const [hidden, setHidden] = useState(false);
  const prevDoneRef = useRef<Record<string, boolean> | null>(null);
  const prevCompletedRef = useRef<boolean>(false);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch("/onboarding", { token });
    if (!res.ok) return;
    const json = (await res.json()) as Onboarding;

    // Detect step transitions for confetti — but skip the very first load
    // (existing users would see a cascade of celebrations for old work).
    const prevDone = prevDoneRef.current;
    const prevCompleted = prevCompletedRef.current;
    if (prevDone) {
      let stepJustCompleted = false;
      for (const s of json.steps) {
        if (s.done && !prevDone[s.id]) {
          stepJustCompleted = true;
          break;
        }
      }
      if (json.completed && !prevCompleted) {
        void fireConfetti(true);
      } else if (stepJustCompleted) {
        void fireConfetti(false);
      }
    }
    prevDoneRef.current = Object.fromEntries(
      json.steps.map((s) => [s.id, s.done]),
    );
    prevCompletedRef.current = json.completed;
    setData(json);
  }, [token]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  async function dismiss() {
    if (!token) return;
    setHidden(true);
    await apiFetch("/onboarding/dismiss", { method: "POST", token });
  }

  if (!data || data.dismissed || hidden) return null;

  const doneCount = data.steps.filter((s) => s.done).length;

  return (
    <section
      aria-label="Getting started checklist"
      className="mb-6 overflow-hidden rounded-2xl border border-brand-amber/30 bg-gradient-to-br from-brand-warm/90 to-brand-warm/60 shadow-lg"
    >
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-amber">
              {data.completed ? "All set up" : "Getting started"}
            </p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-brand-cream sm:text-xl">
              {data.completed
                ? "🎉 You're live — your TV is showing your content."
                : `${doneCount} of ${data.steps.length} steps done`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void dismiss()}
            className="shrink-0 rounded-full p-1 text-xs text-brand-muted hover:text-brand-cream"
            aria-label="Hide checklist"
          >
            ✕
          </button>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-brand-amber transition-all duration-500"
            style={{ width: `${data.percent}%` }}
            role="progressbar"
            aria-valuenow={data.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <ol className="mt-2 space-y-2">
          {data.steps.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors ${
                s.done
                  ? "border-emerald-400/25 bg-emerald-500/5"
                  : "border-white/10 bg-brand-deep/40"
              }`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  s.done
                    ? "bg-emerald-400 text-brand-deep"
                    : "border border-brand-amber/40 text-brand-amber"
                }`}
                aria-hidden
              >
                {s.done ? "✓" : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    s.done ? "text-brand-cream/80" : "text-brand-cream"
                  }`}
                >
                  {s.title}
                </p>
                <p className="mt-0.5 text-xs text-brand-muted">
                  {s.description}
                </p>
              </div>
              {!s.done && (
                <Link
                  href={s.cta_href}
                  className="shrink-0 self-center rounded-lg bg-brand-amber px-3 py-1.5 text-xs font-semibold text-brand-deep hover:bg-brand-amber-bright"
                >
                  {s.cta_label}
                </Link>
              )}
            </li>
          ))}
        </ol>

        {data.completed && (
          <button
            type="button"
            onClick={() => void dismiss()}
            className="mt-1 self-end text-xs text-brand-muted hover:text-brand-cream"
          >
            Hide this
          </button>
        )}
      </div>
    </section>
  );
}
