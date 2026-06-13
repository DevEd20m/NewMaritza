import { SLUG_WEIGHTS } from './slug-weights'
import { type CategorySlug, type CategoryScores, CATEGORY_SLUGS } from './types'

const TIEBREAK_ORDER: CategorySlug[] = [
  'piel', 'bienestar', 'gym', 'solar', 'digestivo', 'viaje', 'hogar', 'pies-cuerpo',
]

export function emptyScores(): CategoryScores {
  return Object.fromEntries(CATEGORY_SLUGS.map(c => [c, 0])) as CategoryScores
}

export function calculateCategoryScores(slugs: string[]): CategoryScores {
  const scores = emptyScores()
  const seen = new Set<string>()
  for (const slug of slugs) {
    if (seen.has(slug)) continue
    seen.add(slug)
    const weights = SLUG_WEIGHTS[slug]
    if (!weights) continue
    for (const [cat, pts] of Object.entries(weights)) {
      if (cat in scores) {
        scores[cat as CategorySlug] += pts
      }
    }
  }
  return scores
}

export function selectTopCategory(scores: CategoryScores): CategorySlug | null {
  const sorted = CATEGORY_SLUGS
    .map(c => ({ cat: c, score: scores[c] }))
    .filter(x => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return TIEBREAK_ORDER.indexOf(a.cat) - TIEBREAK_ORDER.indexOf(b.cat)
    })
  return sorted[0]?.cat ?? null
}

export function scoresSortedDesc(scores: CategoryScores): Array<{ cat: CategorySlug; score: number }> {
  return CATEGORY_SLUGS
    .map(c => ({ cat: c, score: scores[c] }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return TIEBREAK_ORDER.indexOf(a.cat) - TIEBREAK_ORDER.indexOf(b.cat)
    })
}
