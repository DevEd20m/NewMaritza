import { describe, expect, it } from 'vitest'
import { analyticsBatchSchema, sanitizeAnalyticsMetadata } from '@/lib/analytics/schema'

describe('analytics event safety', () => {
  it('removes PII-shaped keys and email values', () => {
    expect(sanitizeAnalyticsMetadata({
      product: 'kit-piel', email: 'clienta@example.com', phone: '999999999', note: 'escribir a clienta@example.com', nested: { address: 'Lima', step: 2 },
    })).toEqual({ product: 'kit-piel', note: '[redacted]', nested: { step: 2 } })
  })

  it('accepts the controlled event contract', () => {
    expect(analyticsBatchSchema.safeParse({ events: [{
      event_id: crypto.randomUUID(), event: 'element_click', occurred_at: new Date().toISOString(),
      path: '/tienda', target_id: 'product-card:kit-piel', target_type: 'card',
    }] }).success).toBe(true)
  })

  it('rejects arbitrary events and external paths', () => {
    expect(analyticsBatchSchema.safeParse({ events: [{
      event_id: crypto.randomUUID(), event: 'capture_password', occurred_at: new Date().toISOString(), path: 'https://evil.example',
    }] }).success).toBe(false)
  })
})
