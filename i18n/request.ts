import { getRequestConfig } from 'next-intl/server';
import { locales } from '../i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = locales.includes(requested as (typeof locales)[number]) ? requested : 'uk';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
