'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (res.ok) {
        router.push('/auth/login');
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
      Вийти з акаунту
    </button>
  );
}



