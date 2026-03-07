"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import SocialAuthButtons from '../../../../components/auth/SocialAuthButtons';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || `/${locale}/account`;
  const errorParam = searchParams.get('error');
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(errorParam ? getErrorMessage(errorParam) : "");
  const [isLoading, setIsLoading] = useState(false);

  function getErrorMessage(errorCode: string): string {
    const errorMap: Record<string, string> = {
      'google_auth_failed': 'Google: не получен код авторизации',
      'google_state_mismatch': 'Google: ошибка проверки безопасности (state mismatch)',
      'google_token_failed': 'Google: не удалось получить токен доступа',
      'google_profile_failed': 'Google: не удалось загрузить профиль',
      'social_auth_failed': 'WordPress: не удалось создать/найти пользователя',
      'google_unexpected_error': 'Неожиданная ошибка при входе через Google',
    };
    return errorMap[errorCode] || 'Ошибка при входе через Google';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" }
      });

      const text = await res.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        setError(t('serverError'));
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || t('error'));
        setIsLoading(false);
        return;
      }

      // Успешно — редирект на страницу аккаунта или на returnTo
      window.location.href = returnTo;
    } catch (error) {
      console.error("Login error:", error);
      setError(t('generalError'));
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 site-padding-x">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-[#E6E6E6] shadow-[0px_12px_28px_0px_#0000001A] p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">{t('title')}</h1>
            <p className="text-[#6D6D6D]">{t('subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#5A5A5A] mb-2">
                {t('username')}
              </label>
              <input
                id="username"
                placeholder={t('usernamePlaceholder')}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#D8D8D8] rounded-lg focus:ring-2 focus:ring-[#9C0000] focus:border-[#9C0000] outline-none transition-all"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#5A5A5A] mb-2">
                {t('password')}
              </label>
              <input
                id="password"
                placeholder={t('passwordPlaceholder')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#D8D8D8] rounded-lg focus:ring-2 focus:ring-[#9C0000] focus:border-[#9C0000] outline-none transition-all"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-[#FFF2F2] border border-[#F5B7B7] text-[#9C0000] px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#9C0000] text-white py-3 rounded-lg font-semibold hover:bg-[#7D0000] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0px_12px_28px_0px_#0000001A]"
            >
              {isLoading ? t('submitting') : t('submit')}
            </button>
          </form>

          <SocialAuthButtons returnTo={returnTo} />

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6D6D6D]">
              {t('noAccount')}{" "}
              <Link href={`/${locale}/auth/register${returnTo && returnTo !== `/${locale}/account` ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="text-[#9C0000] hover:text-[#7D0000] font-semibold">
                {t('register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


