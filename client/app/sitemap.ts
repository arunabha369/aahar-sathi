import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

const siteUrl = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: siteUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/register`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/login`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
