import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { getSiteUrl } from '@/lib/siteUrl';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Aahar Sathi — Personalised Indian diet plans',
    template: '%s | Aahar Sathi',
  },
  description:
    'Get a personalised 7-day Indian meal plan with calorie and macro targets, a grocery list, a water tracker and progress charts. Built around home-style Indian food.',
  keywords: [
    'Indian diet plan',
    'Indian meal planner',
    'calorie calculator India',
    'vegetarian diet plan',
    'weight loss diet India',
    'macro calculator',
  ],
  applicationName: 'Aahar Sathi',
  authors: [{ name: 'Aahar Sathi' }],
  openGraph: {
    type: 'website',
    siteName: 'Aahar Sathi',
    locale: 'en_IN',
    url: siteUrl,
    title: 'Aahar Sathi — Personalised Indian diet plans',
    description:
      'A 7-day Indian meal plan built for your body, your goal and your kitchen — with macros, a grocery list and progress tracking.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aahar Sathi — Personalised Indian diet plans',
    description:
      'A 7-day Indian meal plan built for your body, your goal and your kitchen — with macros, a grocery list and progress tracking.',
  },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#0a0b0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-dvh antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
