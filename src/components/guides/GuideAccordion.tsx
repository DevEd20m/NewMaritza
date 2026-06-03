'use client'
import { useState } from 'react'
import type { FAQ } from '@/lib/guides'
import { CaretDown } from '@phosphor-icons/react'

export function GuideAccordion({ faqs }: { faqs: FAQ[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', overflow: 'hidden' }}>
      {faqs.map((faq, i) => (
        <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1.5px solid var(--liora-arena)' : 'none' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
              textAlign: 'left',
            }}
          >
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', lineHeight: 1.35 }}>
              {faq.q}
            </span>
            <CaretDown
              size={18} weight="bold"
              style={{
                color: 'var(--liora-uva)', flexShrink: 0, opacity: 0.6,
                transform: open === i ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
              }}
            />
          </button>
          {open === i && (
            <div style={{ padding: '0 24px 20px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.78, margin: 0, lineHeight: 1.55 }}>
                {faq.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
