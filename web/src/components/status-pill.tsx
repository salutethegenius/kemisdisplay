type Tone = "amber" | "red" | "emerald" | "muted";

const tones: Record<Tone, string> = {
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  red: "border-red-400/30 bg-red-500/10 text-red-300",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  muted: "border-white/15 bg-white/5 text-brand-muted",
};

export function StatusPill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
