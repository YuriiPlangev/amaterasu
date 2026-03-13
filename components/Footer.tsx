'use client';
import React from 'react';
import Logo from './ui/Logo';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function Footer() {
  const locale = useLocale();
  const isUk = locale === 'uk';

  const legalLinks = [
    {
      href: `/${locale}/privacy-policy`,
      label: isUk ? 'Політика конфіденційності' : 'Privacy Policy',
    },
    {
      href: `/${locale}/cookies`,
      label: isUk ? 'Політика Cookie' : 'Cookie Policy',
    },
    {
      href: `/${locale}/terms-of-use`,
      label: isUk ? 'Умови користування' : 'Terms of Use',
    },
    {
      href: `/${locale}/public-offer`,
      label: isUk ? 'Публічна оферта' : 'Public Offer',
    },
    {
      href: `/${locale}/returns-policy`,
      label: isUk ? 'Повернення та обмін' : 'Returns & Exchange',
    },
    {
      href: `/${locale}/delivery`,
      label: isUk ? 'Доставка й оплата' : 'Delivery & Payment',
    },
  ];

  return (
    <footer>
      <div className='flex overflow-hidden'>
        <Image src={'/svg/flamefooter.svg'} alt='' width={100} height={100} className='w-full h-auto' />
        <Image src={'/svg/flamefooter.svg'} alt='' width={100} height={100} className='w-full h-auto -ml-3' />  
      </div>
      <div className='bg-[#1C1C1C] w-full'>
        <div className='max-w-[1920px] mx-auto site-padding-x  flex flex-row flex-wrap justify-between items-start items-center gap-6'>
          <Logo />
          <div className='flex flex-col md:flex-row gap-4 md:gap-6'>
            <a href="https://t.me/amaterasuAnimeShopBot" target="_blank" rel="noopener noreferrer" className='footer-link-hover flex gap-2 items-center transition-opacity duration-200 hover:opacity-90' aria-label="Telegram: @amaterasu1shop">
              <Image src='/svg/tg.svg' alt="" width={24} height={24} className='shrink-0' aria-hidden />
              <p className='text-[#BCBCBC] text-sm md:text-base transition-colors duration-200'>@amaterasu1shop</p>
            </a>
            <a href="https://instagram.com/amaterasu1shop" target="_blank" rel="noopener noreferrer" className='footer-link-hover flex gap-2 items-center transition-opacity duration-200 hover:opacity-90' aria-label="Instagram: @amaterasu1shop">
              <Image src='/svg/instagram.svg' alt="" width={24} height={24} className='shrink-0' aria-hidden />
              <p className='text-[#BCBCBC] text-sm md:text-base transition-colors duration-200'>@amaterasu1shop</p>
            </a>
          </div>
        </div>
        <div className='max-w-[1920px] mx-auto site-padding-x pb-6'>
          <div className='h-px bg-white/10 mb-4' />
          <nav aria-label={isUk ? 'Юридична інформація' : 'Legal information'} className='flex flex-wrap justify-center gap-x-5 gap-y-2 text-center'>
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='text-[#BCBCBC] text-sm hover:text-white transition-colors duration-200'
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
