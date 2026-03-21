'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import NewsCard from '../../../components/NewsCard';
import { CardSkeleton } from '../../../components/ui/Skeletons';
import { useNews } from '../../../hooks/useNews';

export default function NewsPage() {
  const t = useTranslations('news');
  const locale = useLocale();
  const { data: posts = [], isLoading: loading } = useNews();

  if (loading) {
    return (
      <div className='max-w-[1920px] w-full mx-auto site-padding-x py-[clamp(32px,4vw,80px)] mt-16'>
        <div className='flex items-end justify-between gap-6 mb-[clamp(20px,3vw,40px)]'>
          <div>
            <h1 className='text-[clamp(28px,2.6vw,55px)] font-bold uppercase text-black'>{t('title')}</h1>
            <p className='text-[#6B6B6B] mt-2'>{t('subtitle')}</p>
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-[1920px] w-full mx-auto site-padding-x py-[clamp(32px,4vw,80px)] mt-16'>
      <div className='flex items-end justify-between gap-6 mb-[clamp(20px,3vw,40px)]'>
        <div>
          <h1 className='text-[clamp(28px,2.6vw,55px)] font-bold uppercase text-black'>{t('title')}</h1>
          <p className='text-[#6B6B6B] mt-2'>{t('subtitle')}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {posts.length > 0 ? (
          posts.map((post) => <NewsCard key={post.id} post={post} />)
        ) : (
          <div className='col-span-full flex flex-col items-center gap-4 text-center'>
            <p className='text-[18px] text-gray-500'>{t('noPosts')}</p>
            <Link
              href={`/${locale}/catalog`}
              className='text-[#9C0000] font-semibold hover:underline'
            >
              {t('goToCatalog')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


