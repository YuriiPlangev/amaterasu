'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../../store/cartStore';
import { avatarIdToSrc, LOCAL_AVATAR_IDS } from '../../lib/avatars';
import { useAuthUser } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useProducts';

type UserProfile = {
  id: string;
  login: string;
  roles?: string[];
  displayName?: string;
  email?: string;
  phone?: string;
  avatarId?: string;
  availableAvatars?: string[];
  currentAvatar?: string | null;
};

type AvatarItem =
  | { id: string; src: string; type: 'free' }
  | { id: string; src: string; type: 'launch'; sku: string }
  | { id: string; src: string; type: 'premium'; sku: string };

const FREE_AVATAR_IDS = ['photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5', 'photo_6', 'photo_7', 'photo_8', 'photo_9', 'photo_10', 'photo_11', 'photo_12', 'photo_13', 'photo_14', 'photo_15', 'photo_16', 'photo_17', 'photo_18', 'photo_19', 'photo_20', 'photo_21', 'photo_22', 'photo_23', 'photo_24', 'photo_25', 'photo_26'] as const;

const FREE_AVATARS: AvatarItem[] = FREE_AVATAR_IDS.map((id) => ({
  id,
  src: `/avatars/${id}.jpg`,
  type: 'free' as const,
}));

export default function ProfileForm({ initialLogin }: { initialLogin: string }) {
  const t = useTranslations('profileForm');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const addToCart = useCartStore((state) => state.add);
  const { data: userData, isLoading: userLoading } = useAuthUser({ enabled: true });
  const { data: avatarProducts, isLoading: avatarProductsLoading } = useProducts(
    { category: '7012', per_page: '50' },
    {
      enabled: !!userData,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ displayName: '', email: '', phone: '', avatarId: 'photo_1' });
  const [availableAvatars, setAvailableAvatars] = useState<string[]>(['default']);
  const [pendingPremiumSku, setPendingPremiumSku] = useState<string | null>(null);
  const [avatarTab, setAvatarTab] = useState<'free' | 'unique' | 'premium'>('free');
  const [loadedPremiumImages, setLoadedPremiumImages] = useState<Set<string>>(new Set());

  const premiumAvatars = useMemo((): AvatarItem[] => {
    const raw = Array.isArray(avatarProducts) ? avatarProducts : [];
    const mapped: AvatarItem[] = [];
    for (const p of raw) {
      const sku = (p?.sku || '').trim();
      if (!sku || LOCAL_AVATAR_IDS.includes(sku as any)) continue;
      mapped.push({ id: sku, src: `/api/avatars/${encodeURIComponent(sku)}`, type: 'premium' as const, sku });
    }
    return mapped;
  }, [avatarProducts]);

  useEffect(() => {
    if (!userData) return;
    setProfile(userData as UserProfile);
    setAvailableAvatars(Array.isArray(userData.availableAvatars) ? userData.availableAvatars : ['default']);
    const avatarId = (userData.currentAvatar || userData.avatarId || 'photo_1') as string;
    setForm({
      displayName: userData.displayName ?? userData.login ?? '',
      email: userData.email ?? '',
      phone: userData.phone ?? '',
      avatarId,
    });
    if (LOCAL_AVATAR_IDS.includes(avatarId as (typeof LOCAL_AVATAR_IDS)[number])) {
      setAvatarTab('unique');
    } else if (/^photo_\d+$/.test(avatarId)) {
      setAvatarTab('free');
    } else {
      setAvatarTab('premium');
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: form.displayName.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          avatarId: form.avatarId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error'));
      setMessage({ type: 'success', text: t('saved') });
      if (data.profile) {
        setProfile((p) => (p ? { ...p, ...data.profile } : p));
      }
      void queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t('error') });
    } finally {
      setSaving(false);
    }
  };

  const handleBuyAvatar = async (sku: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/products?sku=${encodeURIComponent(sku)}&per_page=1`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'Failed');
      }

      const product = Array.isArray(data)
        ? data[0]
        : Array.isArray(data.products)
        ? data.products[0]
        : null;

      if (!product) {
        setMessage({ type: 'error', text: t('buyAvatarError') });
        return;
      }

      addToCart(product, 1);
      setMessage({ type: 'success', text: t('buyAvatarAdded') });
      router.push(`/${locale}/cart`);
    } catch {
      setMessage({ type: 'error', text: t('buyAvatarError') });
    }
  };

  if (userLoading) {
    return (
      <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-[#E5E7EB] rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-[#E5E7EB] rounded" />
          <div className="h-10 bg-[#E5E7EB] rounded" />
          <div className="h-10 bg-[#E5E7EB] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6 md:p-8">
      <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
        <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-[#FFF2F2] text-[#9C0000] mr-3 text-sm">✏️</span>
        {t('contactData')}
      </h2>
      <p className="text-sm text-[#6B7280] mb-4">
        {t('contactDataDesc')}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="profile-display-name" className="block text-sm font-medium text-[#374151] mb-1">{t('displayName')}</label>
          <input
            id="profile-display-name"
            type="text"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            className="w-full px-4 py-2.5 border border-[#D8D8D8] rounded-lg focus:ring-2 focus:ring-[#9C0000]/30 focus:border-[#9C0000] outline-none transition"
            placeholder={initialLogin}
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="block text-sm font-medium text-[#374151] mb-1">{t('email')}</label>
          <input
            id="profile-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2.5 border border-[#D8D8D8] rounded-lg focus:ring-2 focus:ring-[#9C0000]/30 focus:border-[#9C0000] outline-none transition"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label htmlFor="profile-phone" className="block text-sm font-medium text-[#374151] mb-1">{t('phone')}</label>
          <input
            id="profile-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full px-4 py-2.5 border border-[#D8D8D8] rounded-lg focus:ring-2 focus:ring-[#9C0000]/30 focus:border-[#9C0000] outline-none transition"
            placeholder="+380..."
          />
        </div>
        <div>
          <p className="block text-sm font-medium text-[#374151] mb-2">{t('avatar')}</p>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 p-0.5 bg-[#F3F4F6] rounded-lg inline-flex">
            {(['free', 'unique', 'premium'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAvatarTab(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  avatarTab === tab
                    ? 'bg-white text-[#9C0000] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {tab === 'free' && t('avatarCategoryFree')}
                {tab === 'unique' && t('avatarCategoryUnique')}
                {tab === 'premium' && t('avatarCategoryPremium')}
              </button>
            ))}
          </div>

          {/* Avatar grid with scroll for free and premium */}
          <div
            className={`grid grid-cols-5 gap-3 ${
              (avatarTab === 'free' || avatarTab === 'premium') ? 'max-h-[220px] overflow-y-auto pr-1' : ''
            }`}
          >
            {avatarTab === 'free' &&
              FREE_AVATARS.map((avatar, index) => {
                const owned = true;
                const selected = form.avatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avatarId: avatar.id }))}
                    className={`relative w-16 h-16 rounded-full border-2 overflow-hidden transition shrink-0 ${
                      selected ? 'border-[#9C0000]' : 'border-transparent hover:border-[#D8D8D8]'
                    }`}
                    aria-label={t('avatarOption', { number: index + 1 })}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar.src}
                      alt={t('avatarOption', { number: index + 1 })}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            {avatarTab === 'unique' &&
              LOCAL_AVATAR_IDS.map((id) => ({ id, src: `/avatars/${id}.jpg`, type: 'launch' as const, sku: id })).map((avatar) => {
                const owned = availableAvatars.includes(avatar.sku);
                const selected = form.avatarId === avatar.id;
                const isLaunchLocked = !owned;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => !isLaunchLocked && setForm((f) => ({ ...f, avatarId: avatar.id }))}
                    className={`relative w-16 h-16 rounded-full border-2 overflow-hidden transition shrink-0 ${
                      selected ? 'border-[#9C0000]' : 'border-transparent hover:border-[#D8D8D8]'
                    }`}
                    aria-label={t('avatarLaunchOption')}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar.src}
                      alt={t('avatarLaunchOption')}
                      className="w-full h-full object-cover"
                    />
                    {isLaunchLocked && (
                      <span className="absolute top-0.5 right-0.5 z-10 w-5 h-5 rounded-full bg-[#FACC15] text-[#7C2D12] text-[10px] font-extrabold flex items-center justify-center shadow-md ring-2 ring-white">
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            {avatarTab === 'premium' && avatarProductsLoading && (
              <>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-full border-2 border-[#E5E7EB] bg-[#F3F4F6] flex items-center justify-center shrink-0 animate-pulse"
                    aria-hidden
                  >
                    <div className="w-6 h-6 border-2 border-[#9C0000]/30 border-t-[#9C0000] rounded-full animate-spin" />
                  </div>
                ))}
              </>
            )}
            {avatarTab === 'premium' && !avatarProductsLoading &&
              premiumAvatars.map((avatar) => {
                const sku = avatar.type === 'premium' ? avatar.sku : avatar.id;
                const owned = availableAvatars.includes(sku);
                const selected = form.avatarId === avatar.id;
                const isPremiumLocked = !owned;
                const imageLoaded = loadedPremiumImages.has(avatar.id);
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      if (isPremiumLocked) setPendingPremiumSku(sku);
                      else setForm((f) => ({ ...f, avatarId: avatar.id }));
                    }}
                    className={`relative w-16 h-16 rounded-full border-2 overflow-hidden transition shrink-0 ${
                      selected ? 'border-[#9C0000]' : 'border-transparent hover:border-[#D8D8D8]'
                    }`}
                    aria-label={t('avatarPremiumOption')}
                  >
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#F3F4F6] z-[1]">
                        <div className="w-6 h-6 border-2 border-[#9C0000]/30 border-t-[#9C0000] rounded-full animate-spin" />
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar.src}
                      alt={t('avatarPremiumOption')}
                      className="w-full h-full object-cover"
                      onLoad={() => setLoadedPremiumImages((s) => new Set(s).add(avatar.id))}
                    />
                    {isPremiumLocked && (
                      <span className="absolute top-0.5 right-0.5 z-10 w-5 h-5 rounded-full bg-[#FACC15] text-[#7C2D12] text-[10px] font-extrabold flex items-center justify-center shadow-md ring-2 ring-white">
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
          {pendingPremiumSku && (
            <div className="mt-3 rounded-lg border border-[#9C0000] bg-white px-4 py-3 text-[14px] md:text-sm">
              <p className="font-semibold text-[#1C1C1C]">
                {t('buyAvatarPrompt')}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleBuyAvatar(pendingPremiumSku);
                    setPendingPremiumSku(null);
                  }}
                  className="px-3 py-1.5 rounded-md bg-[#9C0000] text-white text-xs font-semibold hover:bg-[#7D0000] transition-colors"
                >
                  {t('buyAvatarConfirmButton')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingPremiumSku(null);
                    setMessage(null);
                  }}
                  className="px-3 py-1.5 rounded-md bg-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-[#D1D5DB] transition-colors"
                >
                  {t('buyAvatarCancelButton')}
                </button>
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB]">
              {(() => {
                const src = avatarIdToSrc(form.avatarId);
                return src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="w-full h-full object-cover" />
                ) : null;
              })()}
            </div>
            <p className="text-sm text-[#1C1C1C]">{t('avatarSelectedHint')}</p>
          </div>
        </div>
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-[#9C0000]'}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto px-6 py-3 bg-[#9C0000] text-white rounded-lg hover:bg-[#7D0000] transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </form>
    </div>
  );
}
