import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { GuiaPrivadaClient } from '@/components/guides/GuiaPrivadaClient'
import { getStoreSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Tu guía personalizada | LIORA',
  robots: { index: false, follow: false },
}

export default async function MiGuiaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: snapshot } = await (admin as any)
    .from('order_guide_snapshots')
    .select(`
      *,
      orders (
        order_number,
        status,
        created_at
      )
    `)
    .eq('secure_token', token)
    .maybeSingle()

  if (!snapshot) notFound()

  // Si la orden expiró
  if (snapshot.expires_at && new Date(snapshot.expires_at) < new Date()) {
    return (
      <div style={{ padding: '96px 48px', textAlign: 'center', background: 'var(--liora-crema)', minHeight: '60vh' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)' }}>
          Este link de guía ha expirado.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, opacity: 0.65, marginTop: 12 }}>
          Crea una cuenta para acceder a tu guía en cualquier momento.
        </p>
        <a
          href="/login"
          style={{ display: 'inline-block', marginTop: 24, background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '14px 28px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
        >
          Crear cuenta →
        </a>
      </div>
    )
  }

  // Registrar primer acceso
  if (!snapshot.viewed_at) {
    await (admin as any)
      .from('order_guide_snapshots')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', snapshot.id)
  }

  const { whatsapp_number } = await getStoreSettings()
  return <GuiaPrivadaClient snapshot={snapshot} whatsappNumber={whatsapp_number} />
}
