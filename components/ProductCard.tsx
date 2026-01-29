'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../store/cartStore';

export default function ProductCard({ product }: { product: any }) {
  console.log(product);
  const router = useRouter();
  const addToCart = useCartStore((state) => state.add);
  const locale = useLocale();

  const cleanDescription = product?.short_description
    ? product.short_description.replace(/<[^>]*>/g, '').trim()
    : '';
  
  const isInStock = product?.stock_status === 'instock';
  
  const [isHeartHovered, setIsHeartHovered] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);

  // Обработчик для предотвращения перехода при клике на кнопки
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Обработчик для добавления в корзину
  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  // Обработчик для кнопки "Придбати"
  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    router.push('/cart');
  };
  
  return (
    <Link href={`/${locale}/product/${product?.slug || product?.id}`} className="block">
      <article className={`border border-[#D8D8D8] px-5  py-6 flex flex-col items-center gap-5 transition-all duration-300 hover:shadow-[0px_16px_36px_0px_#0000001A] hover:scale-[1.01] cursor-pointer ${!isInStock ? 'opacity-50' : ''}`}>
      <Image src={product?.images[0]?.src} alt={product?.name} width={300} height={300} className='max-h-[370px] object-contain' />
      <div className='flex flex-col items-center w-full gap-[10px]'>
        <div className='flex justify-between items-center w-full'>
        <p className='text-[#9C0000] font-semibold text-[25px]'>
        {product?.price} ₴
      </p>
      <p className={`font-semibold text-[15px] ${isInStock ? 'text-[#2E7900]' : 'text-[#9C0000]'}`}>
        {isInStock ? 'В наявності' : 'Немає в наявності'} 
      </p>
        </div>
      
      <div className='self-start w-full'>
      <h3 className='text-black font-medium text-[17px] '>{product?.name}</h3>
      <p className='text-black font-medium text-[17px] truncate'>{cleanDescription}</p>
      </div>
      </div>
      <div className='flex justify-between items-center w-full gap-5'>
        <button 
          onClick={handleBuyClick}
          className='bg-[#9C0000] text-white px-4 py-2 rounded-md flex-1 hover:bg-white hover:text-[#9C0000] hover:border-[#9C0000] hover:border transition-all duration-300 font-bold text-[15px]'
        >
          Придбати
        </button>
        <button 
          onClick={handleButtonClick}
          onMouseEnter={() => setIsHeartHovered(true)}
          onMouseLeave={() => setIsHeartHovered(false)}
          className='transition-all duration-300'
        >
          <Image 
            src={isHeartHovered ? '/svg/heartB.svg' : '/svg/favoriteB.svg'} 
            alt='heart' 
            width={24} 
            height={24} 
            className='transition-all duration-300'
          /> 
        </button>
        <button 
          onClick={handleCartClick}
          onMouseEnter={() => setIsCartHovered(true)}
          onMouseLeave={() => setIsCartHovered(false)}
          className='transition-all duration-300'
        >
          <Image 
            src={isCartHovered ? '/svg/cartBlack.svg' : '/svg/cartB.svg'} 
            alt='cart' 
            width={24} 
            height={24} 
            className='transition-all duration-300'
          /> 
        </button>
      </div>
      
    </article>
    </Link>
  );
}
