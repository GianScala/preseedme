// app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://preseedme.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/ideas`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    // add other important routes here:
    // { url: `${baseUrl}/about`, lastModified: new Date(), priority: 0.6 },
  ];
}
