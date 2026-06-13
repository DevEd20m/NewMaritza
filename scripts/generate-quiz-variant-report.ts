#!/usr/bin/env tsx
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { calculateCategoryScores, selectTopCategory } from '../src/lib/recommendation/score'
import { extractSafetyFlags, extractRestrictions, needsHumanReview } from '../src/lib/recommendation/safety'
import { QUIZ_QUESTIONS, type QuizQuestion, type QuizOption } from '../tests/unit/recommendation/fixtures/quiz-structure'

const EXHAUSTIVE = process.argv.includes('--exhaustive')
const MAX_PER_OBJECTIVE = EXHAUSTIVE ? 50 : 20
const ROOT = join(__dirname, '..')
const REPORTS_DIR = join(ROOT, 'reports')

// ── Types ─────────────────────────────────────────────────────────────────────

interface VariantResult {
  id: number
  objective: string
  slugs: string[]
  scores: Record<string, number>
  topCategory: string | null
  topScore: number
  safetyFlags: string[]
  restrictions: string[]
  needsReview: boolean
  warning?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isActive(q: QuizQuestion, slugs: string[]): boolean {
  if (!q.conditions) return true
  return q.conditions.if_any_slug.some(s => slugs.includes(s))
}

// Generate variants rooted at a specific Q01 option, balanced across sub-questions
function generateForObjective(
  objectiveSlug: string,
  maxVariants: number,
): string[][] {
  const results: string[][] = []
  const seenSlugs = new Set<string>()

  // Get all questions active for this objective (excluding Q01 itself)
  const subQuestions = QUIZ_QUESTIONS
    .filter(q => q.id !== 'q-01-objetivo')
    .sort((a, b) => a.sort_order - b.sort_order)

  function traverse(current: string[], processed: Set<string>) {
    if (results.length >= maxVariants) return

    const remaining = subQuestions.filter(
      q => !processed.has(q.id) && isActive(q, current),
    )

    if (remaining.length === 0) {
      const key = current.sort().join('|')
      if (!seenSlugs.has(key)) {
        seenSlugs.add(key)
        results.push([...current])
      }
      return
    }

    const [q] = remaining
    const nextProcessed = new Set([...processed, q.id])

    if (q.type === 'single') {
      for (const opt of q.options) {
        if (results.length >= maxVariants) break
        traverse([...current, opt.slug], nextProcessed)
      }
    } else {
      // multi: each option individually, then a combined "all non-exclusive" selection
      const nonExclusive = q.options.filter(o => !o.slug.startsWith('sin-'))
      for (const opt of q.options) {
        if (results.length >= maxVariants) break
        traverse([...current, opt.slug], nextProcessed)
      }
      if (!EXHAUSTIVE) return
      // In exhaustive mode, also test all non-exclusive together
      if (nonExclusive.length > 1 && results.length < maxVariants) {
        traverse([...current, ...nonExclusive.map(o => o.slug)], nextProcessed)
      }
    }
  }

  traverse([objectiveSlug], new Set(['q-01-objetivo']))
  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  const q01 = QUIZ_QUESTIONS.find(q => q.id === 'q-01-objetivo')!
  console.log(`\nGenerating quiz variant report ${EXHAUSTIVE ? '(exhaustive)' : `(max ${MAX_PER_OBJECTIVE} per objective)`}...\n`)

  const allSlugSets: Array<{ objective: string; slugs: string[] }> = []

  for (const opt of q01.options) {
    const sets = generateForObjective(opt.slug, MAX_PER_OBJECTIVE)
    for (const slugs of sets) {
      allSlugSets.push({ objective: opt.slug, slugs })
    }
    console.log(`  ${opt.slug.padEnd(20)} → ${sets.length} variants`)
  }

  console.log(`\n  Total: ${allSlugSets.length} variants\n`)

  const results: VariantResult[] = []
  let id = 0

  for (const { objective, slugs } of allSlugSets) {
    id++
    const scores = calculateCategoryScores(slugs)
    const top = selectTopCategory(scores)
    const topScore = top ? scores[top as keyof typeof scores] : 0
    const flags = extractSafetyFlags(slugs)
    const restrictions = extractRestrictions(slugs)
    const activeFlags: string[] = []
    if (flags.pregnancy)          activeFlags.push('embarazo')
    if (flags.medications)        activeFlags.push('medicamentos')
    if (flags.medicalCondition)   activeFlags.push('condicion-medica')
    if (flags.strongReactions)    activeFlags.push('reacciones-fuertes')
    if (flags.persistentSymptoms) activeFlags.push('sintomas-persistentes')

    let warning: string | undefined
    if (top === null) {
      warning = 'Sin categoría dominante — obj-guia sin seguimiento o perfil solo informacional'
    } else if (topScore < 2) {
      warning = `Score muy bajo (${topScore})`
    }

    const nonZeroScores = Object.fromEntries(
      Object.entries(scores).filter(([, v]) => v > 0),
    )

    results.push({
      id,
      objective,
      slugs,
      scores: nonZeroScores,
      topCategory: top,
      topScore,
      safetyFlags: activeFlags,
      restrictions,
      needsReview: needsHumanReview(flags),
      warning,
    })
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalVariants = results.length
  const categoryCounts: Record<string, number> = {}
  const objectiveToCategory: Record<string, Record<string, number>> = {}
  let nullCategory = 0
  let safetyVariants = 0
  let reviewNeeded = 0
  const warnings: VariantResult[] = []

  for (const r of results) {
    if (r.topCategory) {
      categoryCounts[r.topCategory] = (categoryCounts[r.topCategory] ?? 0) + 1
    } else {
      nullCategory++
    }
    if (r.safetyFlags.length > 0) safetyVariants++
    if (r.needsReview) reviewNeeded++
    if (r.warning) warnings.push(r)

    if (!objectiveToCategory[r.objective]) objectiveToCategory[r.objective] = {}
    const cat = r.topCategory ?? '(ninguna)'
    objectiveToCategory[r.objective][cat] = (objectiveToCategory[r.objective][cat] ?? 0) + 1
  }

  // ── Markdown report ───────────────────────────────────────────────────────

  const date = new Date().toISOString().split('T')[0]
  const lines: string[] = []
  lines.push('# LIORA Quiz Variant Report')
  lines.push(`> Generado: ${date} | Modo: ${EXHAUSTIVE ? 'exhaustivo' : 'estándar'} | Total variantes: ${totalVariants}`)
  lines.push('')
  lines.push('## Resumen ejecutivo')
  lines.push('')
  lines.push('| Métrica | Valor |')
  lines.push('|---------|-------|')
  lines.push(`| Total variantes analizadas | ${totalVariants} |`)
  lines.push(`| Variantes sin categoría | ${nullCategory} |`)
  lines.push(`| Variantes con flags de seguridad | ${safetyVariants} |`)
  lines.push(`| Requieren revisión humana | ${reviewNeeded} |`)
  lines.push('')

  lines.push('## Distribución por categoría')
  lines.push('')
  lines.push('| Categoría | Variantes | % |')
  lines.push('|-----------|-----------|---|')
  for (const [cat, count] of Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)) {
    const pct = ((count / totalVariants) * 100).toFixed(1)
    lines.push(`| ${cat} | ${count} | ${pct}% |`)
  }
  if (nullCategory > 0) {
    const pct = ((nullCategory / totalVariants) * 100).toFixed(1)
    lines.push(`| *(sin categoría)* | ${nullCategory} | ${pct}% |`)
  }
  lines.push('')

  lines.push('## Routing por objetivo de entrada')
  lines.push('')
  lines.push('| Objetivo (Q01) | Categoría resultado | Variantes |')
  lines.push('|----------------|---------------------|-----------|')
  for (const [obj, cats] of Object.entries(objectiveToCategory)) {
    const entries = Object.entries(cats).sort(([, a], [, b]) => b - a)
    for (const [cat, count] of entries) {
      lines.push(`| ${obj} | ${cat} | ${count} |`)
    }
  }
  lines.push('')

  if (warnings.length > 0) {
    lines.push('## Advertencias')
    lines.push('')
    for (const w of warnings.slice(0, 30)) {
      lines.push(`- **V${w.id}** [${w.objective}] \`${w.slugs.slice(0, 4).join(', ')}\` → ${w.warning}`)
    }
    if (warnings.length > 30) {
      lines.push(`- *(y ${warnings.length - 30} más — consulta el JSON completo)*`)
    }
    lines.push('')
  }

  lines.push('## Muestra de variantes (primeras 40)')
  lines.push('')
  lines.push('| # | Objetivo | Slugs clave | Categoría | Score | Safety | Restricciones |')
  lines.push('|---|----------|-------------|-----------|-------|--------|---------------|')
  for (const r of results.slice(0, 40)) {
    const key = r.slugs.slice(0, 4).join(', ')
    const flags = r.safetyFlags.join(', ') || '—'
    const rest = r.restrictions.join(', ') || '—'
    const cat = r.topCategory ?? '⚠️ ninguna'
    lines.push(`| ${r.id} | ${r.objective} | ${key} | ${cat} | ${r.topScore} | ${flags} | ${rest} |`)
  }

  mkdirSync(REPORTS_DIR, { recursive: true })
  writeFileSync(join(REPORTS_DIR, 'quiz-variant-report.md'), lines.join('\n'), 'utf-8')

  const json = {
    generated: new Date().toISOString(),
    mode: EXHAUSTIVE ? 'exhaustive' : 'standard',
    totalVariants,
    stats: { categoryCounts, nullCategory, safetyVariants, reviewNeeded },
    variants: results,
  }
  writeFileSync(join(REPORTS_DIR, 'quiz-variant-report.json'), JSON.stringify(json, null, 2), 'utf-8')

  console.log('Reports generated:')
  console.log('  reports/quiz-variant-report.md')
  console.log('  reports/quiz-variant-report.json')
  console.log('\nCategory distribution:')
  for (const [cat, count] of Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)) {
    const pct = ((count / totalVariants) * 100).toFixed(1)
    console.log(`  ${cat.padEnd(14)} ${String(count).padStart(4)} variants (${pct}%)`)
  }
  if (nullCategory > 0) {
    console.log(`  ${'(sin cat.)'.padEnd(14)} ${String(nullCategory).padStart(4)} variants`)
  }
  console.log('')
}

run()
