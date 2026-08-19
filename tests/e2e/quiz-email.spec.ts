import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const enabled = process.env.RUN_QUIZ_EMAIL_E2E === '1'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const productionEnabled = process.env.RUN_QUIZ_EMAIL_PROD_E2E === '1'
const configuredRecipient = process.env.QUIZ_E2E_RECIPIENT

test.setTimeout(120_000)

test.describe('Entrega del resultado del cuestionario', () => {
  test.skip(
    !enabled || !supabaseUrl || !serviceRoleKey,
    'Requiere Supabase staging y RUN_QUIZ_EMAIL_E2E=1',
  )

  test('captura un solo correo LIORA y el enlace restaura el kit', async ({ page, browser, baseURL }) => {
    const isProduction = supabaseUrl!.includes('skcfrccoexscaiayzjzd')
    if (isProduction) {
      expect(productionEnabled).toBe(true)
      expect(configuredRecipient).toMatch(/@liora\.pe$/)
    }
    const admin = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const recipient = configuredRecipient ?? `quiz-e2e-${Date.now()}@liora.invalid`
    const { data: usersBefore, error: usersBeforeError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (usersBeforeError) throw usersBeforeError
    const matchingUserIdsBefore = usersBefore.users
      .filter(user => user.email === recipient)
      .map(user => user.id)
      .sort()

    await page.goto('/cuestionario', { waitUntil: 'domcontentloaded' })
    // La página llega renderizada desde el servidor; espera la hidratación antes
    // del primer clic para que React no descarte la interacción temprana.
    await page.waitForTimeout(750)

    const emailInput = page.getByPlaceholder('cami@email.com')
    for (let step = 0; step < 40 && !await emailInput.isVisible().catch(() => false); step += 1) {
      const continueButton = page.getByRole('button', { name: 'Continuar' })
      if (await continueButton.isVisible().catch(() => false)) {
        await continueButton.click()
      } else {
        const firstOption = page.locator('.liora-quiz-option').first()
        await expect(firstOption).toBeVisible()
        await firstOption.click()
        const nextButton = page.getByRole('button', { name: /Siguiente|Ver mi kit/ })
        await expect(nextButton).toBeEnabled({ timeout: 5_000 })
        await nextButton.click()
      }
      await page.waitForTimeout(250)
    }

    await expect(emailInput).toBeVisible()
    await emailInput.fill(recipient)
    const submitRequest = page.waitForRequest(request =>
      request.url().endsWith('/api/quiz/submit') && request.method() === 'POST',
    )
    await page.getByRole('button', { name: 'Ver mi kit personalizado' }).click()
    const originalRequest = await submitRequest
    await expect(page).toHaveURL(/\/carrito\?profileId=/, { timeout: 30_000 })

    const originalPayload = originalRequest.postDataJSON()
    const retry = await page.request.post('/api/quiz/submit', { data: originalPayload })
    expect(retry.ok(), await retry.text()).toBeTruthy()

    let jobs: Array<{
      status: string
      html_snapshot: string | null
      quiz_profile_id: string | null
      payload: Record<string, unknown> | null
    }> = []
    await expect.poll(async () => {
      const { data, error } = await admin
        .from('email_queue')
        .select('status, html_snapshot, quiz_profile_id, payload')
        .eq('recipient_email', recipient)
        .eq('type', 'quiz_welcome')
        .order('created_at', { ascending: false })
      if (error) throw error
      jobs = data ?? []
      return jobs[0]?.status ?? 'missing'
    }, { timeout: 20_000 }).toBe(isProduction ? 'sent' : 'captured')

    // El reintento debe apuntar al mismo trabajo; un destinatario productivo
    // conocido puede tener ejecuciones antiguas, por eso se compara el perfil.
    const currentProfileId = new URL(page.url()).searchParams.get('profileId')
    expect(jobs.filter(job => job.quiz_profile_id === currentProfileId)).toHaveLength(1)

    const html = jobs[0]?.html_snapshot ?? ''
    if (!isProduction) {
      expect(html).toContain('Tu kit personalizado está listo')
      expect(html).toContain('Ver mi kit personalizado')
      expect(html).not.toContain('Confirm your email address')
    }

    const { data: users, error: usersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (usersError) throw usersError
    expect(users.users
      .filter(user => user.email === recipient)
      .map(user => user.id)
      .sort()).toEqual(matchingUserIdsBefore)

    const encodedResultUrl = html.match(/https?:\/\/[^"'<>\s]+\/api\/quiz\/result\?token=[^"'<>\s]+/)?.[0]
    const resultToken = typeof jobs[0]?.payload?.result_token === 'string'
      ? jobs[0].payload.result_token
      : null
    const resultUrl = encodedResultUrl
      ? encodedResultUrl.replaceAll('&amp;', '&')
      : `${baseURL}/api/quiz/result?token=${encodeURIComponent(resultToken ?? '')}`
    expect(resultToken || encodedResultUrl).toBeTruthy()
    const secondDevice = await browser.newContext({
      extraHTTPHeaders: bypass ? {
        'x-vercel-protection-bypass': bypass,
        'x-vercel-set-bypass-cookie': 'true',
      } : undefined,
    })
    const resultPage = await secondDevice.newPage()
    await resultPage.goto(resultUrl, { waitUntil: 'domcontentloaded' })
    await expect(resultPage).toHaveURL(/\/carrito\?profileId=/)
    expect(resultPage.url()).not.toContain('token=')
    await expect.poll(async () => (await secondDevice.cookies())
      .some(cookie => cookie.name === 'liora_session' && cookie.httpOnly)).toBe(true)

    await resultPage.goto('/api/quiz/result?token=token-invalido-que-no-debe-funcionar-1234567890')
    await expect(resultPage).toHaveURL(/\/cuestionario\?resultado=invalido/)
    await secondDevice.close()
  })
})
