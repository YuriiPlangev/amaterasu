'use client'

import React from 'react'
import Image from 'next/image'

type Props = {
  className?: string
  placeholder?: string
  value?: string
  onSearch?: (value: string) => void
  /** Викликається при натисканні «Шукати» — пошук тільки по кнопці */
  onSearchSubmit?: () => void
}

const CatalogSearch: React.FC<Props> = ({ className = '', placeholder = 'Введіть запит...', value = '', onSearch, onSearchSubmit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit?.();
  };
  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex items-center w-full rounded-xl border border-[#D8D8D8] bg-white px-3 py-2 gap-3">
        <input
          type="text"
          aria-label="Пошук"
          placeholder={placeholder}
          value={value}
          className="flex-1 bg-transparent outline-none text-[#111111] placeholder-[#B0B0B0]"
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <button
          type="submit"
          aria-label="Шукати"
          className="flex items-center gap-2 bg-[#9C0000] text-white rounded-lg px-6 py-3 text-sm font-semibold"
        >
          Шукати
          <Image src="/svg/search.svg" alt="search" width={16} height={16} />
        </button>
      </div>
    </form>
  )
}

export default CatalogSearch
