// app/account/page.tsx (server component)
import { cookies } from 'next/headers';
import { verifyToken } from '../../lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function AccountPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload || typeof payload !== 'object') {
    redirect('/auth/login');
  }

  const userId = String(payload.sub ?? '');
  const userLogin = typeof payload.login === 'string' ? payload.login : 'User';
  const userRoles = Array.isArray(payload.roles) ? payload.roles : [];

  return (
    <div className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
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

          {/* Content */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
                  <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-[#FFF2F2] text-[#9C0000] mr-3">👤</span>
                  Інформація про користувача
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#9C9C9C]">Ім'я користувача</p>
                    <p className="text-lg font-semibold text-black">{userLogin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#9C9C9C]">ID користувача</p>
                    <p className="text-lg font-semibold text-black">#{userId}</p>
                  </div>
                  {userRoles.length > 0 && (
                    <div>
                      <p className="text-sm text-[#9C9C9C]">Ролі</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {userRoles.map((role, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#FFF2F2] text-[#9C0000] rounded-full text-sm font-semibold"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
                  <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-[#FFF2F2] text-[#9C0000] mr-3">⚡</span>
                  Швидкі дії
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/cart"
                    className="block w-full px-4 py-3 bg-white border border-[#D8D8D8] rounded-lg hover:border-[#9C0000] hover:bg-[#FFF7F7] transition-colors text-center font-semibold text-black"
                  >
                    Переглянути кошик
                  </Link>
                  <Link
                    href="/catalog"
                    className="block w-full px-4 py-3 bg-white border border-[#D8D8D8] rounded-lg hover:border-[#9C0000] hover:bg-[#FFF7F7] transition-colors text-center font-semibold text-black"
                  >
                    Перейти до магазину
                  </Link>
                </div>
              </div>
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
