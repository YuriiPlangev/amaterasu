import { absoluteUrl } from '../../lib/seo';

type Item = { name: string; path: string };

export default function JsonLdBreadcrumb({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const base = absoluteUrl('');
  const list = items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `${base}/${locale}${item.path}`,
  }));
  const json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
