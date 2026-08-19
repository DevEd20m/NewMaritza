import { z } from 'zod'

export const ANALYTICS_EVENTS = [
  'page_view', 'page_engagement', 'element_click', 'navigation_click', 'whatsapp_click',
  'view_item', 'add_to_cart', 'begin_checkout', 'checkout_error', 'purchase',
  'search', 'search_no_results', 'quiz_start', 'quiz_step', 'quiz_complete',
  'assistant_message', 'assistant_swap_suggested', 'assistant_swap_accepted',
] as const

const SENSITIVE_KEY = /email|phone|name|address|password|token|document|dni|card|answer/i
const EMAIL_VALUE = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 2) return undefined
  if (typeof value === 'string') return EMAIL_VALUE.test(value) ? '[redacted]' : value.slice(0, 200)
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value
  if (Array.isArray(value)) return value.slice(0, 20).map(item => sanitizeValue(item, depth + 1)).filter(v => v !== undefined)
  if (typeof value === 'object' && value) return sanitizeAnalyticsMetadata(value as Record<string, unknown>, depth + 1)
  return undefined
}

export function sanitizeAnalyticsMetadata(input: Record<string, unknown>, depth = 0): Record<string, unknown> {
  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input).slice(0, 30)) {
    if (SENSITIVE_KEY.test(key)) continue
    const sanitized = sanitizeValue(value, depth)
    if (sanitized !== undefined) output[key.slice(0, 60)] = sanitized
  }
  return output
}

export const trackedEventSchema = z.object({
  event_id: z.string().uuid(),
  page_view_id: z.string().uuid().optional(),
  event: z.enum(ANALYTICS_EVENTS),
  occurred_at: z.string().datetime({ offset: true }),
  path: z.string().startsWith('/').max(300).optional(),
  page_title: z.string().max(120).optional(),
  referrer: z.string().max(500).optional(),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(120).optional(),
  product_slug: z.string().max(200).optional(),
  variant_id: z.string().uuid().optional(),
  value_cents: z.number().int().min(0).max(100_000_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  device: z.enum(['mobile', 'desktop']).optional(),
  target_id: z.string().max(160).optional(),
  target_type: z.enum(['button', 'link', 'image', 'card', 'control']).optional(),
  engagement_ms: z.number().int().min(0).max(30_000).optional(),
  page_exit: z.boolean().optional(),
})

export const analyticsBatchSchema = z.object({ events: z.array(trackedEventSchema).min(1).max(20) })
export type AnalyticsEventInput = z.infer<typeof trackedEventSchema>
