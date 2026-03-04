import type { Metadata } from 'next';
import axios from 'axios';
import { absoluteUrl } from '../../../../lib/seo';
import { decodeHtmlEntities } from '../../../../lib/html';

async function getPostBySlug(slug: string) {
  const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
  if (!wpUrl) return null;
  try {
    const { data } = await axios.get(`${wpUrl}/wp-json/wp/v2/posts`, {
      params: { slug, _embed: true },
    });
    if (!data?.length) return null;
    const post = data[0];
    return {
      title: decodeHtmlEntities(post.title?.rendered?.replace(/<[^>]*>/g, '') || ''),
      excerpt: decodeHtmlEntities(post.excerpt?.rendered?.replace(/<[^>]*>/g, '').slice(0, 160) || ''),
      image: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.large?.source_url || '',
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }> | { slug: string; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = await Promise.resolve(params);
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Новина' };
  const path = `/${locale}/news/${slug}`;
  return {
    title: post.title,
    description: post.excerpt.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt.slice(0, 160),
      url: absoluteUrl(path),
      images: post.image ? [{ url: post.image, alt: post.title }] : undefined,
    },
    alternates: { canonical: absoluteUrl(path) },
  };
}

export default function NewsSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
