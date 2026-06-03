import { z } from 'zod'

export const addressSchema = z.object({
  firstName: z.string().min(2, 'Nombre requerido'),
  lastName: z.string().min(2, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  addressLine1: z.string().min(5, 'Dirección requerida'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Ciudad requerida'),
  district: z.string().min(2, 'Distrito requerido'),
  postalCode: z.string().optional(),
  country: z.string().optional(),
})

export type AddressFormData = z.infer<typeof addressSchema>

export const checkoutSchema = z.object({
  address: addressSchema,
  paymentMethod: z.enum(['card', 'yape', 'pse']).optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

export const createOrderSchema = z.object({
  cartSessionToken: z.string(),
  address: addressSchema,
  couponCode: z.string().optional(),
  notes: z.string().optional(),
})

export const couponValidateSchema = z.object({
  code: z.string().min(1),
  cartTotalCents: z.number().int().positive(),
  cartVariantIds: z.array(z.string().uuid()).optional(),
})
