'use client'
import { useRef, useState } from 'react'
import { UploadSimple, Spinner } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'

// Sube una imagen al bucket product-images y devuelve su URL pública.
// Requiere las políticas admin_* sobre storage.objects (migración 20260714000000).
export async function uploadAdminImage(file: File, path: string): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) return { error: 'Solo se aceptan imágenes' }
  if (file.size > 5 * 1024 * 1024) return { error: 'La imagen no puede superar 5 MB' }
  const supabase = createClient()
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) return { error: 'Error al subir: ' + error.message }
  const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
  return { url: publicUrl }
}

export function fileExt(file: File) {
  return file.name.split('.').pop()?.toLowerCase() ?? 'png'
}

export function ImageUploadField({
  value,
  onChange,
  pathPrefix,
  fileName = 'cover',
  previewBg = 'var(--cat-lavanda)',
  previewNote,
  urlLabel = 'O pega una URL directamente',
}: {
  value: string
  onChange: (url: string) => void
  pathPrefix: string
  fileName?: string
  previewBg?: string
  previewNote?: string
  urlLabel?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const path = `${pathPrefix}/${fileName}.${fileExt(file)}`
      const { url, error } = await uploadAdminImage(file, path)
      if (error) { setUploadError(error); return }
      if (url) onChange(url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Drop zone / upload button */}
      <div
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--liora-uva)' }}
        onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--liora-arena)' }}
        onDrop={e => {
          e.preventDefault()
          e.currentTarget.style.borderColor = 'var(--liora-arena)'
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        style={{ border: '2px dashed var(--liora-arena)', borderRadius: 14, padding: '18px 14px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
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
          {urlLabel}
        </label>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://...supabase.co/storage/v1/object/public/..."
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--liora-arena)', borderRadius: 12, background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Preview */}
      {value && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="preview"
            style={{ height: 88, width: 88, objectFit: 'contain', background: previewBg, borderRadius: 14, border: '1.5px solid var(--liora-arena)' }}
            onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
          />
          <div style={{ flex: 1 }}>
            {previewNote && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, display: 'block', marginBottom: 6 }}>{previewNote}</span>
            )}
            <button
              type="button"
              onClick={() => { onChange(''); setUploadError(null) }}
              style={{ background: 'transparent', border: '1.5px solid var(--cat-coral)', color: 'var(--cat-coral)', borderRadius: 999, padding: '4px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}
            >
              Quitar imagen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
