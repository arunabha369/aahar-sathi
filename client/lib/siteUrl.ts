const DEFAULT_SITE_URL = 'https://aaharsathi.in';

/**
 * Return a valid origin for metadata and sitemap URLs.
 *
 * Hosting providers can expose an environment variable as an empty string;
 * nullish coalescing alone does not catch that case, and `new URL('')` throws
 * while Next.js is collecting route metadata during a production build.
 */
export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return DEFAULT_SITE_URL;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}
