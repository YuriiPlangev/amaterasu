export type AvatarId = string;

/** Локальні спец-аватарки (без WooCommerce, не продаються) — додай зображення в public/avatars/ */
export const LOCAL_AVATAR_IDS = ["avatar_launch"] as const;

export function avatarIdToSrc(avatarId: AvatarId | null | undefined): string | null {
  const id = String(avatarId || "").trim();
  if (!id || id === "default") return null;

  // free avatars: photo_1..photo_10 (локальні)
  if (/^photo_(\d+)$/.test(id)) {
    return `/avatars/${id}.jpg`;
  }

  // локальні спец-аватарки (роздача при реєстрації тощо)
  if (LOCAL_AVATAR_IDS.includes(id as (typeof LOCAL_AVATAR_IDS)[number])) {
    return `/avatars/${id}.jpg`;
  }

  // преміум з WooCommerce — через API (зображення з WordPress)
  return `/api/avatars/${encodeURIComponent(id)}`;
}

