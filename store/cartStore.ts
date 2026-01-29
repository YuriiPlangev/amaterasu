import { create } from 'zustand';

type CartItem = { id: number; name: string; qty: number; price?: string; image?: string };

interface CartStore {
  items: CartItem[];
  add: (product: any, qty?: number) => void;
  remove: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clear: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  add: (product: any, qty = 1) => {
    const items = get().items;
    const existingItem = items.find(item => item.id === product.id);
    
    if (existingItem) {
      // Если товар уже есть, увеличиваем количество
      set({
        items: items.map(item =>
          item.id === product.id
            ? { ...item, qty: item.qty + qty }
            : item
        )
      });
    } else {
      // Если товара нет, добавляем новый
      set({
        items: [
          ...items,
          {
            id: product.id,
            name: product.name,
            qty,
            price: product.price,
            image: product.images?.[0]?.src || product.image
          }
        ]
      });
    }
  },

  remove: (id: number) => set({ items: get().items.filter(i => i.id !== id) }),

  updateQty: (id: number, qty: number) => {
    if (qty <= 0) {
      get().remove(id);
      return;
    }
    set({
      items: get().items.map(item =>
        item.id === id ? { ...item, qty } : item
      )
    });
  },

  clear: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce((total, item) => {
      const price = parseFloat(item.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
      return total + price * item.qty;
    }, 0);
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.qty, 0);
  },
}));
