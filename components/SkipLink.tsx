'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function SkipLink() {
  const pathname = usePathname();
  const t = useTranslations('a11y');
  return (
    <Link
      href={`${pathname || '/'}#main-content`}
      className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-3 focus:bg-[#9C0000] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:clip-auto"
    >
      {t('skipToContent')}
    </Link>
  );
}
