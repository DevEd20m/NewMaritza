import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AnalyticsClient, type AnalyticsData, type VisitorsData, type JourneySummary } from '@/components/admin/AnalyticsClient'

export const metadata: Metadata = { title: 'Analítica — Admin LIORA' }

const EMPTY_VISITORS: VisitorsData = {
  days: 7,
  sessions: 0,
  pageViews: 0,
  mobileSessions: 0,
  funnel: { visited: 0, viewedProduct: 0, addedToCart: 0, beganCheckout: 0, purchased: 0 },
  quiz: { started: 0, completed: 0 },
  exitPages: [],
  topViewed: [],
  topAdded: [],
  checkoutErrors: [],
  sources: [],
}

function parseVisitors(raw: unknown, days: number): VisitorsData {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_VISITORS, days }
  const r = raw as Partial<{
    sessions: number; page_views: number; mobile_sessions: number
    funnel: { visited?: number; viewed_product?: number; added_to_cart?: number; began_checkout?: number; purchased?: number }
    quiz: { started?: number; completed?: number }
    exit_pages: VisitorsData['exitPages']; top_viewed: VisitorsData['topViewed']; top_added: VisitorsData['topAdded']
    checkout_errors: VisitorsData['checkoutErrors']; sources: VisitorsData['sources']
  }>
  return {
    days,
    sessions: r.sessions ?? 0,
    pageViews: r.page_views ?? 0,
    mobileSessions: r.mobile_sessions ?? 0,
    funnel: {
      visited: r.funnel?.visited ?? 0,
      viewedProduct: r.funnel?.viewed_product ?? 0,
      addedToCart: r.funnel?.added_to_cart ?? 0,
      beganCheckout: r.funnel?.began_checkout ?? 0,
      purchased: r.funnel?.purchased ?? 0,
    },
    quiz: { started: r.quiz?.started ?? 0, completed: r.quiz?.completed ?? 0 },
    exitPages: r.exit_pages ?? [],
    topViewed: r.top_viewed ?? [],
    topAdded: r.top_added ?? [],
    checkoutErrors: r.checkout_errors ?? [],
    sources: r.sources ?? [],
  }
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ dias?: string; q?: string; identidad?: string; whatsapp?: string }> }) {
  const admin = createAdminClient()
  const { dias, q, identidad, whatsapp } = await searchParams
  const days = dias === '1' ? 1 : dias === '30' ? 30 : 7
  const identity = identidad === 'identified' || identidad === 'anonymous' ? identidad : 'all'

  const [
    { data: profilesRaw },
    { data: recsRaw },
    { data: ordersRaw },
    { data: visitorsRaw },
    { data: journeysRaw },
  ] = await Promise.all([
    admin.from('quiz_profiles').select('id, user_id, created_at').order('created_at', { ascending: false }).limit(200),
    admin.from('recommendations').select('quiz_profile_id, variant_id, rationale, score, product_variants(name, products(name, cover_image_url, categories(name, slug)))'),
    admin.from('orders').select('id, status, total_cents, created_at').order('created_at', { ascending: false }).limit(200),
    admin.rpc('analytics_summary', { p_days: days }),
    admin.rpc('admin_analytics_session_list', {
      p_days: days, p_limit: 50, p_offset: 0, p_query: q ?? null,
      p_identity: identity, p_whatsapp: whatsapp === '1',
    }),
  ])

  // Funnel
  type ProfileRow = { id: string; user_id: string | null; created_at: string }
  type RecommendationRow = { quiz_profile_id: string; rationale: string | null; product_variants: { products: { name: string; cover_image_url: string | null; categories: { name: string; slug: string } | null } | null } | null }
  type OrderRow = { id: string; status: string; total_cents: number; created_at: string }
  const profiles = (profilesRaw ?? []) as unknown as ProfileRow[]
  const recs = (recsRaw ?? []) as unknown as RecommendationRow[]
  const orders = (ordersRaw ?? []) as unknown as OrderRow[]

  const profilesWithKit = new Set(recs.map(r => r.quiz_profile_id))
  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const paidOrders = orders.filter(o => ['paid','processing','shipped','delivered'].includes(o.status))
  const monthOrders = paidOrders.filter(o => new Date(o.created_at) >= startMonth)
  const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.total_cents ?? 0), 0)

  // Top recommended products
  const prodCount: Record<string, { count: number; name: string; category: string; imageUrl: string | null }> = {}
  for (const r of recs) {
    const p = r.product_variants?.products
    if (!p) continue
    const key = p.name
    if (!prodCount[key]) prodCount[key] = { count: 0, name: p.name, category: p.categories?.name ?? '', imageUrl: p.cover_image_url ?? null }
    prodCount[key].count++
  }
  const topProducts = Object.values(prodCount).sort((a, b) => b.count - a.count).slice(0, 8)

  // Recent profiles
  const recentProfiles: AnalyticsData['recentProfiles'] = profiles.slice(0, 15).map(p => {
    const profileRecs = recs.filter(r => r.quiz_profile_id === p.id)
    return {
      id: p.id,
      createdAt: p.created_at,
      email: p.user_id ? 'Cliente identificado' : 'Invitado',
      isGuest: !p.user_id,
      kitProducts: profileRecs
        .filter(r => !r.rationale || r.rationale === 'kit')
        .slice(0, 3)
        .map(r => r.product_variants?.products?.name ?? '')
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

  return <AnalyticsClient
    data={data}
    visitors={parseVisitors(visitorsRaw, days)}
    journeys={(journeysRaw ?? []) as unknown as JourneySummary[]}
    filters={{ query: q ?? '', identity, whatsappOnly: whatsapp === '1' }}
  />
}
