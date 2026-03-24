'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function DeliveryPage() {
  const t = useTranslations('delivery');
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1920px] w-full mx-auto site-padding-x py-12 md:py-16 mt-12">
        <h1 className="text-[clamp(28px,3vw,44px)] font-bold uppercase text-[#1C1C1C] mb-2">
          {t('title')}
        </h1>
        <p className="text-[#6B7280] text-base mb-10">
          {t('subtitle')}
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-[#9C0000]/10 flex items-center justify-center mb-5">
              <Image src="/svg/delivery.svg" alt="" width={32} height={32} className="object-contain" />
            </div>
            <h2 className="text-[clamp(18px,1.5vw,22px)] font-bold text-[#1C1C1C] mb-3">
              {t('delivery')}
            </h2>
            <ul className="space-y-3 text-[#374151] text-[15px] leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[#9C0000] font-bold">•</span>
                {t('delivery1')}
              </li>
              <li className="flex gap-2">
                <span className="text-[#9C0000] font-bold">•</span>
                {t('delivery2')}
              </li>
              <li className="flex gap-2">
                <span className="text-[#9C0000] font-bold">•</span>
                {t('delivery3')}
              </li>
            </ul>
          </article>

          <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-[#9C0000]/10 flex items-center justify-center mb-5">
              <Image src="/svg/pay.svg" alt="" width={32} height={32} className="object-contain" />
            </div>
            <h2 className="text-[clamp(18px,1.5vw,22px)] font-bold text-[#1C1C1C] mb-3">
              {t('payment')}
            </h2>
            <ul className="space-y-3 text-[#374151] text-[15px] leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[#9C0000] font-bold">•</span>
                {t('payment1')}
              </li>
              <li className="flex gap-2">
                <span className="text-[#9C0000] font-bold">•</span>
                {t('payment2')}
              </li>
              <li className="flex gap-2">
                <span className="text-[#9C0000] font-bold">•</span>
                {t('payment3')}
              </li>
            </ul>
          </article>

          <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-[#9C0000]/10 flex items-center justify-center mb-5">
              <Image src="/svg/refund.svg" alt="" width={32} height={32} className="object-contain" />
            </div>
            <h2 className="text-[clamp(18px,1.5vw,22px)] font-bold text-[#1C1C1C] mb-3">
              {t('return')}
            </h2>
            <p className="text-[#374151] text-[15px] leading-relaxed">
              {t('returnText')}{' '}
              <a
                href="https://t.me/amaterasu1shop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9C0000] font-semibold hover:underline"
              >
                {t('returnLink')}
              </a>
              .
            </p>
          </article>
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-[#FFF7F7] border border-[#F5B7B7]">
          <p className="text-[15px] leading-relaxed mb-2 text-[#1C1C1C]">{t('splitParcels')}</p>
          <p className="text-[15px] leading-relaxed text-[#1C1C1C]">{t('splitParcelsManager')}</p>
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-[#1C1C1C] text-white">
          <p className="font-semibold text-lg mb-1">{t('questions')}</p>
          <p className="text-white/80 text-sm">
            {t('questionsText')}
          </p>
          <a
            href="https://t.me/amaterasu1shop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-[#9C0000] font-semibold hover:underline"
          >
            <Image src="/svg/tg.svg" alt="" width={20} height={20} className=" brightness-0 invert" />
            @amaterasu1shop
          </a>
        </div>
      </div>
    </div>
  );
}
