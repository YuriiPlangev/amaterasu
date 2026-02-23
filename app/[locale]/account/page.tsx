// app/[locale]/account/page.tsx (server component)
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import ProfileForm from '../../../components/account/ProfileForm';
import OrderHistory from '../../../components/account/OrderHistory';

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> | { locale: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? verifyToken(token) : null;

  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale || 'uk';

  if (!payload || typeof payload !== 'object') {
    redirect(`/${locale}/auth/login`);
  }

  const userId = String(payload.sub ?? '');
  const userLogin = typeof payload.login === 'string' ? payload.login : 'User';
  const userRoles = Array.isArray(payload.roles) ? payload.roles : [];

  return (
    <div className="min-h-screen bg-white py-10 site-padding-x mt-16">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-[#E6E6E6] shadow-[0px_12px_28px_0px_#0000001A] rounded-2xl overflow-hidden">
          <div className="px-6 py-7 bg-[#9C0000]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Мій профіль</h1>
                <p className="text-white/80">Ласкаво просимо, {userLogin}!</p>
              </div>
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-xl font-bold text-[#9C0000]">
                {userLogin.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            {/* Контактні дані + Швидкі дії */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ProfileForm initialLogin={userLogin} />
              <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6 md:p-8">
                <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
                  <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-[#FFF2F2] text-[#9C0000] mr-3">⚡</span>
                  Швидкі дії
                </h2>
                <div className="space-y-3">
                  <Link
                    href={`/${locale}/cart`}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-[#D8D8D8] rounded-lg hover:border-[#9C0000] hover:bg-[#FFF7F7] transition-colors font-semibold text-black"
                  >
                    Кошик
                    <span className="text-[#9C0000]">→</span>
                  </Link>
                  <Link
                    href={`/${locale}/favorites`}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-[#D8D8D8] rounded-lg hover:border-[#9C0000] hover:bg-[#FFF7F7] transition-colors font-semibold text-black"
                  >
                    Обране
                    <span className="text-[#9C0000]">→</span>
                  </Link>
                  <Link
                    href={`/${locale}/catalog`}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-[#D8D8D8] rounded-lg hover:border-[#9C0000] hover:bg-[#FFF7F7] transition-colors font-semibold text-black"
                  >
                    Каталог
                    <span className="text-[#9C0000]">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Історія замовлень */}
            <div className="mb-8">
              <OrderHistory />
            </div>


    

            <div className="border-t border-[#E6E6E6] pt-6">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

