'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, X, FloppyDisk, Trash, Package, UploadSimple, ArrowSquareOut, Tag } from '@phosphor-icons/react'
import type { AdminTag } from './TagsClient'
import { generateSkuBase } from '@/lib/utils/generate-sku'

const CAT_COLORS: Record<string, string> = {
  piel:          'var(--cat-coral)',
  solar:         'var(--cat-mostaza)',
  bienestar:     'var(--cat-lavanda)',
  gym:           'var(--cat-durazno)',
  viaje:         'var(--cat-cielo)',
  hogar:         'var(--cat-rosa)',
  digestivo:     'var(--cat-menta)',
  'pies-cuerpo': 'var(--cat-durazno)',
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
}

export interface AdminProductData {
  id: string
  name: string
  slug: string
  description: string | null
  brand: string | null
  category_id: string | null
  cover_image_url: string | null
  is_active: boolean
  stock_quantity: number | null
  usage_instructions: string | null
  indications: string | null
  contraindications: string | null
  gallery_urls: string[]
  category: { name: string; slug: string } | null
  variant_id: string | null
  variant_name: string | null
  sku: string | null
  price_cents: number | null
  compare_at_cents: number | null
  tag_ids: string[]
}

interface ProductForm {
  name: string
  description: string
  brand: string
  category_id: string
  cover_image_url: string
  is_active: boolean
  stock_quantity: number | null
  variant_name: string
  sku: string
  price: string
  compare_at: string
  tag_ids: string[]
  usage_instructions: string
  indications: string
  contraindications: string
  gallery_urls: string[]
}

const EMPTY_FORM: ProductForm = {
  name: '', description: '', brand: '', category_id: '',
  cover_image_url: '', is_active: true, stock_quantity: null,
  variant_name: '', sku: '', price: '', compare_at: '', tag_ids: [],
  usage_instructions: '', indications: '', contraindications: '', gallery_urls: [],
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: 'var(--cat-coral)' }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid var(--liora-arena)', borderRadius: 12,
  background: 'var(--liora-crema)', fontFamily: 'var(--font-body)',
  fontSize: 13, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>{title}</div>
      {children}
    </div>
  )
}

