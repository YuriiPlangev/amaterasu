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
        ? 'Contact Amaterasu: Telegram, Instagram, support hours.'
        : 'Контакти Amaterasu: Telegram, Instagram, години роботи підтримки.',
  };
}

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
