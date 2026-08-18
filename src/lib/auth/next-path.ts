const SAFE_DEFAULT_PATH = '/cuenta'

export function sanitizeNextPath(value: string | null | undefined, fallback = SAFE_DEFAULT_PATH): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback

  try {
    const parsed = new URL(value, 'https://liora.pe')
    if (parsed.origin !== 'https://liora.pe') return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
