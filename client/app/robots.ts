import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aaharsathi.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Everything behind a login is per-user and has nothing to index.
      disallow: ['/api/', '/dashboard', '/onboarding', '/grocery', '/plans', '/progress', '/settings'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
