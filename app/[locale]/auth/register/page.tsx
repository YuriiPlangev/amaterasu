"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import SocialAuthButtons from '../../../../components/auth/SocialAuthButtons';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || `/${locale}/account`;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isValidPhone = (v: string) => {
    const s = v.trim().replace(/\s/g, '');
    return /^\+380\d{9}$/.test(s) || /^380\d{9}$/.test(s) || /^0\d{9}$/.test(s);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!legalConsent) {
      setError(t('consentRequired'));
      return;
    }

    if (!isValidEmail(email)) {
      setError(t('emailInvalid'));
      return;
    }

    if (!isValidPhone(phone)) {
      setError(t('phoneInvalid'));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify({ username, email, phone, password }),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('error'));
        setIsLoading(false);
        return;
      }

      setSuccess(true);

      // Після успішної реєстрації намагаємось автоматично залогінити користувача,
      // щоб номер телефону та інші дані одразу підставлялись у профіль та кошик.
      try {
        await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } catch (e) {
        console.error("Auto login after register failed:", e);
      }

      // Після реєстрації переводимо користувача в профіль (параметр для поздравления с аватаркой)
      window.location.href = `/${locale}/account?welcome_avatar=1`;
    } catch (error) {
      console.error("Registration error:", error);
      setError(t('generalError'));
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 site-padding-x mt-12">
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
              <label htmlFor="email" className="block text-sm font-medium text-[#5A5A5A] mb-2">
                {t('email')}
              </label>
              <input
                id="email"
                placeholder={t('emailPlaceholder')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#D8D8D8] rounded-lg focus:ring-2 focus:ring-[#9C0000] focus:border-[#9C0000] outline-none transition-all"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#5A5A5A] mb-2">
                {t('phone')}
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+380XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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

            {success && (
              <div className="bg-[#F1FFF3] border border-[#BFE6C6] text-[#2E7900] px-4 py-3 rounded-lg text-sm">
                {t('successMessage')}
              </div>
            )}

            <label className="flex items-start gap-3 text-sm text-[#5A5A5A]">
              <input
                type="checkbox"
                checked={legalConsent}
                onChange={(e) => setLegalConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#9C0000]"
                required
              />
              <span>
                {t('consentStart')}{' '}
                <Link href={`/${locale}/terms-of-use`} className="text-[#9C0000] hover:underline font-medium">
                  {t('consentTerms')}
                </Link>{' '}
                {t('consentAnd')}{' '}
                <Link href={`/${locale}/privacy-policy`} className="text-[#9C0000] hover:underline font-medium">
                  {t('consentPrivacy')}
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full bg-[#9C0000] text-white py-3 rounded-lg font-semibold hover:bg-[#7D0000] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0px_12px_28px_0px_#0000001A]"
            >
              {isLoading ? t('submitting') : success ? t('success') : t('submit')}
            </button>
          </form>

          <SocialAuthButtons returnTo={returnTo} />

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6D6D6D]">
              {t('hasAccount')}{" "}
              <Link href={`/${locale}/auth/login${returnTo && returnTo !== `/${locale}/account` ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="text-[#9C0000] hover:text-[#7D0000] font-semibold">
                {t('login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


