'use client'

import React from 'react'
import Image from 'next/image'

type Props = {
  className?: string
  placeholder?: string
  onSearch?: (value: string) => void
}

const CatalogSearch: React.FC<Props> = ({ className = '', placeholder = 'Введіть запит...', onSearch }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center w-full rounded-xl border border-[#D8D8D8] bg-white px-3 py-2 gap-3">
        <input
          type="text"
          aria-label="Пошук"
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[#111111] placeholder-[#B0B0B0]"
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <button
          type="button"
          aria-label="Шукати"
          className="flex items-center gap-2 bg-[#9C0000] text-white rounded-lg px-6 py-3 text-sm font-semibold"
        >
          Шукати
          <Image src="/svg/search.svg" alt="search" width={16} height={16} />
        </button>
      </div>
    </div>
  )
}

export default CatalogSearch
