'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useNewsPost } from '../../../../hooks/useNews';

export default function NewsSlugPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: post, isLoading: loading, error } = useNewsPost(slug || null);
  const errorMessage = error instanceof Error ? error.message : error ? 'Невідома помилка' : null;

  if (loading) {
    return (
      <main className="max-w-[1920px] w-full mx-auto site-padding-x py-12 mt-16 md:py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </main>
    );
  }

  if (errorMessage || !post) {
    return (
      <main className="max-w-[1920px] w-full mx-auto site-padding-x py-12 md:py-16 mt-12">
        <div className="text-center py-16">
          <p className="text-[#9C0000] font-semibold mb-4">{errorMessage || 'Новину не знайдено'}</p>
          <Link
            href={params?.locale ? `/${params.locale}/news` : '/news'}
            className="inline-block text-[#9C0000] font-semibold underline underline-offset-4 hover:opacity-80"
          >
            ← Повернутися до новин
          </Link>
        </div>
      </main>
    );
  }

  const date = new Date(post.date);
  const formattedDate = date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const locale = params?.locale as string;
  const basePath = locale ? `/${locale}` : '';

  return (
    <main className="max-w-[1920px] w-full mx-auto site-padding-x py-12 md:py-16 mt-16">
      <Link
        href={`${basePath}/news`}
        className="inline-flex items-center gap-2 text-[#1C1C1C] font-medium mb-8 hover:text-[#9C0000] transition-colors"
      >
        <Image src="/svg/arrow-left.svg" alt="" width={20} height={20} />
        Назад до новин
      </Link>

      <article className="max-w-[800px] mx-auto">
        {post.badge && (
          <span className="inline-block mb-4 py-2 px-4 bg-[#9C0000] text-white text-sm font-semibold rounded-lg">
            {post.badge}
          </span>
        )}

        <h1
          className="text-[clamp(28px,3vw,42px)] font-bold text-[#1C1C1C] mb-4 leading-tight"
          dangerouslySetInnerHTML={{ __html: post.title }}
        />

        <p className="text-[#6B7280] text-base mb-8">{formattedDate}</p>

        {post.image && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8">
            <Image
              src={post.image}
              alt={post.title.replace(/<[^>]*>/g, '')}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        <div
          className="prose prose-lg max-w-none text-[#374151] leading-relaxed [&_p]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}
