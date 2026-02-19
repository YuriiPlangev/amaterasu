'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';

export default function ProductActions({ product }: { product: any }) {
  const locale = useLocale();
  const t = useTranslations('toast');
  const router = useRouter();
  const addToCart = useCartStore((state) => state.add);
  const showToast = useToastStore((state) => state.show);

  const isInStock = product?.stock_status === 'instock';

  const handleBuy = () => {
    if (!isInStock) return;
    addToCart(product, 1);
    router.push(`/${locale}/cart`);
  };

  const handleAddToCart = () => {
    if (!isInStock) return;
    addToCart(product, 1);
    showToast(t('addedToCart'), 'cart');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={handleBuy}
        disabled={!isInStock}
        className="flex-1 bg-[#9C0000] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#7D0000] transition flex items-center justify-center gap-2 text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Image src="/svg/shopping-bag.svg" alt="" width={20} height={20} className="brightness-0 invert" />
        Купити
      </button>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!isInStock}
        className="flex-1 border-2 border-[#9C0000] text-[#9C0000] font-bold py-4 px-6 rounded-xl hover:bg-[#9C0000] hover:text-white transition text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed"
      >
        В кошик
      </button>
    </div>
  );
}
