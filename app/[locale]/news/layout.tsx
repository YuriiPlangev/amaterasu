import type { Metadata } from 'next';

const titles: Record<string, string> = {
  uk: 'Новини та акції',
  en: 'News and Promotions',
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
        ? 'Latest news and promotions from Amaterasu anime shop.'
        : 'Новини та акції інтернет-магазину аніме атрибутики Amaterasu.',
  };
}

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
