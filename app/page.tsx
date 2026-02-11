import React from 'react';
import Hero from '../components/sections/Hero';
import Image from 'next/image';
import BestSellers from '../components/sections/BestSellers';
import PopularCategories from '../components/sections/PopularCategories';
import News from '../components/sections/News';


export default function HomePage() {
  return (
    <main>
     <Hero />
     <div>
          <Image src="/images/flame.svg" alt="logo" width={1920} height={100} className='' />
        </div>
        <BestSellers />
        <PopularCategories />
        <News />
    </main>
  );
}
