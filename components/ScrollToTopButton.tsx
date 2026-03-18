'use client';

import { useEffect, useState } from 'react';

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed right-4 bottom-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1C]/90 text-white shadow-lg border border-white/20 hover:bg-[#9C0000] transition-colors md:right-6 md:bottom-6"
      aria-label="Повернутися вгору"
    >
      <span className="text-lg leading-none">↑</span>
    </button>
  );
}

