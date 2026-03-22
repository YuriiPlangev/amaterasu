'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';

export default function LogoutButton() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('account');
  const queryClient = useQueryClient();

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        queryClient.removeQueries({ queryKey: ['auth', 'user'] });
        queryClient.removeQueries({ queryKey: ['auth', 'check'] });
        router.push(`/${locale}/auth/login`);
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full px-6 py-3 bg-[#9C0000] text-white rounded-lg hover:bg-[#7D0000] transition-colors font-semibold"
    >
      {t('logout')}
    </button>
  );
}


