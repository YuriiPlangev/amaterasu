'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useProducts } from '../../../hooks/useProducts';
import { useCatalogMetadata } from '../../../hooks/useCatalogMetadata';
import ProductCard from '../../../components/ProductCard';
import CatalogSearch from '../../../components/ui/CatalogSearch';
import Image from 'next/image';
import CatalogFilters, { initialFilterState, type CatalogFilterState, type FilterOptions } from '../../../components/sections/CatalogFilters';
import { ProductSkeleton } from '../../../components/ui/Skeletons';
import { CATALOG_LOGO_SLIDES } from '../../../constants/catalog';
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

type SortDropdownProps = {
  label: string;
  value: SortOption;
  options: { value: SortOption; label: string }[];
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  onChange: (v: SortOption) => void;
  buttonClassName?: string;
  menuClassName?: string;
};

function SortDropdown({
  label,
  value,
  options,
  isOpen,
  setIsOpen,
  onChange,
  buttonClassName,
  menuClassName,
}: SortDropdownProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const active = options.find((o) => o.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={
          buttonClassName ??
          'border border-[#D8D8D8] rounded-md px-3 py-2 bg-white pr-10 min-w-[220px] text-left'
        }
      >
        <span className="block truncate">{active?.label ?? label}</span>
        <Image
          src="/svg/arrow-down.svg"
          alt=""
          width={14}
          height={8}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className={
            menuClassName ??
            'absolute right-0 top-full mt-3 w-full min-w-[220px] rounded-xl border border-[#D8D8D8] bg-white shadow-lg p-1 z-30'
          }
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (opt.value !== value) onChange(opt.value);
                  setIsOpen(false);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (opt.value !== value) onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  selected ? 'bg-[#111827] text-white' : 'text-[#111827] hover:bg-[#F3F4F6]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function normalizeFilterLabel(value: string) {
  return value.trim().toLowerCase();
}

function parseNumericList(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => Number(decodeURIComponent(item)))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function buildIdToLabelMap(options: Array<{ id: number; label: string }> | undefined) {
  const map: Record<number, string> = {};
  for (const option of options ?? []) {
    map[option.id] = option.label;
  }
  return map;
}

function resolveLegacyAttrIds(rawValue: string | null, labelToId: Map<string, number>): number[] {
  if (!rawValue || labelToId.size === 0) return [];

  return rawValue
    .split(',')
    .map((item) => {
      const decoded = decodeURIComponent(item);
      const numeric = Number(decoded);
      if (Number.isInteger(numeric) && numeric > 0) return numeric;
      return labelToId.get(normalizeFilterLabel(decoded));
    })
    .filter((item): item is number => typeof item === 'number' && Number.isInteger(item) && item > 0);
}

function resolveCustomProductType(slug: string, categoryName: string) {
  const slugLower = slug.toLowerCase();
  const categoryLower = categoryName.toLowerCase();

  if (slugLower.includes('badge') || slugLower.includes('значк') || categoryLower.includes('значк')) {
    return 'badge';
  }

  if (slugLower.includes('magnet') || slugLower.includes('магніт') || categoryLower.includes('магніт')) {
    return 'magnet';
  }

  if (
    slugLower.includes('keychain') ||
    slugLower.includes('брелок') ||
    slugLower.includes('брелки') ||
    categoryLower.includes('брелок') ||
    categoryLower.includes('брелки') ||
    categoryLower.includes('keychain')
  ) {
    return 'keychain';
  }

  return 'cup';
}

function resolveCustomProductImage(slug: string, categoryName: string) {
  const productType = resolveCustomProductType(slug, categoryName);

  if (productType === 'badge') return '/images/badge_cover.webp';
  if (productType === 'magnet') return '/images/magnet_cover.webp';
  if (productType === 'keychain') return '/images/keychain_cover.webp';
  return '/images/cup_cover.webp';
}

function resolveCustomProductPrice(slug: string, categoryName: string) {
  const productType = resolveCustomProductType(slug, categoryName);
  return productType === 'cup' ? '200' : '40';
}

export default function CatalogPage() {
  const t = useTranslations('catalog');
  const SORT_OPTIONS: { value: SortOption; label: string }[] = useMemo(
    () => [
      { value: 'date', label: t('sortDate') },
      { value: 'price_asc', label: t('sortPriceAsc') },
      { value: 'price_desc', label: t('sortPriceDesc') },
    ],
    [t]
  );
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const [filterState, setFilterState] = useState<CatalogFilterState>(() => {
    const s = { ...initialFilterState };
    const cats = searchParams.get('category') || searchParams.get('categories');
    if (cats) s.categoryIds = cats.split(',').map(Number).filter(id => !isNaN(id));
    const title = searchParams.get('attribute_title');
    if (title) s.titles = parseNumericList(title);
    const char = searchParams.get('attribute_character');
    if (char) s.characters = parseNumericList(char);
    const genre = searchParams.get('attribute_genre');
    if (genre) s.genres = parseNumericList(genre);
    const games = searchParams.get('attribute_games');
    if (games) s.games = parseNumericList(games);
    const priceMin = searchParams.get('price_min');
    if (priceMin) s.priceFrom = priceMin;
    const priceMax = searchParams.get('price_max');
    if (priceMax) s.priceTo = priceMax;
    return s;
  });
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '');
  const [searchApplied, setSearchApplied] = useState(() => searchParams.get('search') ?? '');
  const [sortBy, setSortBy] = useState<SortOption>(
    () => (searchParams.get('sort') as SortOption) || 'date'
  );
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [newProductIds, setNewProductIds] = useState<Set<number>>(new Set());
  const isLargeScreen = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(min-width: 1024px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
    () => true
  );
  const perPage = isLargeScreen ? 12 : 8;

  const {
    metadata: filterOptions,
    titleLabelToId,
    characterLabelToId,
    genreLabelToId,
    gameLabelToId,
  } = useCatalogMetadata();

  const titleIdToLabel = useMemo(() => buildIdToLabelMap(filterOptions?.titles), [filterOptions]);
  const characterIdToLabel = useMemo(() => buildIdToLabelMap(filterOptions?.characters), [filterOptions]);
  const genreIdToLabel = useMemo(() => buildIdToLabelMap(filterOptions?.genres), [filterOptions]);
  const gameIdToLabel = useMemo(() => buildIdToLabelMap(filterOptions?.games), [filterOptions]);

  // Sync state → URL so filters survive page refresh
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (searchApplied.trim()) params.set('search', searchApplied.trim());
    if (filterState.categoryIds.length) params.set('categories', filterState.categoryIds.join(','));
    if (filterState.priceFrom) params.set('price_min', filterState.priceFrom);
    if (filterState.priceTo) params.set('price_max', filterState.priceTo);
    if (filterState.titles.length) params.set('attribute_title', filterState.titles.join(','));
    if (filterState.characters.length) params.set('attribute_character', filterState.characters.join(','));
    if (filterState.genres.length) params.set('attribute_genre', filterState.genres.join(','));
    if (filterState.games.length) params.set('attribute_games', filterState.games.join(','));
    if (sortBy !== 'date') params.set('sort', sortBy);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filterState, searchApplied, sortBy]);

  const categoryNames = useMemo(() => {
    const map: Record<number, string> = {};
    for (const c of filterOptions?.categories ?? []) {
      if (c?.id != null) map[c.id] = c.name || '';
    }
    return map;
  }, [filterOptions?.categories]);

  const categorySlugs = useMemo(() => {
    const map: Record<number, string> = {};
    for (const c of filterOptions?.categories ?? []) {
      if (c?.id != null) map[c.id] = c.slug || '';
    }
    return map;
  }, [filterOptions?.categories]);

  const customCategoryIds = useMemo(
    () =>
      (filterOptions?.customProductionCategories ?? [])
        .map((c) => Number(c?.id))
        .filter((id) => Number.isFinite(id)),
    [filterOptions?.customProductionCategories]
  );

  useEffect(() => {
    const nextTitles = resolveLegacyAttrIds(searchParams.get('attribute_title'), titleLabelToId);
    const nextCharacters = resolveLegacyAttrIds(searchParams.get('attribute_character'), characterLabelToId);
    const nextGenres = resolveLegacyAttrIds(searchParams.get('attribute_genre'), genreLabelToId);
    const nextGames = resolveLegacyAttrIds(searchParams.get('attribute_games'), gameLabelToId);

    if (!nextTitles.length && !nextCharacters.length && !nextGenres.length && !nextGames.length) return;

    setFilterState((current) => {
      const titles = nextTitles.length ? Array.from(new Set(nextTitles)) : current.titles;
      const characters = nextCharacters.length ? Array.from(new Set(nextCharacters)) : current.characters;
      const genres = nextGenres.length ? Array.from(new Set(nextGenres)) : current.genres;
      const games = nextGames.length ? Array.from(new Set(nextGames)) : current.games;

      const hasChanged =
        current.titles.join(',') !== titles.join(',') ||
        current.characters.join(',') !== characters.join(',') ||
        current.genres.join(',') !== genres.join(',') ||
        current.games.join(',') !== games.join(',');

      if (!hasChanged) return current;

      return {
        ...current,
        titles,
        characters,
        genres,
        games,
      };
    });
  }, [searchParams, titleLabelToId, characterLabelToId, genreLabelToId, gameLabelToId]);

  
  const hasActiveFilters =
    filterState.priceFrom !== '' ||
    filterState.priceTo !== '' ||
    filterState.categoryIds.length > 0 ||
    filterState.titles.length > 0 ||
    filterState.characters.length > 0 ||
    filterState.genres.length > 0 ||
    filterState.games.length > 0 ||
    searchApplied.trim().length > 0;

  const activeFilterTags: { key: string; label: string }[] = [
    ...(searchApplied.trim() ? [{ key: 'search', label: `${t('searchTag')} ${searchApplied.trim()}` }] : []),
    ...filterState.categoryIds.map((id) => ({ key: `cat-${id}`, label: categoryNames[id] || `${t('categoryTag')}${id}` })),
    ...filterState.titles.map((id) => ({ key: `title-${id}`, label: titleIdToLabel[id] || String(id) })),
    ...filterState.characters.map((id) => ({ key: `char-${id}`, label: characterIdToLabel[id] || String(id) })),
    ...filterState.genres.map((id) => ({ key: `genre-${id}`, label: genreIdToLabel[id] || String(id) })),
    ...filterState.games.map((id) => ({ key: `game-${id}`, label: gameIdToLabel[id] || String(id) })),
  ];

  // Dynamic document title for SEO when filters are applied
  const filterTitleLabel = filterState.characters[0]
    ? characterIdToLabel[filterState.characters[0]]
    : filterState.titles[0]
    ? titleIdToLabel[filterState.titles[0]]
    : filterState.games[0]
    ? gameIdToLabel[filterState.games[0]]
    : filterState.categoryIds[0]
    ? categoryNames[filterState.categoryIds[0]]
    : null;

  useEffect(() => {
    if (filterTitleLabel) {
      document.title =
        locale === 'uk'
          ? `Мерч по темі ${filterTitleLabel} | Amaterasu`
          : `Merch by ${filterTitleLabel} | Amaterasu`;
    } else {
      document.title = locale === 'uk' ? 'Каталог | Amaterasu' : 'Catalog | Amaterasu';
    }
  }, [filterTitleLabel, locale]);

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
      const v = Number(key.replace('title-', ''));
      setFilterState((s) => ({ ...s, titles: s.titles.filter((x) => x !== v) }));
    } else if (key.startsWith('char-')) {
      const v = Number(key.replace('char-', ''));
      setFilterState((s) => ({ ...s, characters: s.characters.filter((x) => x !== v) }));
    } else if (key.startsWith('genre-')) {
      const v = Number(key.replace('genre-', ''));
      setFilterState((s) => ({ ...s, genres: s.genres.filter((x) => x !== v) }));
    } else if (key.startsWith('game-')) {
      const v = Number(key.replace('game-', ''));
      setFilterState((s) => ({ ...s, games: s.games.filter((x) => x !== v) }));
    }
  };

  const logoSlides = CATALOG_LOGO_SLIDES;

  const setTitleFilter = (titleValue: string) => {
    const titleId = titleLabelToId.get(normalizeFilterLabel(titleValue));
    if (!titleId) return;

    // При кліку по логотипу тайтла дозволяємо вибрати тільки ОДИН тайтл:
    // якщо вже обраний — знімаємо фільтр, якщо інший — замінюємо попередній.
    setFilterState((s) => {
      const has = s.titles.includes(titleId);
      if (has) {
        return { ...s, titles: [] };
      }
      return { ...s, titles: [titleId] };
    });
  };

  const productParams: Record<string, string | undefined> = useMemo(() => {
    const params: Record<string, string | undefined> = {
      per_page: String(perPage),
      page: String(currentPage),
      sort: sortBy,
    };

    const trimmedSearch = searchApplied.trim();
    if (trimmedSearch) params.search = trimmedSearch;
    if (filterState.categoryIds.length > 0) params.categories = filterState.categoryIds.join(',');
    if (filterState.priceFrom) params.price_min = filterState.priceFrom;
    if (filterState.priceTo) params.price_max = filterState.priceTo;
    if (filterState.titles.length) params.attribute_title = filterState.titles.join(',');
    if (filterState.characters.length) params.attribute_character = filterState.characters.join(',');
    if (filterState.genres.length) params.attribute_genre = filterState.genres.join(',');
    if (filterState.games.length) params.attribute_games = filterState.games.join(',');

    return params;
  }, [
    currentPage,
    perPage,
    sortBy,
    searchApplied,
    filterState.categoryIds,
    filterState.priceFrom,
    filterState.priceTo,
    filterState.titles,
    filterState.characters,
    filterState.genres,
    filterState.games,
  ]);

  const { data: productsData, isLoading, error } = useProducts(productParams);

  // Debug: логируем параметры запроса

  // Скидаємо сторінку і накопичені товари при зміні фільтрів
  useEffect(() => {
    setCurrentPage(1);
    setAllProducts([]);
  }, [
    perPage,
    searchApplied,
    sortBy,
    filterState.categoryIds.join(','),
    filterState.priceFrom,
    filterState.priceTo,
    filterState.titles.join(','),
    filterState.characters.join(','),
    filterState.genres.join(','),
    filterState.games.join(','),
  ]);

  // Накопичуємо товари при завантаженні нової сторінки
  useEffect(() => {
    if (productsData && typeof productsData === 'object' && 'products' in productsData) {
      if (currentPage === 1) {
        setAllProducts(productsData.products || []);
      } else {
        // Добавляем только уникальные товары (избегаем дубликатов)
        setAllProducts(prev => {
          const existingIds = new Set(prev.map((p: any) => p.id));
          const newProducts = (productsData.products || []).filter((p: any) => !existingIds.has(p.id));
          
          // Отмечаем новые товары для анимации
          const newIds = new Set<number>(newProducts.map((p: any) => p.id));
          setNewProductIds(newIds);
          
          // Убираем анимацию через 600ms
          setTimeout(() => {
            setNewProductIds(new Set());
          }, 600);
          
          return [...prev, ...newProducts];
        });
      }
    } else if (Array.isArray(productsData)) {
      // Старий формат (для зворотної сумісності)
      if (currentPage === 1) {
        setAllProducts(productsData);
      }
    }
  }, [productsData, currentPage]);

  useEffect(() => {
    // If content shrinks after applying filters, clamp scroll to valid document bounds.
    const raf = window.requestAnimationFrame(() => {
      const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (window.scrollY > maxScrollY) {
        window.scrollTo({ top: maxScrollY, behavior: 'auto' });
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, [allProducts.length, isLoading, currentPage]);

  const hasMore = productsData && typeof productsData === 'object' && 'hasMore' in productsData 
    ? productsData.hasMore 
    : false;

  const selectedCustomCategoryId = filterState.categoryIds.find((id) => customCategoryIds.includes(id));
  const customCategoryName = selectedCustomCategoryId ? categoryNames[selectedCustomCategoryId] : '';
  const customCategorySlug = selectedCustomCategoryId ? categorySlugs[selectedCustomCategoryId] : '';
  const customProductImage = resolveCustomProductImage(customCategorySlug || '', customCategoryName || '');
  const customProductPrice = resolveCustomProductPrice(customCategorySlug || '', customCategoryName || '');

  const customDesignProduct = selectedCustomCategoryId
    ? {
        id: -selectedCustomCategoryId,
        slug: `custom-design-${customCategorySlug || selectedCustomCategoryId}`,
        name: customCategoryName ? `${customCategoryName} з вашим дизайном` : 'З вашим дизайном',
        short_description: 'Індивідуальне виготовлення під ваш макет. Натисніть, щоб дізнатися деталі замовлення.',
        price: customProductPrice,
        stock_status: 'instock',
        images: [{ src: customProductImage }],
        isCustomDesign: true,
        customUrl: `/${locale}/custom-order/${customCategorySlug || selectedCustomCategoryId}?category=${encodeURIComponent(customCategoryName || '')}`,
      }
    : null;

  // Исключаем товары-аватарки (категория avatars, id = 7012), чтобы они не светились в общем каталоге
  const nonAvatarProducts = allProducts.filter((p: any) => {
    const cats = Array.isArray(p?.categories) ? p.categories : [];
    // WooCommerce REST обычно возвращает категории как объекты { id, name, slug }
    return !cats.some((c: any) => Number(c?.id) === 7012 || String(c?.slug || '').toLowerCase() === 'avatars');
  });

  const displayedProducts = customDesignProduct
    ? [customDesignProduct, ...nonAvatarProducts]
    : nonAvatarProducts;

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  return (
    <>
      <div className="max-w-[1920px] w-full mx-auto site-padding-x pb-10 mt-24">
      {/* Mobile: при открытых фильтрах — только фильтры, header и footer видны, контент скрыт */}
      {isMobileFiltersOpen ? (
        <div className="md:hidden flex flex-col min-h-[60vh]">
          <div className="flex items-center justify-between px-4 py-4 text-[#1C1C1C] rounded-xl">
            <div className='flex items-center gap-2'>
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shrink-0"
              aria-label={t('back')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <p className='text-[#1C1C1C] text-bold text-[20px]'>{t('filters')}</p>
            </div>
  
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="bg-[#9C0000] text-white px-6 py-2.5 rounded-lg font-semibold text-sm"
            >
              {t('apply')}
            </button>
          </div>
          <div className="flex-1 min-h-0 max-h-[calc(100vh-10rem)] overflow-y-auto overflow-x-hidden px-4 py-4">
            <CatalogFilters
              variant="drawer"
              value={filterState}
              onChange={setFilterState}
              options={filterOptions}
            />
          </div>
        </div>
      ) : (
        <>
      {/* Top: логотипи тайтлів + стрілки; на max-[500px] стрілки під картинками */}
      <div className="mb-6">
        <div className="relative w-full min-w-0">
          <Swiper
            slidesPerView={2}
            spaceBetween={12}
            breakpoints={{
              1600: { slidesPerView: 5, spaceBetween: 30 },
              1200: { slidesPerView: 4, spaceBetween: 18 },
              768: { slidesPerView: 2, spaceBetween: 12 },
              0: { slidesPerView: 2, spaceBetween: 12 },
            }}
            loop={true}
            navigation={{
              nextEl: '.logo-slider-next',
              prevEl: '.logo-slider-prev',
            }}
            modules={[Navigation]}
            className="logo-slider"
          >
            {logoSlides.map((logo, i) => (
              <SwiperSlide key={i} className="flex justify-center items-center">
                <button
                  type="button"
                  onClick={() => setTitleFilter(logo.titleFilter)}
                  className={`h-14 sm:h-16 md:h-20 w-[140px] sm:w-[160px] md:w-[200px] relative shrink-0 block transition-opacity hover:opacity-90 ${
                    (() => {
                      const titleId = titleLabelToId.get(normalizeFilterLabel(logo.titleFilter));
                      return titleId ? filterState.titles.includes(titleId) : false;
                    })()
                      ? 'ring-2 ring-[#9C0000] rounded-lg'
                      : ''
                  }`}
                  aria-label={`${t('filterLabel')} ${logo.alt}`}
                >
                  <Image src={logo.src} alt={logo.alt} fill className="object-contain object-center pointer-events-none" />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Стрілки: max-[500px] — під слайдером по центру; 501px+ — по краях */}
          <div className="flex flex-row justify-between items-center py-3 max-[500px]:flex min-[501px]:absolute min-[501px]:inset-0 min-[501px]:pointer-events-none min-[501px]:flex-row min-[501px]:items-center min-[501px]:justify-between min-[501px]:px-2 min-[501px]:py-0">
            <button
              type="button"
              className="logo-slider-prev w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md hover:bg-[#f5f5f5] transition shrink-0 min-[501px]:pointer-events-auto min-[501px]:absolute min-[501px]:left-1 sm:-left-4 md:-left-6 min-[501px]:top-1/2 min-[501px]:-translate-y-1/2"
              aria-label={t('scrollLeft')}
            >
              <Image src="/svg/arrow-left.svg" alt="" width={24} height={24} />
            </button>
            <button
              type="button"
              className="logo-slider-next w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center bg-white shadow-md hover:bg-[#f5f5f5] transition shrink-0 min-[501px]:pointer-events-auto min-[501px]:absolute min-[501px]:right-1 sm:-right-4 md:-right-6 min-[501px]:top-1/2 min-[501px]:-translate-y-1/2"
              aria-label={t('scrollRight')}
            >
              <Image src="/svg/arrow-right.svg" alt="" width={24} height={24} />
            </button>
          </div>
        </div>
      </div>
      

      <h2 className='text-[#000000] mb-5 mt-7 text-[32px] text-medium hidden md:block'>{t('filters')}</h2>

      <div className="grid grid-cols-1 items-start md:grid-cols-[clamp(260px,24vw,420px)_minmax(0,1fr)] gap-8">
        {/* Sidebar: desktop only */}
        <aside className="hidden md:block self-start w-full">
          <div className="sticky top-6 pr-2">
            <CatalogFilters
              value={filterState}
              onChange={setFilterState}
              options={filterOptions}
            />
          </div>
        </aside>

        {/* Content */}
        <section>
          <header className="mb-6 flex flex-col gap-3 md:gap-4 w-full">
            {/* Search + sort: до xl в колонку (під пошук), з xl — в один ряд */}
            <div className="w-full flex flex-col xl:flex-row xl:items-center gap-3 md:gap-4">
              <div className="w-full xl:flex-1">
                <CatalogSearch
                  placeholder={t('searchPlaceholder')}
                  value={searchInput}
                  onSearch={setSearchInput}
                  onSearchSubmit={() => setSearchApplied(searchInput.trim())}
                />
              </div>

              {/* Desktop: сортировка справа від пошуку (xl+), інакше під пошуком */}
              <div className="hidden md:flex items-center gap-3 shrink-0">
                <label className="">{t('sortBy')}</label>
                <SortDropdown
                  label={t('sortBy')}
                  value={sortBy}
                  options={SORT_OPTIONS}
                  isOpen={isSortOpen}
                  setIsOpen={setIsSortOpen}
                  onChange={(v) => setSortBy(v)}
                  buttonClassName="border border-[#D8D8D8] rounded-md px-3 py-3 bg-white pr-10 min-w-[220px] text-left h-[46px]"
                />
              </div>
            </div>

            {/* Mobile: Filters + Sort row */}
            <div className="flex md:hidden items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex items-center gap-2 bg-[#9C0000] text-white rounded-lg px-4 py-2.5 text-sm font-bold w-fit"
              >
                <FunnelIcon />
                {t('filters')}
              </button>
              <SortDropdown
                label={t('sortBy')}
                value={sortBy}
                options={SORT_OPTIONS}
                isOpen={isSortOpen}
                setIsOpen={setIsSortOpen}
                onChange={(v) => setSortBy(v)}
                buttonClassName="border border-[#D8D8D8] rounded-md px-3 py-3 bg-white pr-8 text-sm min-w-[200px] text-left h-[46px]"
                menuClassName="absolute right-0 top-full mt-2 w-full min-w-[200px] rounded-xl border border-[#D8D8D8] bg-white shadow-lg p-1 z-30"
              />
            </div>

            {/* Desktop: выбранные фильтры отдельной строкой под поиском */}
            {hasActiveFilters && (
              <div className="hidden md:flex items-center gap-2 flex-wrap w-full md:order-3 md:basis-full">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-[#6B7280] text-sm font-medium w-fit"
                >
                  <TrashIcon />
                  {t('clear')}
                </button>
                {activeFilterTags.map(({ key, label }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 bg-[#E5E7EB] text-[#374151] rounded-lg px-3 py-1.5 text-sm"
                  >
                    {label}
                    <button type="button" onClick={() => removeFilterTag(key)} aria-label={t('removeFilter')} className="hover:text-[#9C0000]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}


            {/* Mobile: Clear + filter tags */}
            {hasActiveFilters && (
              <div className="flex md:hidden items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-[#6B7280] text-sm font-medium w-fit"
                >
                  <TrashIcon />
                  {t('clear')}
                </button>
                {activeFilterTags.map(({ key, label }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 bg-[#E5E7EB] text-[#374151] rounded-lg px-3 py-1.5 text-sm"
                  >
                    {label}
                    <button type="button" onClick={() => removeFilterTag(key)} aria-label={t('removeFilter')} className="hover:text-[#9C0000]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            </header>

          {/* Загрузка первой страницы — скелетоны товаров */}
          {isLoading && currentPage === 1 && (
            <section className="grid grid-cols-2 lg:grid-cols-3 [@media(min-width:1600px)]:grid-cols-4 gap-x-3 gap-y-3 md:gap-x-[13px] md:gap-y-5">
              {Array.from({ length: perPage }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </section>
          )}

          {error && (
            <div className="py-10 text-center text-red-600">{t('loadError')}</div>
          )}

          {!error && ((currentPage === 1 && !isLoading) || currentPage > 1) && (
            <>
              {displayedProducts && displayedProducts.length > 0 ? (
                <>
                  <section className="grid grid-cols-2 lg:grid-cols-3 [@media(min-width:1600px)]:grid-cols-4 gap-x-3 gap-y-3 md:gap-x-[13px] md:gap-y-5">
                    {displayedProducts.map((product: any, index: number) => (
                      <div 
                        key={product.id} 
                        className={`w-full ${newProductIds.has(product.id) ? 'new-product-animate' : ''}`}
                        style={newProductIds.has(product.id) ? { animationDelay: `${(index % perPage) * 0.05}s` } : {}}
                      >
                        <ProductCard product={product} variant="catalog" />
                      </div>
                    ))}
                  </section>
                  
                  {/* Кнопка "Показать еще" - показываем если есть еще товары ИЛИ идет загрузка */}
                  {(hasMore || (isLoading && currentPage > 1)) && (
                    <div className="flex flex-col items-center mt-8 gap-4">
                      <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="bg-white text-black px-8 py-3 rounded-lg font-semibold text-base transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3 min-w-[260px] justify-center"
                      >
                        <span>
                          {isLoading && currentPage > 1 ? t('loadingMore') : t('loadMoreCount', { count: perPage })}
                        </span>
                        <Image
                          src="/svg/refresh.svg"
                          alt=""
                          width={22}
                          height={22}
                          className={`${isLoading && currentPage > 1 ? 'animate-spin [animation-direction:reverse]' : ''}`}
                          aria-hidden
                        />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-10 text-center text-gray-600">{t('noProducts')}</div>
              )}
            </>
          )}
        </section>
      </div>
        </>
      )}
      </div>
    </>
  );
}


