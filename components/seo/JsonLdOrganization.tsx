import { getBaseUrl, SITE_NAME } from '../../lib/seo';

export default function JsonLdOrganization() {
  const base = getBaseUrl();
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: base,
    logo: `${base}/svg/logo.svg`,
    image: `${base}/svg/logo.svg`,
    description: 'Аніме магазин у Білгороді-Дністровському. Плакати, наклейки, мерч.',
    sameAs: [
      'https://t.me/amaterasuanimeshop',
      'https://instagram.com/amaterasu1shop',
    ],
  };

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: `${SITE_NAME} — Аніме магазин`,
    url: base,
    image: `${base}/svg/logo.svg`,
    description: 'Аніме магазин у Білгороді-Дністровському. Плакати, наклейки, мерч. Доставка по Україні.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bilhorod-Dnistrovskyi',
      addressRegion: 'Odesa Oblast',
      addressCountry: 'UA',
      streetAddress: 'Lomonosova St., building 2, apt. 30',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Ukraine',
    },
    sameAs: [
      'https://t.me/amaterasuanimeshop',
      'https://instagram.com/amaterasu1shop',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
    </>
  );
}
