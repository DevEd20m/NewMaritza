import type { Metadata } from 'next'
import { getStoreSettings } from '@/lib/settings'
import { ConfiguracionClient } from '@/components/admin/ConfiguracionClient'

export const metadata: Metadata = { title: 'Configuración — Admin LIORA' }

export default async function AdminConfiguracionPage() {
  const settings = await getStoreSettings()
  return <ConfiguracionClient initial={settings} />
}
