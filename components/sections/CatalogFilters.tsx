'use client'

import React, { useState } from 'react'
import Image from 'next/image'

const SECTIONS = ['Ціна', 'Тип товару', 'Товари на замовлення', 'Тайтли', 'Персонаж', 'Жанр']

const sampleData: Record<string, Array<{ label: string; count: number }>> = {
  'Тип товару': [
    { label: 'Манга', count: 1078 },
    { label: 'Фігурки', count: 980 },
    { label: 'Брелки', count: 467 },
    { label: 'Стікери', count: 1003 },
  ],
  'Товари на замовлення': [
    { label: 'Значки', count: 15 },
    { label: 'Брелоки', count: 10 },
    { label: 'Чашки', count: 8 },
    { label: 'Друк', count: 4 },
  ],
  'Тайтли': [
    { label: 'Клинок рассекающий демонов', count: 1078 },
    { label: 'Ван Пис', count: 980 },
    { label: 'Наруто', count: 467 },
    { label: 'Берсерк', count: 1003 },
  ],
  'Персонаж': [
    { label: 'Сатору Годзю', count: 1078 },
    { label: 'Наруто', count: 980 },
    { label: 'Ітачі', count: 467 },
    { label: 'Монкі де Луфі', count: 1003 },
  ],
  'Жанр': [
    { label: 'Хентай', count: 1078 },
    { label: 'Сеннэн', count: 980 },
    { label: 'Романтика', count: 467 },
    { label: 'Спорт', count: 1003 },
  ],
}

const FilterSection: React.FC<{ title: string }> = ({ title }) => {
  const [open, setOpen] = useState(true)
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [query, setQuery] = useState<string>('')

  const items = sampleData[title] || []
  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items

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
          {/* Price filter UI matching the screenshot: two compact inputs with currency symbol, no buttons */}
          {title === 'Ціна' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col">
                  <span className="sr-only">Ціна від</span>
                  <div className="relative rounded-lg border border-[#E5E5E5] bg-white">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      placeholder="От"
                      className="w-full bg-transparent outline-none text-sm text-[#111827] placeholder-gray-300 px-3 py-2 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#111827]">₴</span>
                  </div>
                </label>

                <label className="flex flex-col">
                  <span className="sr-only">Ціна до</span>
                  <div className="relative rounded-lg border border-[#E5E5E5] bg-white">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="До"
                      className="w-full bg-transparent outline-none text-sm text-[#111827] placeholder-gray-300 px-3 py-2 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#111827]">₴</span>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            // Other sections: search + checklist
            <div className="space-y-2">
              <div className="pt-1">
                <input
                  type="search"
                  placeholder="Пошук..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="mt-2 max-h-40 overflow-y-auto pr-2">
                {filtered.map((item) => (
                  <label key={item.label} className="flex items-center justify-between py-2 cursor-pointer">
                    <div className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="peer sr-only" />
                      <span className="w-4 h-4 rounded border border-[#D6D6D6] bg-white block peer-checked:bg-[#9C0000] peer-checked:border-[#9C0000]" />
                      <span className="text-sm text-[#111827]">{item.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{item.count}</span>
                  </label>
                ))}

                {filtered.length === 0 && <div className="text-sm text-gray-400 py-2">Нічого не знайдено</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const CatalogFilters: React.FC<{ variant?: 'sidebar' | 'drawer' }> = ({ variant = 'sidebar' }) => {
  return (
    <div className={`space-y-4 ${variant === 'drawer' ? '[&>div]:border-dashed [&>div]:bg-[#F9FAFB] [&>div]:border-[#93C5FD]' : ''}`}>
      {SECTIONS.map((s) => (
        <FilterSection key={s} title={s} />
      ))}
    </div>
  )
}

export default CatalogFilters