function ProductDrawer({
  editing,
  onClose,
  categories,
  tags,
  onSaved,
}: {
  editing: 'new' | AdminProductData | null
  onClose: () => void
  categories: AdminCategory[]
  tags: AdminTag[]
  onSaved: () => void
}) {
  const isNew = editing === 'new'
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) return
    if (isNew) {
      setForm(EMPTY_FORM)
    } else {
      const p = editing as AdminProductData
      setForm({
        name: p.name,
        description: p.description ?? '',
        brand: p.brand ?? '',
        category_id: p.category_id ?? '',
        cover_image_url: p.cover_image_url ?? '',
        is_active: p.is_active,
        stock_quantity: p.stock_quantity ?? null,
        variant_name: p.variant_name ?? '',
        sku: p.sku ?? '',
        price: p.price_cents ? String(Math.round(p.price_cents / 100)) : '',
        compare_at: p.compare_at_cents ? String(Math.round(p.compare_at_cents / 100)) : '',
        tag_ids: p.tag_ids ?? [],
        usage_instructions: p.usage_instructions ?? '',
        indications: p.indications ?? '',
        contraindications: p.contraindications ?? '',
        gallery_urls: p.gallery_urls ?? [],
      })
    }
    setError(null)
  }, [editing, isNew])

  const catSlug = categories.find(c => c.id === form.category_id)?.slug ?? ''
  const previewBg = CAT_COLORS[catSlug] ?? 'var(--cat-lavanda)'
  const previewSku = useMemo(() => {
    if (form.sku || !form.name || !form.variant_name) return null
    return generateSkuBase(catSlug || null, form.name, form.variant_name)
  }, [form.sku, form.name, form.variant_name, catSlug])
  const priceSoles = Number(form.price) || 0
  const compareAtSoles = Number(form.compare_at) || 0

  if (!editing) return null

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setForm(prev => ({ ...prev, [k]: v }))

  const addGallery = () => setForm(prev => ({ ...prev, gallery_urls: [...prev.gallery_urls, ''] }))
  const setGallery = (i: number, val: string) => setForm(prev => ({ ...prev, gallery_urls: prev.gallery_urls.map((u, idx) => idx === i ? val : u) }))
  const removeGallery = (i: number) => setForm(prev => ({ ...prev, gallery_urls: prev.gallery_urls.filter((_, idx) => idx !== i) }))

  const canSave = form.name.length > 0 && form.variant_name.length > 0 && form.price.length > 0 && Number(form.price) > 0

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const priceCents = Math.round(Number(form.price) * 100)
      const compareAtCents = form.compare_at ? Math.round(Number(form.compare_at) * 100) : null

      if (isNew) {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description || undefined,
            brand: form.brand || undefined,
            category_id: form.category_id || null,
            cover_image_url: form.cover_image_url || null,
            is_active: form.is_active,
            stock_quantity: form.stock_quantity,
            variant_name: form.variant_name,
            sku: form.sku || undefined,
            price_cents: priceCents,
            compare_at_cents: compareAtCents,
            usage_instructions: form.usage_instructions || undefined,
            indications: form.indications || undefined,
            contraindications: form.contraindications || undefined,
            gallery_urls: form.gallery_urls.filter(Boolean),
          }),
        })
        if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error al guardar'); return }
      } else {
        const p = editing as AdminProductData
        const res = await fetch(`/api/admin/products/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description || undefined,
            brand: form.brand || undefined,
            category_id: form.category_id || null,
            cover_image_url: form.cover_image_url || null,
            is_active: form.is_active,
            stock_quantity: form.stock_quantity,
            variant_id: p.variant_id,
            variant_name: form.variant_name,
            sku: form.sku || undefined,
            price_cents: priceCents,
            compare_at_cents: compareAtCents,
            tag_ids: form.tag_ids,
            usage_instructions: form.usage_instructions || undefined,
            indications: form.indications || undefined,
            contraindications: form.contraindications || undefined,
            gallery_urls: form.gallery_urls.filter(Boolean),
          }),
        })
        if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error al guardar'); return }
      }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isNew) return
    if (!confirm(`¿Desactivar "${form.name}"? El producto no se eliminará, solo se ocultará de la tienda.`)) return
    setDeleting(true)
    try {
      const p = editing as AdminProductData
      await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' })
      onSaved()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(61,26,58,0.35)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 680, background: 'var(--liora-crema)', zIndex: 51, boxShadow: '-8px 0 40px rgba(61,26,58,0.18)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--liora-arena)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              {isNew ? 'Nuevo producto' : 'Editar producto'}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--liora-uva)', lineHeight: 1.1 }}>
              {form.name || 'Sin nombre'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isNew && (
              <Link href={`/tienda/${(editing as AdminProductData).slug}`} target="_blank" style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '7px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <ArrowSquareOut size={12} weight="bold" /> Ver en tienda
              </Link>
            )}
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.6, padding: 8 }}>
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Preview card */}
          <div style={{ background: previewBg, borderRadius: 20, overflow: 'hidden', display: 'grid', gridTemplateColumns: '120px 1fr' }}>
            <div style={{ aspectRatio: '1/1', background: previewBg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {form.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <Package size={40} weight="bold" color="var(--liora-uva)" style={{ opacity: 0.4 }} />
              )}
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {categories.find(c => c.id === form.category_id)?.name ?? 'Sin categoría'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--liora-uva)', lineHeight: 1.1 }}>{form.name || 'Nombre del producto'}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.65 }}>{form.variant_name || 'Presentación'}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--liora-uva)' }}>S/{priceSoles || '—'}</span>
                {compareAtSoles > 0 && <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.5, textDecoration: 'line-through' }}>S/{compareAtSoles}</span>}
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={{ background: form.is_active ? 'rgba(255,255,255,0.5)' : 'rgba(61,26,58,0.15)', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {form.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <Section title="Información del producto">
            <Field label="Nombre" required>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Granola Andina Bowl" style={inputStyle} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Marca">
                <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Ej. NutriAndina" style={inputStyle} />
              </Field>
              <Field label="Categoría">
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Descripción">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Descripción del producto para la ficha de tienda…" style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <Field label="URL de imagen de portada" hint="Pega la URL de Supabase Storage o cualquier imagen pública">
              <input value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} placeholder="https://…" style={inputStyle} />
            </Field>
            <Field label="Galería de imágenes" hint="URLs adicionales (máx 4). Aparecen como miniaturas en la ficha del producto.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.gallery_urls.map((url, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input value={url} onChange={e => setGallery(i, e.target.value)} placeholder="https://…" style={{ ...inputStyle, flex: 1 }} />
                    <button type="button" onClick={() => removeGallery(i)} style={{ background: 'transparent', border: '1.5px solid var(--liora-arena)', borderRadius: 10, padding: '0 10px', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.6, fontFamily: 'var(--font-body)', fontSize: 14 }}>✕</button>
                  </div>
                ))}
                {form.gallery_urls.length < 4 && (
                  <button type="button" onClick={addGallery} style={{ background: 'transparent', border: '1.5px dashed var(--liora-arena)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', opacity: 0.7, textAlign: 'left' }}>
                    + Agregar imagen
                  </button>
                )}
              </div>
            </Field>
          </Section>

          {/* Uso y contraindicaciones */}
          <Section title="Uso y contraindicaciones">
            <Field label="Indicado para" hint="¿Para quién es este producto? Ej: Personas con piel grasa, mayores de 12 años">
              <textarea value={form.indications} onChange={e => set('indications', e.target.value)} rows={2} placeholder="Ej. Adultos que buscan mejorar su hidratación diaria…" style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <Field label="Modo de uso" hint="Cómo y cuándo tomarlo o aplicarlo">
              <textarea value={form.usage_instructions} onChange={e => set('usage_instructions', e.target.value)} rows={3} placeholder="Ej. Tomar 1 cápsula en el desayuno con agua. No exceder la dosis recomendada…" style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <Field label="Contraindicaciones" hint="Quién NO debe usarlo. Ej: Embarazadas, menores de 12 años, personas con hipertensión">
              <textarea value={form.contraindications} onChange={e => set('contraindications', e.target.value)} rows={2} placeholder="Ej. No recomendado para embarazadas ni durante la lactancia…" style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
          </Section>

          {/* Tags */}
          {tags.length > 0 && (
            <Section title="Tags de recomendación">
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, marginBottom: 4 }}>
                Conecta este producto con las respuestas del cuestionario. Selecciona todos los que apliquen.
              </div>
              {(['objetivo', 'uso', 'nivel', 'intensidad', 'piel', 'preferencia', 'momento'] as const).map(group => {
                const groupTags = tags.filter(t => t.group === group && !t.is_internal)
                if (!groupTags.length) return null
                const groupLabel: Record<string, string> = {
                  objetivo: 'Objetivo', uso: 'Categoría de uso', nivel: 'Nivel',
                  intensidad: 'Intensidad', piel: 'Tipo de piel',
                  preferencia: 'Preferencias', momento: 'Momento de uso',
                }
                return (
                  <div key={group}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>{groupLabel[group]}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {groupTags.map(tag => {
                        const selected = form.tag_ids.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => set('tag_ids', selected ? form.tag_ids.filter(id => id !== tag.id) : [...form.tag_ids, tag.id])}
                            style={{
                              background: selected ? 'var(--liora-uva)' : 'var(--liora-blanco)',
                              color: selected ? 'var(--liora-crema)' : 'var(--liora-uva)',
                              border: `1.5px solid ${selected ? 'var(--liora-uva)' : 'var(--liora-arena)'}`,
                              borderRadius: 999, padding: '5px 12px',
                              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11,
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                              transition: 'all 120ms',
                            }}
                          >
                            {selected && <Tag size={10} weight="bold" />}
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {/* Alertas internas — para contexto de la IA */}
              {(() => {
                const alertTags = tags.filter(t => t.group === 'alerta')
                if (!alertTags.length) return null
                return (
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--cat-coral)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Alertas internas (solo IA)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {alertTags.map(tag => {
                        const selected = form.tag_ids.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => set('tag_ids', selected ? form.tag_ids.filter(id => id !== tag.id) : [...form.tag_ids, tag.id])}
                            style={{
                              background: selected ? 'var(--cat-coral)' : 'var(--liora-blanco)',
                              color: selected ? 'var(--liora-blanco)' : 'var(--liora-uva)',
                              border: `1.5px solid ${selected ? 'var(--cat-coral)' : 'var(--liora-arena)'}`,
                              borderRadius: 999, padding: '5px 12px',
                              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11,
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                              transition: 'all 120ms',
                            }}
                          >
                            {selected && <Tag size={10} weight="bold" />}
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
              {form.tag_ids.length > 0 && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55 }}>
                  {form.tag_ids.length} tag{form.tag_ids.length !== 1 ? 's' : ''} seleccionado{form.tag_ids.length !== 1 ? 's' : ''}
                </div>
              )}
            </Section>
          )}

          {/* Variant + pricing */}
          <Section title="Presentación y precio">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Presentación / tamaño" required hint="Ej. 500g · 30 cápsulas · 1kg Vainilla">
                <input value={form.variant_name} onChange={e => set('variant_name', e.target.value)} placeholder="500g" style={inputStyle} />
              </Field>
              <Field label="SKU">
                <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Ej. GRA-AND-500 (se genera automáticamente)" style={inputStyle} />
                {previewSku && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.5, marginTop: 4 }}>
                    Se creará: <code style={{ fontWeight: 700, opacity: 0.8 }}>{previewSku}</code>
                  </div>
                )}
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Precio de venta (S/)" required>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', opacity: 0.5 }}>S/</span>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 34 }} />
                </div>
              </Field>
              <Field label="Precio tachado (S/)" hint="Opcional — precio anterior">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', opacity: 0.5 }}>S/</span>
                  <input type="number" min="0" step="0.01" value={form.compare_at} onChange={e => set('compare_at', e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 34 }} />
                </div>
              </Field>
            </div>
          </Section>

          {/* Stock + status */}
          <Section title="Stock y estado">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', marginBottom: 6 }}>Stock</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: form.stock_quantity !== null ? 8 : 0 }}>
                  {[{ v: null, l: '∞ Ilimitado' }, { v: 0, l: 'Cantidad exacta' }].map(s => (
                    <button key={String(s.v)} onClick={() => set('stock_quantity', s.v)} style={{ flex: 1, background: (form.stock_quantity === null) === (s.v === null) ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: (form.stock_quantity === null) === (s.v === null) ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + ((form.stock_quantity === null) === (s.v === null) ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 12, padding: '10px 0', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                      {s.l}
                    </button>
                  ))}
                </div>
                {form.stock_quantity !== null && (
                  <input type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', Number(e.target.value))} placeholder="0" style={inputStyle} />
                )}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', marginBottom: 6 }}>Visibilidad en tienda</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ v: true, l: 'Activo' }, { v: false, l: 'Inactivo' }].map(s => (
                    <button key={String(s.v)} onClick={() => set('is_active', s.v)} style={{ flex: 1, background: form.is_active === s.v ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: form.is_active === s.v ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (form.is_active === s.v ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 12, padding: '10px 0', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {form.stock_quantity === 0 && (
              <div style={{ background: 'var(--cat-coral)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)' }}>
                Stock en 0 — el producto aparecerá como "Agotado" en la tienda.
              </div>
            )}
          </Section>

          {error && <div style={{ background: 'var(--cat-coral)', borderRadius: 12, padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', fontWeight: 600 }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1.5px solid var(--liora-arena)', display: 'flex', gap: 8, flexShrink: 0 }}>
          {!isNew && (
            <button onClick={handleDelete} disabled={deleting} style={{ background: 'transparent', color: 'var(--cat-coral)', border: '1.5px solid var(--cat-coral)', borderRadius: 999, padding: '10px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: deleting ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 'auto', opacity: deleting ? 0.7 : 1 }}>
              <Trash size={13} weight="bold" /> Desactivar
            </button>
          )}
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !canSave} style={{ background: canSave ? 'var(--liora-uva)' : 'var(--liora-arena)', color: canSave ? 'var(--liora-crema)' : 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '10px 22px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: !canSave || saving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
            <FloppyDisk size={14} weight="bold" /> {isNew ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  )
}

export function ProductsClient({
  products: initialProducts,
  categories,
  tags,
}: {
  products: AdminProductData[]
  categories: AdminCategory[]
  tags: AdminTag[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<'new' | AdminProductData | null>(null)
  const [search, setSearch] = useState('')

  const filtered = search
    ? initialProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.category?.name ?? '').toLowerCase().includes(search.toLowerCase()))
    : initialProducts

  const activeCount = initialProducts.filter(p => p.is_active).length
  const outCount = initialProducts.filter(p => p.stock_quantity !== null && p.stock_quantity === 0 && p.is_active).length
  const lowCount = initialProducts.filter(p => p.stock_quantity !== null && p.stock_quantity > 0 && p.stock_quantity < 10 && p.is_active).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Catálogo</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Productos</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
            {initialProducts.length} productos · {activeCount} activos
            {outCount > 0 && ` · ${outCount} agotados`}
            {lowCount > 0 && ` · ${lowCount} stock bajo`}
          </p>
        </div>
        <button onClick={() => setEditing('new')} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '11px 20px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Plus size={15} weight="bold" /> Nuevo producto
        </button>
      </div>

      {/* Stock alerts */}
      {outCount > 0 && (
        <div style={{ background: 'var(--cat-coral)', borderRadius: 14, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', fontWeight: 600 }}>
          <Package size={18} weight="bold" />
          {outCount} {outCount === 1 ? 'producto agotado' : 'productos agotados'}: {initialProducts.filter(p => p.stock_quantity !== null && p.stock_quantity === 0 && p.is_active).slice(0, 3).map(p => p.name).join(', ')}{outCount > 3 ? '…' : ''}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o categoría…" style={{ width: '100%', padding: '11px 16px', border: '1.5px solid var(--liora-arena)', borderRadius: 999, background: 'var(--liora-blanco)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {/* Add new card */}
        <button onClick={() => setEditing('new')} style={{ background: 'transparent', cursor: 'pointer', border: '2px dashed var(--liora-arena)', borderRadius: 18, minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--liora-uva)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--liora-uva)'; e.currentTarget.style.background = 'var(--liora-blanco)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--liora-arena)'; e.currentTarget.style.background = 'transparent' }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--liora-lima)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={22} weight="bold" color="var(--liora-uva)" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--liora-uva)', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Nuevo producto</div>
        </button>

        {filtered.map(p => {
          const catSlug = p.category?.slug ?? ''
          const bg = CAT_COLORS[catSlug] ?? 'var(--cat-lavanda)'
          const out = p.stock_quantity !== null && p.stock_quantity === 0
          const low = p.stock_quantity !== null && p.stock_quantity > 0 && p.stock_quantity < 10

          return (
            <article
              key={p.id}
              onClick={() => setEditing(p)}
              style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, overflow: 'hidden', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--liora-uva)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--liora-arena)')}
            >
              {/* Image */}
              <div style={{ aspectRatio: '1/1', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {p.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package size={52} weight="bold" color="var(--liora-uva)" style={{ opacity: 0.35 }} />
                )}
                {!p.is_active && (
                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--liora-uva)', color: 'var(--liora-lima)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inactivo</span>
                )}
                {out && p.is_active && (
                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--cat-coral)', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Agotado</span>
                )}
                {low && p.is_active && (
                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--cat-mostaza)', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stock bajo</span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: 14 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: 'var(--liora-uva)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{p.category?.name ?? '—'}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', lineHeight: 1.15, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, marginTop: 2 }}>{p.variant_name ?? '—'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', fontVariantNumeric: 'tabular-nums' }}>
                      {p.price_cents ? `S/${Math.round(p.price_cents / 100)}` : '—'}
                    </span>
                    {p.compare_at_cents && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.45, textDecoration: 'line-through' }}>S/{Math.round(p.compare_at_cents / 100)}</span>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55 }}>{p.stock_quantity === null ? '∞' : `${p.stock_quantity} u.`}</span>
                </div>
              </div>
            </article>
          )
        })}

        {filtered.length === 0 && search && (
          <div style={{ gridColumn: '1/-1', padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.55 }}>
            No hay productos que coincidan con "{search}"
          </div>
        )}
      </div>

      <ProductDrawer
        editing={editing}
        onClose={() => setEditing(null)}
        categories={categories}
        tags={tags}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
