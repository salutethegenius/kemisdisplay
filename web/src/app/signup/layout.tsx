import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const title = "Start free trial";
const description =
  "Create a KemisDisplay account — 14-day trial, up to 4 screens. Upload media and run browser-based digital signage on any TV.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/signup` },
  openGraph: {
    title: `${title} · KemisDisplay`,
    description,
    url: `${getSiteUrl()}/signup`,
    siteName: "KemisDisplay",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · KemisDisplay`,
    description,
  },
  robots: { index: true, follow: true },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
