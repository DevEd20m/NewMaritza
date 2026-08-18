import { expect, test } from '@playwright/test'

test.describe('Stripe checkout de staging', () => {
  test('un invitado paga y vuelve a una orden confirmada', async ({ browser }) => {
    test.skip(process.env.RUN_STRIPE_E2E !== '1', 'Solo se ejecuta contra Stripe test en staging')

    const baseUrl = process.env.PLAYWRIGHT_BASE_URL
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    expect(baseUrl).toBeTruthy()
    expect(bypass).toBeTruthy()

    // Este contexto no hereda el header global de bypass: así el secreto nunca
    // se envía a checkout.stripe.com. Primero obtenemos una cookie solo de Vercel.
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(
      `${baseUrl}/?x-vercel-protection-bypass=${encodeURIComponent(bypass!)}&x-vercel-set-bypass-cookie=true`,
    )

    const checkoutResponse = await page.request.post(`${baseUrl}/api/checkout`, {
      data: {
        cartSessionToken: crypto.randomUUID(),
        address: {
          firstName: 'Prueba',
          lastName: 'Staging',
          email: 'checkout-staging@liora.invalid',
          phone: '999999999',
          addressLine1: 'Av. Pruebas 123',
          city: 'Lima',
          district: 'Miraflores',
          country: 'PE',
        },
        items: [{
          // Fixture ilimitado: permite repetir el flujo sin consumir inventario.
          variantId: '30000000-0000-0000-0000-000000000002',
          quantity: 1,
        }],
      },
    })
    expect(checkoutResponse.ok(), await checkoutResponse.text()).toBeTruthy()
    const order = await checkoutResponse.json() as {
      orderId: string
      reservationExpiresAt: string
    }
    expect(new Date(order.reservationExpiresAt).getTime()).toBeGreaterThan(Date.now())

    const sessionResponse = await page.request.post(`${baseUrl}/api/payment/create-session`, {
      data: { orderId: order.orderId },
    })
    expect(sessionResponse.ok(), await sessionResponse.text()).toBeTruthy()
    const session = await sessionResponse.json() as { redirectUrl: string }
    expect(session.redirectUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//)

    await page.goto(session.redirectUrl)
    await page.locator('input[name="cardNumber"]').fill('4242424242424242')
    await page.locator('input[name="cardExpiry"]').fill('1234')
    await page.locator('input[name="cardCvc"]').fill('123')

    const billingName = page.locator('input[name="billingName"]')
    if (await billingName.isVisible()) await billingName.fill('Prueba Staging')

    const payButton = page
      .getByTestId('hosted-payment-submit-button')
      .or(page.getByRole('button', { name: /pagar|pay/i }))
      .first()
    await payButton.click()
    await page.waitForURL(new RegExp(`^${baseUrl!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/confirmado\\?session_id=`), {
      timeout: 45_000,
    })
    await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toBeVisible({ timeout: 30_000 })

    await context.close()
  })
})
