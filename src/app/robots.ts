import type { MetadataRoute } from "next";

// This is an internal tool for a small group of masjid administrators.
// It should not be indexed by search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
