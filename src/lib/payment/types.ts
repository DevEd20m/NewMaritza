export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled'

export interface CreateSessionInput {
  orderId: string
  orderNumber: string
  amountCents: number
  currency: string
  customerEmail: string
  customerName: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface CreateSessionResult {
  sessionId: string
  redirectUrl: string
  providerReference: string
}

export interface ConfirmResult {
  status: PaymentStatus
  providerReference: string
  method?: string
  metadata?: Record<string, unknown>
}

export interface WebhookEvent {
  id: string
  type: string
  provider: string
  orderId?: string
  paymentId?: string
  status?: PaymentStatus
  rawPayload: unknown
}

export interface PaymentProvider {
  name: string
  createSession(input: CreateSessionInput): Promise<CreateSessionResult>
  confirmPayment(sessionId: string): Promise<ConfirmResult>
  constructWebhookEvent(payload: string | Buffer, signature: string): Promise<WebhookEvent>
  mapStatus(providerStatus: string): PaymentStatus
}
