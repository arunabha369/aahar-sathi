import type { MetadataRoute } from 'next';

/** Makes Aahar Sathi installable: Chrome, Edge and Android offer "Install", iOS "Add to Home Screen". */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Aahar Sathi — Indian diet planner',
    short_name: 'Aahar Sathi',
    description:
      'Personalised 7-day Indian meal plans with calorie and macro targets, a grocery list, a water tracker and progress charts.',
    // Signed-out visitors are sent on to /login by the proxy, then back here.
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0b0a',
    theme_color: '#0a0b0a',
    categories: ['health', 'food', 'lifestyle'],
    lang: 'en-IN',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Today',
        url: '/dashboard',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Grocery list',
        url: '/grocery',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Log weight',
        url: '/progress',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
