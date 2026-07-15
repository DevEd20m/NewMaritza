import Stripe from 'stripe'
import type { PaymentProvider, CreateSessionInput, CreateSessionResult, ConfirmResult, WebhookEvent, PaymentStatus } from '../types'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
}

export const stripeProvider: PaymentProvider = {
  name: 'stripe',

  async createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            product_data: {
              name: `Pedido ${input.orderNumber}`,
              metadata: { order_id: input.orderId },
            },
            unit_amount: input.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        order_id: input.orderId,
        order_number: input.orderNumber,
        ...input.metadata,
      },
    }, {
      // Reintentos para la misma orden reutilizan la sesión en vez de crear una nueva
      // (evita doble cobro por reintento/back-button mientras la orden sigue pendiente).
      idempotencyKey: `session_${input.orderId}`,
    })

    return {
      sessionId: session.id,
      redirectUrl: session.url!,
      providerReference: session.id,
    }
  },

  async confirmPayment(sessionId: string): Promise<ConfirmResult> {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return {
      status: this.mapStatus(session.payment_status),
      providerReference: sessionId,
      method: session.payment_method_types?.[0],
      metadata: { session },
    }
  },

  async constructWebhookEvent(payload: string | Buffer, signature: string): Promise<WebhookEvent> {
    const stripe = getStripe()
    const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    const session = event.type.startsWith('checkout.session') ? event.data.object as Stripe.Checkout.Session : null

    return {
      id: event.id,
      type: event.type,
      provider: 'stripe',
      orderId: session?.metadata?.order_id,
      status: session ? this.mapStatus(session.payment_status) : undefined,
      rawPayload: event,
    }
  },

  mapStatus(providerStatus: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      paid: 'succeeded',
      unpaid: 'pending',
      no_payment_required: 'succeeded',
      succeeded: 'succeeded',
      requires_payment_method: 'pending',
      canceled: 'cancelled',
    }
    return map[providerStatus] ?? 'pending'
  },
}
