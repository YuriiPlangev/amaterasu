import { useQuery } from '@tanstack/react-query';

const CATEGORIES_STALE_MS = 5 * 60 * 1000; // 5 min

export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'popular'],
    staleTime: CATEGORIES_STALE_MS,
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });
}
