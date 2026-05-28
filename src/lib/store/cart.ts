'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartLineItem {
  variantId: string
  productId: string
  name: string
  variantName: string
  priceCents: number
  currency: string
  quantity: number
  imageUrl?: string
  categoryColor?: string
}

interface CartState {
  sessionToken: string
  cartId: string | null
  items: CartLineItem[]
  appliedCouponCode: string | null
  discountCents: number
  isOpen: boolean

  setCartId: (id: string) => void
  setSessionToken: (token: string) => void
  addItem: (item: Omit<CartLineItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  setIsOpen: (open: boolean) => void
  setAppliedCoupon: (code: string | null, discountCents: number) => void

  subtotalCents: () => number
  totalCents: () => number
  itemCount: () => number
}

function generateToken() {
  return `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      sessionToken: generateToken(),
      cartId: null,
      items: [],
      appliedCouponCode: null,
      discountCents: 0,
      isOpen: false,

      setCartId: (id) => set({ cartId: id }),
      setSessionToken: (token) => set({ sessionToken: token }),

      addItem: (item) => {
        const qty = item.quantity ?? 1
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: i.quantity + qty } : i
              ),
              isOpen: true,
            }
          }
          return { items: [...state.items, { ...item, quantity: qty }], isOpen: true }
        })
      },

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
        }))
      },

      clearCart: () =>
        set({ items: [], appliedCouponCode: null, discountCents: 0, cartId: null }),

      setIsOpen: (open) => set({ isOpen: open }),

      setAppliedCoupon: (code, discountCents) =>
        set({ appliedCouponCode: code, discountCents }),

      subtotalCents: () => get().items.reduce((s, i) => s + i.priceCents * i.quantity, 0),

      totalCents: () => {
        const sub = get().subtotalCents()
        const discount = get().discountCents
        return Math.max(0, sub - discount)
      },

      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name: 'liora-cart',
      partialize: (state) => ({
        sessionToken: state.sessionToken,
        cartId: state.cartId,
        items: state.items,
        appliedCouponCode: state.appliedCouponCode,
        discountCents: state.discountCents,
      }),
    }
  )
)
