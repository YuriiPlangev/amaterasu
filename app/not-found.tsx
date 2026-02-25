import Link from 'next/link';

export const metadata = {
  title: '404 — Сторінку не знайдено',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <p className="text-[#9C0000] font-bold text-6xl mb-2">404</p>
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Сторінку не знайдено</h1>
        <p className="text-[#6B7280] mb-8">Такої сторінки не існує або вона була переміщена.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/uk"
            className="inline-block bg-[#9C0000] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#7D0000] transition-colors"
          >
            На головну (UA)
          </Link>
          <Link
            href="/en"
            className="inline-block border-2 border-[#1C1C1C] text-[#1C1C1C] px-6 py-3 rounded-lg font-semibold hover:bg-[#1C1C1C] hover:text-white transition-colors"
          >
            Home (EN)
          </Link>
        </div>
      </div>
    </div>
  );
}
