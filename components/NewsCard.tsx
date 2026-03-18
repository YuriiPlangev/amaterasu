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
  const href = `/${locale}/news/${post.slug}`;

  const excerptText = String(post.excerpt || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const shortExcerpt = excerptText.length > 140 ? `${excerptText.slice(0, 140).trimEnd()}…` : excerptText;

  return (
    <Link
      href={href}
      className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9C0000] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      aria-label={`${post.title}. ${t('readMore')}`}
    >
      <article className='rounded-2xl relative group h-full flex flex-col border border-[#BCBCBC] transition-shadow duration-300 hover:shadow-lg'>
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

        <div className="p-6 rounded-b-2xl flex flex-col flex-1">
          {/* Заголовок */}
          <h3 className="text-[24px] text-[#1C1C1C] font-semibold mb-2">{post.title}</h3>
          
          {/* Краткое описание */}
          <p className="text-[#1C1C1C] opacity-70 line-clamp-2 mb-4 flex-1">{shortExcerpt}</p>
          
          <div className="flex items-center justify-between mt-auto">
            <span className="font-semibold text-[#9C0000] underline underline-offset-4">
              {t('readMore')}
            </span>
            <span className="text-sm text-gray-400">{formattedDate}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}