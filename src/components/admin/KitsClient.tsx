'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, PencilSimple, FloppyDisk, Trash, Check, Package } from '@phosphor-icons/react'

const KIT_COLORS = [
  { label: 'Mostaza',  value: 'var(--cat-mostaza)' },
  { label: 'Coral',    value: 'var(--cat-coral)' },
  { label: 'Lavanda',  value: 'var(--cat-lavanda)' },
  { label: 'Menta',    value: 'var(--cat-menta)' },
  { label: 'Cielo',    value: 'var(--cat-cielo)' },
  { label: 'Durazno',  value: 'var(--cat-durazno)' },
]

const SLUG_COLOR_MAP: Record<string, string> = {
  energia:      'var(--cat-mostaza)',
  piel:         'var(--cat-coral)',
  'post-entreno': 'var(--cat-durazno)',
  gym:          'var(--cat-durazno)',
  reset:        'var(--cat-menta)',
  detox:        'var(--cat-menta)',
}

function inferKitColor(slug: string) {
  for (const [key, color] of Object.entries(SLUG_COLOR_MAP)) {
    if (slug.includes(key)) return color
  }
  return 'var(--cat-lavanda)'
}

export interface AdminVariantOption {
  variantId: string
  variantName: string
  productId: string
  productName: string
  priceCents: number
  categoryName: string | null
}

export interface AdminKitProduct {
  variantId: string
  variantName: string
  productName: string
  priceCents: number
}

export interface AdminKitData {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  type: string
  kitProducts: AdminKitProduct[]
  totalCents: number
}

interface KitForm {
  name: string
  description: string
  variantIds: string[]
  is_active: boolean
  bg: string
}

const EMPTY_FORM: KitForm = {
  name: '',
  description: '',
  variantIds: [],
  is_active: true,
  bg: 'var(--cat-mostaza)',
}

