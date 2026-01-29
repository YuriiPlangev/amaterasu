import React from 'react';
import Hero from '../components/sections/Hero';
import Image from 'next/image';
import BestSellers from '../components/sections/BestSellers';
import PopularCategories from '../components/sections/PopularCategories';


export default function HomePage() {
  return (
    <main>
     <Hero />
     <div>
          <Image src="/images/flame.svg" alt="logo" width={1920} height={100} className='' />
        </div>
        <BestSellers />
        <PopularCategories />
    </main>
  );
}
