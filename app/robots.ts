import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/sign-in",
          "/sign-up",
          "/about",
          "/cgu",
          "/contact",
          "/privacy",
          "/blog",
          "/blog/*",
        ],
        disallow: [
          "/dashboard/",
          "/api/",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
