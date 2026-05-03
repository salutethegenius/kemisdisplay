import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "kgc-dr",
  project: "kemisdisplay",
  silent: !process.env.CI,
  // Avoid serving browser source maps from the deployment after upload to Sentry.
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
