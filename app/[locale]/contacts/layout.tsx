import type { Metadata } from 'next';

const titles: Record<string, string> = {
  uk: 'Контакти',
  en: 'Contacts',
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
        ? 'Contact Amaterasu anime shop in Bilhorod-Dnistrovskyi: Telegram, Instagram, support hours.'
        : 'Контакти Amaterasu — аніме магазин у Білгороді-Дністровському: Telegram, Instagram, години роботи підтримки.',
  };
}

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
