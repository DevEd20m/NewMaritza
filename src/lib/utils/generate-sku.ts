export function generateSkuBase(
  categorySlug: string | null,
  productName: string,
  variantName: string,
): string {
  const cat = (categorySlug ?? 'MISC')
    .split('-')[0]
    .substring(0, 4)
    .toUpperCase()

  const words = productName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toUpperCase()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w.substring(0, 4))

  const num = variantName.match(/\d+/)?.[0] ?? ''

  return ['LIO', cat, ...words, num].filter(Boolean).join('-')
}
