// app/[locale]/account/page.tsx (server component)
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import LogoutButton from './LogoutButton';
import ProfileForm from '../../../components/account/ProfileForm';
import OrderHistory from '../../../components/account/OrderHistory';
import AccountWelcomeToast from '../../../components/account/AccountWelcomeToast';
import { avatarIdToSrc } from '../../../lib/avatars';
import AvatarWithFallback from '../../../components/ui/AvatarWithFallback';

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }> | { locale: string };
  searchParams?: Promise<{ welcome_avatar?: string }> | { welcome_avatar?: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? verifyToken(token) : null;

  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = await Promise.resolve(searchParams || {});
  const locale = resolvedParams.locale || 'uk';

  if (!payload || typeof payload !== 'object') {
    const returnTo =
      resolvedSearch?.welcome_avatar === '1'
        ? `/${locale}/account?welcome_avatar=1`
        : `/${locale}/account`;
    redirect(`/${locale}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const t = await getTranslations('account');
  const userId = String(payload.sub ?? '');
  const userLogin = typeof payload.login === 'string' ? payload.login : 'User';
  const userRoles = Array.isArray(payload.roles) ? payload.roles : [];
  let profileName = userLogin;
  let avatarId: string | null = null;

  try {
    const profileCookie = cookieStore.get('profile')?.value;
    if (profileCookie) {
      const parsed = JSON.parse(decodeURIComponent(profileCookie));
      if (parsed?.displayName && typeof parsed.displayName === 'string') {
        profileName = parsed.displayName;
      }
      if (parsed?.avatarId && typeof parsed.avatarId === 'string') {
        avatarId = parsed.avatarId;
      }
    }
  } catch {
    // Ignore malformed profile cookie.
  }

  // Берём аватар з WordPress (актуальніший за cookie)
  const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;
  const appLogin = process.env.WP_USER_LOGIN;
  const appPass = process.env.WP_USER_PASS;
  if (wpUrl && appLogin && appPass && userId) {
    try {
      const wpRes = await fetch(`${wpUrl.replace(/\/+$/, '')}/wp-json/wp/v2/users/${userId}?_fields=current_avatar`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${appLogin}:${appPass}`).toString('base64')}`,
          'Cache-Control': 'no-store',
        },
        cache: 'no-store',
      });
      if (wpRes.ok) {
        const wpData = await wpRes.json();
        const wpAvatar = wpData?.current_avatar || wpData?.currentAvatar;
        if (wpAvatar && typeof wpAvatar === 'string') {
          avatarId = wpAvatar.trim();
        }
      }
    } catch {
      // ignore
    }
  }

  const avatarSrc = avatarIdToSrc(avatarId);

  return (
    <div className="min-h-screen bg-white py-10 site-padding-x mt-16">
      <AccountWelcomeToast />
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-[#E6E6E6] shadow-[0px_12px_28px_0px_#0000001A] rounded-2xl overflow-hidden">
          <div className="px-6 py-7 bg-[#9C0000]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{t('profileTitle')}</h1>
                <p className="text-white/80">{t('welcome')} {profileName}!</p>
              </div>
              <div className="w-14 h-14 bg-white rounded-full overflow-hidden">
                <AvatarWithFallback src={avatarSrc} alt={profileName} fallbackChar={profileName.charAt(0).toUpperCase()} size={56} />
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
                  {t('quickActions')}
                </h2>
                <div className="space-y-3">
                  <Link
                    href={`/${locale}/cart`}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-[#D8D8D8] rounded-lg hover:border-[#9C0000] hover:bg-[#FFF7F7] transition-colors font-semibold text-black"
                  >
                    {t('cart')}
                    <span className="text-[#9C0000]">→</span>
                  </Link>
                  <Link
                    href={`/${locale}/favorites`}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-[#D8D8D8] rounded-lg hover:border-[#9C0000] hover:bg-[#FFF7F7] transition-colors font-semibold text-black"
                  >
                    {t('favorites')}
                    <span className="text-[#9C0000]">→</span>
                  </Link>
                  <Link
                    href={`/${locale}/catalog`}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-[#D8D8D8] rounded-lg hover:border-[#9C0000] hover:bg-[#FFF7F7] transition-colors font-semibold text-black"
                  >
                    {t('catalog')}
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

