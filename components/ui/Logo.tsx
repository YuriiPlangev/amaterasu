import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Logo = () => {
  return (
    <Link href="/" className='pb-3 block cursor-pointer'>
        <Image src="/svg/logo.svg" alt="logo" width={220} height={75.5} />   
    </Link>
  )
}

export default Logo