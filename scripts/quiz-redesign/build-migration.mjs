import { QUESTIONS, RETIRED, GROUPS, RETIRE_CONDITION } from './questionnaire.mjs'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const TEMPLATE = '55550001-0000-0000-0000-000000000001'
const GROUP_IDS = {
  g1: '55550011-0001-0000-0000-000000000001',
  g2: '55550011-0002-0000-0000-000000000001',
  g3: '55550011-0003-0000-0000-000000000001',
}

// UUID determinista: reejecutar la migración produce los mismos ids,
// así los perfiles guardados siguen resolviendo tras un re-seed.
const uuid = (ns, key) => {
  const h = createHash('md5').update(`liora:quiz-v2:${ns}:${key}`).digest('hex')
  return [h.slice(0,8), h.slice(8,12), '5'+h.slice(13,16),
          ((parseInt(h[16],16) & 0x3 | 0x8).toString(16))+h.slice(17,20), h.slice(20,32)].join('-')
}
const q = s => s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`
const jsonb = o => o === null ? 'NULL' : `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`

const L = []
L.push(`-- Rediseño del cuestionario: de router de categorías a índices de perfil.`)
L.push(`--`)
L.push(`-- Aditiva por diseño. Ninguna pregunta ni opción se borra: quiz_profiles.answers`)
L.push(`-- referencia sus UUIDs y el motor los resuelve por ahí. Las preguntas que salen`)
L.push(`-- del flujo se ocultan con una condición que ninguna opción emite.`)
L.push(`--`)
L.push(`-- Generado por scripts/quiz-redesign/build-migration.mjs desde questionnaire.mjs.`)
L.push(`-- No editar a mano: cambiar la especificación y regenerar.`)
L.push(``)
L.push(`BEGIN;`)
L.push(``)

L.push(`-- ── Esquema ──────────────────────────────────────────────────────────`)
L.push(`-- El campo abierto necesita un tipo de pregunta nuevo.`)
L.push(`ALTER TABLE public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_type_check;`)
L.push(`ALTER TABLE public.quiz_questions ADD CONSTRAINT quiz_questions_type_check`)
L.push(`  CHECK (type IN ('single','multi','range','age','text'));`)
L.push(``)
L.push(`-- Tope de selección para las preguntas de varias respuestas, y tope de`)
L.push(`-- caracteres para el campo abierto. Ambos opcionales.`)
L.push(`ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS max_select integer;`)
L.push(`ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS max_length integer;`)
L.push(`ALTER TABLE public.quiz_question_options ADD COLUMN IF NOT EXISTS render text;`)
L.push(``)

L.push(`-- ── Preguntas que salen del flujo ────────────────────────────────────`)
L.push(`-- Se ocultan, no se borran. El slug de la condición no lo emite ninguna opción.`)
for (const r of RETIRED) {
  L.push(`-- ${r.text} — ${r.motivo}`)
  L.push(`UPDATE public.quiz_questions SET conditions = ${jsonb(RETIRE_CONDITION)} WHERE id = '${r.id}';`)
}
L.push(``)

const nuevas = QUESTIONS.filter(x => x.status === 'new')
L.push(`-- ── Preguntas nuevas ─────────────────────────────────────────────────`)
for (const x of nuevas) {
  const qid = uuid('q', x.key)
  L.push(``)
  L.push(`-- [${x.key}] ${x.text}`)
  L.push(`INSERT INTO public.quiz_questions (id, group_id, text, subtext, type, sort_order, is_required, conditions, max_select, max_length)`)
  L.push(`VALUES ('${qid}', '${GROUP_IDS[x.group]}', ${q(x.text)}, ${q(x.subtext)}, ${q(x.type)}, ${x.sort}, ${x.required}, ${jsonb(x.conditions)}, ${x.maxSelect ?? 'NULL'}, ${x.maxLength ?? 'NULL'})`)
  L.push(`ON CONFLICT (id) DO UPDATE SET group_id = EXCLUDED.group_id, text = EXCLUDED.text,`)
  L.push(`  subtext = EXCLUDED.subtext, type = EXCLUDED.type, sort_order = EXCLUDED.sort_order,`)
  L.push(`  is_required = EXCLUDED.is_required, conditions = EXCLUDED.conditions,`)
  L.push(`  max_select = EXCLUDED.max_select, max_length = EXCLUDED.max_length;`)
  for (const [i, o] of (x.options ?? []).entries()) {
    const oid = uuid('o', `${x.key}:${o.slug}:${i}`)
    L.push(`INSERT INTO public.quiz_question_options (id, question_id, text, slug, sort_order, tag_ids, icon_url, next_question_id, render)`)
    L.push(`VALUES ('${oid}', '${qid}', ${q(o.text)}, ${q(o.slug)}, ${i + 1}, '{}', NULL, NULL, ${q(o.render ?? null)})`)
    L.push(`ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, slug = EXCLUDED.slug,`)
    L.push(`  sort_order = EXCLUDED.sort_order, render = EXCLUDED.render;`)
  }
}
L.push(``)

const keep = QUESTIONS.filter(x => x.status === 'keep')
if (keep.length) {
  L.push(`-- ── Preguntas que se mantienen ───────────────────────────────────────`)
  L.push(`-- Solo cambia su posición para dejar sitio a las nuevas. Cambiar sort_order`)
  L.push(`-- no afecta a los perfiles guardados: el motor resuelve por id, no por orden.`)
  for (const x of keep) {
    L.push(`UPDATE public.quiz_questions SET sort_order = ${x.sort} WHERE id = '${x.id}';  -- ${x.text}`)
  }
  L.push(``)
}

L.push(`-- ── Etiquetas colgadas ───────────────────────────────────────────────`)
L.push(`-- Los tag_ids de las opciones apuntan a filas de tags borradas en junio por`)
L.push(`-- 20260612172750_restructure_tags_8_groups.sql, que hizo DELETE + reinsert con`)
L.push(`-- ids nuevos. quiz_profiles.applied_tags viene guardando UUIDs muertos desde`)
L.push(`-- entonces. No se reconecta: el motor no debe amarrarse a productos concretos`)
L.push(`-- porque el catálogo cambia. Las etiquetas llegan a la IA como texto del`)
L.push(`-- producto, nunca como filtro.`)
L.push(`UPDATE public.quiz_question_options SET tag_ids = '{}'`)
L.push(`WHERE tag_ids <> '{}'`)
L.push(`  AND NOT EXISTS (SELECT 1 FROM public.tags t WHERE t.id = ANY(quiz_question_options.tag_ids));`)
L.push(``)
L.push(`COMMIT;`)
L.push(``)

const stamp = process.argv[2] ?? '20260827120000'
const out = `/Users/prado/Documents/Maritza-New/liora/supabase/migrations/${stamp}_quiz_profile_index_redesign.sql`
writeFileSync(out, L.join('\n'))
console.log(out)
console.log(`preguntas nuevas: ${nuevas.length} · opciones: ${nuevas.reduce((s,x)=>s+(x.options?.length||0),0)} · retiradas: ${RETIRED.length}`)

// El índice de perfil necesita los mismos ids: se exportan para el módulo TS.
writeFileSync('/Users/prado/Documents/Maritza-New/liora/scripts/quiz-redesign/ids.json',
  JSON.stringify(Object.fromEntries(nuevas.map(x => [x.key, uuid('q', x.key)])), null, 2))
