'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, PencilSimple, FloppyDisk, Trash, Check, UploadSimple, Spinner } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { BENEFIT_ICONS, type KitBenefit } from '@/lib/kit-benefits'

const KIT_COLORS = [
  { label: 'Mostaza',  value: 'var(--cat-mostaza)' },
  { label: 'Coral',    value: 'var(--cat-coral)' },
  { label: 'Lavanda',  value: 'var(--cat-lavanda)' },
  { label: 'Menta',    value: 'var(--cat-menta)' },
  { label: 'Cielo',    value: 'var(--cat-cielo)' },
  { label: 'Durazno',  value: 'var(--cat-durazno)' },
]

const SLUG_COLOR_MAP: Record<string, string> = {
  piel:      'var(--cat-coral)',
  solar:     'var(--cat-mostaza)',
  calma:     'var(--cat-lavanda)',
  descanso:  'var(--cat-lavanda)',
  bienestar: 'var(--cat-lavanda)',
  gym:       'var(--cat-durazno)',
  dolor:     'var(--cat-durazno)',
  viaje:     'var(--cat-cielo)',
  playa:     'var(--cat-cielo)',
  digestivo: 'var(--cat-menta)',
  hogar:     'var(--cat-rosa)',
  auxilios:  'var(--cat-rosa)',
  botiquin:  'var(--cat-rosa)',
  pies:      'var(--cat-mostaza)',
  cuerpo:    'var(--cat-durazno)',
  pantallas: 'var(--cat-lavanda)',
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
  cover_image_url: string | null
  show_in_home: boolean
  home_sort_order: number
  benefits: KitBenefit[]
  kitProducts: AdminKitProduct[]
  totalCents: number
}

interface KitForm {
  name: string
  description: string
  variantIds: string[]
  is_active: boolean
  bg: string
  cover_image_url: string
  show_in_home: boolean
  home_sort_order: number
  benefits: KitBenefit[]
}

