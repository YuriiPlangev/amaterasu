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
    title: 'Повернення та обмін',
    updated: 'Оновлено: 11 березня 2026 року',
    intro:
      'Повернення і обмін товарів здійснюються відповідно до Закону України "Про захист прав споживачів". Нижче наведено базові правила для замовлень, оформлених на сайті Amaterasu.',
    sections: [
      {
        heading: '1. Строк повернення',
        points: [
          'Покупець має право повернути товар належної якості протягом 14 календарних днів з моменту отримання.',
          'День отримання товару не враховується у 14-денний строк.',
        ],
      },
      {
        heading: '2. Умови повернення товару належної якості',
        points: [
          'Товар не був у використанні та збережено його товарний вигляд.',
          'Збережено споживчі властивості, комплектність, пломби, ярлики та пакування (за наявності).',
          'Наявний документ, що підтверджує факт придбання (чек, накладна або інше підтвердження замовлення).',
        ],
      },
      {
        heading: '3. Товари, що не підлягають поверненню',
        points: [
          'Перелік таких товарів визначається законодавством України.',
          'Індивідуально виготовлені товари (кастомний дизайн) можуть не підлягати поверненню, якщо це прямо дозволено законодавством.',
        ],
      },
      {
        heading: '4. Товар неналежної якості',
        points: [
          'У разі виявлення недоліків покупець має право вимагати обмін, безоплатне усунення недоліків, зменшення ціни або повернення коштів - згідно із законом.',
          'Для розгляду звернення може знадобитися фото/відео підтвердження або огляд товару.',
        ],
      },
      {
        heading: '5. Порядок повернення коштів',
        points: [
          'Після підтвердження повернення кошти повертаються способом, погодженим з покупцем.',
          'Строк повернення коштів залежить від платіжного методу та банку, зазвичай до 7 банківських днів після погодження.',
        ],
      },
      {
        heading: '6. Витрати на доставку',
        points: [
          'Якщо повернення здійснюється через відмову від товару належної якості, витрати на зворотну доставку, як правило, несе покупець.',
          'Якщо повернення пов\'язане з недоліками товару або помилкою продавця, витрати на доставку компенсуються продавцем.',
        ],
      },
    ],
    contact:
      'Щоб оформити повернення або подати претензію, зверніться: +38 (068) 549-96-90 або Telegram: @amaterasu1shop.',
  },
  en: {
    title: 'Returns & Exchange Policy',
    updated: 'Last updated: March 11, 2026',
    intro:
      'Returns and exchanges are processed in accordance with the Law of Ukraine "On Consumer Rights Protection". The rules below apply to orders placed on the Amaterasu website.',
    sections: [
      {
        heading: '1. Return period',
        points: [
          'The buyer may return goods of proper quality within 14 calendar days from receipt.',
          'The day of receipt is not counted in the 14-day period.',
        ],
      },
      {
        heading: '2. Conditions for returning proper-quality goods',
        points: [
          'The product has not been used and remains in sellable condition.',
          'Consumer properties, completeness, labels, seals, and packaging (if applicable) are preserved.',
          'Proof of purchase is provided (receipt, shipping note, or order confirmation).',
        ],
      },
      {
        heading: '3. Non-returnable goods',
        points: [
          'The list of non-returnable goods is defined by Ukrainian law.',
          'Custom-made goods may be non-returnable where legally permitted.',
        ],
      },
      {
        heading: '4. Defective goods',
        points: [
          'If defects are found, the buyer may request exchange, free repair, price reduction, or refund as provided by law.',
          'Photo/video evidence or product inspection may be required to process the claim.',
        ],
      },
      {
        heading: '5. Refund procedure',
        points: [
          'After return approval, funds are refunded using an agreed method.',
          'Refund timing depends on payment method and bank processing, usually up to 7 banking days after approval.',
        ],
      },
      {
        heading: '6. Shipping costs',
        points: [
          'For voluntary returns of proper-quality goods, return shipping is usually paid by the buyer.',
          'If return is due to defects or seller error, shipping costs are reimbursed by the seller.',
        ],
      },
    ],
    contact:
      'To request a return or file a complaint, contact: +38 (068) 549-96-90 or Telegram: @amaterasu1shop.',
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
    title: isUk ? 'Повернення та обмін' : 'Returns & Exchange',
    description: isUk
      ? 'Умови повернення та обміну товарів відповідно до законодавства України.'
      : 'Product return and exchange terms in accordance with Ukrainian law.',
  };
}

export default async function ReturnsPolicyPage({
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
