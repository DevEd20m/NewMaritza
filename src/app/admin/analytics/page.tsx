import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AnalyticsClient, type AnalyticsData } from '@/components/admin/AnalyticsClient'

export const metadata: Metadata = { title: 'Analítica — Admin LIORA' }

export default async function AdminAnalyticsPage() {
  const admin = createAdminClient() as any

  const [
    { data: profilesRaw },
    { data: recsRaw },
    { data: ordersRaw },
    { data: topOptsRaw },
  ] = await Promise.all([
    admin.from('quiz_profiles').select('id, user_id, created_at').order('created_at', { ascending: false }),
    admin.from('recommendations').select('quiz_profile_id, variant_id, rationale, score, product_variants(name, products(name, cover_image_url, categories(name, slug)))'),
    admin.from('orders').select('id, status, total_cents, created_at').order('created_at', { ascending: false }).limit(200),
    admin.from('quiz_profiles').select('answers').limit(500),
  ])

  // Get emails for users
  const userIds = [...new Set(((profilesRaw ?? []) as any[]).map((p: any) => p.user_id).filter(Boolean))]
  const emailMap: Record<string, string> = {}
  for (const uid of userIds) {
    try {
      const { data } = await admin.auth.admin.getUserById(uid)
      if (data?.user?.email) emailMap[uid] = data.user.email
    } catch {}
  }

  // Funnel
  const profiles = (profilesRaw ?? []) as any[]
  const recs = (recsRaw ?? []) as any[]
  const orders = (ordersRaw ?? []) as any[]

  const profilesWithKit = new Set(recs.map((r: any) => r.quiz_profile_id))
  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const paidOrders = orders.filter((o: any) => ['paid','processing','shipped','delivered'].includes(o.status))
  const monthOrders = paidOrders.filter((o: any) => new Date(o.created_at) >= startMonth)
  const monthRevenue = monthOrders.reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0)

  // Top recommended products
  const prodCount: Record<string, { count: number; name: string; category: string; imageUrl: string | null }> = {}
  for (const r of recs) {
    const p = (r as any).product_variants?.products
    if (!p) continue
    const key = p.name
    if (!prodCount[key]) prodCount[key] = { count: 0, name: p.name, category: p.categories?.name ?? '', imageUrl: p.cover_image_url ?? null }
    prodCount[key].count++
  }
  const topProducts = Object.values(prodCount).sort((a, b) => b.count - a.count).slice(0, 8)

  // Top quiz answer slugs
  const slugCounts: Record<string, number> = {}
  for (const row of (topOptsRaw ?? []) as any[]) {
    const ans = row.answers as Record<string, string[]>
    // We only have option IDs, count by profile answers
    Object.values(ans ?? {}).flat().forEach(id => { slugCounts[id] = (slugCounts[id] ?? 0) + 1 })
  }

  // Recent profiles
  const recentProfiles: AnalyticsData['recentProfiles'] = profiles.slice(0, 15).map((p: any) => {
    const profileRecs = recs.filter((r: any) => r.quiz_profile_id === p.id)
    return {
      id: p.id,
      createdAt: p.created_at,
      email: p.user_id ? (emailMap[p.user_id] ?? 'Usuario') : 'Invitado',
      isGuest: !p.user_id,
      kitProducts: profileRecs
        .filter((r: any) => !r.rationale || r.rationale === 'kit')
        .slice(0, 3)
        .map((r: any) => (r as any).product_variants?.products?.name ?? '')
        .filter(Boolean),
      kitCount: profileRecs.length,
    }
  })

  const data: AnalyticsData = {
    totalQuizzes: profiles.length,
    withKit: profilesWithKit.size,
    paidOrdersMonth: monthOrders.length,
    monthRevenueCents: monthRevenue,
    topProducts,
    recentProfiles,
  }

  return <AnalyticsClient data={data} />
}
