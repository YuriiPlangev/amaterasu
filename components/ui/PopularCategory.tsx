import React from 'react'
import Image from 'next/image'

const PopularCategory = ({ category }: { category: any }) => {
  return (
    <article className='p-2 rounded-2xl border border-[#9C0000] relative w-full overflow-hidden'>
      <div className='relative w-full aspect-square rounded-2xl overflow-hidden'>
        <Image
          src={category.image || '/images/placeholder.jpg'}
          alt={category.name}
          fill
          className='object-cover'
        />
      </div>

      <div className='bg-[#1C1C1CB2] absolute bottom-2 left-2 right-2 rounded-b-2xl text-center py-2'>
        <h3 className='text-white font-bold text-[20px] truncate'>{category.name}</h3>
      </div>
    </article>
  )
}

export default PopularCategory