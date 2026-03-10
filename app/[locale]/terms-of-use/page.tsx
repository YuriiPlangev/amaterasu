import type { Metadata } from 'next';

type Locale = 'uk' | 'en';

const CONTENT: Record<Locale, {
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; points: string[] }[];
}> = {
  uk: {
    title: 'Умови користування сайтом',
    updated: 'Оновлено: 10 березня 2026 року',
    intro:
      'Ці Умови користування регулюють доступ та використання сайту Amaterasu. Використовуючи сайт, ви підтверджуєте, що ознайомилися та погоджуєтесь із цими умовами.',
    sections: [
      {
        heading: '1. Загальні положення',
        points: [
          'Сайт є інформаційно-торговельною платформою для продажу товарів.',
          'Продавець має право змінювати контент, ціни та умови без попереднього повідомлення, якщо інше не передбачено законом.',
          'Подальше використання сайту після змін означає згоду з оновленою редакцією умов.',
        ],
      },
      {
        heading: '2. Реєстрація та акаунт',
        points: [
          'Користувач зобов\'язаний надавати достовірні дані під час реєстрації та замовлення.',
          'Користувач несе відповідальність за збереження даних доступу до акаунту.',
          'У разі підозри несанкціонованого доступу користувач повинен негайно звернутися до служби підтримки.',
        ],
      },
      {
        heading: '3. Правила використання сайту',
        points: [
          'Заборонено використовувати сайт для дій, що порушують законодавство України.',
          'Заборонено втручатися в роботу сайту, розповсюджувати шкідливе ПЗ або здійснювати несанкціонований доступ.',
          'Заборонено публікувати неправдиву, образливу або незаконну інформацію.',
        ],
      },
      {
        heading: '4. Інтелектуальна власність',
        points: [
          'Дизайн, тексти, графіка, логотипи та інші матеріали сайту охороняються законодавством про авторське право.',
          'Копіювання та використання матеріалів без письмового дозволу правовласника заборонено, крім випадків, передбачених законом.',
        ],
      },
      {
        heading: '5. Відповідальність',
        points: [
          'Продавець не несе відповідальності за перебої в роботі сайту, спричинені технічними збоями, діями третіх осіб або форс-мажором.',
          'Користувач несе відповідальність за порушення цих умов та чинного законодавства.',
        ],
      },
      {
        heading: '6. Застосовне право і спори',
        points: [
          'До цих умов застосовується законодавство України.',
          'Спори вирішуються шляхом переговорів, а у разі недосягнення згоди - у компетентному суді України.',
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Use',
    updated: 'Last updated: March 10, 2026',
    intro:
      'These Terms of Use govern access to and use of the Amaterasu website. By using the website, you confirm that you have read and accepted these terms.',
    sections: [
      {
        heading: '1. General provisions',
        points: [
          'The website is an information and e-commerce platform.',
          'The seller may update content, prices, and terms without prior notice unless otherwise required by law.',
          'Continued use after updates means acceptance of the revised terms.',
        ],
      },
      {
        heading: '2. Registration and account',
        points: [
          'Users must provide accurate data during registration and checkout.',
          'Users are responsible for protecting account credentials.',
          'If unauthorized access is suspected, users must contact support immediately.',
        ],
      },
      {
        heading: '3. Acceptable use',
        points: [
          'You must not use the website for activities that violate Ukrainian law.',
          'You must not disrupt website operation, spread malware, or attempt unauthorized access.',
          'You must not publish false, offensive, or unlawful information.',
        ],
      },
      {
        heading: '4. Intellectual property',
        points: [
          'Design, texts, graphics, logos, and other materials are protected by copyright law.',
          'Copying or reuse without written permission is prohibited except where legally allowed.',
        ],
      },
      {
        heading: '5. Liability',
        points: [
          'The seller is not liable for interruptions caused by technical failures, third parties, or force majeure.',
          'Users are liable for violations of these terms and applicable law.',
        ],
      },
      {
        heading: '6. Governing law and disputes',
        points: [
          'These terms are governed by Ukrainian law.',
          'Disputes should first be resolved through negotiation and then, if unresolved, by competent Ukrainian courts.',
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
    title: isUk ? 'Умови користування' : 'Terms of Use',
    description: isUk
      ? 'Правила використання сайту Amaterasu.'
      : 'Rules for using the Amaterasu website.',
  };
}

export default async function TermsOfUsePage({
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
