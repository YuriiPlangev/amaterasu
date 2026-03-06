import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'uk'
});

export const config = {
  // Run middleware for all non-static pages so next-intl can resolve locale.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

