import { useQuery } from '@tanstack/react-query';

const AUTH_CHECK_STALE_MS = 60 * 1000; // 1 min
const AUTH_USER_STALE_MS = 60 * 1000; // 1 min

async function fetchAuthCheck(): Promise<{ authenticated: boolean }> {
  const res = await fetch('/api/auth/check', { credentials: 'include' });
  const data = await res.json().catch(() => ({ authenticated: false }));
  return { authenticated: Boolean(data?.authenticated) };
}

async function fetchAuthUser(): Promise<{
  id?: string;
  login?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  currentAvatar?: string | null;
  avatarId?: string;
  availableAvatars?: string[];
}> {
  const res = await fetch('/api/auth/user', { credentials: 'include' });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

/** Проверка авторизации — один запрос на всё приложение, кеш 1 мин */
export function useAuthCheck() {
  return useQuery({
    queryKey: ['auth', 'check'],
    queryFn: fetchAuthCheck,
    staleTime: AUTH_CHECK_STALE_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/** Данные пользователя — один запрос, кеш 1 мин, только для авторизованных */
export function useAuthUser(options?: { enabled?: boolean }) {
  const check = useAuthCheck();
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: fetchAuthUser,
    staleTime: AUTH_USER_STALE_MS,
    enabled: options?.enabled ?? check.data?.authenticated === true,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
