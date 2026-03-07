"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type SocialAuthButtonsProps = {
  returnTo: string;
};

export default function SocialAuthButtons({ returnTo }: SocialAuthButtonsProps) {
  const t = useTranslations("auth.social");

  const googleHref = useMemo(() => {
    const query = new URLSearchParams({ returnTo }).toString();
    return `/api/auth/google/start?${query}`;
  }, [returnTo]);

  return (
    <div className="space-y-4">
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E6E6E6]" />
        </div>
        <span className="relative bg-white px-4 text-sm text-[#6D6D6D]">{t("divider")}</span>
      </div>

      <a
        href={googleHref}
        className="w-full inline-flex items-center justify-center gap-3 border border-[#D8D8D8] rounded-lg px-4 py-3 font-medium text-[#1F1F1F] hover:bg-[#F7F7F7] transition-colors"
      >
        <Image 
          src="/images/google.png" 
          alt="" 
          width={20} 
          height={20}
          className="shrink-0"
        />
        <span>{t("google")}</span>
      </a>
    </div>
  );
}
