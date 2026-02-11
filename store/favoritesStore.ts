import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FavoriteItem = {
  id: number;
  name: string;
  slug: string;
  price?: string;
  image?: string;
  images?: Array<{ src?: string }>;
};

interface FavoritesStore {
  items: FavoriteItem[];
  add: (product: FavoriteItem | any) => void;
  remove: (id: number) => void;
  toggle: (product: FavoriteItem | any) => void;
  isFavorite: (id: number) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],

      add: (product: any) => {
        const items = get().items;
        if (items.some((i) => i.id === product.id)) return;
        set({
          items: [
            ...items,
            {
              id: product.id,
              name: product.name,
              slug: product.slug || String(product.id),
              price: product.price,
              image: product.images?.[0]?.src || product.image,
              images: product.images,
            },
          ],
        });
      },

      remove: (id: number) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      toggle: (product: any) => {
        const items = get().items;
        const exists = items.some((i) => i.id === product.id);
        if (exists) {
          set({ items: items.filter((i) => i.id !== product.id) });
        } else {
          set({
            items: [
              ...items,
              {
                id: product.id,
                name: product.name,
                slug: product.slug || String(product.id),
                price: product.price,
                image: product.images?.[0]?.src || product.image,
                images: product.images,
              },
            ],
          });
        }
      },

      isFavorite: (id: number) => get().items.some((i) => i.id === id),

      clear: () => set({ items: [] }),
    }),
    { name: 'amaterasu-favorites' }
  )
);
