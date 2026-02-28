import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import CustomDesignPreview from '../../../../components/CustomDesignPreview';

export default async function CustomOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }> | { locale: string; slug: string };
  searchParams?: Promise<{ category?: string }> | { category?: string };
}) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const t = await getTranslations('customOrder');
  const categoryName = resolvedSearchParams?.category || t('defaultCategory');

  return (
    <div className="max-w-[1280px] w-full mx-auto site-padding-x py-10 mt-24">
      <div className="mb-6 text-sm text-[#6B7280]">
        <Link href={`/${locale}/catalog`} className="hover:text-[#1C1C1C]">{t('backToCatalog')}</Link>
      </div>

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 md:p-8">
        <p className="inline-flex items-center rounded-md bg-[#9C0000] text-white px-3 py-1 text-sm font-semibold mb-4">
          {t('badge')}
        </p>
        <h1 className="text-[clamp(24px,2.5vw,36px)] font-bold text-[#1C1C1C] mb-3">
          {categoryName}: {t('title')}
        </h1>
        <p className="text-[#4B5563] text-base md:text-lg leading-relaxed mb-8">
          {t('description')}
        </p>

        <CustomDesignPreview categoryName={categoryName} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-[#E5E7EB] p-4">
            <h2 className="font-semibold text-[#1C1C1C] mb-2">{t('howTitle')}</h2>
            <p className="text-[#4B5563] text-sm leading-relaxed">{t('howText')}</p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] p-4">
            <h2 className="font-semibold text-[#1C1C1C] mb-2">{t('termsTitle')}</h2>
            <p className="text-[#4B5563] text-sm leading-relaxed">{t('termsText')}</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-4 md:p-5">
          <h3 className="font-semibold text-[#1C1C1C] mb-2">{t('contactTitle')}</h3>
          <p className="text-[#4B5563] text-sm mb-4">{t('contactText')}</p>
          <a
            href="https://t.me/amaterasu1shop"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[#9C0000] text-white px-5 py-2.5 font-semibold"
          >
            {t('contactButton')}
          </a>
        </div>
      </section>
    </div>
  );
}
