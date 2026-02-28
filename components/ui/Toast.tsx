'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useToastStore } from '../../store/toastStore';

const icons = {
  cart: '/svg/shopping-bag-red.svg',
  favorite_add: '/svg/heart-filled.svg',
  favorite_remove: '/svg/heart.svg',
  success: '/svg/heart-filled.svg',
  error: '/svg/heart.svg',
};

export default function Toast() {
  const { visible, message, type } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed top-4 right-4 md:top-6 md:right-6 bottom-auto left-auto md:left-auto z-[9999] animate-toast-in"
      role="alert"
    >
      <div className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] bg-white border border-[#E5E5E5] min-w-[280px] max-w-[90vw]">
        <span className="w-10 h-10 rounded-full bg-[#9C0000]/10 flex items-center justify-center shrink-0">
          <Image
            src={icons[type]}
            alt=""
            width={20}
            height={20}
          />
        </span>
        <p className="text-[#1C1C1C] font-medium text-[15px]">{message}</p>
      </div>
    </div>
  );
}
