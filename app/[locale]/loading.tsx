import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('common');
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#D8D8D8] border-t-[#9C0000] animate-spin" />
        <p className="text-sm text-[#6D6D6D]">{t('loading')}</p>
      </div>
    </div>
  );
}
