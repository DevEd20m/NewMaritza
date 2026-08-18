import { describe, expect, it } from 'vitest'
import { sanitizeNextPath } from '@/lib/auth/next-path'

describe('sanitizeNextPath', () => {
  it('preserves internal routes and query strings', () => {
    expect(sanitizeNextPath('/admin/analytics?dias=30')).toBe('/admin/analytics?dias=30')
  })

  it.each(['https://evil.example', '//evil.example/admin', 'javascript:alert(1)', ''])('rejects unsafe redirect %s', value => {
    expect(sanitizeNextPath(value)).toBe('/cuenta')
  })

  it('supports an explicit safe fallback', () => {
    expect(sanitizeNextPath(null, '/admin')).toBe('/admin')
  })
})
