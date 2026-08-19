import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const enabled = process.env.RUN_LIA_LIVE_E2E === '1'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const recipient = process.env.QUIZ_E2E_RECIPIENT

test.setTimeout(120_000)

test.describe('Lía con catálogo real', () => {
  test.skip(
    !enabled || !supabaseUrl || !serviceRoleKey || !recipient,
    'Requiere un perfil de cuestionario controlado y RUN_LIA_LIVE_E2E=1',
  )

  test('propone y confirma un reemplazo más económico del catálogo', async ({ page }) => {
    if (supabaseUrl!.includes('skcfrccoexscaiayzjzd')) {
      expect(recipient).toMatch(/@liora\.pe$/)
    }
    const admin = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: job, error } = await admin
      .from('email_queue')
      .select('quiz_profile_id, payload')
      .eq('recipient_email', recipient!)
      .eq('type', 'quiz_welcome')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    const payload = job?.payload as Record<string, unknown> | null
    const resultToken = typeof payload?.result_token === 'string' ? payload.result_token : null
    expect(job?.quiz_profile_id).toBeTruthy()
    expect(resultToken).toBeTruthy()

    await page.goto(`/api/quiz/result?token=${encodeURIComponent(resultToken!)}`)
    await expect(page.getByRole('heading', { name: /Hicimos esto/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.liora-cart-item').first()).toBeVisible()

    const input = page.getByPlaceholder('Pregúntame sobre tu kit…')
    await input.fill('Quiero algo más económico')
    const chatResponsePromise = page.waitForResponse(response =>
      response.url().endsWith('/api/kit/chat') && response.request().method() === 'POST',
    )
    await input.press('Enter')
    const chatResponse = await chatResponsePromise
    expect(chatResponse.ok(), await chatResponse.text()).toBeTruthy()
    const chat = await chatResponse.json() as {
      reply: string
      suggestions: Array<{
        id: string
        sourceVariantId: string
        savingsCents: number
        replacement: { variantId: string; name: string }
      }>
    }
    expect(chat.reply).not.toMatch(/farmacia|tienda externa|mercado libre/i)
    expect(chat.suggestions.length).toBeGreaterThan(0)
    expect(chat.suggestions[0].savingsCents).toBeGreaterThan(0)

    const replaceButton = page.getByRole('button', { name: 'Reemplazar' }).first()
    await expect(replaceButton).toBeVisible({ timeout: 15_000 })
    const acceptResponsePromise = page.waitForResponse(response =>
      response.url().endsWith('/api/kit/chat/accept') && response.request().method() === 'POST',
    )
    await replaceButton.click()
    const acceptResponse = await acceptResponsePromise
    expect(acceptResponse.ok(), await acceptResponse.text()).toBeTruthy()
    const accepted = await acceptResponse.json() as {
      replacement: { variantId: string; name: string }
    }
    expect(accepted.replacement.variantId).toBe(chat.suggestions[0].replacement.variantId)
    await expect(page.getByText(accepted.replacement.name, { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reemplazado' }).first()).toBeDisabled()
  })
})
