import { useQuery } from '@tanstack/react-query';

export function useProducts(params: any = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const url = `/api/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });
  
}
