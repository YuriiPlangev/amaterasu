"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

type SocialAuthButtonsProps = {
  returnTo: string;
};

export default function SocialAuthButtons({ returnTo }: SocialAuthButtonsProps) {
  const t = useTranslations("auth.social");
  const [telegramError, setTelegramError] = useState("");
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);

  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  const googleHref = useMemo(() => {
    const query = new URLSearchParams({ returnTo }).toString();
    return `/api/auth/google/start?${query}`;
  }, [returnTo]);

  useEffect(() => {
    window.onTelegramAuth = async (user: Record<string, unknown>) => {
      setTelegramError("");
      setIsTelegramLoading(true);

      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...user, returnTo }),
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
          setTelegramError(data?.error || t("telegramError"));
          setIsTelegramLoading(false);
          return;
        }

        window.location.href = data.returnTo || returnTo;
      } catch (error) {
        console.error("Telegram auth client error:", error);
        setTelegramError(t("telegramError"));
        setIsTelegramLoading(false);
      }
    };

    return () => {
      delete window.onTelegramAuth;
    };
  }, [returnTo, t]);

  useEffect(() => {
    if (!telegramBotUsername) return;

    const container = document.getElementById("telegram-auth-widget-container");
    if (!container) return;

    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", telegramBotUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    container.appendChild(script);
  }, [telegramBotUsername]);

  return (
    <div className="space-y-3">
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E6E6E6]" />
        </div>
        <span className="relative bg-white px-3 text-sm text-[#6D6D6D]">{t("divider")}</span>
      </div>

      <a
        href={googleHref}
        className="w-full inline-flex items-center justify-center gap-2 border border-[#D8D8D8] rounded-lg py-3 font-semibold text-[#1F1F1F] hover:bg-[#F7F7F7] transition-colors"
      >
        <span aria-hidden>G</span>
        <span>{t("google")}</span>
      </a>

      {telegramBotUsername ? (
        <div className="space-y-2">
          <div id="telegram-auth-widget-container" className="flex justify-center" />
          {isTelegramLoading && (
            <p className="text-sm text-[#6D6D6D] text-center">{t("telegramLoading")}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#6D6D6D] text-center">{t("telegramNotConfigured")}</p>
      )}

      {telegramError && (
        <div className="bg-[#FFF2F2] border border-[#F5B7B7] text-[#9C0000] px-4 py-3 rounded-lg text-sm">
          {telegramError}
        </div>
      )}
    </div>
  );
}
