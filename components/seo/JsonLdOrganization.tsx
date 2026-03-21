import { getBaseUrl, SITE_NAME } from '../../lib/seo';

export default function JsonLdOrganization() {
  const base = getBaseUrl();
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: base,
    logo: `${base}/svg/logo.svg`,
    image: `${base}/svg/logo.svg`,
    description: 'Інтернет-магазин аніме атрибутики. Плакати, наклейки, мерч.',
    sameAs: [
      'https://t.me/amaterasuanimeshop',
      'https://instagram.com/amaterasu1shop',
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
