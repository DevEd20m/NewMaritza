'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Guide {
  id: string
  slug: string
  kit_name: string
  tagline: string
  color: string
  matching_keywords: string[]
  is_active: boolean
  sort_order: number
  updated_at: string
}

export function GuiasClient({ initialGuides }: { initialGuides: Guide[] }) {
  const [guides, setGuides] = useState<Guide[]>(initialGuides)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editKeywords, setEditKeywords] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleActive = async (guide: Guide) => {
    const res = await fetch(`/api/admin/guides/${guide.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !guide.is_active }),
    })
    if (res.ok) {
      setGuides(prev => prev.map(g => g.id === guide.id ? { ...g, is_active: !g.is_active } : g))
    }
  }

  const startEditKeywords = (guide: Guide) => {
    setEditingId(guide.id)
    setEditKeywords(guide.matching_keywords.join(', '))
  }

  const saveKeywords = async (guide: Guide) => {
    setSaving(true)
    const keywords = editKeywords.split(',').map(k => k.trim()).filter(Boolean)
    const res = await fetch(`/api/admin/guides/${guide.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matching_keywords: keywords }),
    })
    if (res.ok) {
      setGuides(prev => prev.map(g => g.id === guide.id ? { ...g, matching_keywords: keywords } : g))
      setEditingId(null)
    }
    setSaving(false)
  }

  const cell: React.CSSProperties = { padding: '14px 16px', borderBottom: '1px solid var(--liora-arena)', verticalAlign: 'middle', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)' }

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--liora-uva)', margin: 0 }}>Guías de kit</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.6, margin: '6px 0 0' }}>
            {guides.length} guías · Edita keywords para mejorar la detección automática en pedidos y emails
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--liora-crema)' }}>
              {['', 'Kit', 'Keywords de detección', 'Activa', 'Acciones'].map(h => (
                <th key={h} style={{ ...cell, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guides.map(g => (
              <tr key={g.id} style={{ opacity: g.is_active ? 1 : 0.45 }}>
                <td style={{ ...cell, width: 16 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                </td>
                <td style={cell}>
                  <div style={{ fontWeight: 700 }}>{g.kit_name}</div>
                  <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{g.slug}</div>
                </td>
                <td style={{ ...cell, maxWidth: 400 }}>
                  {editingId === g.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={editKeywords}
                        onChange={e => setEditKeywords(e.target.value)}
                        placeholder="colag, biotina, natures truth"
                        style={{ flex: 1, border: '1.5px solid var(--liora-uva)', borderRadius: 8, padding: '6px 10px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', outline: 'none' }}
                      />
                      <button onClick={() => saveKeywords(g)} disabled={saving} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                        {saving ? '…' : 'Guardar'}
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: '1.5px solid var(--liora-arena)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {g.matching_keywords.map(kw => (
                        <span key={kw} style={{ background: 'var(--liora-crema)', border: '1px solid var(--liora-arena)', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{kw}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <button
                    onClick={() => toggleActive(g)}
                    style={{
                      width: 40, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer',
                      background: g.is_active ? 'var(--liora-uva)' : 'var(--liora-arena)',
                      position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: g.is_active ? 21 : 3, width: 16, height: 16,
                      borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                    }} />
                  </button>
                </td>
                <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => startEditKeywords(g)}
                    style={{ background: 'transparent', border: '1.5px solid var(--liora-arena)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', marginRight: 6 }}
                  >
                    Editar keywords
                  </button>
                  <Link
                    href={`/guia/${g.slug}`}
                    target="_blank"
                    style={{ fontSize: 12, color: 'var(--liora-uva)', opacity: 0.5, textDecoration: 'none' }}
                  >
                    Ver guía →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
