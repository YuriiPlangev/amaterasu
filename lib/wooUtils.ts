/**
 * Shared WooCommerce / meta helpers used in API and product page.
 */
export function toBooleanFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
  }
  return false;
}

export function readMetaValue(metaData: any[] | undefined, key: string): unknown {
  if (!Array.isArray(metaData)) return undefined;
  const entry = metaData.find((m: any) => m?.key === key);
  return entry?.value;
}
