import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from '@/lib/store/cart'

describe('cart replacement', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      appliedCouponCode: null,
      discountCents: 0,
      cartId: null,
      isOpen: false,
    })
  })

  it('preserves quantity and routine position while clearing the coupon', () => {
    const state = useCartStore.getState()
    state.addItem({
      variantId: 'source',
      productId: 'product-source',
      name: 'Producto original',
      variantName: 'Unidad',
      priceCents: 9000,
      currency: 'PEN',
      quantity: 2,
      stepLabel: 'Hidratación',
      stepWhen: 'Mañana',
      stepInstruction: 'Instrucción original',
    })
    state.setAppliedCoupon('BIENVENIDA10', 1000)

    useCartStore.getState().replaceItem('source', {
      variantId: 'replacement',
      productId: 'product-replacement',
      name: 'Alternativa',
      variantName: 'Unidad',
      priceCents: 5000,
      currency: 'PEN',
      stepInstruction: 'Instrucción vigente',
    })

    const next = useCartStore.getState()
    expect(next.items).toHaveLength(1)
    expect(next.items[0]).toMatchObject({
      variantId: 'replacement',
      quantity: 2,
      stepLabel: 'Hidratación',
      stepWhen: 'Mañana',
      stepInstruction: 'Instrucción vigente',
    })
    expect(next.appliedCouponCode).toBeNull()
    expect(next.discountCents).toBe(0)
  })
})

