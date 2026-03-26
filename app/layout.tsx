import React from 'react';
import NextTopLoader from 'nextjs-toploader';

export const dynamic = 'force-dynamic';
import './globals.css';
import Providers from '../components/Providers';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.amaterasu.com.ua'),
  title: {
    default: 'Amaterasu | Anime Shop',
    template: '%s | Amaterasu',
  },
  description: 'Аніме магазин у Білгороді-Дністровському. Плакати, наклейки, мерч з улюблених аніме та індивідуальний дизайн. Доставка по Україні.',
  keywords: [
    'аніме',
    'anime',
    'магазин аніме',
    'аніме магазин',
    'аніме магазин Білгород-Дністровський',
    'аніме магазин Одеса',
    'аніме магазин Україна',
    'аніме магазин України',
    'аніме магазин Белгород-Днестровский',
    'аніме атрибутика',
    'аніме мерч',
    'мерч аніме',
    'купити аніме мерч',
    'купити мерч аніме',
    'anime merch Ukraine',
    'buy anime merch',
    'фігурки аніме',
    'фігурки anime',
    'купити фігурки аніме',
    'аніме фігурки Україна',
    'колекційні фігурки аніме',
    'статуетки аніме',
    'плакати аніме',
    'постери аніме',
    'аніме постери купити',
    'наклейки аніме',
    'стікери аніме',
    'аніме стікери',
    'значки аніме',
    'pins аніме',
    'брелоки аніме',
    'аніме брелок',
    'магніти аніме',
    'чашки аніме',
    'чашка з принтом',
    'чашка зі своїм дизайном',
    'чашка з власним дизайном',
    'чашка на замовлення',
    'друк на чашці',
    'сублімація чашка',
    'кастомна чашка',
    'створити чашку з дизайном',
    'індивідуальний дизайн',
    'мерч на замовлення',
    'кастомний мерч',
    'друк на сувенірах',
    'сувеніри аніме',
    'подарунок фанату аніме',
    'подарунок анімешнику',
    'косплей аксесуари',
    'manga мерч',
    'манга магазин',
    'фігурки аниме',
    'купить аниме мерч',
    'магазин аниме',
    'мерч anime',
    'чашка со своим дизайном',
    'постер аниме',
    'наклейки аниме',
    'аниме атрибутика Украина',
    'доставка мерч Україна',
    'доставка по Україні',
    'аматерасу',
    'Amaterasu shop',
    'anime shop Ukraine',
    'anime figures shop',
    'custom anime poster',
    'personalized anime gifts',
    'одяг аніме',
    'футболка аніме принт',
    'шопер аніме',
    'ручка аніме',
    'блокнот аніме',
    'кружка anime',
    'poster anime купить Киев Одеса',
    'аніме мерч Одеса область',
    'аніме Бессарабія',
    'geek магазин Україна',
    'otaku магазин',
    'оригінальні подарунки аніме',
    'рідкісний аніме мерч',
    'каталог аніме товарів',
    'замовити друк наклейок',
    'вінілові наклейки аніме',
    'переводные наклейки anime',
  ],
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
    icon: [
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/svg/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: [{ url: '/favicon-48.png', type: 'image/png' }],
    apple: [{ url: '/favicon-192.png', sizes: '192x192', type: 'image/png' }],
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
