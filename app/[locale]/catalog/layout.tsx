import type { Metadata } from 'next';

const titles: Record<string, string> = {
  uk: 'Каталог',
  en: 'Catalog',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  return {
    title: titles[locale] || titles.uk,
    description:
      locale === 'en'
        ? 'Browse anime merchandise: posters, stickers, apparel. Filter by title, character, genre.'
        : 'Каталог аніме атрибутики: плакати, наклейки, мерч. Фільтри за тайтлом, персонажем, жанром.',
  };
}

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
