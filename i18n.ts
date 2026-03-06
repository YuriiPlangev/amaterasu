import { getRequestConfig } from 'next-intl/server';

export const locales = ['uk', 'en'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = locales.includes(requested as Locale) ? (requested as Locale) : 'uk';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});


