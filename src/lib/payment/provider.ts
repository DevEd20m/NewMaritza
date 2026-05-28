import type { PaymentProvider } from './types'
import { stripeProvider } from './stripe/provider'

const providers: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
}

export function getPaymentProvider(name = 'stripe'): PaymentProvider {
  const provider = providers[name]
  if (!provider) throw new Error(`Unknown payment provider: ${name}`)
  return provider
}
