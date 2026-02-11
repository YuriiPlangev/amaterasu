'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useFavoritesStore } from '../store/favoritesStore';
import { useToastStore } from '../store/toastStore';

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
    <div className="relative border-2 border-[#D8D8D8] rounded-2xl bg-white p-4 md:p-6 flex flex-col min-h-0">
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
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border border-[#E6E6E6] hover:border-[#9C0000] z-10"
        >
          <Image src={isFavorite ? '/svg/heart-filled.svg' : '/svg/heart.svg'} alt="favorite" width={20} height={20} />
        </button>
      )}

      <div className="flex-1 flex items-center justify-center min-h-[280px] md:min-h-[400px]">
        <Image
          src={active}
          alt={name}
          width={620}
          height={620}
          className="w-full max-w-[520px] h-auto max-h-[50vh] md:max-h-[calc(100vh-280px)] object-contain"
        />
      </div>

      <div className="flex gap-2 md:gap-3 mt-4 md:mt-0 md:absolute md:left-6 md:bottom-6 overflow-x-auto pb-2 md:pb-0">
        {gallery.slice(0, 4).map((img, idx) => (
          <button
            key={`${img?.src || idx}`}
            onClick={() => setActiveIndex(idx)}
            className={`border-2 rounded-xl p-2 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white shrink-0 ${
              idx === activeIndex ? 'border-[#9C0000]' : 'border-[#E6E6E6]'
            }`}
          >
            <Image
              src={img?.src || fallbackSrc}
              alt={name}
              width={80}
              height={80}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
