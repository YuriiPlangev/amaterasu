'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const PhoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const EmailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const MapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function ContactsPage() {
  const t = useTranslations('contacts');
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1920px] w-full mx-auto site-padding-x py-12 md:py-16 mt-12">
        <h1 className="text-[clamp(28px,3vw,44px)] font-bold uppercase text-[#1C1C1C] mb-2">
          {t('title')}
        </h1>
        <p className="text-[#6B7280] text-base mb-10">
          {t('subtitle')}
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 min-w-0">
          <article className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow min-w-0 overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-[#9C0000]/10 flex items-center justify-center text-[#9C0000] mb-4">
              <PhoneIcon />
            </div>
            <h2 className="text-[clamp(18px,1.5vw,22px)] font-bold text-[#1C1C1C] mb-3">
              {t('support')}
            </h2>
            <p className="text-[#6B7280] text-sm mb-4">
              {t('supportHours')}
            </p>
            <ul className="space-y-3 text-[#374151] text-[15px]">
              <li className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                <span className="text-[#9C0000] font-semibold shrink-0">{t('phone')}</span>
                <a href="tel:+380685499690" className="hover:text-[#9C0000] transition-colors break-all">
                  +38 (068) 549‑96‑90
                </a>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                <span className="text-[#9C0000] font-semibold shrink-0">{t('email')}</span>
                <a href="mailto:amaterasuanimeshop@gmail.com" className="hover:text-[#9C0000] transition-colors break-all">
                  amaterasuanimeshop@gmail.com
                </a>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                <span className="text-[#9C0000] font-semibold shrink-0">{t('telegram')}</span>
                <a href="https://t.me/amaterasuAnimeShopBot" target="_blank" rel="noopener noreferrer" className="hover:text-[#9C0000] transition-colors break-all">
                  @amaterasuAnimeShopBot
                </a>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                <span className="text-[#9C0000] font-semibold shrink-0">{t('instagram')}</span>
                <a href="https://instagram.com/amaterasu_anime_shop" target="_blank" rel="noopener noreferrer" className="hover:text-[#9C0000] transition-colors break-all">
                  @amaterasu_anime_shop
                </a>
              </li>
            </ul>
          </article>

          <article className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow min-w-0 overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-[#9C0000]/10 flex items-center justify-center text-[#9C0000] mb-4">
              <MapIcon />
            </div>
            <h2 className="text-[clamp(18px,1.5vw,22px)] font-bold text-[#1C1C1C] mb-3">
              {t('address')}
            </h2>
            <p className="text-[#374151] text-[15px]">
              {t('addressCity')}
            </p>
            <p className="text-[#6B7280] text-sm mt-1">
              {t('addressNote')}
            </p>
          </article>

          <article className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1 min-w-0 overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-[#9C0000]/10 flex items-center justify-center text-[#9C0000] mb-4">
              <EmailIcon />
            </div>
            <h2 className="text-[clamp(18px,1.5vw,22px)] font-bold text-[#1C1C1C] mb-3">
              {t('socials')}
            </h2>
            <p className="text-[#374151] text-[15px] mb-4 break-all">
            <a href="https://instagram.com/amaterasu_anime_shop" target="_blank" rel="noopener noreferrer" className="hover:text-[#9C0000] transition-colors">
              @amaterasu_anime_shop
            </a>
            </p>
            <a
              href="https://t.me/amaterasuAnimeShopBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1C1C] text-white rounded-xl font-semibold text-sm hover:bg-[#9C0000] transition-colors"
            >
              <Image src="/svg/tg.svg" alt="" width={20} height={20} />
              {t('writeTelegram')}
            </a>
          </article>
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-[#1C1C1C] to-[#333] text-white">
          <p className="font-semibold text-lg mb-1">{t('fastReply')}</p>
          <p className="text-white/80 text-sm mb-4">
            {t('fastReplyText')}
          </p>
          <Link
            href="https://t.me/amaterasuAnimeShopBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#9C0000] font-semibold hover:underline"
          >
            <Image src="/svg/tg.svg" alt="" width={20} height={20} className="brightness-0 invert" />
            {t('goToChat')}
          </Link>
        </div>
      </div>
    </div>
  );
}
