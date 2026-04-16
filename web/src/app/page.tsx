import type { Metadata } from "next";
import { Landing } from "@/components/landing";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  getSiteUrl,
} from "@/lib/site";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: { absolute: DEFAULT_TITLE },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: `${siteUrl}/` },
  openGraph: {
    url: `${siteUrl}/`,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      description: DEFAULT_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: SITE_NAME,
      url: `${siteUrl}/`,
      description: DEFAULT_DESCRIPTION,
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "RegisterAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/signup`,
        },
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <Landing />
    </>
  );
}
