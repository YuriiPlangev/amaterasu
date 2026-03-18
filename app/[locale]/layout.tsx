import React from 'react';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';
import { absoluteUrl } from '../../lib/seo';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SkipLink from '../../components/SkipLink';
import SetDocumentLang from '../../components/SetDocumentLang';
import JsonLdOrganization from '../../components/seo/JsonLdOrganization';
import ScrollToTopButton from '../../components/ScrollToTopButton';

export const dynamic = 'force-dynamic';

const TITLES: Record<string, string> = {
  uk: 'Amaterasu — Аніме магазин',
  en: 'Amaterasu — Anime Shop',
};

const DESCRIPTIONS: Record<string, string> = {
  uk: 'Інтернет-магазин аніме атрибутики. Плакати, наклейки, мерч з улюблених аніме та можливість замовити індивідуальний дизайн. Доставка по Україні.',
  en: 'Anime merchandise shop. Posters, stickers, merch from your favorite anime and custom design orders. Delivery across Ukraine.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  if (!locales.includes(locale as any)) return {};
  const path = `/${locale}`;
  return {
    title: TITLES[locale] || TITLES.uk,
    description: DESCRIPTIONS[locale] || DESCRIPTIONS.uk,
    alternates: {
      canonical: absoluteUrl(path),
      languages: {
        'uk': absoluteUrl('/uk'),
        'en': absoluteUrl('/en'),
      },
    },
    openGraph: {
      title: TITLES[locale] || TITLES.uk,
      description: DESCRIPTIONS[locale] || DESCRIPTIONS.uk,
      url: absoluteUrl(path),
      locale: locale === 'uk' ? 'uk_UA' : 'en_GB',
      alternateLocale: locale === 'uk' ? 'en_GB' : 'uk_UA',
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <JsonLdOrganization />
      <SetDocumentLang />
      <SkipLink />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <ScrollToTopButton />
      </div>
    </NextIntlClientProvider>
  );
}

