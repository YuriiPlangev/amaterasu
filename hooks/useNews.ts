import { useQuery } from '@tanstack/react-query';

export interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  slug: string;
  image: string;
  badge?: string;
}

export function useNews(limit?: number) {
  return useQuery({
    queryKey: ['news', limit],
    queryFn: async () => {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];
      return limit ? sorted.slice(0, limit) : sorted;
    },
  });
}

export function useNewsPost(slug: string | null) {
  return useQuery({
    queryKey: ['news', 'post', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug');
      const res = await fetch(`/api/news/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch post');
      }
      return res.json();
    },
    enabled: !!slug,
  });
}
