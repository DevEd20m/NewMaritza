import 'server-only'

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export const CHECKOUT_COOKIE = 'liora_checkout'

export function createOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function verifyOpaqueToken(token: string, expectedHash: string | null | undefined): boolean {
  if (!token || !expectedHash) return false
  const actual = Buffer.from(hashOpaqueToken(token), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
