'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { avatarIdToSrc } from '../../lib/avatars';

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
  | { id: string; src: string; type: 'premium'; sku: string };

const AVATARS: AvatarItem[] = [
  { id: 'photo_1', src: '/avatars/photo_1.jpg', type: 'free' },
  { id: 'photo_2', src: '/avatars/photo_2.jpg', type: 'free' },
  { id: 'photo_3', src: '/avatars/photo_3.jpg', type: 'free' },
  { id: 'photo_4', src: '/avatars/photo_4.jpg', type: 'free' },
  { id: 'photo_5', src: '/avatars/photo_5.jpg', type: 'free' },
  { id: 'photo_6', src: '/avatars/photo_6.jpg', type: 'free' },
  { id: 'photo_7', src: '/avatars/photo_7.jpg', type: 'free' },
  { id: 'photo_8', src: '/avatars/photo_8.jpg', type: 'free' },
  { id: 'photo_9', src: '/avatars/photo_9.jpg', type: 'free' },
  { id: 'photo_10', src: '/avatars/photo_10.jpg', type: 'free' },
  // Преміум-аватар (купується за товаром з SKU avatar_premium)
  { id: 'avatar_premium', src: '/avatars/premium/avatar_premium.gif', type: 'premium', sku: 'avatar_premium' },
];

export default function ProfileForm({ initialLogin }: { initialLogin: string }) {
  const t = useTranslations('profileForm');
  const locale = useLocale();
  const router = useRouter();
  const addToCart = useCartStore((state) => state.add);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ displayName: '', email: '', phone: '', avatarId: 'photo_1' });
  const [availableAvatars, setAvailableAvatars] = useState<string[]>(['default']);
  const [pendingPremiumSku, setPendingPremiumSku] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setProfile(data);
        setAvailableAvatars(Array.isArray(data.availableAvatars) ? data.availableAvatars : ['default']);
        const avatarId = (data.currentAvatar || data.avatarId || 'photo_1') as string;
        setForm({
          displayName: data.displayName ?? data.login ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          avatarId,
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
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
          <div className="grid grid-cols-5 gap-3">
            {AVATARS.map((avatar, index) => {
              const ownedKey = avatar.type === 'premium' ? avatar.sku : avatar.id;
              const owned = avatar.type === 'free' || availableAvatars.includes(ownedKey);
              const selected = form.avatarId === avatar.id;
              const isPremiumLocked = avatar.type === 'premium' && !owned;

              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    if (isPremiumLocked && avatar.type === 'premium') {
                      setPendingPremiumSku(avatar.sku);
                    } else {
                      setForm((f) => ({ ...f, avatarId: avatar.id }));
                    }
                  }}
                  className={`relative w-16 h-16 rounded-full border-2 overflow-hidden transition ${
                    selected ? 'border-[#9C0000]' : 'border-transparent hover:border-[#D8D8D8]'
                  }`}
                  aria-label={
                    avatar.type === 'premium'
                      ? t('avatarPremiumOption')
                      : t('avatarOption', { number: index + 1 })
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatar.src}
                    alt={avatar.type === 'premium' ? t('avatarPremiumOption') : t('avatarOption', { number: index + 1 })}
                    className="w-full h-full object-cover"
                  />
                  {isPremiumLocked && (
                    <span className="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <span className="w-7 h-7 rounded-full bg-[#FACC15] text-[#7C2D12] text-[11px] font-extrabold flex items-center justify-center shadow-md">
                        ★
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {pendingPremiumSku && (
            <div className="mt-3 rounded-lg border border-[#F97373] bg-[#FFF0F0] px-4 py-3 text-[13px] md:text-sm text-[#7F1D1D]">
              <p className="font-semibold">{t('buyAvatarPrompt')}</p>
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
              {avatarIdToSrc(form.avatarId) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarIdToSrc(form.avatarId) as string} alt="" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <p className="text-sm text-[#6B7280]">{t('avatarSelectedHint')}</p>
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
