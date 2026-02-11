import React from 'react';
import { Noto_Sans } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import Providers from '../components/Providers';

const notoSans = Noto_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '500', '600', '700'],
  display: 'swap',
});

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
      <body className={notoSans.className}>
        <NextTopLoader color="#9C0000" height={3} showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
