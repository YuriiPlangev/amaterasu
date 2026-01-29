'use client';
import React, { useEffect, useState } from 'react';
import Logo from './ui/Logo';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const t = useTranslations('header');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Проверяем статус авторизации
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const switchLocale = (newLocale: string) => {
    // Получаем текущий путь без locale
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    // Создаем новый путь с новым locale
    const newPathname = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPathname);
    router.refresh();
  };

  // Определяем путь для профиля в зависимости от статуса авторизации (c учетом locale)
  const basePath = `/${locale}`;
  const profileHref = isAuthenticated ? `${basePath}/account` : `${basePath}/auth/login`;
  return (
    <header className='bg-black py-6 w-full'>
      <div className='max-w-[1920px] w-full mx-auto px-10 sm:px-6 lg:px-[144px] flex items-center justify-between'>
      <Logo />
      <nav className=''>
        <ul className='flex gap-[clamp(16px,2.5vw,48px)] text-[17px] font-medium'>
          <li>
            <Link href={`${basePath}/catalog`}>{t('catalog')}</Link>
          </li>
          <li>
            <a href='#'>{t('home')}</a>
          </li>
          <li>
            <a href='#'>{t('delivery')}</a>
          </li>
          <li>
            <a href='#'>{t('contacts')}</a>
          </li>
          <li>
            <a href='#'>{t('news')}</a>
          </li>
        </ul>
      </nav>
      <nav className=''>
        <ul className='flex justify-between gap-[30px] items-center'>
          <li>
            <a href='#'>
              <Image src='/svg/search.svg' alt='search' width={24} height={24} />
            </a>
          </li>
          <li>
            <a href='#'>
              <Image src='/svg/favorite.svg' alt='heart' width={24} height={24} />
            </a>
          </li>
          <li>
            <a href='#'>
              <Image src='/svg/tg.svg' alt='tg' width={24} height={24} />
            </a>
          </li>
          <li>
            <Link href={`${basePath}/cart`}>
              <Image src='/svg/cart.svg' alt='cart' width={24} height={24} />
            </Link>
          </li>
          <li>
            <Link href={profileHref}>
              <Image src='/svg/profile.svg' alt='profile' width={24} height={24} />
            </Link>
          </li>
          <li className='flex gap-2'>
            <button
              onClick={() => switchLocale('uk')}
              className={`px-2 py-1 text-sm ${locale === 'uk' ? 'text-white font-bold' : 'text-gray-400'}`}
            >
              UA
            </button>
            <span className='text-gray-400'>|</span>
            <button
              onClick={() => switchLocale('en')}
              className={`px-2 py-1 text-sm ${locale === 'en' ? 'text-white font-bold' : 'text-gray-400'}`}
            >
              EN
            </button>
          </li>
        </ul>
      </nav>
      </div>
    </header>
  );
}
