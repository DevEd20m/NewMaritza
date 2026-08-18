'use client'
import type { CSSProperties } from 'react'
import { ChartBar, UserCircle, ShoppingCart, Sparkle, ArrowRight, TrendUp, Eye, DeviceMobile, Warning, WhatsappLogo, Clock, Path } from '@phosphor-icons/react'
import Link from 'next/link'
import Image from 'next/image'

export interface VisitorsData {
  days: number
  sessions: number
  pageViews: number
  mobileSessions: number
  funnel: { visited: number; viewedProduct: number; addedToCart: number; beganCheckout: number; purchased: number }
  quiz: { started: number; completed: number }
  exitPages: Array<{ path: string; sessions: number }>
  topViewed: Array<{ name: string; slug: string | null; views: number; sessions: number }>
  topAdded: Array<{ name: string; adds: number }>
  checkoutErrors: Array<{ message: string; created_at: string }>
  sources: Array<{ source: string; sessions: number }>
}

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

export interface JourneySummary {
  session_id: string
  status: 'anonymous' | 'identified' | 'opted_out'
  started_at: string
  last_seen_at: string
  landing_path: string | null
  last_path: string | null
  active_ms: number
  page_view_count: number
  device: string | null
  source: string
  display_name: string
  email: string | null
  quiz_profile_id: string | null
  order_id: string | null
  order_number: string | null
  whatsapp_code: string | null
  whatsapp_clicked: boolean
}

type JourneyFilters = { query: string; identity: string; whatsappOnly: boolean }

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

