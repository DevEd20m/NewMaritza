import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm, type PrefillData } from '@/components/checkout/CheckoutForm'

export const metadata: Metadata = { title: 'Pago seguro', robots: { index: false, follow: false } }

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let prefill: PrefillData | null = null

  if (user) {
    const [{ data: profileRaw }, { data: addressRaw }] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, phone').eq('id', user.id).single(),
      supabase.from('addresses').select('first_name, last_name, phone, address_line1, address_line2, city, state, postal_code').eq('user_id', user.id).order('is_default', { ascending: false }).limit(1).single(),
    ])

    const profile = profileRaw as { first_name: string | null; last_name: string | null; phone: string | null } | null
    const address = addressRaw as { first_name: string; last_name: string; phone: string | null; address_line1: string; address_line2: string | null; city: string; state: string | null; postal_code: string | null } | null

    prefill = {
      isLoggedIn: true,
      email: user.email ?? '',
      firstName: address?.first_name ?? profile?.first_name ?? '',
      lastName: address?.last_name ?? profile?.last_name ?? '',
      phone: address?.phone ?? profile?.phone ?? '',
      addressLine1: address?.address_line1 ?? '',
      city: address?.city ?? '',
      district: address?.state ?? '',
      postalCode: address?.postal_code ?? '',
    }
  }

  return <CheckoutForm prefill={prefill} />
}
