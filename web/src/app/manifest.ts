import type { MetadataRoute } from "next";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  const base = getSiteUrl();
  return {
    id: `${base}/`,
    name: SITE_NAME,
    short_name: SITE_NAME,
    description:
      "Turn any TV into a revenue screen. Upload menus and promos, publish once, update every display — no proprietary boxes.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    background_color: "#0d0806",
    theme_color: "#ffaa00",
    orientation: "any",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/pwa-192",
        type: "image/png",
        sizes: "192x192",
        purpose: "any",
      },
      {
        src: "/pwa-512",
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/pwa-512",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Home",
        description: "Screens and quick links",
        url: "/dashboard",
      },
      {
        name: "Menus",
        short_name: "Menus",
        description: "Build menu boards and generate video",
        url: "/dashboard/menus",
      },
      {
        name: "Media",
        short_name: "Media",
        description: "Upload images and video",
        url: "/dashboard/media",
      },
    ],
  };
}
