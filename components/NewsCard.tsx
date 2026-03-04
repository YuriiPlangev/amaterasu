'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { getProxiedImageUrl } from '../lib/imageProxy';

interface NewsCardProps {
  post: {
    id: number;
    title: string;
    excerpt: string;
    date: string;
    slug: string;
    image: string; // URL картинки с сервера
    badge?: string; // Наша плашка из ACF
  };
}

export default function NewsCard({ post }: NewsCardProps) {
  const locale = useLocale();
  const t = useTranslations('news');

  if (!post || !post.date) {
    return null;
  }
  
  const date = new Date(post.date);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const formattedDate = `${day}.${month}.${year}`;

  return (
    <article className='rounded-2xl relative group h-full flex flex-col transition-shadow duration-300 hover:shadow-lg'>
      {/* Badge (плашка) */}
      {post.badge && (
        <div className="absolute top-0 left-0 py-[clamp(6px,1.2vw,12px)] px-[clamp(8px,2vw,20px)] z-10 bg-[#9C0000] text-white rounded-tl-2xl rounded-br-2xl text-[clamp(14px,1.4vw,22px)] font-semibold">
          {post.badge}
        </div>
      )}

      <div className="news-card-image-zoom overflow-hidden rounded-t-2xl">
        <Image
          src={getProxiedImageUrl(post.image)}
          alt={post.title}
          width={400}
          height={250}
          className='w-full h-[250px] object-cover rounded-t-2xl'
        />
      </div>

      <div className="p-6 border-x border-b border-[#BCBCBC] rounded-b-2xl flex flex-col flex-1">
        {/* Заголовок */}
        <h3 className="text-[24px] text-[#1C1C1C] font-semibold mb-2">{post.title}</h3>
        
        {/* Краткое описание */}
        <p className="text-[#1C1C1C] opacity-70 line-clamp-3 mb-4 flex-1">{post.excerpt}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <Link href={`/${locale}/news/${post.slug}`}>
            <button className="font-semibold text-[#9C0000] underline underline-offset-4">{t('readMore')}</button>
          </Link>
          <span className="text-sm text-gray-400">{formattedDate}</span>
        </div>
      </div>
    </article>
  );
}