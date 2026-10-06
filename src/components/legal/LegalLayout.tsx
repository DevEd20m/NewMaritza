import type { ReactNode } from 'react'

/**
 * Presentación compartida de los documentos legales.
 *
 * Existe para que /terminos y /privacidad no diverjan en tipografía, anchos ni anclas, y para
 * que la fecha de vigencia se marque siempre igual (`data-actualizado`, US-005 · AC-005-03).
 *
 * Los tamaños salen en px como el resto del repositorio, pero los títulos llevan sus ganchos
 * `liora-*` para que las reglas móviles de src/styles/responsive.css los alcancen (US-002).
 */

const UVA = 'var(--liora-uva)'

export function LegalLayout({
  titulo,
  bajada,
  actualizado,
  actualizadoTexto,
  children,
}: {
  titulo: string
  bajada: string
  actualizado: string
  actualizadoTexto: string
  children: ReactNode
}) {
  return (
    // <article> y no <main>: el layout de (store) ya envuelve todo en un <main>, y anidar
    // dos es HTML inválido además de confundir a los lectores de pantalla.
    <article data-legal-doc className="liora-px" style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px', color: UVA }}>
      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.55, margin: '0 0 10px' }}>
        {bajada}
      </p>

      <h1
        className="liora-page-title"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 12px', overflowWrap: 'anywhere' }}
      >
        {titulo}
      </h1>

      <p
        data-actualizado={actualizado}
        style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.6, margin: '0 0 40px' }}
      >
        Última actualización: {actualizadoTexto}
      </p>

      <div style={{ display: 'grid', gap: 36 }}>{children}</div>
    </article>
  )
}

export function Seccion({ n, titulo, id, children }: { n?: number; titulo: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 90 }}>
      <h2
        className="liora-legal-h2"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, lineHeight: 1.2, margin: '0 0 14px', overflowWrap: 'anywhere' }}
      >
        {n !== undefined && <span style={{ opacity: 0.4, marginRight: 8 }}>{n}.</span>}
        {titulo}
      </h2>
      <div style={{ display: 'grid', gap: 14 }}>{children}</div>
    </section>
  )
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p data-legal-body style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
      {children}
    </p>
  )
}

export function Lista({ items, ordenada = false }: { items: ReactNode[]; ordenada?: boolean }) {
  const Etiqueta = ordenada ? 'ol' : 'ul'
  return (
    <Etiqueta style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, margin: 0, paddingLeft: 22, display: 'grid', gap: 8 }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </Etiqueta>
  )
}

export function Tabla({ cabeceras, filas }: { cabeceras: string[]; filas: ReactNode[][] }) {
  return (
    // En una pantalla angosta una tabla de tres columnas no cabe; se desplaza en vez de
    // recortarse, que es la regla que fija US-003 · AC-003-03 para el panel.
    <div className="liora-admin-tabla" style={{ overflowX: 'auto', border: '1.5px solid var(--liora-arena)', borderRadius: 14 }}>
      <table style={{ width: '100%', minWidth: 460, borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 14 }}>
        <thead>
          <tr>
            {cabeceras.map((c) => (
              <th key={c} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, borderBottom: '1.5px solid var(--liora-arena)' }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i}>
              {fila.map((celda, j) => (
                <td key={j} style={{ padding: '12px 14px', lineHeight: 1.55, borderBottom: i === filas.length - 1 ? 'none' : '1px solid var(--liora-arena)', verticalAlign: 'top' }}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
