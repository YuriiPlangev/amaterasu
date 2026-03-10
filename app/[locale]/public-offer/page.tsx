import type { Metadata } from 'next';

type Locale = 'uk' | 'en';

const CONTENT: Record<Locale, {
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; points: string[] }[];
  note: string;
}> = {
  uk: {
    title: 'Публічна оферта',
    updated: 'Оновлено: 10 березня 2026 року',
    intro:
      'Цей документ є публічною офертою відповідно до ст. 633, 641, 642 Цивільного кодексу України і визначає умови дистанційного продажу товарів через сайт Amaterasu.',
    sections: [
      {
        heading: '1. Предмет договору',
        points: [
          'Продавець зобов\'язується передати товар у власність покупця, а покупець - прийняти та оплатити товар.',
          'Опис товару, ціна та доступність вказуються на сторінках каталогу.',
        ],
      },
      {
        heading: '2. Порядок оформлення замовлення',
        points: [
          'Покупець оформлює замовлення через кошик на сайті.',
          'Після оформлення продавець може зв\'язатися для уточнення деталей.',
          'Договір вважається укладеним з моменту підтвердження замовлення продавцем та/або факту оплати (залежно від обраного способу оплати).',
        ],
      },
      {
        heading: '3. Ціна та оплата',
        points: [
          'Ціни на сайті вказуються у гривні (UAH).',
          'Оплата здійснюється способами, доступними під час оформлення замовлення (картка онлайн, післяплата тощо).',
          'Продавець має право змінювати ціни до моменту підтвердження конкретного замовлення.',
        ],
      },
      {
        heading: '4. Доставка',
        points: [
          'Доставка здійснюється по Україні службами доставки, вказаними на сайті.',
          'Строки доставки залежать від оператора доставки та населеного пункту.',
          'Ризик випадкового пошкодження або втрати товару переходить до покупця з моменту передачі відправлення перевізнику, якщо інше не встановлено законом.',
        ],
      },
      {
        heading: '5. Повернення та обмін',
        points: [
          'Умови повернення визначені окремою сторінкою "Повернення та обмін".',
          'Повернення здійснюється відповідно до Закону України "Про захист прав споживачів".',
        ],
      },
      {
        heading: '6. Права та обов\'язки сторін',
        points: [
          'Покупець зобов\'язаний надати коректні дані для доставки та зв\'язку.',
          'Продавець зобов\'язаний передати товар належної якості у погоджений строк.',
          'Сторони зобов\'язані добросовісно виконувати умови цього договору.',
        ],
      },
      {
        heading: '7. Відповідальність і форс-мажор',
        points: [
          'Сторони несуть відповідальність згідно з чинним законодавством України.',
          'Сторони звільняються від відповідальності за невиконання зобов\'язань у разі дії обставин непереборної сили (форс-мажор).',
        ],
      },
      {
        heading: '8. Персональні дані',
        points: [
          'Оформлюючи замовлення, покупець надає згоду на обробку персональних даних відповідно до Політики конфіденційності.',
        ],
      },
    ],
    note:
      'Для повної юридичної ідентифікації продавця (ФОП/ТОВ, код ЄДРПОУ/РНОКПП, адреса, банківські реквізити) рекомендується додати окремий блок реквізитів після надання актуальних даних.',
  },
  en: {
    title: 'Public Offer',
    updated: 'Last updated: March 10, 2026',
    intro:
      'This document is a public offer under Articles 633, 641, and 642 of the Civil Code of Ukraine and defines distance sales terms for goods sold via the Amaterasu website.',
    sections: [
      {
        heading: '1. Subject of agreement',
        points: [
          'The seller agrees to transfer goods to the buyer, and the buyer agrees to accept and pay for them.',
          'Product details, price, and availability are shown in the catalog.',
        ],
      },
      {
        heading: '2. Order placement',
        points: [
          'The buyer places an order through the website cart.',
          'The seller may contact the buyer to clarify order details.',
          'The agreement is concluded once the order is confirmed by the seller and/or payment is made depending on the selected method.',
        ],
      },
      {
        heading: '3. Pricing and payment',
        points: [
          'Prices are listed in UAH.',
          'Payment methods are presented at checkout (online card, cash on delivery, etc.).',
          'The seller may change prices before a specific order is confirmed.',
        ],
      },
      {
        heading: '4. Delivery',
        points: [
          'Delivery is available across Ukraine via shipping providers listed on the website.',
          'Delivery times depend on the shipping provider and destination.',
          'Risk of accidental loss or damage may pass to the buyer upon handover to the carrier unless otherwise required by law.',
        ],
      },
      {
        heading: '5. Returns and exchange',
        points: [
          'Return conditions are provided on the dedicated Returns & Exchange page.',
          'Returns are processed in accordance with the Law of Ukraine "On Consumer Rights Protection".',
        ],
      },
      {
        heading: '6. Rights and obligations',
        points: [
          'The buyer must provide correct delivery and contact information.',
          'The seller must deliver goods of proper quality within agreed timelines.',
          'Both parties must act in good faith and comply with this agreement.',
        ],
      },
      {
        heading: '7. Liability and force majeure',
        points: [
          'Parties are liable according to Ukrainian law.',
          'Parties are released from liability for non-performance caused by force majeure.',
        ],
      },
      {
        heading: '8. Personal data',
        points: [
          'By placing an order, the buyer consents to personal data processing in accordance with the Privacy Policy.',
        ],
      },
    ],
    note:
      'For full legal identification of the seller (sole proprietor/company details, registration code, address, bank details), add a dedicated legal entity block once final details are approved.',
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
    title: isUk ? 'Публічна оферта' : 'Public Offer',
    description: isUk
      ? 'Умови дистанційного продажу товарів через сайт Amaterasu.'
      : 'Distance sales terms for goods purchased via Amaterasu website.',
  };
}

export default async function PublicOfferPage({
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

        <p className="mt-8 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] p-4 text-[#7C2D12] text-[15px]">
          {content.note}
        </p>
      </div>
    </div>
  );
}
