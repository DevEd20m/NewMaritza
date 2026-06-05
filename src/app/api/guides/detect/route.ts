import { NextRequest, NextResponse } from 'next/server'
import { detectKitFromItemsDB } from '@/lib/guides/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { productNames } = await req.json().catch(() => ({ productNames: [] }))
  if (!Array.isArray(productNames)) return NextResponse.json(null)
  const guide = await detectKitFromItemsDB(productNames)
  return NextResponse.json(guide ?? null)
}
