'use client';

import React, { useState } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import ProductCard from '../../../components/ProductCard';
import CatalogSearch from '../../../components/ui/CatalogSearch';
import Image from 'next/image';
import CatalogFilters from '../../../components/sections/CatalogFilters';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const FunnelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function CatalogPage() {
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [tagSlug, setTagSlug] = useState<string>('');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);


  const hasActiveFilters = Boolean(categorySlug || tagSlug);
  const activeFilterTags = [
    categorySlug && { slug: categorySlug, label: categorySlug },
    tagSlug && { slug: tagSlug, label: tagSlug },
  ].filter(Boolean) as { slug: string; label: string }[];

  const clearFilters = () => {
    setCategorySlug('');
    setTagSlug('');
  };

  const removeFilterTag = (slug: string) => {
    if (categorySlug === slug) setCategorySlug('');
    if (tagSlug === slug) setTagSlug('');
  };

  const logoSlides = [
    { src: '/images/naruto.png', alt: 'Naruto' },
    { src: '/images/onepiece.png', alt: 'One Piece' },
    { src: '/images/bleach.png', alt: 'Bleach' },
    { src: '/images/attack.png', alt: 'Attack on Titan' },
    { src: '/images/berserk.png', alt: 'Berserk' },
    { src: '/images/demonSlayer.png', alt: 'Demon Slayer' },
    { src: '/images/jujutsu.png', alt: 'Jujutsu Kaisen' },
  ];

  const { data: products, isLoading, error } = useProducts({
    category_slug: categorySlug || undefined,
    tag_slug: tagSlug || undefined,
    per_page: 24,
  });

  return (
    <main className="max-w-[1920px] w-full mx-auto site-padding-x py-10 mt-20">
      {/* Mobile: при открытых фильтрах — только фильтры, header и footer видны, контент скрыт */}
      {isMobileFiltersOpen ? (
        <div className="md:hidden flex flex-col min-h-[60vh]">
          <div className="flex items-center justify-between px-4 py-4 text-[#1C1C1C] rounded-xl">
            <div className='flex items-center gap-2'>
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shrink-0"
              aria-label="Назад"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <p className='text-[#1C1C1C] text-bold text-[20px]'>Фільтри</p>
            </div>
  
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="bg-[#9C0000] text-white px-6 py-2.5 rounded-lg font-semibold text-sm"
            >
              Застосувати
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <CatalogFilters variant="drawer" />
          </div>
        </div>
      ) : (
        <>
      {/* Top: small horizontal avatars / categories (visual placeholder) */}
      <div className="mb-6 flex flex-col gap-6">
        <div className='flex items-center p-1 border border-[#9C0000] rounded-[25px] w-fit'>
          <div className='rounded-[20px] bg-[#9C0000] px-12 py-2.5 w-fit'>
            <p>Тайтли</p>
          </div>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden ml-4">
          <Swiper
            spaceBetween={24}
            slidesPerView="auto"
            className="logo-slider"
            breakpoints={{
              0: { slidesPerView: 2, spaceBetween: 16 },
              640: { slidesPerView: 3, spaceBetween: 20 },
              1024: { slidesPerView: 4, spaceBetween: 32 },
            }}
          >
            {logoSlides.map((logo, i) => (
              <SwiperSlide key={i} className="!w-auto">
                <div className="h-14 sm:h-16 md:h-20 w-[140px] sm:w-[160px] md:w-[200px] relative shrink-0">
                  <Image src={logo.src} alt={logo.alt} fill className="object-contain object-center" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      

      <h2 className='text-[#000000] mb-5 mt-7 text-[32px] text-medium hidden md:block'>Фільтри</h2>

      <div className="grid grid-cols-1 md:grid-cols-[clamp(260px,24vw,420px)_minmax(0,1fr)] gap-8">
        {/* Sidebar: desktop only */}
        <aside className="hidden md:block">
          <CatalogFilters />
        </aside>

        {/* Content */}
        <section>
          <header className="mb-6 flex flex-col md:flex-row gap-3 md:gap-4 w-full">
            {/* Search */}
            <div className="w-full">
              <CatalogSearch placeholder="Введіть запит..." />
            </div>

            {/* Mobile: Filters + Sort row */}
            <div className="flex md:hidden items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex items-center gap-2 bg-[#9C0000] text-white rounded-lg px-4 py-2.5 text-sm font-bold w-fit"
              >
                <FunnelIcon />
                Фільтри
              </button>
              <div className="relative flex items-center gap-2 shrink-0">
                <label className="text-sm hidden md:block text-[#111827]">Сортувати:</label>
                <select
                  className="border border-[#D8D8D8] rounded-md px-3 py-2 bg-white appearance-none pr-8 text-sm"
                  onMouseDown={() => setIsSortOpen((v) => !v)}
                  onBlur={() => setIsSortOpen(false)}
                  onChange={() => setIsSortOpen(false)}
                >
                  <option>по актуальності</option>
                  <option>ціна: від дешевих</option>
                  <option>ціна: від дорогих</option>
                </select>
                <Image
                  src="/svg/arrow-down.svg"
                  alt=""
                  width={14}
                  height={8}
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${isSortOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {/* Desktop: Sort only */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <label className="">Сортувати:</label>
              <div className="relative">
                <select
                  className="border border-[#D8D8D8] rounded-md px-3 py-2 bg-white appearance-none pr-10"
                  onMouseDown={() => setIsSortOpen((v) => !v)}
                  onBlur={() => setIsSortOpen(false)}
                  onChange={() => setIsSortOpen(false)}
                >
                  <option>по актуальності</option>
                  <option>ціна: від дешевих</option>
                  <option>ціна: від дорогих</option>
                </select>
                <Image
                  src="/svg/arrow-down.svg"
                  alt=""
                  width={14}
                  height={8}
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${isSortOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {/* Mobile: Clear + filter tags */}
            {hasActiveFilters && (
              <div className="flex md:hidden items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-[#6B7280] text-sm font-medium w-fit"
                >
                  <TrashIcon />
                  Очистити
                </button>
                {activeFilterTags.map(({ slug, label }) => (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1.5 bg-[#E5E7EB] text-[#374151] rounded-lg px-3 py-1.5 text-sm"
                  >
                    {label}
                    <button type="button" onClick={() => removeFilterTag(slug)} aria-label="Видалити" className="hover:text-[#9C0000]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            </header>

          {isLoading && (
            <div className="py-10 text-center text-gray-600">Завантаження товарів...</div>
          )}

          {error && (
            <div className="py-10 text-center text-red-600">Не вдалося завантажити товари. Спробуйте пізніше.</div>
          )}

          {!isLoading && !error && (
            <>
              {products && products.length > 0 ? (
                <section className="grid grid-cols-2 lg:grid-cols-3 [@media(min-width:1600px)]:grid-cols-4 gap-6">
                  {products.map((product: any) => (
                    <div key={product.id} className="w-full">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </section>
              ) : (
                <div className="py-10 text-center text-gray-600">Товари не знайдено. Спробуйте змінити фільтри.</div>
              )}
            </>
          )}
        </section>
      </div>
        </>
      )}
    </main>
  );
}


