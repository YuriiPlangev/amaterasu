'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export interface CatalogFilterState {
  priceFrom: string;
  priceTo: string;
  categoryIds: number[];
  titles: number[];
  kpop: number[];
  characters: number[];
  genres: number[];
  games: number[];
}

type TermOption = {
  id: number;
  label: string;
};

const initialFilterState: CatalogFilterState = {
  priceFrom: '',
  priceTo: '',
  categoryIds: [],
  titles: [],
  kpop: [],
  characters: [],
  genres: [],
  games: [],
};

export interface FilterOptions {
  categories: Array<{ id: number; name: string; slug: string }>;
  customProductionCategories: Array<{ id: number; name: string; slug: string }>;
  titles: TermOption[];
  kpop: TermOption[];
  characters: TermOption[];
  genres: TermOption[];
  games: TermOption[];
}

interface FilterSectionProps {
  title: string;
  items: Array<{ id?: number; label: string }>;
  selected: (string | number)[];
  onToggle: (value: string | number) => void;
  isLoading?: boolean;
  placeholder?: string;
  loadingText?: string;
  nothingFoundText?: string;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  items,
  selected,
  onToggle,
  isLoading,
  placeholder,
  loadingText,
  nothingFoundText,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = query
    ? items.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-sm">{title}</span>
        <Image
          src="/svg/arrow-down.svg"
          alt=""
          width={14}
          height={8}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            <div className="pt-1">
              <input
                type="search"
                placeholder={placeholder ?? ''}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="filter-section-list mt-2 h-80 min-h-0 overflow-y-auto overflow-x-hidden pr-2">
              {isLoading ? (
                <div className="text-sm text-gray-400 py-2">{loadingText ?? ''}</div>
              ) : (
                filtered.map((item) => {
                  const value = item.id ?? item.label;
                  const checked = selected.includes(value);
                  return (
                    <label
                      key={item.id ?? item.label}
                      className="flex items-center gap-3 py-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(value)}
                        className="sr-only peer"
                      />
                      <span
                        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                          checked
                            ? 'bg-[#9C0000] border-[#9C0000]'
                            : 'border-[#D6D6D6] bg-white'
                        }`}
                      >
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path
                              d="M1 4L4 7L9 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-[#111827]">{item.label}</span>
                    </label>
                  );
                })
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="text-sm text-gray-400 py-2">{nothingFoundText ?? ''}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CatalogFiltersProps {
  variant?: 'sidebar' | 'drawer';
  value: CatalogFilterState;
  onChange: (state: CatalogFilterState) => void;
  options?: FilterOptions | null;
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  variant = 'sidebar',
  value,
  onChange,
  options = null,
}) => {
  const t = useTranslations('catalogFilters');
  const [data, setData] = useState<FilterOptions | null>(options);
  const [isLoading, setIsLoading] = useState(!options);

  useEffect(() => {
    setData(options ?? null);
    setIsLoading(!options);
  }, [options]);

  const update = (patch: Partial<CatalogFilterState>) => {
    onChange({ ...value, ...patch });
  };

  const toggleCategory = (id: number) => {
    const next = value.categoryIds.includes(id)
      ? value.categoryIds.filter((x) => x !== id)
      : [...value.categoryIds, id];
    update({ categoryIds: next });
  };

  const toggleTitle = (v: number) => {
    const next = value.titles.includes(v)
      ? value.titles.filter((x) => x !== v)
      : [...value.titles, v];
    update({ titles: next });
  };

  const toggleCharacter = (v: number) => {
    const next = value.characters.includes(v)
      ? value.characters.filter((x) => x !== v)
      : [...value.characters, v];
    update({ characters: next });
  };

  const toggleGenre = (v: number) => {
    const next = value.genres.includes(v)
      ? value.genres.filter((x) => x !== v)
      : [...value.genres, v];
    update({ genres: next });
  };

  const toggleGames = (v: number) => {
    const next = value.games.includes(v)
      ? value.games.filter((x) => x !== v)
      : [...value.games, v];
    update({ games: next });
  };

  const toggleKpop = (v: number) => {
    const next = value.kpop.includes(v)
      ? value.kpop.filter((x) => x !== v)
      : [...value.kpop, v];
    update({ kpop: next });
  };

  const categories = (data?.categories ?? []).map((c) => ({ id: c.id, label: c.name }));
  const customProductionCategories = (data?.customProductionCategories ?? []).map((c) => ({ id: c.id, label: c.name }));
  const titles = data?.titles ?? [];
  const kpop = data?.kpop ?? [];
  const characters = data?.characters ?? [];
  const genres = data?.genres ?? [];
  const games = data?.games ?? [];

  return (
    <div
      className={`space-y-4 ${
        variant === 'drawer'
          ? '[&>div]:border-dashed [&>div]:bg-[#F9FAFB] [&>div]:border-[#93C5FD]'
          : ''
      }`}
    >
      {/* Ціна */}
      <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden">
        <div className="px-4 py-3">
          <span className="font-semibold text-sm">{t('price')}</span>
        </div>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="sr-only">{t('priceFrom')}</span>
              <div className="relative rounded-lg border border-[#E5E5E5] bg-white">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={value.priceFrom}
                  onChange={(e) => update({ priceFrom: e.target.value })}
                  placeholder="Від"
                  className="w-full bg-transparent outline-none text-sm text-[#111827] placeholder-gray-300 px-3 py-2 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#111827]">₴</span>
              </div>
            </label>
            <label className="flex flex-col">
              <span className="sr-only">{t('priceTo')}</span>
              <div className="relative rounded-lg border border-[#E5E5E5] bg-white">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={value.priceTo}
                  onChange={(e) => update({ priceTo: e.target.value })}
                  placeholder="До"
                  className="w-full bg-transparent outline-none text-sm text-[#111827] placeholder-gray-300 px-3 py-2 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#111827]">₴</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Тип товару = categories */}
      <FilterSection
        title={t('productType')}
        items={categories}
        selected={value.categoryIds}
        onToggle={(v) => toggleCategory(Number(v))}
        isLoading={isLoading}
        placeholder={t('searchPlaceholder')}
        loadingText={t('loading')}
        nothingFoundText={t('nothingFound')}
      />

      {/* Товари на замовлення = список категорий с ACF is_custom_production */}
      {customProductionCategories.length > 0 && (
        <FilterSection
          title={t('customOrder')}
          items={customProductionCategories}
          selected={value.categoryIds}
          onToggle={(v) => toggleCategory(Number(v))}
          isLoading={isLoading}
          placeholder={t('searchPlaceholder')}
          loadingText={t('loading')}
          nothingFoundText={t('nothingFound')}
        />
      )}

      {/* Тайтли, Ігри, Kpop, Персонаж, Жанр */}
      <FilterSection
        title={t('titles')}
        items={titles}
        selected={value.titles}
        onToggle={(v) => toggleTitle(Number(v))}
        isLoading={isLoading}
        placeholder={t('searchPlaceholder')}
        loadingText={t('loading')}
        nothingFoundText={t('nothingFound')}
      />
      <FilterSection
        title={t('games')}
        items={games}
        selected={value.games}
        onToggle={(v) => toggleGames(Number(v))}
        isLoading={isLoading}
        placeholder={t('searchPlaceholder')}
        loadingText={t('loading')}
        nothingFoundText={t('nothingFound')}
      />
      {kpop.length > 0 && (
        <FilterSection
          title={t('kpop')}
          items={kpop}
          selected={value.kpop}
          onToggle={(v) => toggleKpop(Number(v))}
          isLoading={isLoading}
          placeholder={t('searchPlaceholder')}
          loadingText={t('loading')}
          nothingFoundText={t('nothingFound')}
        />
      )}
      <FilterSection
        title={t('character')}
        items={characters}
        selected={value.characters}
        onToggle={(v) => toggleCharacter(Number(v))}
        isLoading={isLoading}
        placeholder={t('searchPlaceholder')}
        loadingText={t('loading')}
        nothingFoundText={t('nothingFound')}
      />
      <FilterSection
        title={t('genre')}
        items={genres}
        selected={value.genres}
        onToggle={(v) => toggleGenre(Number(v))}
        isLoading={isLoading}
        placeholder={t('searchPlaceholder')}
        loadingText={t('loading')}
        nothingFoundText={t('nothingFound')}
      />
    </div>
  );
};

export default CatalogFilters;
export { initialFilterState };
