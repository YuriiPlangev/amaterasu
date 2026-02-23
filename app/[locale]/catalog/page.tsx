'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '../../../hooks/useProducts';
import ProductCard from '../../../components/ProductCard';
import CatalogSearch from '../../../components/ui/CatalogSearch';
import Image from 'next/image';
import CatalogFilters, { initialFilterState, type CatalogFilterState } from '../../../components/sections/CatalogFilters';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
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

export type SortOption = 'date' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date', label: 'по актуальності' },
  { value: 'price_asc', label: 'ціна: від дешевих' },
  { value: 'price_desc', label: 'ціна: від дорогих' },
];

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const [filterState, setFilterState] = useState<CatalogFilterState>(initialFilterState);
  const [searchInput, setSearchInput] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [categoryNames, setCategoryNames] = useState<Record<number, string>>({});
  const logoSliderPrevRef = useRef<HTMLButtonElement>(null);
  const logoSliderNextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const q = searchParams.get('search') ?? '';
    setSearchInput(q);
    setSearchApplied(q);
  }, [searchParams]);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      const id = Number(categoryParam);
      if (!isNaN(id)) {
        setFilterState((s) => ({
          ...s,
          categoryIds: s.categoryIds.includes(id) ? s.categoryIds : [id],
        }));
      }
    }
  }, [searchParams.get('category')]);

  useEffect(() => {
    fetch('/api/catalog/filters')
      .then((r) => r.json())
      .then((d) => {
        const map: Record<number, string> = {};
        for (const c of d?.categories ?? []) {
          if (c?.id != null) map[c.id] = c.name || '';
        }
        setCategoryNames(map);
      })
      .catch(() => {});
  }, []);

  const hasActiveFilters =
    filterState.priceFrom !== '' ||
    filterState.priceTo !== '' ||
    filterState.categoryIds.length > 0 ||
    filterState.titles.length > 0 ||
    filterState.characters.length > 0 ||
    filterState.genres.length > 0 ||
    searchApplied.trim().length > 0;

  const activeFilterTags: { key: string; label: string }[] = [
    ...(searchApplied.trim() ? [{ key: 'search', label: `Пошук: ${searchApplied.trim()}` }] : []),
    ...filterState.categoryIds.map((id) => ({ key: `cat-${id}`, label: categoryNames[id] || `Категорія #${id}` })),
    ...filterState.titles.map((t) => ({ key: `title-${t}`, label: t })),
    ...filterState.characters.map((c) => ({ key: `char-${c}`, label: c })),
    ...filterState.genres.map((g) => ({ key: `genre-${g}`, label: g })),
  ];

  const clearFilters = () => {
    setFilterState(initialFilterState);
    setSearchInput('');
    setSearchApplied('');
  };

  const removeFilterTag = (key: string) => {
    if (key === 'search') {
      setSearchApplied('');
      return;
    }
    if (key.startsWith('cat-')) {
      const id = Number(key.replace('cat-', ''));
      setFilterState((s) => ({ ...s, categoryIds: s.categoryIds.filter((x) => x !== id) }));
    } else if (key.startsWith('title-')) {
      const v = key.replace('title-', '');
      setFilterState((s) => ({ ...s, titles: s.titles.filter((x) => x !== v) }));
    } else if (key.startsWith('char-')) {
      const v = key.replace('char-', '');
      setFilterState((s) => ({ ...s, characters: s.characters.filter((x) => x !== v) }));
    } else if (key.startsWith('genre-')) {
      const v = key.replace('genre-', '');
      setFilterState((s) => ({ ...s, genres: s.genres.filter((x) => x !== v) }));
    }
  };

  // titleFilter — значение из фильтра «Тайтли» (должно совпадать с атрибутом в WooCommerce)
  const logoSlides: { src: string; alt: string; titleFilter: string }[] = [
    { src: '/images/naruto.png', alt: 'Naruto', titleFilter: 'Наруто' },
    { src: '/images/onepiece.png', alt: 'One Piece', titleFilter: 'Ван Пис' },
    { src: '/images/bleach.png', alt: 'Bleach', titleFilter: 'Бліч' },
    { src: '/images/attack.png', alt: 'Attack on Titan', titleFilter: 'Атака титанів' },
    { src: '/images/berserk.png', alt: 'Berserk', titleFilter: 'Берсерк' },
    { src: '/images/demonSlayer.png', alt: 'Demon Slayer', titleFilter: 'Клинок, що знищує демонів' },
    { src: '/images/jujutsu.png', alt: 'Jujutsu Kaisen', titleFilter: 'Магічна битва' },
  ];

  const setTitleFilter = (titleValue: string) => {
    setFilterState((s) => {
      const has = s.titles.includes(titleValue);
      if (has) return { ...s, titles: s.titles.filter((t) => t !== titleValue) };
      return { ...s, titles: [...s.titles, titleValue] };
    });
  };

  const productParams: Record<string, string | undefined> = {
    per_page: '24',
    sort: sortBy,
  };
  if (searchApplied.trim()) {
    productParams.search = searchApplied.trim();
  }
  if (filterState.categoryIds.length > 0) {
    productParams.categories = filterState.categoryIds.join(',');
  }
  if (filterState.priceFrom) productParams.price_min = filterState.priceFrom;
  if (filterState.priceTo) productParams.price_max = filterState.priceTo;
  if (filterState.titles.length) productParams.attribute_title = filterState.titles.join(',');
  if (filterState.characters.length) productParams.attribute_character = filterState.characters.join(',');
  if (filterState.genres.length) productParams.attribute_genre = filterState.genres.join(',');

  const { data: products, isLoading, error } = useProducts(productParams);

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
            <CatalogFilters
              variant="drawer"
              value={filterState}
              onChange={setFilterState}
            />
          </div>
        </div>
      ) : (
        <>
      {/* Top: Тайтли + кнопки скролу справа зверху, потім слайдер */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center p-1 border border-[#9C0000] rounded-[25px] w-fit">
            <div className="rounded-[20px] bg-[#9C0000] px-12 py-2.5 w-fit">
              <p>Тайтли</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              ref={logoSliderPrevRef}
              type="button"
              className="w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md hover:bg-[#f5f5f5] transition"
              aria-label="Прокрутити вліво"
            >
              <Image src="/svg/arrow-left.svg" alt="" width={24} height={24} />
            </button>
            <button
              ref={logoSliderNextRef}
              type="button"
              className="w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md hover:bg-[#f5f5f5] transition"
              aria-label="Прокрутити вправо"
            >
              <Image src="/svg/arrow-right.svg" alt="" width={24} height={24} />
            </button>
          </div>
        </div>
        <div className="relative overflow-visible min-w-0">
          <Swiper
            spaceBetween={24}
            slidesPerView="auto"
            navigation={{
              nextEl: logoSliderNextRef.current,
              prevEl: logoSliderPrevRef.current,
            }}
            onBeforeInit={(swiper) => {
              if (typeof swiper.params.navigation !== 'boolean' && swiper.params.navigation) {
                (swiper.params.navigation as any).prevEl = logoSliderPrevRef.current;
                (swiper.params.navigation as any).nextEl = logoSliderNextRef.current;
              }
            }}
            modules={[Navigation]}
            className="logo-slider"
            breakpoints={{
              0: { slidesPerView: 2, spaceBetween: 16 },
              640: { slidesPerView: 3, spaceBetween: 20 },
              1024: { slidesPerView: 4, spaceBetween: 32 },
            }}
          >
            {logoSlides.map((logo, i) => (
              <SwiperSlide key={i} className="!w-auto">
                <button
                  type="button"
                  onClick={() => setTitleFilter(logo.titleFilter)}
                  className={`h-14 sm:h-16 md:h-20 w-[140px] sm:w-[160px] md:w-[200px] relative shrink-0 block transition-opacity hover:opacity-90 ${
                    filterState.titles.includes(logo.titleFilter)
                      ? 'ring-2 ring-[#9C0000] rounded-lg'
                      : ''
                  }`}
                  aria-label={`Фільтр: ${logo.alt}`}
                >
                  <Image src={logo.src} alt={logo.alt} fill className="object-contain object-center pointer-events-none" />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      

      <h2 className='text-[#000000] mb-5 mt-7 text-[32px] text-medium hidden md:block'>Фільтри</h2>

      <div className="grid grid-cols-1 md:grid-cols-[clamp(260px,24vw,420px)_minmax(0,1fr)] gap-8">
        {/* Sidebar: desktop only */}
        <aside className="hidden md:block">
          <CatalogFilters
            value={filterState}
            onChange={setFilterState}
          />
        </aside>

        {/* Content */}
        <section>
          <header className="mb-6 flex flex-col md:flex-row gap-3 md:gap-4 w-full">
            {/* Search: пошук тільки після натискання «Шукати» */}
            <div className="w-full">
              <CatalogSearch
                placeholder="Введіть запит..."
                value={searchInput}
                onSearch={setSearchInput}
                onSearchSubmit={() => setSearchApplied(searchInput.trim())}
              />
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
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  onMouseDown={() => setIsSortOpen((v) => !v)}
                  onBlur={() => setIsSortOpen(false)}
                  className="border border-[#D8D8D8] rounded-md px-3 py-2 bg-white appearance-none pr-8 text-sm"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
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

            {/* Desktop: Clear + filter tags */}
            {hasActiveFilters && (
              <div className="hidden md:flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-[#6B7280] text-sm font-medium w-fit"
                >
                  <TrashIcon />
                  Очистити
                </button>
                {activeFilterTags.map(({ key, label }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 bg-[#E5E7EB] text-[#374151] rounded-lg px-3 py-1.5 text-sm"
                  >
                    {label}
                    <button type="button" onClick={() => removeFilterTag(key)} aria-label="Видалити" className="hover:text-[#9C0000]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Desktop: Sort only */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <label className="">Сортувати:</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  onMouseDown={() => setIsSortOpen((v) => !v)}
                  onBlur={() => setIsSortOpen(false)}
                  className="border border-[#D8D8D8] rounded-md px-3 py-2 bg-white appearance-none pr-10"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
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
                {activeFilterTags.map(({ key, label }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 bg-[#E5E7EB] text-[#374151] rounded-lg px-3 py-1.5 text-sm"
                  >
                    {label}
                    <button type="button" onClick={() => removeFilterTag(key)} aria-label="Видалити" className="hover:text-[#9C0000]">
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


