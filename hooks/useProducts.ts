import { useQuery } from '@tanstack/react-query';

const PRODUCTS_STALE_MS = 60 * 1000; // 1 min
const PRODUCTS_GC_MS = 10 * 60 * 1000; // 10 min — keep cache for instant display on revisit

export function useProducts(
  params: any = {},
  options?: { enabled?: boolean; staleTime?: number; gcTime?: number }
) {
  return useQuery({
    queryKey: ['products', params],
    staleTime: options?.staleTime ?? PRODUCTS_STALE_MS,
    gcTime: options?.gcTime ?? PRODUCTS_GC_MS,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      const hasSearch = typeof params.search === 'string' && params.search.trim() !== '';

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || String(value) === '') return;
        // Для поискового запроса шлём параметр q, а не search
        if (key === 'search' && hasSearch) {
          searchParams.append('q', String(value));
        } else {
          searchParams.append(key, String(value));
        }
      });

      const query = searchParams.toString();
      const basePath = hasSearch ? '/api/search' : '/api/products';
      const url = `${basePath}${query ? `?${query}` : ''}`;

      const res = await fetch(url);

      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();

      // Новий формат: { products, hasMore, total, page, perPage }
      if (data && typeof data === 'object' && 'products' in data) {
        return data;
      }

      // Старий формат: просто масив товарів
      return {
        products: Array.isArray(data) ? data : [],
        hasMore: false,
        total: Array.isArray(data) ? data.length : 0,
        page: 1,
        perPage: Array.isArray(data) ? data.length : 0,
      };
    },
    select: (data) => {
      if (!params.page && data.products) {
        return data.products;
      }
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

