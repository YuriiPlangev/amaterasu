'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('notFound');
  const locale = useLocale();
  const basePath = `/${locale}`;

  return (
    <div className="max-w-[1920px] w-full mx-auto site-padding-x py-16 md:py-24 min-h-[60vh] flex flex-col items-center justify-center">
      <div className="text-center max-w-lg">
        <p className="text-[#9C0000] font-bold text-7xl md:text-8xl mb-4">404</p>
        <h1 className="text-[clamp(24px,3vw,36px)] font-bold text-[#1C1C1C] mb-3">
          {t('title')}
        </h1>
        <p className="text-[#6B7280] text-base md:text-lg mb-10">
          {t('description')}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href={basePath}
            className="inline-block bg-[#9C0000] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#7D0000] transition-colors shadow-[0px_12px_28px_0px_#0000001A]"
          >
            {t('backHome')}
          </Link>
          <Link
            href={`${basePath}/catalog`}
            className="inline-block border-2 border-[#1C1C1C] text-[#1C1C1C] px-8 py-3 rounded-xl font-semibold hover:bg-[#1C1C1C] hover:text-white transition-colors"
          >
            {t('toCatalog')}
          </Link>
        </div>
      </div>
    </div>
  );
}
