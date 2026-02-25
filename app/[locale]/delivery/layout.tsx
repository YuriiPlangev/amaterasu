import type { Metadata } from 'next';

const titles: Record<string, string> = {
  uk: 'Доставка і оплата',
  en: 'Delivery and Payment',
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
        ? 'Delivery across Ukraine, payment options, return policy.'
        : 'Доставка по Україні, способи оплати, умови повернення.',
  };
}

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