const PANEL_LABEL: CSSProperties = { fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: 14 }
const PANEL_BOX: CSSProperties = { background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, padding: '8px 0' }
const EMPTY_MSG: CSSProperties = { padding: 28, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.45 }
const ROW_TEXT: CSSProperties = { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const COUNT_PILL: CSSProperties = { background: 'var(--liora-lima)', borderRadius: 999, padding: '3px 10px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', flexShrink: 0 }

function RankList({ title, rows, empty }: { title: string; rows: Array<{ label: string; sub?: string; count: number }>; empty: string }) {
  return (
    <div>
      <div style={PANEL_LABEL}>{title}</div>
      <div style={PANEL_BOX}>
        {rows.length === 0 ? (
          <div style={EMPTY_MSG}>{empty}</div>
        ) : rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < rows.length - 1 ? '1px solid var(--liora-arena)' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--liora-uva)', opacity: 0.25, width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={ROW_TEXT}>{r.label}</div>
              {r.sub && <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)', opacity: 0.5 }}>{r.sub}</div>}
            </div>
            <div style={COUNT_PILL}>×{r.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VisitorsSection({ v }: { v: VisitorsData }) {
  const pct = (n: number, base: number) => (base > 0 ? Math.round((n / base) * 100) : 0)
  const mobilePct = pct(v.mobileSessions, v.sessions)
  const funnelSteps = [
    { label: 'Visitó la tienda', value: v.funnel.visited, color: 'var(--cat-lavanda)' },
    { label: 'Vio un producto', value: v.funnel.viewedProduct, color: 'var(--cat-cielo)' },
    { label: 'Añadió al carrito', value: v.funnel.addedToCart, color: 'var(--cat-menta)' },
    { label: 'Inició el pago', value: v.funnel.beganCheckout, color: 'var(--cat-mostaza)' },
    { label: 'Compró', value: v.funnel.purchased, color: 'var(--cat-durazno)' },
  ]

  return (
    <>
      {/* Selector de rango */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[{ d: 7, label: 'Últimos 7 días' }, { d: 30, label: 'Últimos 30 días' }].map(({ d, label }) => (
          <Link key={d} href={`/admin/analytics?dias=${d}`} style={{
            textDecoration: 'none', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12,
            padding: '8px 16px', borderRadius: 999,
            background: v.days === d ? 'var(--liora-uva)' : 'var(--liora-blanco)',
            color: v.days === d ? 'var(--liora-crema)' : 'var(--liora-uva)',
            border: '1.5px solid ' + (v.days === d ? 'var(--liora-uva)' : 'var(--liora-arena)'),
          }}>{label}</Link>
        ))}
      </div>

      {/* KPIs de visitantes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="Sesiones" value={String(v.sessions)} sub={`últimos ${v.days} días`} icon={UserCircle} color="var(--cat-lavanda)" />
        <KPI label="Páginas vistas" value={String(v.pageViews)} sub={v.sessions > 0 ? `${(v.pageViews / v.sessions).toFixed(1)} por visita` : undefined} icon={Eye} color="var(--cat-cielo)" />
        <KPI label="Desde celular" value={`${mobilePct}%`} sub={`${v.mobileSessions} visitantes`} icon={DeviceMobile} color="var(--cat-menta)" />
        <KPI label="Conversión a compra" value={`${pct(v.funnel.purchased, v.sessions)}%`} sub={`${v.funnel.purchased} compras`} icon={ShoppingCart} color="var(--cat-durazno)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Embudo de visitantes */}
        <div>
          <div style={PANEL_LABEL}>¿Dónde se quedan los clientes?</div>
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, padding: 20 }}>
            {v.sessions === 0 ? (
              <div style={EMPTY_MSG}>Aún no hay visitas registradas. Los datos aparecerán apenas alguien navegue la tienda.</div>
            ) : funnelSteps.map((step, i) => {
              const prev = i === 0 ? step.value : funnelSteps[i - 1].value
              const lost = i === 0 ? 0 : prev - step.value
              return (
                <div key={i} style={{ marginBottom: i < funnelSteps.length - 1 ? 14 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', fontWeight: 600 }}>{step.label}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', fontWeight: 700 }}>
                      {step.value} <span style={{ opacity: 0.5, fontWeight: 400 }}>({pct(step.value, v.sessions)}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 10, background: 'var(--liora-arena)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct(step.value, v.sessions)}%`, background: step.color, borderRadius: 999, transition: 'width 500ms ease' }} />
                  </div>
                  {lost > 0 && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#C2433A', opacity: 0.8, marginTop: 3 }}>
                      ↓ {lost} {lost === 1 ? 'visitante se quedó' : 'visitantes se quedaron'} en el paso anterior
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Errores de checkout */}
          <div style={{ marginTop: 16 }}>
            <div style={PANEL_LABEL}><Warning size={12} weight="bold" style={{ verticalAlign: -1, marginRight: 4 }} />Errores al pagar (por qué no terminan)</div>
            <div style={PANEL_BOX}>
              {v.checkoutErrors.length === 0 ? (
                <div style={EMPTY_MSG}>Sin errores de pago registrados 🎉</div>
              ) : v.checkoutErrors.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < v.checkoutErrors.length - 1 ? '1px solid var(--liora-arena)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-body)', fontSize: 12, color: '#C2433A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message || 'Error sin detalle'}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.5, flexShrink: 0 }}>
                    {new Date(e.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RankList
            title="Productos más vistos"
            empty="Sin vistas de producto aún"
            rows={v.topViewed.map(p => ({ label: p.name, sub: `${p.sessions} ${p.sessions === 1 ? 'visitante' : 'visitantes'}`, count: p.views }))}
          />
          <RankList
            title="Más añadidos al carrito"
            empty="Sin productos añadidos aún"
            rows={v.topAdded.map(p => ({ label: p.name, count: p.adds }))}
          />
          <RankList
            title="Última pantalla antes de irse (sin comprar)"
            empty="Sin datos aún"
            rows={v.exitPages.map(p => ({ label: p.path, count: p.sessions }))}
          />
          <RankList
            title="¿De dónde llegan?"
            empty="Sin fuentes registradas aún"
            rows={v.sources.map(s => ({ label: s.source, count: s.sessions }))}
          />
          {/* Quiz funnel corto */}
          <div>
            <div style={PANEL_LABEL}>Cuestionario ({v.days} días)</div>
            <div style={{ ...PANEL_BOX, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--liora-uva)' }}>{v.quiz.started} empezaron</span>
              <ArrowRight size={14} color="var(--liora-uva)" opacity={0.4} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--liora-uva)' }}>{v.quiz.completed} terminaron</span>
              <span style={{ ...COUNT_PILL, marginLeft: 'auto' }}>{pct(v.quiz.completed, v.quiz.started)}%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function formatDuration(ms: number) {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function JourneySection({ journeys, days, filters }: { journeys: JourneySummary[]; days: number; filters: JourneyFilters }) {
  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <div style={PANEL_LABEL}>Recorridos recientes</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6 }}>Pantallas, tiempo activo, cuestionario, compra y origen de WhatsApp.</div>
        </div>
        <form method="get" action="/admin/analytics" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="hidden" name="dias" value={days} />
          <input aria-label="Buscar recorrido" name="q" defaultValue={filters.query} placeholder="Email, pedido o código" style={{ border: '1px solid var(--liora-arena)', borderRadius: 999, padding: '9px 14px', background: 'var(--liora-blanco)', color: 'var(--liora-uva)' }} />
          <select aria-label="Filtrar por identidad" name="identidad" defaultValue={filters.identity} style={{ border: '1px solid var(--liora-arena)', borderRadius: 999, padding: '9px 12px', background: 'var(--liora-blanco)', color: 'var(--liora-uva)' }}>
            <option value="all">Todos</option><option value="identified">Identificados</option><option value="anonymous">Anónimos</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12 }}><input type="checkbox" name="whatsapp" value="1" defaultChecked={filters.whatsappOnly} /> WhatsApp</label>
          <button type="submit" style={{ border: 0, borderRadius: 999, padding: '9px 16px', background: 'var(--liora-uva)', color: 'var(--liora-crema)', fontWeight: 700 }}>Filtrar</button>
        </form>
      </div>
      <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, overflowX: 'auto' }}>
        {journeys.length === 0 ? <div style={EMPTY_MSG}>Aún no hay recorridos con estos filtros.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 840 }}>
            <thead><tr>{['Visitante', 'Recorrido', 'Tiempo', 'Resultado', 'Última actividad'].map(label => <th key={label} style={{ padding: '11px 14px', textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>{label}</th>)}</tr></thead>
            <tbody>{journeys.map(journey => (
              <tr key={journey.session_id} style={{ borderTop: '1px solid var(--liora-arena)' }}>
                <td style={{ padding: '12px 14px' }}><Link href={`/admin/analytics/${journey.session_id}`} style={{ color: 'var(--liora-uva)', fontWeight: 700, fontSize: 12 }}>{journey.display_name}</Link><div style={{ fontSize: 10, opacity: 0.55 }}>{journey.email ?? 'Anónimo'} · {journey.device ?? '—'}</div></td>
                <td style={{ padding: '12px 14px', fontSize: 11 }}><div style={{ display: 'flex', gap: 5, alignItems: 'center' }}><Path size={13} /> {journey.page_view_count} pantallas</div><div style={{ opacity: 0.55 }}>{journey.landing_path ?? '—'} → {journey.last_path ?? '—'}</div></td>
                <td style={{ padding: '12px 14px', fontSize: 12 }}><Clock size={13} style={{ verticalAlign: -2 }} /> {formatDuration(journey.active_ms)}</td>
                <td style={{ padding: '12px 14px', fontSize: 11 }}>{journey.whatsapp_clicked && <div><WhatsappLogo size={13} style={{ verticalAlign: -2 }} /> {journey.whatsapp_code}</div>}{journey.order_number && <div>Pedido {journey.order_number}</div>}{journey.quiz_profile_id && <div>Cuestionario</div>}</td>
                <td style={{ padding: '12px 14px', fontSize: 11 }}>{new Date(journey.last_seen_at).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}<div style={{ opacity: 0.5 }}>{journey.source}</div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export function AnalyticsClient({ data, visitors, journeys, filters }: { data: AnalyticsData; visitors: VisitorsData; journeys: JourneySummary[]; filters: JourneyFilters }) {
  const conversionRate = data.totalQuizzes > 0
    ? Math.round((data.withKit / data.totalQuizzes) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.55, marginBottom: 4 }}>Marketing</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', margin: 0, lineHeight: 1 }}>Analítica</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 6 }}>Visitantes de la tienda, embudo de compra, quiz y conversión.</p>
      </div>

      <VisitorsSection v={visitors} />

      <JourneySection journeys={journeys} days={visitors.days} filters={filters} />

      {/* ── Sección quiz/pedidos (histórico) ─────────────────────────── */}
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.55 }}>Quiz y pedidos</div>
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
