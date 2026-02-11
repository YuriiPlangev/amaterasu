import React from 'react';
import NextTopLoader from 'nextjs-toploader';

export const dynamic = 'force-dynamic';
import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'Amaterasu',
  description: 'Anime Shop',
  icons: {
    icon: '/svg/favicon.svg',
    shortcut: '/svg/favicon.svg',
    apple: '/svg/favicon.svg',
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
