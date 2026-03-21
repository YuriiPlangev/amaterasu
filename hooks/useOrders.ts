import { useQuery } from '@tanstack/react-query';

const ORDERS_STALE_MS = 60 * 1000; // 1 min

async function fetchOrders(): Promise<{
  orders: Array<{
    id: number;
    number?: string;
    status?: string;
    total?: string;
    date_created?: string;
    line_items?: Array<{ name: string; quantity: number }>;
  }>;
}> {
  const res = await fetch('/api/orders', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return { orders: Array.isArray(data?.orders) ? data.orders : [] };
}

export function useOrders(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: ORDERS_STALE_MS,
    gcTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
    retry: false,
  });
}
