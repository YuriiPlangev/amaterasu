import { create } from 'zustand';

export type ToastType = 'cart' | 'favorite_add' | 'favorite_remove' | 'success' | 'error';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
  addToast: (message: string, type?: ToastType) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  visible: false,
  message: '',
  type: 'cart',

  show: (message: string, type: ToastType = 'cart') => {
    set({ visible: true, message, type });
    const timer = setTimeout(() => {
      get().hide();
      clearTimeout(timer);
    }, 3500);
  },

  addToast: (message: string, type: ToastType = 'cart') => {
    set({ visible: true, message, type });
    const timer = setTimeout(() => {
      get().hide();
      clearTimeout(timer);
    }, 3500);
  },

  hide: () => set({ visible: false }),
}));
