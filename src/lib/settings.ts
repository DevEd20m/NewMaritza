import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface StoreSettings {
  free_shipping_threshold_cents: number
  shipping_cost_cents: number
  delivery_message: string
  whatsapp_number: string
  hero_image_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  email_contact: string | null
}

const DEFAULTS: StoreSettings = {
  free_shipping_threshold_cents: 15000,
  shipping_cost_cents: 1500,
  delivery_message: 'Lima 36–48h · Provincias 3–5 días',
  whatsapp_number: '51999999999',
  hero_image_url: null,
  instagram_url: null,
  tiktok_url: null,
  email_contact: null,
}

export async function getStoreSettings(): Promise<StoreSettings> {
  noStore()
  const admin = createAdminClient()
  const { data } = await (admin as any).from('store_settings').select('key, value')
  if (!data) return DEFAULTS
  const map = Object.fromEntries((data as Array<{ key: string; value: string }>).map((r) => [r.key, r.value]))
  return {
    free_shipping_threshold_cents: Number(map.free_shipping_threshold_cents ?? DEFAULTS.free_shipping_threshold_cents),
    shipping_cost_cents: Number(map.shipping_cost_cents ?? DEFAULTS.shipping_cost_cents),
    delivery_message: map.delivery_message ?? DEFAULTS.delivery_message,
    whatsapp_number: map.whatsapp_number ?? DEFAULTS.whatsapp_number,
    hero_image_url: map.hero_image_url ?? null,
    instagram_url: map.instagram_url ?? null,
    tiktok_url: map.tiktok_url ?? null,
    email_contact: map.email_contact ?? null,
  }
}
