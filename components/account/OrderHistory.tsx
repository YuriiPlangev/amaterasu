'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useOrders } from '../../hooks/useOrders';

type OrderItem = {
  id: number;
  number?: string;
  status?: string;
  total?: string;
  date_created?: string;
  line_items?: Array<{ name: string; quantity: number }>;
};

function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function OrderHistory() {
  const locale = useLocale();
  const t = useTranslations('orderHistory');
  const { data, isLoading: loading, error: queryError } = useOrders();
  const orders = data?.orders ?? [];
  const error = queryError ? 'loadError' : null;

  const STATUS_LABELS: Record<string, string> = {
    pending: t('statusPending'),
    processing: t('statusProcessing'),
    'on-hold': t('statusOnHold'),
    completed: t('statusCompleted'),
    cancelled: t('statusCancelled'),
    refunded: t('statusRefunded'),
    failed: t('statusFailed'),
  };

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6 md:p-8">
      <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
        <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-[#FFF2F2] text-[#9C0000] mr-3 text-sm">📦</span>
        {t('title')}
      </h2>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#E5E7EB] rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <p className="text-[#6B7280] text-sm">{error === 'loadError' ? t('loadError') : error}</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#6B7280] mb-4">{t('noOrders')}</p>
          <Link
            href={`/${locale}/catalog`}
            className="inline-block px-6 py-3 bg-[#9C0000] text-white rounded-lg font-semibold hover:bg-[#7D0000] transition-colors"
          >
            {t('goToCatalog')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl border border-[#E5E7EB] hover:border-[#9C0000]/30 transition-colors"
            >
              <div>
                <span className="font-semibold text-[#1C1C1C]">
                  № {(order as any).number ?? order.id}
                </span>
                <span className="text-[#6B7280] text-sm ml-2">
                  {formatDate(order.date_created, locale)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#374151]">
                  {STATUS_LABELS[order.status ?? ''] ?? order.status ?? '—'}
                </span>
                <span className="font-semibold text-[#9C0000]">{order.total ?? '—'}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
