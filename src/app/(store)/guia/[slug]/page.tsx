import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getGuideBySlugDB, getAllGuideSlugsDB } from '@/lib/guides/db'
import { GuideAccordion } from '@/components/guides/GuideAccordion'
import { PersonalizedIntro } from '@/components/guides/PersonalizedIntro'
import { getStoreSettings } from '@/lib/settings'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { Suspense } from 'react'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getAllGuideSlugsDB()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = await getGuideBySlugDB(slug)
  if (!guide) return { title: 'Guía no encontrada' }
  return {
    title: `Guía de uso — ${guide.kitName} | LIORA`,
    description: guide.description,
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const [guide, settings] = await Promise.all([getGuideBySlugDB(slug), getStoreSettings()])
  if (!guide) notFound()

  const kitSlug = slug.replace('kit-', '')
  const waNumber = settings.whatsapp_number

  return (
    <div style={{ background: 'var(--liora-crema)', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ background: guide.color, padding: '48px 48px 56px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Link href={`/tienda/kit/${slug}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            color: 'var(--liora-uva)', opacity: 0.6, textDecoration: 'none', marginBottom: 24,
          }}>
            <ArrowLeft size={14} weight="bold" />
            Volver al kit
          </Link>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(61,26,58,0.12)', borderRadius: 999, padding: '5px 14px', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--liora-uva)', opacity: 0.75 }}>
              Guía de uso
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1.0, color: 'var(--liora-uva)', margin: '0 0 14px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            {guide.kitName}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontStyle: 'italic', color: 'var(--liora-uva)', opacity: 0.75, margin: '0 0 8px', lineHeight: 1.45 }}>
            "{guide.tagline}"
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.7, margin: 0, lineHeight: 1.55, maxWidth: 600 }}>
            {guide.description}
          </p>
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 48px 96px' }}>

        {/* ── Intro personalizada (solo si hay profileId en URL) ─────────── */}
        <Suspense>
          <PersonalizedIntro guideSlug={slug} guideColor={guide.color} tips={guide.tips} />
        </Suspense>

        {/* ── Tu rutina del día ──────────────────────────────────────────── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel>Tu rutina del día</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', overflow: 'hidden' }}>
            {guide.schedule.map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 20, padding: '24px 28px',
                borderBottom: i < guide.schedule.length - 1 ? '1.5px solid var(--liora-arena)' : 'none',
                alignItems: 'flex-start',
              }}>
                {/* Time bubble */}
                <div style={{
                  width: 48, height: 48, borderRadius: 16, background: guide.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  {s.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.55, marginBottom: 6 }}>
                    {s.time}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {s.products.map((p, pi) => (
                      <span key={pi} style={{
                        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                        background: guide.color, color: 'var(--liora-uva)',
                        borderRadius: 8, padding: '4px 12px',
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, margin: 0, lineHeight: 1.5 }}>
                    💡 {s.tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Qué esperar ───────────────────────────────────────────────── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel>Qué esperar — tu línea de tiempo</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {guide.timeline.map((phase, i) => (
              <div key={i} style={{
                background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)',
                borderRadius: 20, padding: '20px 20px',
                borderTop: `4px solid ${guide.color}`,
              }}>
                <div style={{
                  display: 'inline-block', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: guide.color, color: 'var(--liora-uva)',
                  borderRadius: 999, padding: '3px 10px', marginBottom: 10,
                }}>
                  {phase.label}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--liora-uva)', marginBottom: 8, lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                  {phase.title}
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.7, margin: 0, lineHeight: 1.5 }}>
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Consejos clave ────────────────────────────────────────────── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel>Consejos que marcan la diferencia</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {guide.tips.map((tip, i) => (
              <div key={i} style={{
                background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)',
                borderRadius: 20, padding: '20px 22px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{tip.emoji}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--liora-uva)', marginBottom: 6, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                  {tip.title}
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.72, margin: 0, lineHeight: 1.5 }}>
                  {tip.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Receta ────────────────────────────────────────────────────── */}
        {guide.recipe && (
          <section style={{ marginBottom: 64 }}>
            <SectionLabel>Receta especial</SectionLabel>
            <div style={{
              background: guide.color, borderRadius: 24, padding: '32px 36px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start',
            }}>
              <div>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{guide.recipe.emoji}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--liora-uva)', marginBottom: 16, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                  {guide.recipe.title}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--liora-uva)', opacity: 0.6, marginBottom: 10 }}>
                  Ingredientes
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {guide.recipe.ingredients.map((ing, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.8, marginBottom: 4, lineHeight: 1.4 }}>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--liora-uva)', opacity: 0.6, marginBottom: 10 }}>
                  Preparación
                </div>
                <ol style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {guide.recipe.steps.map((step, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.85, marginBottom: 8, lineHeight: 1.5 }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* ── Advertencias ──────────────────────────────────────────────── */}
        {guide.warnings && guide.warnings.length > 0 && (
          <section style={{ marginBottom: 64 }}>
            <div style={{
              background: '#fff8e7', border: '1.5px solid #f0d070',
              borderRadius: 20, padding: '20px 24px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#7a5c00', marginBottom: 8 }}>
                  Ten en cuenta
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {guide.warnings.map((w, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7a5c00', marginBottom: 3 }}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ── FAQs ──────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 64 }}>
          <SectionLabel>Preguntas frecuentes</SectionLabel>
          <GuideAccordion faqs={guide.faqs} />
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section>
          <div style={{ background: 'var(--liora-uva)', borderRadius: 28, padding: '40px 44px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--liora-crema)', lineHeight: 1.1, marginBottom: 8, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                ¿Listo para empezar?
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-crema)', opacity: 0.7, margin: 0 }}>
                Los resultados se construyen día a día.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={`/tienda/kit/${kitSlug}`} style={{
                background: 'var(--liora-crema)', color: 'var(--liora-uva)',
                borderRadius: 999, padding: '13px 24px',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
              }}>
                Ir al kit →
              </Link>
              <a
                href={`https://wa.me/${waNumber}?text=Hola%2C%20tengo%20preguntas%20sobre%20el%20${encodeURIComponent(guide.kitName)}`}
                target="_blank" rel="noopener"
                style={{
                  background: '#25d366', color: '#ffffff',
                  borderRadius: 999, padding: '13px 24px',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11,
      textTransform: 'uppercase', letterSpacing: '0.14em',
      color: 'var(--liora-uva)', opacity: 0.55, marginBottom: 20,
    }}>
      {children}
    </div>
  )
}
