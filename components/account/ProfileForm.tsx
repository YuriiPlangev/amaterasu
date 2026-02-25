'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

type UserProfile = {
  id: string;
  login: string;
  roles?: string[];
  displayName?: string;
  email?: string;
  phone?: string;
};

export default function ProfileForm({ initialLogin }: { initialLogin: string }) {
  const t = useTranslations('profileForm');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ displayName: '', email: '', phone: '' });

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setProfile(data);
        setForm({
          displayName: data.displayName ?? data.login ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
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
