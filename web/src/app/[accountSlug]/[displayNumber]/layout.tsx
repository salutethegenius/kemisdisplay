import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live display",
  description:
    "Private signage player URL. Not indexed. Open the link from your KemisDisplay dashboard.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ShortDisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
