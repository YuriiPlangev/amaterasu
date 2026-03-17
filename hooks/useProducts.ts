import { useQuery } from '@tanstack/react-query';

export function useProducts(params: any = {}) {
  return useQuery({
    queryKey: ['products', params],
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

      const res = await fetch(url, { cache: 'no-store' });

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
  });
}

