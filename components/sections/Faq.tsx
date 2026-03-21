'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface FaqItem {
  id: number
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    id: 1,
    question: 'Що можна замовити зі своїм принтом?',
    answer: 'Ми виготовляємо чашки, брелоки, значки, друк фото під замовлення з вашим індивідуальним зображенням. Для цього треба перейти до каталогу "Товари під замовлення", обрати ту категорію яка вам потрібна та завантажити зображення',
  },
  {
    id: 2,
    question: 'Як швидко виготовляються товари під замовлення?',
    answer: 'Як тільки сформовано заказ, на наступний день буде відправка. Якщо заказ був сформований до 12:00 та все є в наявності, то відразу же відправимо в той же день.',
  },
  {
    id: 3,
    question: 'Чи є можливість забронювати товар якого немає в наявності?',
    answer: 'Так, для цього лише потрібно написати в телеграм чи в інстаграм та вам відразу відповіст менеджер для уточнення всіх деталей',
  },
]

const FaqItem = ({ item }: { item: FaqItem }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className='border border-[#BCBCBC] rounded-lg'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className='w-full px-4 md:px-8 py-4 flex items-center justify-between text-left gap-4'
      >
        <span className='text-[14px] md:text-[18px] font-semibold text-[#1C1C1C]'>{item.question}</span>
        <div className='flex-shrink-0'>
          <Image
            src="/svg/arrow-up.svg"
            alt=""
            width={24}
            height={24}
            className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </div>
      </button>

      {isOpen && (
        <div className='px-4 md:px-8 pb-4'>
          <p className='text-[14px] md:text-[16px] text-[#1C1C1C] opacity-70'>{item.answer}</p>
        </div>
      )}
    </div>
  )
}

const Faq = () => {
  return (
    <section className='w-full mb-14 bg-white'>
      <div className='max-w-[1920px] mx-auto site-padding-x'>
        <h2 className='text-[clamp(22px,2.2vw,55px)] font-bold uppercase text-black py-6 md:py-[clamp(20px,2.2vw,56px)]'>Часті питання</h2>

        <div className='flex flex-col gap-4'>
          {faqItems.map((item) => (
            <FaqItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Faq