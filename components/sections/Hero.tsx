'use client';
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'

const HERO_VISITED_KEY = 'amaterasu_hero_visited';

type HeroState = 'idle' | 'reveal' | 'visible';

const Hero = () => {
  const t = useTranslations('hero');
  const locale = useLocale();
  const [state, setState] = useState<HeroState>('idle');

  useEffect(() => {
    const visited = typeof window !== 'undefined' && sessionStorage.getItem(HERO_VISITED_KEY);
    if (!visited) {
      sessionStorage.setItem(HERO_VISITED_KEY, '1');
      setState('reveal');
    } else {
      setState('visible');
    }
  }, []);

  const revealTitle = state === 'reveal' ? 'hero-reveal-title' : state === 'visible' ? 'hero-visible' : '';
  const revealDesc  = state === 'reveal' ? 'hero-reveal-desc'  : state === 'visible' ? 'hero-visible' : '';
  const revealCta   = state === 'reveal' ? 'hero-reveal-cta'   : state === 'visible' ? 'hero-visible' : '';

  return (
    <section className="flame-boundary bg-[#1C1C1C] w-full relative min-h-screen md:min-h-[600px] md:h-[75vh] md:max-h-[850px] overflow-hidden flex flex-col md:block">
      
      <div className="relative z-10 max-w-[1920px] w-full mx-auto site-padding-x flex flex-col flex-1 md:h-full">
        
        <div className="md:grid md:grid-cols-2 md:h-full relative">
          
          <div className="z-20 flex flex-col justify-center h-full">
            <div className="w-full mx-auto md:mx-0">
              <h1 className={`hero-entrance text-[clamp(28px,3vw,65px)] font-bold pb-4 uppercase text-white leading-[1.1] drop-shadow-2xl ${revealTitle}`}>
                {t('title')}
              </h1>
              <p className={`hero-entrance text-white text-[clamp(14px,1.1vw,18px)] font-light pb-8 opacity-75 leading-relaxed max-w-[420px] ${revealDesc}`}>
                {t('description')}
              </p>
              <Link href={`/${locale}/catalog`} className={`hero-entrance w-full md:w-auto inline-block ${revealCta}`}>
                <button className="w-full md:w-max py-4 px-10 border-2 border-white text-white rounded-md font-bold uppercase hover:bg-white hover:text-black transition-all duration-300 btn-press">
                  {t('cta')}
                </button>
              </Link>
            </div>
          </div>

          {/* 2. ДЕСКТОП КАРТИНКА (Правая колонка) */}
          <div className="hidden md:block relative w-full h-full z-10">
             <img 
               src="/images/itachi.webp" 
               alt="Itachi Uchiha" 
               /* h-full — строго на всю высоту родителя.
                  w-auto — ширина подстроится под высоту без искажений.
                  max-w-none — отменяет стандартное ограничение по ширине колонки.
                  left-1/2 -translate-x-1/2 — идеальная центровка внутри ПРАВОЙ колонки.
               */
               className="absolute bottom-0 left-1/2 -translate-x-1/2 h-full w-auto max-w-none object-contain object-bottom select-none pointer-events-none" 
             />
          </div>

        </div>
        
        {/* МОБИЛЬНЫЙ ИТАЧИ */}
        <div className="md:hidden mt-auto -mx-[var(--site-gutter)] w-[calc(100%+2*var(--site-gutter))] leading-[0] z-0">
          <img 
            src="/images/itachi.webp" 
            alt="Itachi Uchiha" 
            className="w-full h-auto object-contain object-bottom select-none pointer-events-none" 
          />
        </div>

      </div>
    </section>
  )
}

export default Hero