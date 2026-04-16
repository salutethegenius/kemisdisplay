import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const title = "Log in";
const description =
  "Sign in to KemisDisplay to manage screens, playlists, and TV signage for your business.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/login` },
  openGraph: {
    title: `${title} · KemisDisplay`,
    description,
    url: `${getSiteUrl()}/login`,
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

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
