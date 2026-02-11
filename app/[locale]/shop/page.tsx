import { redirect } from 'next/navigation';

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> | { locale: string } }) {
  const resolved = await Promise.resolve(params);
  redirect(`/${resolved.locale}/catalog`);
}
