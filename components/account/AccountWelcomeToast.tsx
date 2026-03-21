'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthUser } from '../../hooks/useAuth';
import { useToastStore } from '../../store/toastStore';
import { LOCAL_AVATAR_IDS } from '../../lib/avatars';
import { useTranslations } from 'next-intl';

export default function AccountWelcomeToast() {
  const searchParams = useSearchParams();
  const { data: userData, isLoading } = useAuthUser({ enabled: true });
  const showToast = useToastStore((s) => s.show);
  const t = useTranslations('profileForm');
  const shownRef = useRef(false);

  useEffect(() => {
    if (isLoading || shownRef.current) return;
    const welcome = searchParams.get('welcome_avatar');
    if (welcome !== '1') return;

    const available = Array.isArray(userData?.availableAvatars) ? userData.availableAvatars : [];
    const hasLaunchAvatar = LOCAL_AVATAR_IDS.some((id) => available.includes(id));
    if (!hasLaunchAvatar) return;

    shownRef.current = true;
    showToast(t('launchAvatarToast'), 'success');

    const url = new URL(window.location.href);
    url.searchParams.delete('welcome_avatar');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, [searchParams, userData, isLoading, showToast, t]);

  return null;
}
