'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export default function SetDocumentLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === 'uk' ? 'uk' : 'en';
  }, [locale]);
  return null;
}
