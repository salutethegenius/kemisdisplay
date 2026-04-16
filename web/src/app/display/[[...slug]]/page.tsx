import { Suspense } from "react";
import { DisplayClient } from "./display-client";

export default function DisplayPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen animate-pulse bg-black"
          aria-hidden
        />
      }
    >
      <DisplayClient />
    </Suspense>
  );
}
