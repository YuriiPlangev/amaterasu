import React from 'react';
import Hero from '../../components/sections/Hero';
import Image from 'next/image';
import BestSellers from '../../components/sections/BestSellers';
import PopularCategories from '../../components/sections/PopularCategories';
import News from '../../components/sections/News';
import Faq from '../../components/sections/Faq';


export default function HomePage() {
  return (
    <main>
     <Hero />
     
        <BestSellers />
        <PopularCategories />
        <News />
        <Faq />
    </main>
  );
}


