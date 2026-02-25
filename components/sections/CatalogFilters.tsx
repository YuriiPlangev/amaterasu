'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export interface CatalogFilterState {
  priceFrom: string;
  priceTo: string;
  categoryIds: number[];
  titles: string[];
  characters: string[];
  genres: string[];
}

const initialFilterState: CatalogFilterState = {
  priceFrom: '',
  priceTo: '',
  categoryIds: [],
  titles: [],
  characters: [],
  genres: [],
};

interface FilterOptions {
  categories: Array<{ id: number; name: string; slug: string }>;
  customProductionCategories: Array<{ id: number; name: string; slug: string }>;
  titles: string[];
  characters: string[];
  genres: string[];
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
  const [open, setOpen] = useState(true);
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
            <div className="mt-2 max-h-40 overflow-y-auto pr-2">
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
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  variant = 'sidebar',
  value,
  onChange,
}) => {
  const t = useTranslations('catalogFilters');
  const [data, setData] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch('/api/catalog/filters')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const update = (patch: Partial<CatalogFilterState>) => {
    onChange({ ...value, ...patch });
  };

  const toggleCategory = (id: number) => {
    const next = value.categoryIds.includes(id)
      ? value.categoryIds.filter((x) => x !== id)
      : [...value.categoryIds, id];
    update({ categoryIds: next });
  };

  const toggleTitle = (v: string) => {
    const next = value.titles.includes(v)
      ? value.titles.filter((x) => x !== v)
      : [...value.titles, v];
    update({ titles: next });
  };

  const toggleCharacter = (v: string) => {
    const next = value.characters.includes(v)
      ? value.characters.filter((x) => x !== v)
      : [...value.characters, v];
    update({ characters: next });
  };

  const toggleGenre = (v: string) => {
    const next = value.genres.includes(v)
      ? value.genres.filter((x) => x !== v)
      : [...value.genres, v];
    update({ genres: next });
  };

  const categories = (data?.categories ?? []).map((c) => ({ id: c.id, label: c.name }));
  const customProductionCategories = (data?.customProductionCategories ?? []).map((c) => ({ id: c.id, label: c.name }));
  const titles = (data?.titles ?? []).map((v) => ({ label: v }));
  const characters = (data?.characters ?? []).map((v) => ({ label: v }));
  const genres = (data?.genres ?? []).map((v) => ({ label: v }));

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

      {/* Тайтли, Персонаж, Жанр */}
      <FilterSection
        title={t('titles')}
        items={titles}
        selected={value.titles}
        onToggle={(v) => toggleTitle(String(v))}
        isLoading={isLoading}
        placeholder={t('searchPlaceholder')}
        loadingText={t('loading')}
        nothingFoundText={t('nothingFound')}
      />
      <FilterSection
        title={t('character')}
        items={characters}
        selected={value.characters}
        onToggle={(v) => toggleCharacter(String(v))}
        isLoading={isLoading}
        placeholder={t('searchPlaceholder')}
        loadingText={t('loading')}
        nothingFoundText={t('nothingFound')}
      />
      <FilterSection
        title={t('genre')}
        items={genres}
        selected={value.genres}
        onToggle={(v) => toggleGenre(String(v))}
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
