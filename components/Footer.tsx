'use client';
import React from 'react';
import Logo from './ui/Logo';
import Image from 'next/image';
import Search from './ui/Search';

export default function Footer() {
  return (
    <footer>
      <div className='flex overflow-hidden'>
        <Image src={'/svg/flamefooter.svg'} alt='' width={100} height={100} className='w-full h-auto' />
        <Image src={'/svg/flamefooter.svg'} alt='' width={100} height={100} className='w-full h-auto -ml-3' />  
      </div>
      <div className='bg-[#1C1C1C] w-full'>
        <div className='max-w-[1920px] mx-auto site-padding-x py-6 flex flex-row flex-wrap justify-between items-start items-center gap-6'>
          <Logo />
          <div className='flex flex-col md:flex-row gap-4 md:gap-6'>
            <a href="https://t.me/amaterasuAnimeShopBot" target="_blank" rel="noopener noreferrer" className='footer-link-hover flex gap-2 items-center transition-opacity duration-200 hover:opacity-90' aria-label="Telegram: @amaterasu1shop">
              <Image src='/svg/tg.svg' alt="" width={24} height={24} className='shrink-0' aria-hidden />
              <p className='text-[#BCBCBC] text-sm md:text-base transition-colors duration-200'>@amaterasu1shop</p>
            </a>
            <a href="https://instagram.com/amaterasu_anime_shop" target="_blank" rel="noopener noreferrer" className='footer-link-hover flex gap-2 items-center transition-opacity duration-200 hover:opacity-90' aria-label="Instagram: @amaterasu_anime_shop">
              <Image src='/svg/instagram.svg' alt="" width={24} height={24} className='shrink-0' aria-hidden />
              <p className='text-[#BCBCBC] text-sm md:text-base transition-colors duration-200'>@amaterasu_anime_shop</p>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
