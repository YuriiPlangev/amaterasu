// app/[locale]/account/page.tsx (server component)
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
export default async function AccountPage({ params }: { params: Promise<{ locale: string }> | { locale: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload || typeof payload !== 'object') {
    const resolvedParams = await Promise.resolve(params);
    redirect(`/${resolvedParams.locale}/auth/login`);
  }

  const userId = String(payload.sub ?? '');
  const userLogin = typeof payload.login === 'string' ? payload.login : 'User';
  const userRoles = Array.isArray(payload.roles) ? payload.roles : [];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Мій профіль</h1>
                <p className="text-purple-100">Ласкаво просимо, {userLogin}!</p>
              </div>
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-purple-600">
                {userLogin.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* User Info Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Інформація про користувача
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Ім'я користувача</p>
                    <p className="text-lg font-medium text-gray-900">{userLogin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID користувача</p>
                    <p className="text-lg font-medium text-gray-900">#{userId}</p>
                  </div>
                  {userRoles.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Ролі</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {userRoles.map((role, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Швидкі дії
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/cart"
                    className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center font-medium text-gray-700"
                  >
                    Переглянути кошик
                  </Link>
                  <Link
                    href="/shop"
                    className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center font-medium text-gray-700"
                  >
                    Перейти до магазину
                  </Link>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="border-t border-gray-200 pt-6">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

