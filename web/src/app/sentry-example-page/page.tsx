import { notFound } from "next/navigation";

import { SentryExampleButtons } from "./sentry-example-buttons";

/** Visible only in dev or when NEXT_PUBLIC_SENTRY_TEST_PAGE=1 — not a public prod spam endpoint. */
export default function SentryExamplePage() {
  const allowed =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_SENTRY_TEST_PAGE === "1";

  if (!allowed) {
    notFound();
  }

  return <SentryExampleButtons />;
}
