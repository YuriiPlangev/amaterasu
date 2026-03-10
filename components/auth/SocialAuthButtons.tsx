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
    <div className="pt-4 space-y-4">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#DCDCDC] to-[#DCDCDC]" />
        <span className="inline-flex items-center justify-center rounded-full border border-[#E3E3E3] bg-[#FAFAFA] px-4 py-1 text-sm font-medium text-[#6D6D6D] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {t("divider")}
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#DCDCDC] to-[#DCDCDC]" />
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
