'use client';
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'

const Logo = () => {
  const locale = useLocale();
  return (
    <Link href={`/${locale}`} className='pb-3 block cursor-pointer shrink-0'>
      <Image
        src="/svg/logo.svg"
        alt="logo"
        width={220}
        height={75.5}
        className="w-[130px] h-auto md:w-[180px] lg:w-[220px]"
      />
      
    </Link>
  )
}

export default Logo