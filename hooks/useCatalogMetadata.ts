import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FilterOptions } from '../components/sections/CatalogFilters';

type CatalogInitItem = { id: number; name: string; slug: string };

type CatalogInitResponse = {
  categories?: CatalogInitItem[];
  customProductionCategories?: CatalogInitItem[];
  characters?: CatalogInitItem[];
  games?: CatalogInitItem[];
  genres?: CatalogInitItem[];
  titles?: CatalogInitItem[];
};

function toTermOptions(items: CatalogInitItem[] | undefined): Array<{ id: number; label: string }> {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({ id: Number(item.id), label: item.name || '' }))
    .filter((item) => Number.isFinite(item.id) && item.label)
    .sort((a, b) => a.label.localeCompare(b.label, 'uk'));
}

function toFilterOptions(data: CatalogInitResponse | undefined): FilterOptions | null {
  if (!data) return null;

  const categories = (data.categories ?? []).map((c) => ({
    id: Number(c.id),
    name: c.name || '',
    slug: c.slug || '',
  }));

  const customProductionCategories = (data.customProductionCategories ?? []).map((c) => ({
    id: Number(c.id),
    name: c.name || '',
    slug: c.slug || '',
  }));

  return {
    categories,
    customProductionCategories,
    titles: toTermOptions(data.titles),
    characters: toTermOptions(data.characters),
    genres: toTermOptions(data.genres),
    games: toTermOptions(data.games),
  };
}

export function useCatalogMetadata() {
  const query = useQuery({
    queryKey: ['catalog-metadata'],
    queryFn: async () => {
      const res = await fetch('/api/catalog-init');
      if (!res.ok) throw new Error('Failed to fetch catalog metadata');
      const data: CatalogInitResponse = await res.json();
      return toFilterOptions(data);
    },
    staleTime: 3600 * 1000,
    gcTime: 3600 * 1000 * 24,
  });

  const metadata = query.data ?? null;

  const titleLabelToId = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of metadata?.titles ?? []) {
      m.set(t.label.trim().toLowerCase(), t.id);
    }
    return m;
  }, [metadata?.titles]);

  const characterLabelToId = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of metadata?.characters ?? []) {
      m.set(c.label.trim().toLowerCase(), c.id);
    }
    return m;
  }, [metadata?.characters]);

  const genreLabelToId = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of metadata?.genres ?? []) {
      m.set(g.label.trim().toLowerCase(), g.id);
    }
    return m;
  }, [metadata?.genres]);

  const gameLabelToId = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of metadata?.games ?? []) {
      m.set(g.label.trim().toLowerCase(), g.id);
    }
    return m;
  }, [metadata?.games]);

  return {
    metadata,
    isLoading: query.isLoading,
    error: query.error,
    titleLabelToId,
    characterLabelToId,
    genreLabelToId,
    gameLabelToId,
  };
}
