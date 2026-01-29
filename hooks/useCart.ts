import { useCartStore } from '@/store/cartStore';

export function useCart() {
  const items = useCartStore(s => s.items);
  const add = useCartStore(s => s.add);
  const remove = useCartStore(s => s.remove);
  const clear = useCartStore(s => s.clear);
  return { items, add, remove, clear };
}
