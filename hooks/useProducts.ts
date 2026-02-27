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
      
      console.log('Fetching products:', url);
      
      const res = await fetch(url);

      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      
      console.log('Products received:', data);
      
      // Перевірка чи це новий формат (з пагінацією) чи старий (просто масив)
      if (data && typeof data === 'object' && 'products' in data) {
        return data; // Новий формат: { products, hasMore, total, page, perPage }
      }
      
      // Старий формат: просто масив товарів - обернемо його
      return {
        products: Array.isArray(data) ? data : [],
        hasMore: false,
        total: Array.isArray(data) ? data.length : 0,
        page: 1,
        perPage: Array.isArray(data) ? data.length : 0
      };
    },
    select: (data) => {
      // Для обратної сумісності: якщо не передано page, повертаємо просто масив
      if (!params.page && data.products) {
        return data.products;
      }
      // Інакше повертаємо повний об'єкт
      return data;
    }
  });
  
}
