import type { Metadata } from 'next';

type Locale = 'uk' | 'en';

const CONTENT: Record<Locale, {
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; points: string[] }[];
}> = {
  uk: {
    title: 'Політика Cookie',
    updated: 'Оновлено: 10 березня 2026 року',
    intro:
      'Ця політика пояснює, як сайт Amaterasu використовує cookie-файли та схожі технології. Використовуючи сайт, ви погоджуєтесь з використанням необхідних cookie. Для аналітичних і маркетингових cookie ми запитуємо окрему згоду, коли це вимагається законом.',
    sections: [
      {
        heading: '1. Що таке cookie',
        points: [
          'Cookie - це невеликий файл, який зберігається у вашому браузері.',
          'Cookie допомагають запам\'ятовувати ваші налаштування, підтримувати сесію та покращувати роботу сайту.',
        ],
      },
      {
        heading: '2. Які cookie ми використовуємо',
        points: [
          'Необхідні: авторизація, кошик, безпека, робота базових функцій сайту.',
          'Функціональні: збереження мови інтерфейсу та користувацьких налаштувань.',
          'Аналітичні: статистика відвідувань і поведінки для покращення сервісу.',
          'Маркетингові: оцінка ефективності рекламних кампаній (за наявності таких інструментів).',
        ],
      },
      {
        heading: '3. Строки зберігання',
        points: [
          'Сесійні cookie видаляються після закриття браузера.',
          'Постійні cookie зберігаються протягом строку, визначеного їх призначенням, або до їх ручного видалення.',
        ],
      },
      {
        heading: '4. Керування cookie',
        points: [
          'Ви можете змінити налаштування cookie у своєму браузері.',
          'Блокування необхідних cookie може вплинути на коректну роботу сайту.',
          'Ви можете відкликати згоду на необов\'язкові cookie у будь-який момент через налаштування сайту (за наявності банера керування згодами).',
        ],
      },
      {
        heading: '5. Сторонні сервіси',
        points: [
          'Ми можемо використовувати сторонні інструменти аналітики та оплати, які також застосовують cookie.',
          'Такі сервіси обробляють дані згідно з власними політиками конфіденційності.',
        ],
      },
    ],
  },
  en: {
    title: 'Cookie Policy',
    updated: 'Last updated: March 10, 2026',
    intro:
      'This policy explains how Amaterasu uses cookies and similar technologies. By using the website, you accept strictly necessary cookies. Where required by law, we request separate consent for analytics and marketing cookies.',
    sections: [
      {
        heading: '1. What cookies are',
        points: [
          'Cookies are small files stored in your browser.',
          'They help remember settings, keep sessions active, and improve site performance.',
        ],
      },
      {
        heading: '2. Types of cookies we use',
        points: [
          'Strictly necessary: authentication, cart, security, core functionality.',
          'Functional: language and preference storage.',
          'Analytics: visitor statistics and behavior analysis.',
          'Marketing: campaign effectiveness measurement (if enabled).',
        ],
      },
      {
        heading: '3. Retention',
        points: [
          'Session cookies are deleted when you close your browser.',
          'Persistent cookies remain for a defined period or until manually deleted.',
        ],
      },
      {
        heading: '4. Managing cookies',
        points: [
          'You can configure cookie settings in your browser.',
          'Blocking necessary cookies may affect website functionality.',
          'You can withdraw consent for non-essential cookies at any time via consent settings (if available).',
        ],
      },
      {
        heading: '5. Third-party services',
        points: [
          'We may use third-party analytics and payment tools that also set cookies.',
          'Such services process data according to their own privacy policies.',
        ],
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const isUk = locale === 'uk';
  return {
    title: isUk ? 'Політика Cookie' : 'Cookie Policy',
    description: isUk
      ? 'Інформація про використання cookie-файлів на сайті Amaterasu.'
      : 'Information about cookie usage on the Amaterasu website.',
  };
}

export default async function CookiesPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const { locale } = await Promise.resolve(params);
  const content = CONTENT[(locale === 'uk' ? 'uk' : 'en') as Locale];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] w-full mx-auto site-padding-x py-12 md:py-16 mt-12">
        <h1 className="text-[clamp(28px,3vw,44px)] font-bold uppercase text-[#1C1C1C] mb-2">
          {content.title}
        </h1>
        <p className="text-[#6B7280] text-sm mb-6">{content.updated}</p>
        <p className="text-[#374151] text-[15px] leading-relaxed mb-8">{content.intro}</p>

        <div className="space-y-8">
          {content.sections.map((section) => (
            <section key={section.heading} className="rounded-2xl border border-[#E5E7EB] p-6 md:p-8 bg-white">
              <h2 className="text-[clamp(18px,2vw,26px)] font-bold text-[#1C1C1C] mb-4">{section.heading}</h2>
              <ul className="space-y-2 text-[#374151] text-[15px] leading-relaxed">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="text-[#9C0000] font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
