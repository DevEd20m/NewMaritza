import 'server-only'

import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export function requestIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
}

export async function consumeRateLimit(
  bucket: string,
  identity: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('consume_rate_limit', {
    p_bucket_key: `${bucket}:${identity}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  // Fail closed for sensitive endpoints if the limiter cannot be reached.
  if (error) {
    console.error('[rate-limit]', bucket, error.message)
    return false
  }
  return data === true
}