function KitDrawer({
  editing,
  onClose,
  allVariants,
  onSaved,
}: {
  editing: 'new' | AdminKitData | null
  onClose: () => void
  allVariants: AdminVariantOption[]
  onSaved: () => void
}) {
  const isNew = editing === 'new'
  const [form, setForm] = useState<KitForm>(EMPTY_FORM)
  const [variantSearch, setVariantSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) return
    if (isNew) {
      setForm(EMPTY_FORM)
    } else {
      const k = editing as AdminKitData
      setForm({
        name: k.name,
        description: k.description ?? '',
        variantIds: k.kitProducts.map(kp => kp.variantId),
        is_active: k.is_active,
        bg: inferKitColor(k.slug),
      })
    }
    setVariantSearch('')
    setError(null)
  }, [editing, isNew])

  // useMemo must be called before any early return (Rules of Hooks)
  const filteredVariants = useMemo(() => {
    if (!variantSearch) return allVariants
    const q = variantSearch.toLowerCase()
    return allVariants.filter(v =>
      v.productName.toLowerCase().includes(q) ||
      v.variantName.toLowerCase().includes(q) ||
      (v.categoryName ?? '').toLowerCase().includes(q)
    )
  }, [allVariants, variantSearch])

  if (!editing) return null

  const set = <K extends keyof KitForm>(k: K, v: KitForm[K]) => setForm(prev => ({ ...prev, [k]: v }))

  const toggleVariant = (vid: string) => {
    set('variantIds', form.variantIds.includes(vid)
      ? form.variantIds.filter(x => x !== vid)
      : [...form.variantIds, vid])
  }

  const selectedVariants = form.variantIds.map(vid => allVariants.find(v => v.variantId === vid)).filter(Boolean) as AdminVariantOption[]
  const subtotalCents = selectedVariants.reduce((s, v) => s + v.priceCents, 0)

  const handleSave = async () => {
    if (!form.name || form.variantIds.length < 1) return
    setSaving(true)
    setError(null)
    try {
      const method = isNew ? 'POST' : 'PUT'
      const body = isNew
        ? { name: form.name, description: form.description || undefined, is_active: form.is_active, variantIds: form.variantIds }
        : { id: (editing as AdminKitData).id, name: form.name, description: form.description || undefined, is_active: form.is_active, variantIds: form.variantIds }
      const res = await fetch('/api/admin/kits', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { setError('Error al guardar el kit'); return }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isNew || !confirm('¿Eliminar este kit?')) return
    setDeleting(true)
    try {
      const id = (editing as AdminKitData).id
      await fetch(`/api/admin/kits?id=${id}`, { method: 'DELETE' })
      onSaved()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const canSave = form.name.length > 0 && form.variantIds.length >= 1

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(61,26,58,0.35)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 680, background: 'var(--liora-crema)', zIndex: 51, overflowY: 'auto', boxShadow: '-8px 0 40px rgba(61,26,58,0.18)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--liora-arena)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              {isNew ? 'Nuevo kit' : 'Editar kit'}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--liora-uva)', lineHeight: 1.1 }}>
              {form.name || 'Sin nombre'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.6, padding: 8 }}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Preview card */}
          <article style={{ background: form.bg, borderRadius: 22, padding: 22, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ background: form.is_active ? 'rgba(255,255,255,0.5)' : 'var(--liora-uva)', color: form.is_active ? 'var(--liora-uva)' : 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {form.is_active ? 'Activo' : 'Borrador'}
              </span>
              <span style={{ background: 'var(--liora-uva)', color: 'var(--liora-lima)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, padding: '4px 11px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {form.variantIds.length} {form.variantIds.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--liora-uva)', margin: '0 0 6px', lineHeight: 1.05, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              {form.name || 'Nombre del kit'}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.4, color: 'var(--liora-uva)', opacity: 0.85, margin: '0 0 12px' }}>
              {form.description || 'Descripción corta del kit.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {selectedVariants.map(v => (
                <span key={v.variantId} style={{ background: 'rgba(251,241,226,0.85)', border: '1px solid rgba(61,26,58,0.08)', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, padding: '4px 9px', borderRadius: 999 }}>
                  {v.productName}
                </span>
              ))}
            </div>
            <div style={{ paddingTop: 12, borderTop: '1.5px solid rgba(61,26,58,0.15)', display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>
                S/{Math.round(subtotalCents / 100)}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.55 }}>precio total del bundle</span>
            </div>
          </article>

          {/* Name + Description */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Información básica</div>
            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', display: 'block', marginBottom: 6 }}>Nombre del kit <span style={{ color: 'var(--cat-coral)' }}>*</span></label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ej. Kit Energía Matutina"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--liora-arena)', borderRadius: 12, background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', display: 'block', marginBottom: 6 }}>Descripción corta</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2}
                placeholder="Para mañanas que cuestan arrancar."
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--liora-arena)', borderRadius: 12, background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Product picker */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Productos del kit</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.6 }}>{form.variantIds.length} seleccionados</div>
            </div>
            <input
              value={variantSearch}
              onChange={e => setVariantSearch(e.target.value)}
              placeholder="Filtrar por nombre o categoría…"
              style={{ width: '100%', padding: '9px 14px', border: '1.5px solid var(--liora-arena)', borderRadius: 999, background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
            />
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1.5px solid var(--liora-arena)', borderRadius: 12 }}>
              {filteredVariants.map((v, i) => {
                const selected = form.variantIds.includes(v.variantId)
                return (
                  <div
                    key={v.variantId}
                    onClick={() => toggleVariant(v.variantId)}
                    style={{
                      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12,
                      alignItems: 'center', padding: '10px 14px', cursor: 'pointer',
                      borderBottom: i < filteredVariants.length - 1 ? '1.5px solid var(--liora-arena)' : 'none',
                      background: selected ? 'var(--liora-crema)' : 'var(--liora-blanco)',
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#faf7f5' }}
                    onMouseLeave={e => { e.currentTarget.style.background = selected ? 'var(--liora-crema)' : 'var(--liora-blanco)' }}
                  >
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: selected ? 'var(--liora-uva)' : 'transparent', border: '1.5px solid ' + (selected ? 'var(--liora-uva)' : 'var(--liora-arena)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-lima)', fontSize: 12 }}>
                      {selected && <Check size={12} weight="bold" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.productName}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55 }}>{v.variantName}{v.categoryName ? ` · ${v.categoryName}` : ''}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>
                      S/{Math.round(v.priceCents / 100)}
                    </div>
                  </div>
                )
              })}
              {filteredVariants.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.55 }}>Sin resultados</div>
              )}
            </div>
          </div>

          {/* Color picker */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Color de la tarjeta</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {KIT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => set('bg', c.value)}
                  title={c.label}
                  style={{
                    width: 38, height: 38, borderRadius: 12, background: c.value,
                    border: form.bg === c.value ? '3px solid var(--liora-uva)' : '2px solid rgba(61,26,58,0.1)',
                    cursor: 'pointer', boxShadow: form.bg === c.value ? '0 0 0 2px var(--liora-lima)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Status toggle */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Publicación</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: true,  label: 'Activo en tienda' },
                { id: false, label: 'Borrador' },
              ].map(s => {
                const active = form.is_active === s.id
                return (
                  <button
                    key={String(s.id)}
                    onClick={() => set('is_active', s.id)}
                    style={{ flex: 1, background: active ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: active ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (active ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 14, padding: '12px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--cat-coral)', textAlign: 'center' }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1.5px solid var(--liora-arena)', display: 'flex', gap: 8, flexShrink: 0 }}>
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ background: 'transparent', color: 'var(--cat-coral)', border: '1.5px solid var(--cat-coral)', borderRadius: 999, padding: '10px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: deleting ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 'auto', opacity: deleting ? 0.7 : 1 }}
            >
              <Trash size={13} weight="bold" /> Eliminar
            </button>
          )}
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            style={{ background: canSave ? 'var(--liora-uva)' : 'var(--liora-arena)', color: canSave ? 'var(--liora-crema)' : 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: !canSave || saving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}
          >
            <FloppyDisk size={14} weight="bold" /> {isNew ? 'Crear kit' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  )
}

function KitCard({ kit, onEdit }: { kit: AdminKitData; onEdit: () => void }) {
  const bg = inferKitColor(kit.slug)
  return (
    <article
      onClick={onEdit}
      style={{ background: bg, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid rgba(61,26,58,0.08)', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span style={{ background: kit.is_active ? 'rgba(255,255,255,0.5)' : 'var(--liora-uva)', color: kit.is_active ? 'var(--liora-uva)' : 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {kit.is_active ? 'Activo' : 'Borrador'}
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.7 }}>
          {kit.kitProducts.length} productos
        </span>
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--liora-uva)', margin: '0 0 6px', lineHeight: 1.05, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>{kit.name}</h3>
        {kit.description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.4, color: 'var(--liora-uva)', opacity: 0.85, margin: 0 }}>{kit.description}</p>
        )}
      </div>

      <div style={{ padding: '8px 20px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {kit.kitProducts.slice(0, 5).map(kp => (
          <span key={kp.variantId} style={{ background: 'rgba(251,241,226,0.85)', border: '1px solid rgba(61,26,58,0.08)', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, padding: '4px 9px', borderRadius: 999 }}>
            {kp.productName}
          </span>
        ))}
        {kit.kitProducts.length > 5 && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.5, alignSelf: 'center' }}>+{kit.kitProducts.length - 5} más</span>
        )}
      </div>

      <div style={{ marginTop: 'auto', padding: '14px 20px', background: 'rgba(255,255,255,0.35)', borderTop: '1.5px solid rgba(61,26,58,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>
          S/{Math.round(kit.totalCents / 100)}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onEdit() }}
          style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <PencilSimple size={12} weight="bold" /> Editar
        </button>
      </div>
    </article>
  )
}

