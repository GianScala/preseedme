// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://preseedme.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",   // important: do NOT disallow everything
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
