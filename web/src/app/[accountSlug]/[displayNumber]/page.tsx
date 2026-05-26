import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DisplayPlayer } from "@/components/display-player";
import { apiUrl } from "@/lib/api";

type BootstrapResponse = { slug: string; token: string };

async function fetchBootstrap(
  accountSlug: string,
  displayNumber: number,
): Promise<BootstrapResponse | null> {
  const res = await fetch(
    apiUrl(
      `/public/accounts/${encodeURIComponent(accountSlug)}/screens/${displayNumber}/bootstrap`,
    ),
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return res.json() as Promise<BootstrapResponse>;
}

export default async function ShortDisplayPage({
  params,
}: {
  params: Promise<{ accountSlug: string; displayNumber: string }>;
}) {
  const { accountSlug, displayNumber } = await params;
  if (!/^\d+$/.test(displayNumber)) notFound();
  const num = parseInt(displayNumber, 10);
  if (num < 1) notFound();

  const data = await fetchBootstrap(accountSlug, num);
  if (!data) notFound();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen animate-pulse bg-black" aria-hidden />
      }
    >
      <DisplayPlayer slug={data.slug} token={data.token} />
    </Suspense>
  );
}