const EMPTY_FORM: KitForm = {
  name: '',
  description: '',
  variantIds: [],
  is_active: true,
  bg: 'var(--cat-mostaza)',
  cover_image_url: '',
  show_in_home: false,
  home_sort_order: 0,
  benefits: [],
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
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        cover_image_url: k.cover_image_url ?? '',
        show_in_home: k.show_in_home,
        home_sort_order: k.home_sort_order,
        benefits: k.benefits ?? [],
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

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setUploadError('Solo se aceptan imágenes'); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError('La imagen no puede superar 5 MB'); return }

    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'png'
      // derive slug from form name if creating new, otherwise use existing kit slug
      const slug = editing !== 'new' ? (editing as AdminKitData).slug : form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'kit'
      const path = `kits/${slug}/cover.${ext}`
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) { setUploadError('Error al subir: ' + upErr.message); return }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      set('cover_image_url', publicUrl)
    } finally {
      setUploading(false)
    }
  }

  const toggleVariant = (vid: string) => {
    set('variantIds', form.variantIds.includes(vid)
      ? form.variantIds.filter(x => x !== vid)
      : [...form.variantIds, vid])
  }

  const selectedVariants = form.variantIds.map(vid => allVariants.find(v => v.variantId === vid)).filter(Boolean) as AdminVariantOption[]
  const subtotalCents = selectedVariants.reduce((s, v) => s + v.priceCents, 0)

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    setError(null)
    try {
      const method = isNew ? 'POST' : 'PUT'
      const commonFields = {
        name: form.name,
        description: form.description || undefined,
        is_active: form.is_active,
        variantIds: form.variantIds,
        cover_image_url: (() => { const v = form.cover_image_url.trim(); if (!v) return null; try { new URL(v); return v } catch { return null } })(),
        show_in_home: form.show_in_home,
        home_sort_order: form.home_sort_order,
        benefits: form.benefits.filter(b => b.title.trim()),
      }
      const body = isNew ? commonFields : { id: (editing as AdminKitData).id, ...commonFields }
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

  const canSave = form.name.length > 0

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

          {/* Benefits editor */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Beneficios del kit <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 10 }}>(máx. 3)</span>
              </div>
              {form.benefits.length < 3 && (
                <button
                  onClick={() => set('benefits', [...form.benefits, { icon: 'bienestar', title: '', desc: '' }])}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--liora-crema)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '5px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', cursor: 'pointer' }}
                >
                  <Plus size={12} weight="bold" /> Agregar
                </button>
              )}
            </div>

            {form.benefits.length === 0 && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.45, margin: 0 }}>
                Sin beneficios. Se muestran en el card del kit en la tienda.
              </p>
            )}

            {form.benefits.map((b, i) => (
              <div key={i} style={{ border: '1.5px solid var(--liora-arena)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Icon picker */}
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: 'var(--liora-uva)', marginBottom: 6, opacity: 0.7 }}>Icono</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(BENEFIT_ICONS).map(([key, { icon: IconComp, label }]) => {
                      const selected = b.icon === key
                      return (
                        <button
                          key={key}
                          title={label}
                          onClick={() => {
                            const next = [...form.benefits]
                            next[i] = { ...next[i], icon: key }
                            set('benefits', next)
                          }}
                          style={{
                            width: 36, height: 36, borderRadius: 10,
                            border: selected ? '2px solid var(--liora-uva)' : '1.5px solid var(--liora-arena)',
                            background: selected ? 'var(--liora-uva)' : 'var(--liora-crema)',
                            color: selected ? 'var(--liora-lima)' : 'var(--liora-uva)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          }}
                        >
                          <IconComp size={18} weight="bold" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.7, display: 'block', marginBottom: 4 }}>Título</label>
                    <input
                      value={b.title}
                      onChange={e => { const next = [...form.benefits]; next[i] = { ...next[i], title: e.target.value }; set('benefits', next) }}
                      placeholder="Más energía"
                      style={{ width: '100%', padding: '8px 11px', border: '1.5px solid var(--liora-arena)', borderRadius: 10, background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.7, display: 'block', marginBottom: 4 }}>Descripción</label>
                    <input
                      value={b.desc}
                      onChange={e => { const next = [...form.benefits]; next[i] = { ...next[i], desc: e.target.value }; set('benefits', next) }}
                      placeholder="Breve descripción…"
                      style={{ width: '100%', padding: '8px 11px', border: '1.5px solid var(--liora-arena)', borderRadius: 10, background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => set('benefits', form.benefits.filter((_, j) => j !== i))}
                  style={{ alignSelf: 'flex-end', background: 'transparent', border: 'none', color: 'var(--liora-uva)', opacity: 0.4, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}
                >
                  <X size={12} weight="bold" /> Quitar
                </button>
              </div>
            ))}
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
            {form.variantIds.length === 0 && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.55, margin: '8px 0 0', textAlign: 'center' }}>
                Sin productos asignados — el kit no se mostrará en tienda hasta agregar al menos uno.
              </p>
            )}
          </div>

          {/* Image upload */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Imagen del kit</div>

            {/* Drop zone / upload button */}
            <div
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--liora-uva)' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--liora-arena)' }}
              onDrop={e => {
                e.preventDefault()
                e.currentTarget.style.borderColor = 'var(--liora-arena)'
                const file = e.dataTransfer.files[0]
                if (file) handleImageUpload(file)
              }}
              style={{ border: '2px dashed var(--liora-arena)', borderRadius: 14, padding: '18px 14px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }}
              />
              {uploading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.7 }}>
                  <Spinner size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Subiendo…
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <UploadSimple size={24} style={{ color: 'var(--liora-uva)', opacity: 0.4 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.6 }}>
                    Arrastra aquí o <strong style={{ opacity: 1 }}>haz clic para subir</strong>
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.4 }}>PNG recomendado · máx. 5 MB</span>
                </div>
              )}
            </div>

            {uploadError && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--cat-coral)' }}>{uploadError}</span>
            )}

            {/* URL fallback */}
            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', display: 'block', marginBottom: 6 }}>
                O pega una URL directamente
              </label>
              <input
                value={form.cover_image_url}
                onChange={e => set('cover_image_url', e.target.value)}
                placeholder="https://...supabase.co/storage/v1/object/public/..."
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--liora-arena)', borderRadius: 12, background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Preview */}
            {form.cover_image_url && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.cover_image_url}
                  alt="preview"
                  style={{ height: 88, width: 88, objectFit: 'contain', background: form.bg, borderRadius: 14, border: '1.5px solid var(--liora-arena)' }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, display: 'block', marginBottom: 6 }}>Vista previa sobre el color del kit</span>
                  <button
                    onClick={() => { set('cover_image_url', ''); setUploadError(null) }}
                    style={{ background: 'transparent', border: '1.5px solid var(--cat-coral)', color: 'var(--cat-coral)', borderRadius: 999, padding: '4px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}
                  >
                    Quitar imagen
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Show in home */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Home</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)' }}>Mostrar en página principal</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.55, marginTop: 2 }}>Aparece en la sección "Kits más pedidos" del home</div>
              </div>
              <button
                onClick={() => set('show_in_home', !form.show_in_home)}
                style={{ width: 48, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: form.show_in_home ? 'var(--liora-uva)' : 'var(--liora-arena)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 4, left: form.show_in_home ? 25 : 4, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
            {form.show_in_home && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', display: 'block', marginBottom: 6 }}>Orden en el home <span style={{ opacity: 0.5 }}>(1 = primero)</span></label>
                <input type="number" min={1} value={form.home_sort_order} onChange={e => set('home_sort_order', Number(e.target.value))}
                  style={{ width: 80, padding: '8px 12px', border: '1.5px solid var(--liora-arena)', borderRadius: 10, background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', outline: 'none' }} />
              </div>
            )}
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

function KitCard({ kit, onEdit, onToggleHome }: { kit: AdminKitData; onEdit: () => void; onToggleHome: () => void }) {
  const bg = inferKitColor(kit.slug)
  return (
    <article
      onClick={onEdit}
      style={{ background: bg, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1.5px solid rgba(61,26,58,0.08)', cursor: 'pointer', transition: 'transform 200ms ease' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ background: kit.is_active ? 'rgba(255,255,255,0.5)' : 'var(--liora-uva)', color: kit.is_active ? 'var(--liora-uva)' : 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {kit.is_active ? 'Activo' : 'Borrador'}
          </span>
          {kit.show_in_home && (
            <span style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              🏠 Home
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.7 }}>
            {kit.kitProducts.length} productos
          </span>
          <button
            onClick={e => { e.stopPropagation(); onToggleHome() }}
            title={kit.show_in_home ? 'Quitar del home' : 'Mostrar en home'}
            style={{ width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', background: kit.show_in_home ? 'var(--liora-uva)' : 'rgba(255,255,255,0.4)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
          >
            <span style={{ position: 'absolute', top: 3, left: kit.show_in_home ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          KIT-{kit.slug.toUpperCase()}
        </div>
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
  const [kits, setKits] = useState(initialKits)
  const [editing, setEditing] = useState<'new' | AdminKitData | null>(null)

  useEffect(() => {
    setKits(initialKits)
  }, [initialKits])

  const handleSaved = () => { router.refresh() }

  const toggleHome = async (kit: AdminKitData) => {
    const next = !kit.show_in_home
    setKits(prev => prev.map(k => k.id === kit.id ? { ...k, show_in_home: next } : k))
    await fetch('/api/admin/kits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: kit.id, show_in_home: next }),
    })
  }

  const activeCount = kits.filter(k => k.is_active).length
  const homeCount = kits.filter(k => k.show_in_home).length

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Catálogo</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Kits</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
            {kits.length} kits · {activeCount} activos · <strong>{homeCount}</strong> en el home
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
        {kits.map(k => (
          <KitCard key={k.id} kit={k} onEdit={() => setEditing(k)} onToggleHome={() => toggleHome(k)} />
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
