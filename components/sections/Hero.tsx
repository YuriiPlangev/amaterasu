'use client';
import React from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

const Hero = () => {
  const t = useTranslations('hero');
  
  return (
    <section className="bg-black relative overflow-hidden relative">
  <div className="relative max-w-[1920px] w-full mx-auto px-10 sm:px-6 lg:px-[144px]">

    <div className='flex'>
      <div className="flex-1 z-10 max-w-[50%] pb-[148px] pt-[100px]">
      <h1 className="text-[70px] font-bold pb-5 uppercase text-white">
        {t('title')}
      </h1>

      <p className="text-[#BCBCBC] text-[25px] font-light pb-9">
        {t('description')}
      </p>

      <button className="py-5 px-10 border-[3px] border-white text-white">
        {t('cta')}
      </button>
    </div>

    <div className="flex-1">
      
    </div>
    
    <Image
        src="/images/itachi.png"
        alt="itachi"
        fill
        className="absolute translate-x-[85%]  max-w-[1000px] max-h-[1000px]"
      />
    </div>
  </div>

</section>
  )
}

export default Hero
