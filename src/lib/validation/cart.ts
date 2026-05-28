import { z } from 'zod'

export const addToCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  sessionToken: z.string().min(1),
})

export const updateCartItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(0),
})

export const cartIdSchema = z.object({
  cartId: z.string().uuid(),
})
