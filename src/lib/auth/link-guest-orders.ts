import { createAdminClient } from '@/lib/supabase/admin'

export async function linkGuestOrdersToUser(userId: string, email: string) {
  const admin = createAdminClient()

  // Link orders where guest_email matches
  await admin
    .from('orders')
    .update({ user_id: userId })
    .eq('guest_email', email)
    .is('user_id', null)

  // Link quiz_profiles via leads bridge
  const { data: leads } = await admin
    .from('leads')
    .select('quiz_profile_id')
    .eq('email', email)
    .not('quiz_profile_id', 'is', null)

  if (leads?.length) {
    const profileIds = leads.map((l: any) => l.quiz_profile_id).filter(Boolean)
    if (profileIds.length) {
      await admin
        .from('quiz_profiles')
        .update({ user_id: userId })
        .in('id', profileIds)
        .is('user_id', null)
    }
  }
}
