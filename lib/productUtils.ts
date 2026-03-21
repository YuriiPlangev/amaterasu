/**
 * Shared product helpers (brand resolution, etc).
 */
export function getProductBrand(product: any): string {
  const brandFromList = Array.isArray(product?.brands)
    ? product.brands.find((b: any) => {
        if (!b) return false;
        if (typeof b === 'string') return Boolean(b.trim());
        return Boolean(String(b?.name || '').trim());
      })
    : null;

  return (
    (typeof brandFromList === 'string' ? brandFromList : brandFromList?.name) ||
    (typeof product?.brand === 'string' ? product.brand : product?.brand?.name) ||
    (Array.isArray(product?.attributes)
      ? product.attributes.find((attr: any) => {
          const attrName = String(attr?.name || '').toLowerCase();
          const attrSlug = String(attr?.slug || '').toLowerCase();
          return attrName.includes('brand') || attrName.includes('бренд') || attrSlug.includes('brand');
        })?.options?.[0]
      : '') ||
    ''
  );
}
