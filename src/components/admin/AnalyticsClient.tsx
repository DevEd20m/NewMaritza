'use client'
import { ChartBar, UserCircle, ShoppingCart, Sparkle, ArrowRight, TrendUp } from '@phosphor-icons/react'
import Link from 'next/link'
import Image from 'next/image'

export interface AnalyticsData {
  totalQuizzes: number
  withKit: number
  paidOrdersMonth: number
  monthRevenueCents: number
  topProducts: Array<{ name: string; category: string; imageUrl: string | null; count: number }>
  recentProfiles: Array<{
    id: string
    createdAt: string
    email: string
    isGuest: boolean
    kitProducts: string[]
    kitCount: number
  }>
}

const CAT_COLORS: Record<string, string> = {
  'Gym & Proteínas': 'var(--cat-durazno)',
  'Orgánicos': 'var(--cat-menta)',
  'Skin Care': 'var(--cat-lavanda)',
  'Vitaminas': 'var(--cat-mostaza)',
}

function KPI({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: typeof ChartBar; color: string }) {
  return (
    <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} weight="bold" color="var(--liora-uva)" />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--liora-uva)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.5, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const conversionRate = data.totalQuizzes > 0
    ? Math.round((data.withKit / data.totalQuizzes) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.55, marginBottom: 4 }}>Marketing</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', margin: 0, lineHeight: 1 }}>Analítica</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 6 }}>Comportamiento del quiz, kits generados y conversión a compra.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="Quizzes tomados" value={String(data.totalQuizzes)} sub="total acumulado" icon={ChartBar} color="var(--cat-lavanda)" />
        <KPI label="Kits generados" value={String(data.withKit)} sub={`${conversionRate}% conversión`} icon={Sparkle} color="var(--cat-menta)" />
        <KPI label="Pedidos este mes" value={String(data.paidOrdersMonth)} sub="pagados" icon={ShoppingCart} color="var(--cat-durazno)" />
        <KPI label="Ingresos este mes" value={`S/${Math.round(data.monthRevenueCents / 100)}`} sub="pedidos pagados" icon={TrendUp} color="var(--cat-mostaza)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>

        {/* Recent quiz profiles */}
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: 14 }}>
            Historial de cuestionarios
          </div>
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, overflow: 'hidden' }}>
            {data.recentProfiles.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.45 }}>
                Sin cuestionarios aún
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--liora-arena)' }}>
                    {['Usuario', 'Kit generado', 'Fecha'].map(h => (
                      <th key={h} style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 16px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentProfiles.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < data.recentProfiles.length - 1 ? '1px solid var(--liora-arena)' : 'none', transition: 'background 120ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(61,26,58,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 999, background: p.isGuest ? 'var(--liora-arena)' : 'var(--cat-lavanda)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <UserCircle size={16} weight="bold" color="var(--liora-uva)" />
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)' }}>{p.email}</div>
                            {p.isGuest && <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)', opacity: 0.45 }}>Sin cuenta</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {p.kitCount === 0 ? (
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.4 }}>Sin kit</span>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {p.kitProducts.slice(0, 2).map((name, j) => (
                                <span key={j} style={{ background: 'var(--liora-crema)', border: '1px solid var(--liora-arena)', borderRadius: 6, padding: '2px 7px', fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{name}</span>
                              ))}
                              {p.kitCount > 2 && <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)', opacity: 0.5 }}>+{p.kitCount - 2} más</span>}
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6 }}>
                          {new Date(p.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top recommended products */}
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: 14 }}>
            Productos más recomendados
          </div>
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.topProducts.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.45 }}>
                Sin datos aún
              </div>
            ) : data.topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < data.topProducts.length - 1 ? '1px solid var(--liora-arena)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--liora-uva)', opacity: 0.25, width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                {p.imageUrl ? (
                  <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: CAT_COLORS[p.category] ?? 'var(--cat-lavanda)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image src={p.imageUrl} alt={p.name} width={36} height={36} style={{ objectFit: 'contain', width: '90%', height: '90%' }} />
                  </div>
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: CAT_COLORS[p.category] ?? 'var(--cat-lavanda)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)', opacity: 0.5 }}>{p.category}</div>
                </div>
                <div style={{ background: 'var(--liora-lima)', borderRadius: 999, padding: '3px 10px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', flexShrink: 0 }}>
                  ×{p.count}
                </div>
              </div>
            ))}
          </div>

          {/* Funnel visual */}
          <div style={{ marginTop: 16, background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, padding: '20px 20px' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Embudo de conversión</div>
            {[
              { label: 'Cuestionarios tomados', value: data.totalQuizzes, color: 'var(--cat-lavanda)', pct: 100 },
              { label: 'Kits generados', value: data.withKit, color: 'var(--cat-menta)', pct: data.totalQuizzes > 0 ? Math.round(data.withKit / data.totalQuizzes * 100) : 0 },
              { label: 'Pedidos pagados (mes)', value: data.paidOrdersMonth, color: 'var(--cat-mostaza)', pct: data.totalQuizzes > 0 ? Math.round(data.paidOrdersMonth / data.totalQuizzes * 100) : 0 },
            ].map((step, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', fontWeight: 600 }}>{step.label}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', fontWeight: 700 }}>{step.value} <span style={{ opacity: 0.5, fontWeight: 400 }}>({step.pct}%)</span></span>
                </div>
                <div style={{ height: 8, background: 'var(--liora-arena)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${step.pct}%`, background: step.color, borderRadius: 999, transition: 'width 500ms ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
