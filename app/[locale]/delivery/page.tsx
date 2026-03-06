'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

const DeliveryIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const PaymentIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const ReturnIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

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
            <div className="w-14 h-14 rounded-xl bg-[#9C0000]/10 flex items-center justify-center text-[#9C0000] mb-5">
              <DeliveryIcon />
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
            <div className="w-14 h-14 rounded-xl bg-[#9C0000]/10 flex items-center justify-center text-[#9C0000] mb-5">
              <PaymentIcon />
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
            <div className="w-14 h-14 rounded-xl bg-[#9C0000]/10 flex items-center justify-center text-[#9C0000] mb-5">
              <ReturnIcon />
            </div>
            <h2 className="text-[clamp(18px,1.5vw,22px)] font-bold text-[#1C1C1C] mb-3">
              {t('return')}
            </h2>
            <p className="text-[#374151] text-[15px] leading-relaxed">
              {t('returnText')}{' '}
              <a
                href="https://t.me/amaterasuAnimeShopBot"
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
