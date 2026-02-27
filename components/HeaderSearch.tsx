'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;
const RESULTS_LIMIT = 8;

interface HeaderSearchProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  placeholder?: string;
}

export default function HeaderSearch({
  isOpen,
  onClose,
  className = '',
  placeholder,
}: HeaderSearchProps) {
  const locale = useLocale();
  const t = useTranslations('search');
  const placeholderText = placeholder ?? t('placeholder');
  const basePath = `/${locale}`;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: number; name: string; slug: string; price: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (!q || q.trim().length < MIN_CHARS) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(q.trim())}&per_page=${RESULTS_LIMIT}`
      );
      const data = await res.json();
      setResults(
        Array.isArray(data)
          ? data.map((p: any) => ({
              id: p.id,
              name: p.name || '',
              slug: p.slug || '',
              price: p.price || '',
            }))
          : []
      );
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setResults([]);
    setTouched(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < MIN_CHARS) {
      setResults([]);
      setTouched(false);
      return;
    }
    setTouched(true);
    const t = setTimeout(() => fetchResults(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, fetchResults]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showDropdown = query.trim().length >= MIN_CHARS && touched;

  return (
    <div ref={wrapRef} className={`relative header-search-animate ${className}`}>
      <div className="rounded-lg border border-[#BCBCBC] px-3 py-2 bg-[#111111] flex items-center gap-3 min-w-[180px] md:min-w-[240px]">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholderText}
          aria-label={t('ariaSearch')}
          className="bg-transparent outline-none flex-1 text-white placeholder-[#BCBCBC] text-sm md:text-base"
        />
        <button type="button" aria-label={t('close')} onClick={onClose} className="shrink-0 text-[#BCBCBC] hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[#333] bg-[#1C1C1C] shadow-xl max-h-[70vh] overflow-y-auto z-[100]">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-[#BCBCBC] text-sm">{t('loading')}</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-[#BCBCBC] text-sm">{t('noResults')}</div>
          ) : (
            <>
              <ul className="py-2">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`${basePath}/product/${encodeURIComponent(p.slug)}?id=${p.id}`}
                      onClick={onClose}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#2a2a2a] text-white text-sm"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-[#9C0000] font-semibold shrink-0">{p.price} ₴</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#333] px-4 py-2">
                <Link
                  href={`${basePath}/catalog?search=${encodeURIComponent(query.trim())}`}
                  onClick={onClose}
                  className="text-[#9C0000] text-sm font-medium hover:underline"
                >
                  {t('allResults')}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
