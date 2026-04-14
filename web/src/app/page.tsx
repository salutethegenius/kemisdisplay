import { Suspense } from "react";
import { HomeContent } from "@/components/home-content";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen animate-pulse bg-zinc-950" aria-hidden />
      }
    >
      <HomeContent />
    </Suspense>
  );
}
