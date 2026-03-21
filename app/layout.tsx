import React from 'react';
import NextTopLoader from 'nextjs-toploader';

export const dynamic = 'force-dynamic';
import './globals.css';
import Providers from '../components/Providers';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://amaterasu-shop.com'),
  title: {
    default: 'Amaterasu | Anime Shop',
    template: '%s | Amaterasu',
  },
  description: 'Аніме магазин у Білгороді-Дністровському. Плакати, наклейки, мерч з улюблених аніме та індивідуальний дизайн. Доставка по Україні.',
  keywords: ['аніме', 'anime', 'магазин аніме', 'аніме магазин Белгород-Днестровский', 'аніме магазин Білгород-Дністровський', 'аніме мерч', 'плакати аніме', 'наклейки аніме', 'доставка Україна'],
  authors: [{ name: 'Amaterasu' }],
  openGraph: {
    type: 'website',
    siteName: 'Amaterasu',
    locale: 'uk_UA',
    alternateLocale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/svg/favicon.svg',
    shortcut: '/svg/favicon.svg',
    apple: '/svg/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
        <NextTopLoader color="#9C0000" height={3} showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
