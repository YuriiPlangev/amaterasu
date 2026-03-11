import type { Metadata } from 'next';

type Locale = 'uk' | 'en';

const CONTENT: Record<Locale, {
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; points: string[] }[];
  contact: string;
}> = {
  uk: {
    title: 'Політика конфіденційності',
    updated: 'Оновлено: 11 березня 2026 року',
    intro:
      'Ця Політика конфіденційності описує, як магазин Amaterasu обробляє персональні дані користувачів відповідно до Закону України "Про захист персональних даних" та Закону України "Про електронну комерцію".',
    sections: [
      {
        heading: '1. Які дані ми збираємо',
        points: [
          'Реєстраційні дані: ім\'я користувача, email, номер телефону.',
          'Дані замовлення: ПІБ, адреса доставки, місто, індекс, коментар до замовлення.',
          'Технічні дані: IP-адреса, тип пристрою, браузер, cookie-файли.',
          'Дані взаємодії: історія замовлень, обрані товари, звернення до підтримки.',
        ],
      },
      {
        heading: '2. Мета обробки',
        points: [
          'Оформлення, оплата, доставка і супровід замовлень.',
          'Надання доступу до особистого кабінету та авторизації.',
          'Підтримка користувачів, розгляд звернень і претензій.',
          'Аналітика та покращення сервісу, запобігання шахрайству.',
          'Виконання вимог законодавства України.',
        ],
      },
      {
        heading: '3. Правові підстави',
        points: [
          'Виконання договору купівлі-продажу (публічної оферти).',
          'Ваша згода на обробку персональних даних.',
          'Виконання обов\'язків, передбачених законодавством.',
          'Законний інтерес продавця для забезпечення безпеки сервісу.',
        ],
      },
      {
        heading: '4. Кому можуть передаватися дані',
        points: [
          'Платіжним провайдерам для обробки платежів.',
          'Службам доставки (наприклад, Нова Пошта, Укрпошта).',
          'Постачальникам технічної інфраструктури (хостинг, аналітика, CRM).',
          'Державним органам у випадках, прямо передбачених законом.',
        ],
      },
      {
        heading: '5. Строки зберігання',
        points: [
          'Персональні дані зберігаються не довше, ніж це необхідно для цілей обробки.',
          'Дані, пов\'язані з фінансовими та податковими документами, зберігаються протягом строків, визначених законодавством України.',
        ],
      },
      {
        heading: '6. Ваші права',
        points: [
          'Знати джерела збору, місцезнаходження даних та мету обробки.',
          'Отримувати доступ до своїх персональних даних.',
          'Вимагати виправлення, оновлення або видалення даних.',
          'Відкликати згоду на обробку (якщо обробка базується на згоді).',
          'Подати скаргу до Уповноваженого Верховної Ради України з прав людини або до суду.',
        ],
      },
      {
        heading: '7. Захист даних',
        points: [
          'Ми застосовуємо технічні та організаційні заходи для захисту даних від несанкціонованого доступу, зміни або втрати.',
          'Доступ до персональних даних надається лише уповноваженим особам, які зобов\'язані дотримуватися конфіденційності.',
        ],
      },
    ],
    contact:
      'З питань обробки персональних даних і претензій звертайтесь: +38 (068) 549-96-90 або Telegram: @amaterasu1shop.',
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: March 11, 2026',
    intro:
      'This Privacy Policy describes how Amaterasu processes personal data in accordance with Ukrainian data protection and e-commerce laws.',
    sections: [
      {
        heading: '1. Data we collect',
        points: [
          'Account data: username, email, phone number.',
          'Order data: full name, shipping address, city, postal code, order notes.',
          'Technical data: IP address, device type, browser, cookies.',
          'Interaction data: order history, favorites, support requests.',
        ],
      },
      {
        heading: '2. Processing purposes',
        points: [
          'Order placement, payment, delivery, and after-sales support.',
          'Providing account and authentication features.',
          'Customer support and complaint handling.',
          'Service analytics, quality improvement, and fraud prevention.',
          'Compliance with Ukrainian law.',
        ],
      },
      {
        heading: '3. Legal grounds',
        points: [
          'Performance of a purchase agreement (public offer).',
          'Your consent where applicable.',
          'Legal obligations under applicable law.',
          'Legitimate interest in maintaining service security.',
        ],
      },
      {
        heading: '4. Data sharing',
        points: [
          'Payment providers for payment processing.',
          'Delivery providers (for example, Nova Poshta, Ukrposhta).',
          'Infrastructure providers (hosting, analytics, CRM).',
          'Public authorities when required by law.',
        ],
      },
      {
        heading: '5. Retention period',
        points: [
          'Personal data is retained only as long as needed for processing purposes.',
          'Tax and accounting related data is retained for statutory periods required by Ukrainian law.',
        ],
      },
      {
        heading: '6. Your rights',
        points: [
          'Be informed about data sources, location, and processing purposes.',
          'Access your personal data.',
          'Request correction, update, or deletion of data.',
          'Withdraw consent where processing is consent-based.',
          'Lodge a complaint with the Ukrainian Parliament Commissioner for Human Rights or in court.',
        ],
      },
      {
        heading: '7. Security',
        points: [
          'We use technical and organizational safeguards to protect personal data.',
          'Access is limited to authorized personnel bound by confidentiality obligations.',
        ],
      },
    ],
    contact:
      'For personal data requests and complaints contact: +38 (068) 549-96-90 or Telegram: @amaterasu1shop.',
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
    title: isUk ? 'Політика конфіденційності' : 'Privacy Policy',
    description: isUk
      ? 'Політика обробки персональних даних магазину Amaterasu відповідно до законодавства України.'
      : 'Personal data processing policy of Amaterasu in line with Ukrainian law.',
  };
}

export default async function PrivacyPolicyPage({
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

        <p className="mt-8 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-4 text-[#374151] text-[15px]">
          {content.contact}
        </p>
      </div>
    </div>
  );
}
