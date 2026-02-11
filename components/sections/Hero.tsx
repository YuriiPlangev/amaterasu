'use client';
import React from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

const Hero = () => {
  const t = useTranslations('hero');
  const locale = useLocale();
  
  return (
    // На мобилке flex-col, на десктопе — block, чтобы absolute элементы работали корректно
    <section className="flame-boundary  bg-[#1C1C1C] w-full relative min-h-screen md:min-h-[600px] md:h-[75vh] md:max-h-[850px] overflow-hidden flex flex-col md:block">
      
      {/* ДЕКСТОП: Картинка (только 768px+) */}
      <div className="hidden md:block absolute right-0 bottom-0 w-[50%] min-[952px]:w-[70%] h-full z-0">
        <img 
          src="/images/itachi.png" 
          alt="Itachi Uchiha" 
          className="w-full h-full object-contain object-right-bottom select-none pointer-events-none" 
        />
        <div className="absolute inset-0" />
      </div>

      {/* КОНТЕНТ */}
      <div className="relative z-10 max-w-[1920px] w-full mx-auto site-padding-x flex flex-col flex-1 md:h-full">
        {/* На десктопе используем grid, на мобилке — обычный поток */}
        <div className="md:grid md:grid-cols-2 md:h-full">
          
          {/* ТЕКСТОВАЯ ЧАСТЬ */}
          <div className="md:pt-[100px] z-20">
            <div className="max-w-[550px] w-full mx-auto md:mx-0">
              <h1 className="text-[clamp(28px,3vw,65px)] font-bold pb-4 uppercase text-white leading-[1.1] drop-shadow-2xl">
                {t('title')}
              </h1>
              <p className="text-white text-[clamp(14px,1.1vw,18px)] font-light pb-8 opacity-75 leading-relaxed max-w-[420px]">
                {t('description')}
              </p>
              <Link href={`/${locale}/catalog`} className="w-full md:w-auto inline-block">
                <button className="w-full md:w-max py-4 px-10 border-2 border-white text-white rounded-md font-bold uppercase hover:bg-white hover:text-black transition-all duration-300">
                  {t('cta')}
                </button>
              </Link>
            </div>
          </div>

          {/* МОБИЛЬНЫЙ ИТАЧИ: Прижимается к низу только на < 768px */}
          <div className="md:hidden mt-auto -mx-[var(--site-gutter)] w-[calc(100%+2*var(--site-gutter))] leading-[0] z-0">
            <img 
              src="/images/itachi.png" 
              alt="Itachi Uchiha" 
              className="w-full h-auto object-contain object-bottom select-none pointer-events-none" 
            />
          </div>

          {/* Пустой блок для сетки десктопа */}
          <div className="hidden md:block " />
        </div>
      </div>
    </section>
  )
}

export default Hero