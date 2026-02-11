'use client'

import React from 'react'
import Image from 'next/image'

type Props = {
  className?: string
  placeholder?: string
  onChange?: (value: string) => void
}

const Search: React.FC<Props> = ({ className = '', placeholder = 'Искать...', onChange }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="rounded-[8px]  border border-[#BCBCBC] px-[clamp(6px,1.2vw,14px)] py-[clamp(8px,1vw,18px)] bg-[#111111] flex items-center gap-3">
        <input
          type="text"
          aria-label="Поиск"
          placeholder={placeholder}
        className="bg-transparent outline-none w-full text-[#BCBCBC] placeholder-[#BCBCBC] text-[clamp(12px,1vw,16px)]"
          onChange={(e) => onChange?.(e.target.value)}
        />

        <button
          type="button"
          aria-label="Поиск"
          
        >
          <Image src="/svg/search.svg" alt="search" width={20} height={20} />
        </button>
      </div>
    </div>
  )
}

export default Search