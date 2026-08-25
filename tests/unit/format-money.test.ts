import { describe, expect, it } from 'vitest'
import { formatPEN } from '@/lib/format/money'

describe('formatPEN', () => {
  it('conserva los céntimos del precio comercial', () => {
    expect(formatPEN(9990)).toBe('S/99.90')
    expect(formatPEN(1490)).toBe('S/14.90')
  })

  it('omite decimales innecesarios en precios enteros', () => {
    expect(formatPEN(10500)).toBe('S/105')
  })

  it('admite el espacio usado en correos', () => {
    expect(formatPEN(2990, { space: true })).toBe('S/ 29.90')
  })
})
