import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { firstName, lastName = null, phone = null, addressLine1, addressLine2 = null, district = null, city, postalCode = null } = parsed.data
    const admin = createAdminClient()

    await (admin as any).from('profiles').update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
    }).eq('id', user.id)

    if (addressLine1 || city) {
      const { data: existing } = await (admin as any)
        .from('addresses')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      if (existing) {
        await (admin as any).from('addresses').update({
          first_name: firstName,
          last_name: lastName,
          address_line1: addressLine1 ?? null,
          address_line2: addressLine2,
          district: district,
          city: city ?? null,
          postal_code: postalCode,
        }).eq('id', existing.id)
      } else {
        await (admin as any).from('addresses').insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          address_line1: addressLine1 ?? '',
          address_line2: addressLine2,
          district: district,
          city: city ?? null,
          postal_code: postalCode,
          country: 'PE',
          is_default: true,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/profile]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
