export type AvatarId = string;

export function avatarIdToSrc(avatarId: AvatarId | null | undefined): string | null {
  const id = String(avatarId || "").trim();
  if (!id || id === "default") return null;

  // free avatars: photo_1..photo_10
  if (/^photo_(\d+)$/.test(id)) {
    return `/avatars/${id}.jpg`;
  }

  // premium avatars (by SKU)
  if (id === "avatar_premium") {
    return "/avatars/premium/avatar_premium.gif";
  }

  return null;
}

