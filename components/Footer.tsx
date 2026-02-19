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
          <div className='flex gap-6'>
            <a href="https://t.me/amaterasu1shop" target="_blank" rel="noopener noreferrer" className='flex gap-2 items-center'>
              <Image src='/svg/tg.svg' alt='Telegram' width={24} height={24} className='shrink-0' />
              <p className='text-[#BCBCBC] text-sm md:text-base'>@amaterasu1shop</p>
            </a>
            <a href="https://instagram.com/@amaterasu_anime_shop" target="_blank" rel="noopener noreferrer" className='flex gap-2 items-center'>
              <Image src='/svg/instagram.svg' alt='Instagram' width={24} height={24} className='shrink-0' />
              <p className='text-[#BCBCBC] text-sm md:text-base'>@amaterasu_anime_shop</p>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
