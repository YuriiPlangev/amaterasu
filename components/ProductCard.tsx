'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useToastStore } from '../store/toastStore';
import { getProxiedImageUrl } from '../lib/imageProxy';
import { cleanDescription } from '../lib/html';

export default function ProductCard({ product }: { product: any }) {
  const t = useTranslations('toast');
  const tCard = useTranslations('productCard');
  const addToCart = useCartStore((state) => state.add);
  const items = useCartStore((state) => state.items);
  const isInCart = product?.id != null && items.some((i) => i.id === product.id);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product?.id));
  const showToast = useToastStore((state) => state.show);
  const locale = useLocale();
  const router = useRouter();
  const isCustomDesign = Boolean(product?.isCustomDesign);

  const productDescription = cleanDescription(product?.short_description || '');
  const isInStock = product?.stock_status === 'instock';
  const [isCartHovered, setIsCartHovered] = useState(false);
  
  // Price and discount logic
  const currentPrice = parseFloat(product?.price || '0');
  const regularPrice = parseFloat(product?.regular_price || '0');
  const hasDiscount = regularPrice > currentPrice && currentPrice > 0 && regularPrice > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCustomDesign) {
      router.push(productHref);
      return;
    }

    addToCart(product, 1);
    showToast(t('addedToCart'), 'cart');
  };

  const handleGoToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/${locale}/cart`);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasFavorite = isFavorite;
    toggleFavorite(product);
    showToast(wasFavorite ? t('removedFromFavorites') : t('addedToFavorites'), wasFavorite ? 'favorite_remove' : 'favorite_add');
  };

  const productTag = product?.tags?.[0]?.name || '';
  const productHref = product?.customUrl || `/${locale}/product/${product?.slug || product?.id}?id=${product?.id}`;

  const handleProductClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[ProductNav] click', {
      id: product?.id,
      slug: product?.slug,
      name: product?.name,
      href: productHref,
    });
  };

  return (
    <article className={`relative border border-[#D8D8D8] px-5 py-4 flex flex-col rounded-2xl items-center gap-4 transition-all duration-300 hover:shadow-[0px_12px_28px_0px_#0000001A] h-full ${!isInStock ? 'opacity-50' : ''}`}>
      {productTag && (
        <span className="absolute top-4 left-4 inline-flex w-fit max-w-[calc(100%-2rem)] items-center rounded-md bg-[#9C0000] px-4 py-2 text-sm font-semibold leading-none text-white z-10">
          {productTag}
        </span>
      )}

      <Link href={productHref} className="flex flex-col w-full cursor-pointer flex-1" onClick={handleProductClick}>
        <Image src={getProxiedImageUrl(product?.images?.[0]?.src)} alt={product?.name} width={300} height={260} className="w-full h-[260px] object-contain" />
        <div className="flex flex-col items-center w-full gap-[10px] flex-1">
          <div className="flex justify-between items-center gap-2 w-full">
            <div className="flex flex-col items-center gap-0">
              <p className={`text-[#9C0000] font-semibold text-sm line-through opacity-60 min-h-[21px] ${hasDiscount ? 'visible' : 'invisible'}`}>
                {hasDiscount ? `${regularPrice.toFixed(2)} ₴` : '0 ₴'}
              </p>
              <p className="text-[#9C0000] font-semibold text-[25px] whitespace-nowrap shrink-0">{product?.price} ₴</p>
            </div>
            <p className={`font-semibold text-[14px] ${isInStock ? 'text-[#2E7900]' : 'text-[#9C0000]'}`}>
              {isInStock ? tCard('inStock') : tCard('outOfStock')}
            </p>
          </div>
          <div className="self-start w-full min-w-0">
            <h3 className="text-black font-medium text-[16px] truncate" title={product?.name}>{product?.name}</h3>
            <p className="text-black font-medium text-[15px] truncate">{productDescription}</p>
          </div>
        </div>
      </Link>

      <div className="flex justify-between items-center w-full gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={isCustomDesign ? handleAddToCart : isInCart ? handleGoToCart : handleAddToCart}
          onMouseEnter={() => setIsCartHovered(true)}
          onMouseLeave={() => setIsCartHovered(false)}
          disabled={!isInStock}
          className={`btn-press flex justify-center items-center gap-2 px-3 py-2 rounded-md flex-1 transition-all duration-300 font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed ${
            isInCart
              ? 'border-2 border-[#9C0000] text-[#9C0000] bg-white hover:bg-[#FFF7F7]'
              : 'bg-[#9C0000] text-white hover:bg-white hover:text-[#9C0000] hover:border-[#9C0000] hover:border'
          }`}
        >
          {isCustomDesign ? tCard('details') : isInCart ? tCard('toCart') : tCard('buy')}
          {!isInCart && !isCustomDesign && (
            <Image
              src={isCartHovered ? '/svg/shopping-bag-red.svg' : '/svg/shopping-bag.svg'}
              alt="cart"
              width={24}
              height={24}
            />
          )}
        </button>
        {!isCustomDesign && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            className="heart-hover-pulse transition-transform duration-200"
          >
            <Image src={isFavorite ? '/svg/heart-filled.svg' : '/svg/heart.svg'} alt="favorite" width={32} height={32} className="transition-transform duration-200" />
          </button>
        )}
      </div>
    </article>
  );
}
