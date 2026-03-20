'use client';

import React, { useState } from 'react';

type Props = {
  src: string | null;
  alt: string;
  fallbackChar?: string;
  className?: string;
  size?: number;
};

export default function AvatarWithFallback({
  src,
  alt,
  fallbackChar,
  className = '',
  size = 56,
}: Props) {
  const [error, setError] = useState(false);
  const char = fallbackChar || alt.charAt(0).toUpperCase();

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-[#F3F4F6] text-[#9C0000] font-bold overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        {char}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      width={size}
      height={size}
      onError={() => setError(true)}
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: '9999px' }}
    />
  );
}
