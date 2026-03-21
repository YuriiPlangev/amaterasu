'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useFavoritesStore } from '../store/favoritesStore';
import { useToastStore } from '../store/toastStore';
import { getProxiedImageUrl } from '../lib/imageProxy';

interface ProductGalleryProps {
  product?: { id: number; name?: string; slug?: string; price?: string; images?: Array<{ src?: string }> };
  name: string;
  tag?: string;
  images: Array<{ src?: string }>;
  fallbackSrc: string;
}

export default function ProductGallery({ product, name, tag, images, fallbackSrc }: ProductGalleryProps) {
  const t = useTranslations('toast');
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isFavorite = product ? useFavoritesStore((state) => state.isFavorite(product.id)) : false;
  const showToast = useToastStore((state) => state.show);

  const gallery = useMemo(() => {
    const valid = (images || []).filter((img) => img?.src);
    return valid.length > 0 ? valid : [{ src: fallbackSrc }];
  }, [images, fallbackSrc]);

  const [activeIndex, setActiveIndex] = useState(0);
  const active = gallery[activeIndex]?.src || fallbackSrc;

  return (
    <div className="w-full min-w-0 flex flex-col gap-3 lg:sticky lg:top-0 lg:self-start">
      {/* Вся галерея (зображення + тумбнейли) — один sticky блок, скроліться разом */}
      <div className="relative border-2 border-[#D8D8D8] rounded-2xl bg-white p-4 md:p-6 flex flex-col min-h-0 overflow-hidden aspect-square lg:aspect-auto lg:h-[calc(100vh-6rem)] w-full">
        {tag && (
          <span className="absolute top-4 left-4 bg-[#9C0000] text-white font-semibold rounded-[6px] px-3 py-1 text-sm z-10">
            {tag}
          </span>
        )}
        {product && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const wasFavorite = isFavorite;
              toggleFavorite(product);
              showToast(wasFavorite ? t('removedFromFavorites') : t('addedToFavorites'), wasFavorite ? 'favorite_remove' : 'favorite_add');
            }}
            className="heart-hover-pulse absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border border-[#E6E6E6] hover:border-[#9C0000] z-10 transition-colors duration-200"
          >
            <Image src={isFavorite ? '/svg/heart-filled.svg' : '/svg/heart.svg'} alt="favorite" width={20} height={20} />
          </button>
        )}

        <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
          <Image
            src={getProxiedImageUrl(active)}
            alt={name || 'Product image'}
            width={620}
            height={620}
            priority
            className="w-auto max-w-full h-full max-h-full object-contain"
          />
        </div>
      </div>

      {/* Тумбнейли — частина sticky блоку, скролляться разом з основним зображенням */}
      {gallery.length > 1 && (
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center w-full">
          {gallery.slice(0, 4).map((img, idx) => (
            <button
              key={`${img?.src || idx}`}
              onClick={() => setActiveIndex(idx)}
              aria-pressed={idx === activeIndex}
              className={`border-2 rounded-xl p-2 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white shrink-0 ${
                idx === activeIndex ? 'border-[#9C0000]' : 'border-[#E6E6E6]'
              }`}
            >
              <Image
                src={getProxiedImageUrl(img?.src || fallbackSrc)}
                alt={`${name} — ${idx + 1}`}
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
