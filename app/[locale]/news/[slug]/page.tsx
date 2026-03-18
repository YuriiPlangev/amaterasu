'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useNewsPost } from '../../../../hooks/useNews';
import { getProxiedImageUrl } from '../../../../lib/imageProxy';
import NewsComments from '../../../../components/NewsComments';

export default function NewsSlugPage() {
  const t = useTranslations('newsSlug');
  const params = useParams();
  const slug = params?.slug as string;
  const { data: post, isLoading: loading, error } = useNewsPost(slug || null);
  const errorMessage = error instanceof Error ? error.message : error ? t('unknownError') : null;

  if (loading) {
    return (
      <div className="max-w-[1920px] w-full mx-auto site-padding-x py-12 mt-16 md:py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (errorMessage || !post) {
    return (
      <div className="max-w-[1920px] w-full mx-auto site-padding-x py-12 md:py-16 mt-12">
        <div className="text-center py-16">
          <p className="text-[#9C0000] font-semibold mb-4">{errorMessage || t('postNotFound')}</p>
          <Link
            href={`/${(params?.locale as string) || 'uk'}/news`}
            className="inline-block text-[#9C0000] font-semibold underline underline-offset-4 hover:opacity-80"
          >
            ← {t('backToNews')}
          </Link>
        </div>
      </div>
    );
  }

  const date = new Date(post.date);
  const formattedDate = date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const locale = (params?.locale as string) || 'uk';
  const basePath = `/${locale}`;
  const hasExcerpt = post.excerpt && String(post.excerpt).replace(/<[^>]*>/g, '').trim().length > 0;
  const hasContent = post.content && String(post.content).replace(/<[^>]*>/g, '').trim().length > 0;

  return (
    <div className="max-w-[1920px] w-full mx-auto site-padding-x py-10 md:py-16 pt-24 md:pt-28 pb-16">
      <div className="max-w-[1200px] mx-auto">
        <Link
          href={`${basePath}/news`}
          className="inline-flex items-center gap-2 text-[#6B7280] text-sm font-medium mb-8 hover:text-[#9C0000] transition-colors"
        >
          <Image src="/svg/arrow-left.svg" alt="" width={18} height={18} />
          {t('backToNews')}
        </Link>


        <article className="rounded-2xl  bg-white  overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Картинка слева */}
            {post.image && (
              <div className="relative w-full md:w-1/2 min-h-[260px] md:min-h-[340px] bg-[#F3F4F6] flex-shrink-0">
                <Image
                  src={getProxiedImageUrl(post.image)}
                  alt={post.title.replace(/<[^>]*>/g, '')}
                  fill
                  className="object-cover rounded-none md:rounded-l-2xl"
                  sizes="(max-width: 768px) 100vw, 420px"
                  priority
                />
              </div>
            )}
            {/* Текст справа */}
            <div className="w-full md:w-1/2 px-6 py-8 md:px-8 md:py-8 flex flex-col justify-center md:border-l md:border-[#E5E7EB] md:pl-10">
              {post.badge && (
                <span className="block w-full mb-4 py-1.5 px-3 bg-[#9C0000] text-white text-xs font-semibold rounded-md uppercase tracking-wide">
                  {post.badge}
                </span>
              )}
              <h1 className="text-[clamp(24px,2.8vw,38px)] font-bold text-[#1C1C1C] mb-3 leading-tight">
                {post.title}
              </h1>
              <p className="text-[#9CA3AF] text-sm mb-6">{formattedDate}</p>
              {hasExcerpt && (
                <div
                  className="text-[#1C1C1C] text-lg leading-relaxed mb-8 pb-8 border-b border-[#E5E7EB] max-w-full break-words [overflow-wrap:anywhere] [&_p]:!text-[#1C1C1C] [&_span]:!text-[#1C1C1C] [&_a]:break-words [&_a]:[overflow-wrap:anywhere]"
                  dangerouslySetInnerHTML={{ __html: post.excerpt }}
                />
              )}
              {hasContent ? (
                <div
                  className="news-content text-[#1C1C1C] leading-[1.75] max-w-full break-words [overflow-wrap:anywhere] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_li]:mb-1 [&_a]:!text-[#9C0000] [&_a]:underline [&_a:hover]:no-underline [&_a]:break-words [&_a]:[overflow-wrap:anywhere] [&_img]:rounded-lg [&_img]:my-4 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_code]:break-words [&_p]:!text-[#1C1C1C] [&_h2]:!text-[#1C1C1C] [&_h3]:!text-[#1C1C1C] [&_li]:!text-[#1C1C1C] [&_span]:!text-[#1C1C1C] [&_div]:!text-[#1C1C1C]"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              ) : hasExcerpt ? null : (
                <p className="text-[#1C1C1C] italic">{t('noContent')}</p>
              )}
            </div>
          </div>
        </article>

        <NewsComments slug={slug} />
      </div>
    </div>
  );
}
