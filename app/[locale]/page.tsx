import React from 'react';
import Hero from '../../components/sections/Hero';
import Image from 'next/image';
import BestSellers from '../../components/sections/BestSellers';
import PopularCategories from '../../components/sections/PopularCategories';


export default function HomePage() {
  return (
    <main>
     <Hero />
     
        <BestSellers />
        <PopularCategories />
    </main>
  );
}


