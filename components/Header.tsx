'use client';
import React, { useEffect, useState } from 'react';
import Logo from './ui/Logo';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import HeaderSearch from './HeaderSearch';
import { useCartStore } from '../store/cartStore';

export default function Header() {
  const t = useTranslations('header');
  const tSearch = useTranslations('search');
  const tCart = useTranslations('cart');
  const tA11y = useTranslations('a11y');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const switchLocale = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    const newPathname = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPathname);
    router.refresh();
  };

  const basePath = `/${locale}`;
  const isHomePage = pathname === basePath || pathname === `${basePath}/` || pathname === '/';
  const profileHref = isAuthenticated ? `${basePath}/account` : `${basePath}/auth/login`;
  const cartItemsCount = useCartStore((state) => state.items.length);

  const navLinks = [
    { href: `${basePath}/`, label: t('home') },
    { href: `${basePath}/catalog`, label: t('catalog') },
    { href: `${basePath}/delivery`, label: t('delivery') },
    { href: `${basePath}/contacts`, label: t('contacts') },
    { href: `${basePath}/news`, label: t('news') },
  ];

  return (
    <header className='site-header bg-[#1C1C1C] w-full relative z-50'>
      <div className='max-w-[1920px] w-full mx-auto site-padding-x'>
        {/* Контент хедера */}
        <div className='flex items-center justify-between gap-4 pt-3 md:pt-[clamp(10px,1.6vw,22px)] relative z-20'>
          <Logo />
          <nav className='hidden md:flex flex-1 justify-center' aria-label={tA11y('mainNav')}>
            <ul className='flex gap-[clamp(10px,1.8vw,32px)] text-[clamp(12px,1.05vw,17px)] font-medium whitespace-nowrap'>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white hover:text-[#9C0000] transition-colors duration-200 underline-offset-4 hover:underline uppercase tracking-[0.08em]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <nav className='flex items-center gap-3 md:gap-[clamp(12px,1.6vw,28px)] shrink-0' aria-label={tA11y('userNav')}>
            <div className='relative'>
              <button type='button' onClick={() => setIsSearchOpen(true)} className='group flex items-center transition-transform duration-200 hover:scale-110' aria-label={tSearch('ariaSearch')}>
                <Image src='/svg/search.svg' alt='search' width={24} height={24} className='w-[clamp(18px,1.4vw,24px)] h-[clamp(18px,1.4vw,24px)] transition-opacity duration-200 group-hover:opacity-80' />
              </button>
              {isSearchOpen && (
                <div className='absolute top-full right-0 mt-2 z-20'>
                  <HeaderSearch
                    isOpen={true}
                    onClose={() => setIsSearchOpen(false)}
                    placeholder={tSearch('placeholderMinChars')}
                    className='w-[200px] sm:w-[240px]'
                    compact
                  />
                </div>
              )}
            </div>
            <Link href={`${basePath}/favorites`} className='group flex items-center transition-transform duration-200 hover:scale-110'>
              <Image src='/svg/heart.svg' alt='heart' width={24} height={24} className='w-6 h-6 md:w-[clamp(18px,1.4vw,24px)] md:h-[clamp(18px,1.4vw,24px)] transition-opacity duration-200 group-hover:opacity-80' />
            </Link>
            <Link href={`${basePath}/cart`} className={`group flex items-center relative transition-transform duration-200 hover:scale-110 ${cartItemsCount > 0 ? 'cart-icon-has-items' : ''}`} aria-label={tCart('title')}>
              <Image src="/svg/cart.svg" alt="cart" width={24} height={24} className="w-6 h-6 md:w-[clamp(18px,1.4vw,24px)] transition-opacity duration-200 group-hover:opacity-80" />
            </Link>
            <Link href={profileHref} className='group flex items-center transition-transform duration-200 hover:scale-110'>
              <Image src='/svg/profile.svg' alt='profile' width={24} height={24} className='w-6 h-6 md:w-[clamp(18px,1.4vw,24px)] transition-opacity duration-200 group-hover:opacity-80' />
            </Link>
            
            <div className='hidden md:flex gap-2' role="group" aria-label={tA11y('languageGroup')}>
              <button onClick={() => switchLocale('uk')} className={`px-2 py-1 text-[clamp(12px,1vw,14px)] ${locale === 'uk' ? 'text-white font-bold' : 'text-gray-400'}`} aria-label={tA11y('languageUk')} aria-current={locale === 'uk' ? 'true' : undefined}>UA</button>
              <span className='text-white' aria-hidden="true">|</span>
              <button onClick={() => switchLocale('en')} className={`px-2 py-1 text-[clamp(12px,1vw,14px)] ${locale === 'en' ? 'text-white font-bold' : 'text-gray-400'}`} aria-label={tA11y('languageEn')} aria-current={locale === 'en' ? 'true' : undefined}>EN</button>
            </div>

            <button type='button' onClick={() => setIsMobileMenuOpen((prev) => !prev)} className='md:hidden flex items-center justify-center w-10 h-10' aria-label={isMobileMenuOpen ? tA11y('closeMenu') : tA11y('openMenu')} aria-expanded={isMobileMenuOpen}>
               {isMobileMenuOpen ? (
                <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path d='M6 18L18 6M6 6l12 12' /></svg>
               ) : (
                <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path d='M4 6h16M4 12h16M4 18h16' /></svg>
               )}
            </button>
          </nav>
        </div>

      </div>

      {/* ОГОНЬ (как в футере): показываем только если это НЕ главная; -1px чтобы не было белой полоски */}
      {!isHomePage && (
        <div
          className='header-flame-mask bg-[#1C1C1C] w-full absolute left-0 z-0 pointer-events-none'
          style={{ top: 'calc(100% - 1px)' }}
        />
      )}

      {/* Mobile Menu Overlay & Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div
            className='fixed inset-0 bg-black/50 z-40 md:hidden'
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden='true'
          />
          <div className='fixed top-0 right-0 h-full w-[280px] max-w-[85vw] bg-[#1C1C1C] z-50 flex flex-col md:hidden'>
            <div className='flex items-center justify-between px-6 pt-6 pb-4'>
              <span className='text-white font-medium uppercase tracking-wide'>{t('menu')}</span>
              <button
                type='button'
                onClick={() => setIsMobileMenuOpen(false)}
                className='w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0'
                aria-label={tA11y('closeMenu')}
              >
                <svg className='w-5 h-5 text-[#1C1C1C]' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
              </button>
            </div>
            <nav className='flex flex-col flex-1 px-6' aria-label={tA11y('mainNav')}>
              {[
                { href: `${basePath}/`, label: t('home'),},
                { href: `${basePath}/catalog`, label: t('catalog') },
                { href: `${basePath}/delivery`, label: t('delivery') },
                { href: `${basePath}/contacts`, label: t('contacts'), },
                { href: `${basePath}/news`, label: t('news'), },
              ].map((link) => (
                <div key={link.href} className='first:border-t border-b border-[#BCBCBC]'>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='flex items-center justify-between py-4 text-white font-medium text-base  tracking-wide '
                  >
                    {link.label}
                  </Link>
                </div>
              ))}

              <div className='mt-6 flex items-center gap-3' role='group' aria-label={tA11y('languageGroup')}>
                <button
                  type='button'
                  onClick={() => {
                    switchLocale('uk');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded border text-sm font-semibold ${
                    locale === 'uk'
                      ? 'border-white text-white'
                      : 'border-[#6B7280] text-[#9CA3AF]'
                  }`}
                  aria-label={tA11y('languageUk')}
                  aria-current={locale === 'uk' ? 'true' : undefined}
                >
                  UA
                </button>
                <button
                  type='button'
                  onClick={() => {
                    switchLocale('en');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded border text-sm font-semibold ${
                    locale === 'en'
                      ? 'border-white text-white'
                      : 'border-[#6B7280] text-[#9CA3AF]'
                  }`}
                  aria-label={tA11y('languageEn')}
                  aria-current={locale === 'en' ? 'true' : undefined}
                >
                  EN
                </button>
              </div>
            </nav>
            <div className='px-6 pb-8 pt-4'>
              <a
                href='https://instagram.com/amaterasu1shop'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2 text-white hover:text-[#9C0000] transition-colors'
              >
                <Image src='/svg/instagram.svg' alt='Instagram' width={24} height={24} className='shrink-0' />
                <span className='text-sm'>@amaterasu1shop</span>
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
}