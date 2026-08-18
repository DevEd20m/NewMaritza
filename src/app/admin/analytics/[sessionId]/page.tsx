import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, DeviceMobile, Monitor, WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

type Detail = {
  session: {
    session_id: string; status: string; started_at: string; last_seen_at: string; landing_path: string | null;
    last_path: string | null; active_ms: number; page_view_count: number; device: string | null; source: string;
    display_name: string; email: string | null; order_number: string | null; whatsapp_code: string | null; whatsapp_clicked: boolean;
  } | null
  pages: Array<{ id: string; path: string; title: string | null; entered_at: string; exited_at: string | null; engaged_ms: number }>
  events: Array<{ event: string; path: string | null; target_id: string | null; target_type: string | null; product_slug: string | null; value_cents: number | null; metadata: Record<string, unknown>; occurred_at: string; engagement_ms: number | null }>
}

function duration(ms: number) {
  const seconds = Math.round(ms / 1000)
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

const eventLabels: Record<string, string> = {
  page_view: 'Vio una pantalla', page_engagement: 'Permaneció activo', element_click: 'Hizo clic', navigation_click: 'Navegó',
  whatsapp_click: 'Abrió WhatsApp', view_item: 'Vio un producto', add_to_cart: 'Añadió al carrito', begin_checkout: 'Inició checkout',
  purchase: 'Completó una compra', quiz_start: 'Inició cuestionario', quiz_step: 'Avanzó el cuestionario', quiz_complete: 'Terminó cuestionario',
  search: 'Realizó una búsqueda', search_no_results: 'Búsqueda sin resultados', checkout_error: 'Error de checkout',
}

export default async function AnalyticsSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('admin_analytics_session_detail', { p_session_id: sessionId })
  const detail = data as unknown as Detail
  if (error || !detail?.session) notFound()
  const session = detail.session!
  const Device = session.device === 'mobile' ? DeviceMobile : Monitor

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <Link href="/admin/analytics" style={{ display: 'inline-flex', gap: 7, alignItems: 'center', color: 'var(--liora-uva)', fontWeight: 700, fontSize: 13 }}><ArrowLeft size={15} /> Volver a analítica</Link>
      <header style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 22, padding: 24, display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.5 }}>Recorrido</div><h1 style={{ fontFamily: 'var(--font-display)', margin: '4px 0', color: 'var(--liora-uva)' }}>{session.display_name}</h1><div style={{ fontSize: 13, opacity: 0.65 }}>{session.email ?? 'Visitante anónimo'}</div></div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 13 }}><span><Device size={17} style={{ verticalAlign: -3 }} /> {session.device ?? '—'}</span><span><Clock size={17} style={{ verticalAlign: -3 }} /> {duration(session.active_ms)}</span>{session.whatsapp_clicked && <span><WhatsappLogo size={17} style={{ verticalAlign: -3 }} /> {session.whatsapp_code}</span>}</div>
      </header>

      <section><h2 style={heading}>Pantallas observadas</h2><div style={panel}>{detail.pages.length === 0 ? <div style={empty}>Sin páginas detalladas.</div> : detail.pages.map((page, index) => <div key={page.id} style={row}><div style={number}>{index + 1}</div><div style={{ flex: 1 }}><strong>{page.path}</strong>{page.title && <div style={{ opacity: 0.55, fontSize: 11 }}>{page.title}</div>}</div><div style={{ fontWeight: 700 }}>{duration(page.engaged_ms)}</div></div>)}</div></section>

      <section><h2 style={heading}>Cronología</h2><div style={panel}>{detail.events.filter(event => event.event !== 'page_engagement').map((event, index) => <div key={`${event.occurred_at}-${index}`} style={row}><div style={{ width: 82, fontSize: 11, opacity: 0.55 }}>{new Date(event.occurred_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div><div style={{ flex: 1 }}><strong>{eventLabels[event.event] ?? event.event}</strong><div style={{ opacity: 0.58, fontSize: 11 }}>{event.target_id ?? event.product_slug ?? event.path ?? ''}</div></div>{event.event === 'whatsapp_click' && <WhatsappLogo size={18} />}</div>)}</div></section>
    </div>
  )
}

const heading = { fontFamily: 'var(--font-body)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--liora-uva)', opacity: 0.6 }
const panel = { background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, overflow: 'hidden' }
const row = { display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderBottom: '1px solid var(--liora-arena)', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 12 }
const number = { width: 26, height: 26, borderRadius: 999, background: 'var(--cat-lavanda)', display: 'grid', placeItems: 'center', fontWeight: 700, flexShrink: 0 }
const empty = { padding: 28, textAlign: 'center' as const, opacity: 0.5, color: 'var(--liora-uva)' }