export function KitsClient({
  kits: initialKits,
  allVariants,
}: {
  kits: AdminKitData[]
  allVariants: AdminVariantOption[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<'new' | AdminKitData | null>(null)

  const handleSaved = () => {
    router.refresh()
  }

  const activeCount = initialKits.filter(k => k.is_active).length

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Catálogo</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Kits</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
            {initialKits.length} kits configurados · {activeCount} activos en tienda
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '11px 20px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={15} weight="bold" /> Crear kit
        </button>
      </div>

      {/* Kit cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {initialKits.map(k => (
          <KitCard key={k.id} kit={k} onEdit={() => setEditing(k)} />
        ))}

        {/* Ghost "create" card */}
        <button
          onClick={() => setEditing('new')}
          style={{ background: 'transparent', cursor: 'pointer', border: '2px dashed var(--liora-arena)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 260, color: 'var(--liora-uva)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--liora-uva)'; e.currentTarget.style.background = 'var(--liora-blanco)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--liora-arena)'; e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--liora-lima)', color: 'var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={24} weight="bold" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--liora-uva)', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Crear nuevo kit</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65, textAlign: 'center', maxWidth: 240 }}>
            Arma un bundle de 2 o más productos con descuento incluido.
          </div>
        </button>
      </div>

      <KitDrawer editing={editing} onClose={() => setEditing(null)} allVariants={allVariants} onSaved={handleSaved} />
    </div>
  )
}
