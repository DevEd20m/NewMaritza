# LIORA — Auditoría Completa: Quiz + Kits + Motor de Recomendación

**Fecha de auditoría:** 12 de junio de 2026  
**Autor:** Análisis automatizado (solo lectura — sin modificaciones a código ni DB)  
**Fuentes consultadas:**
- DB Supabase `skcfrccoexscaiayzjzd` — tablas: `quiz_question_groups`, `quiz_questions`, `quiz_question_options`, `kits`, `kit_products`, `products`, `categories`
- `src/app/api/kit/recommend/route.ts` — SLUG_WEIGHTS, lógica GPT-4o-mini, fallback
- `src/components/quiz/QuizClient.tsx` — flujo de navegación, handleSelect, condiciones

---

## ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estructura Completa del Cuestionario](#2-estructura-completa-del-cuestionario)
3. [Análisis de SLUG_WEIGHTS](#3-análisis-de-slug_weights)
4. [Los 18 Kits Plantilla](#4-los-18-kits-plantilla)
5. [Mapeo Quiz → Categoría → Kit](#5-mapeo-quiz--categoría--kit)
6. [Gaps de Cobertura](#6-gaps-de-cobertura)
7. [Slugs Huérfanos y Legado](#7-slugs-huérfanos-y-legado)
8. [Riesgos de Seguridad](#8-riesgos-de-seguridad)
9. [Simulación de 12 Perfiles de Usuario](#9-simulación-de-12-perfiles-de-usuario)
10. [Correcciones Recomendadas](#10-correcciones-recomendadas)
11. [Versión Sugerida del Cuestionario](#11-versión-sugerida-del-cuestionario)
12. [Resumen para ChatGPT](#12-resumen-para-chatgpt)

---

## 1. RESUMEN EJECUTIVO

### Estado general: ⚠️ BLOQUEADO PARA PRODUCCIÓN

El cuestionario está estructuralmente bien diseñado y el motor de SLUG_WEIGHTS cubre casi todos los caminos. Sin embargo, existen **5 bloqueantes críticos** que impiden un lanzamiento seguro:

| # | Problema | Severidad |
|---|----------|-----------|
| 1 | **Catálogo vacío**: `products`, `product_variants`, `product_prices` sin filas → el motor no puede devolver ningún producto | 🔴 CRÍTICO |
| 2 | **`cond-embarazo` no llega a GPT**: una usuaria embarazada puede recibir suplementos sin advertencia | 🔴 CRÍTICO |
| 3 | **`alerg-cafeina`, `pref-vegano`, `alerg-azucar` no se traducen al prompt de GPT** → restricciones ignoradas | 🔴 CRÍTICO |
| 4 | **`obj-guia` → `{}`**: el 100% de usuarios que seleccionan "No sé, guíame" obtienen score 0 en todas las categorías → kit vacío | 🔴 CRÍTICO |
| 5 | **`piel-firmeza` y `foco-antiedad` penalizan con bienestar > piel**: usuarios anti-aging son enrutados a kits de relajación | 🟠 ALTO |

### Hallazgos adicionales importantes:
- 3 slugs de quiz sin SLUG_WEIGHT (piel-firmeza genera 3 pts bienestar vs 2 piel — inversión incorrecta)
- `obj-nutricion` no tiene ningún kit propio; usuarios de vitaminas van a kits de bienestar
- `hogar-movil` (botiquín portátil) tiene el peso más bajo del árbol hogar (2 pts) vs familiar (4 pts) — puede perder frente a otros objetivos
- El cuestionario tiene **23 preguntas en DB** pero un usuario típico solo ve **5–8 preguntas** según su rama

---

## 2. ESTRUCTURA COMPLETA DEL CUESTIONARIO

### Leyenda
- `[S]` = single choice  `[M]` = multi choice
- `(cond: ...)` = solo aparece si el usuario seleccionó esos slugs antes
- `[!]` = problema detectado

### SECCIÓN 1 — "¿Qué buscas?" (1 pregunta, sin condiciones)

```
Q1 [S] — "¿Qué quieres cuidar hoy?"
ID: 55550012-0001-0001-0000-000000000001
Subtext: "Elige la opción que más se parece a lo que necesitas ahora."
Opciones (10 — grid 3×3 + lastOpt):
  1. Mi piel, rostro o cabello          → obj-belleza
  2. Mi protección solar o exposición   → obj-solar
  3. Mi descanso, calma o energía       → obj-bienestar
  4. Mi rendimiento físico, gym         → obj-rendimiento
  5. Mi digestión o hidratación         → obj-digestivo
  6. Un viaje, playa u outdoor          → obj-viaje
  7. Mi hogar, familia o primeros aux.  → obj-hogar
  8. Mis pies o cuidado corporal        → obj-pies-cuerpo
  9. Vitaminas y nutrición de base      → obj-nutricion
 10. No estoy seguro/a, quiero que LIORA me guíe → obj-guia  [!] weight: {}
```

---

### SECCIÓN 2 — "Cuéntanos más" (hasta 7 preguntas según rama)

Las preguntas de la S2 están condicionadas por la selección de Q1.  
Nota: q_orden 4 tiene **dos preguntas diferentes** (una por rama), lo que es correcto pero crea ambigüedad en el sort_order compartido.

#### Rama A — Rendimiento (if_any_slug: `obj-rendimiento`)

```
Q2a [S] — "¿Qué tipo de entrenamiento haces?"
ID: 55550012-0002-0001-0000-000000000001
  1. Fuerza y musculación        → tipo-fuerza
  2. Cardio, running o ciclismo  → tipo-cardio
  3. HIIT o entrenamiento func.  → tipo-hiit
  4. Yoga, pilates o movilidad   → tipo-yoga

Q2b [S] — "¿Cuál es tu nivel de entrenamiento?"
ID: 55550012-0002-0002-0000-000000000001
  1. Estoy empezando o ocasional       → nivel-principiante
  2. Entreno regularmente (2-3x/sem)   → nivel-activo
  3. Entreno fuerte (4+ veces/sem)     → nivel-alto
  4. Nivel competitivo o élite         → nivel-elite

Q2c [S] — "¿Sientes molestias en articulaciones o rodillas?"
ID: 55550012-0002-0003-0000-000000000001
  1. No, me muevo sin problemas    → sin-dolor
  2. A veces, después de entrenar  → dolor-leve
  3. Sí, con frecuencia            → dolor-frecuente  [!] weight: bienestar:3 (no gym)

Q2d-R [S] — "¿Qué buscas principalmente con tu entrenamiento?"
ID: 55550012-0002-0017-0000-000000000001
  1. Ganar fuerza o masa muscular  → gym-fuerza
  2. Mejorar energía para entrenar → gym-energia
  3. Recuperarme mejor             → gym-recuperacion
  4. Cuidar mis articulaciones     → gym-articulaciones
  5. Hidratarme mejor              → gym-hidratacion
```

#### Rama B — Belleza (if_any_slug: `obj-belleza`)

```
Q2d-B [S] — "¿En qué quieres enfocarte?"
ID: 55550012-0002-0004-0000-000000000001
  1. Mi piel (cara, tono, manchas, poros)    → foco-piel
  2. Mi cabello (caída, brillo, frizz)       → foco-cabello
  3. Colágeno y belleza desde adentro        → foco-colageno
  4. Antiedad integral: piel firme y cuerpo  → foco-antiedad  [!] weight: bienestar:3 > piel:2

Q2e [S] — "¿Cuál es tu tipo de piel?"
ID: 55550012-0002-0005-0000-000000000001
(cond: foco-piel)
  1. Grasa o mixta   → piel-grasa
  2. Seca o deshidratada → piel-seca
  3. Sensible o reactiva → piel-sensible
  4. Normal          → piel-normal

Q2f [M] — "¿Qué te preocupa más de tu piel?"
ID: 55550012-0002-0006-0000-000000000001
(cond: foco-piel, foco-antiedad)
  1. Manchas y tono desigual     → piel-manchas
  2. Arrugas y pérdida de firmeza → piel-arrugas
  3. Poros grandes / exceso grasa → piel-poros
  4. Firmeza y luminosidad       → piel-firmeza  [!] weight: bienestar:3, piel:2 (invertido)

Q2g [M] — "¿Cuál es tu problema capilar principal?"
ID: 55550012-0002-0007-0000-000000000001
(cond: foco-cabello)
  1. Caída o debilitamiento → cabello-caida
  2. Sequedad, quiebre, puntas → cabello-sequedad
  3. Frizz y falta de brillo → cabello-frizz
  4. Crecimiento muy lento → cabello-crecimiento
```

#### Rama C — Bienestar (if_any_slug: `obj-bienestar`)

```
Q2h [S] — "¿Qué es lo que más te afecta en tu día a día?"
ID: 55550012-0002-0008-0000-000000000001
  1. No puedo dormir bien           → foco-sueno
  2. Me cuesta relajarme / carga    → foco-estres
  3. Los dos: mal sueño y estrés    → foco-sueno-estres
  4. Me falta energía               → foco-energia
  5. Paso muchas horas en pantallas → foco-pantallas

Q2i [S] — "¿Con qué frecuencia lo sientes?"
ID: 55550012-0002-0009-0000-000000000001
(cond: foco-sueno, foco-estres, foco-sueno-estres)
  1. Casi todos los días       → frecuencia-diaria
  2. Varias veces a la semana  → frecuencia-semanal
  3. Solo en épocas de carga   → frecuencia-ocasional
```

*Nota: si el usuario elige `foco-energia` o `foco-pantallas`, Q2i no aparece.*

#### Rama D — Digestivo (if_any_slug: `obj-digestivo`)

```
Q2j [M] — "¿Cuál es tu síntoma principal?"
ID: 55550012-0002-0010-0000-000000000001
  1. Hinchazón y gases        → digestivo-hinchazon
  2. Estreñimiento o tránsito → digestivo-estrenimiento
  3. Reflujo o acidez         → digestivo-reflujo
  4. Quiero rutina más ligera → digestivo-reset
```

#### Rama E — Nutrición (if_any_slug: `obj-nutricion`)

```
Q2k [M] — "¿Cuál es tu prioridad?"
ID: 55550012-0002-0011-0000-000000000001
  1. Más energía y vitalidad        → nutricion-energia
  2. Fortalecer sistema inmune      → nutricion-inmune
  3. Vitaminas de base (omega, D, B) → nutricion-base
  4. Superalimentos andinos         → nutricion-andino
```

#### Pregunta universal (aparece en TODAS las ramas)

```
Q2l [S] — "¿Qué tan importante es que sean productos naturales u orgánicos?"
ID: 55550012-0002-0012-0000-000000000001
(sin condición — aparece a TODOS)
  1. Fundamental, solo lo natural       → prefiere-natural    [!] weight: digestivo:3 (¿?)
  2. Importante, pero no excluyente     → natural-importante  [!] weight: digestivo:1 (¿?)
  3. No es mi prioridad — quiero result → natural-indiferente → {}
```

*[!] Asignar puntos de `digestivo` a una preferencia de ingredientes naturales no tiene coherencia semántica.*

#### Ramas F, G, H, I — Solar / Viaje / Hogar / Pies

```
Q2m [S] — "¿Cómo es tu exposición al sol normalmente?"
ID: 55550012-0002-0013-0000-000000000001 (cond: obj-solar)
  1. Uso diario en ciudad         → solar-diario
  2. Playa, piscina o acuático    → solar-playa
  3. Montaña, running o outdoor   → solar-outdoor
  4. Todo lo anterior, protección completa → solar-completo

Q2n [S] — "¿Qué tipo de destino es tu viaje?"
ID: 55550012-0002-0014-0000-000000000001 (cond: obj-viaje)
  1. Playa o tropical     → viaje-playa   [!] también suma solar:2
  2. Ciudad / negocios    → viaje-ciudad
  3. Montaña o aventura   → viaje-aventura
  4. Vuelo largo          → viaje-largo

Q2o [S] — "¿Qué tipo de kit buscas para casa?"
ID: 55550012-0002-0015-0000-000000000001 (cond: obj-hogar)
  1. Botiquín familiar completo  → hogar-familiar  (hogar:4)
  2. Kit compacto día a día      → hogar-compacto  (hogar:3)
  3. Para auto, cartera, oficina → hogar-movil     (hogar:2)

Q2p [S] — "¿Qué te preocupa principalmente?"
ID: 55550012-0002-0016-0000-000000000001 (cond: obj-pies-cuerpo)
  1. Pies cansados, callos, durezas    → pies-durezas      (pies-cuerpo:4)
  2. Rozaduras, sequedad, cuidado corp → cuerpo-rozaduras  (pies-cuerpo:3)
  3. Recuperación muscular del cuerpo  → cuerpo-muscular   (gym:2, pies-cuerpo:2)
  4. Cuidado general pies y cuerpo     → pies-general      (pies-cuerpo:3)
```

---

### SECCIÓN 3 — "Para terminar" (5 preguntas, 2 condicionales)

*Nota: La pregunta de seguridad tiene `q_orden = 0`, lo cual es técnicamente válido (se muestra primero en la sección), pero rompe la convención de orden 1-based.*

```
S3-Q0 [M] — "Antes de recomendarte algo, ¿hay algo que debamos considerar?"
ID: 55550012-0003-0005-0000-000000000001
q_orden: 0  [!] convención rota — debería ser 1
Subtext: "Tu seguridad es lo primero."
(sin condición)
  1. Ninguna                              → sin-condicion  (exclusive via sin-* logic)
  2. Embarazo o lactancia                 → cond-embarazo      [!] NO llega al prompt GPT
  3. Tomo medicamentos o suplementos      → cond-medicamentos  [!] NO llega al prompt GPT
  4. Tengo una condición médica           → cond-medica        [!] NO llega al prompt GPT
  5. He tenido reacciones a productos     → cond-reacciones    [!] NO llega al prompt GPT
  6. Tengo síntomas intensos o pers.      → cond-sintomas      [!] NO llega al prompt GPT

S3-Q1 [M] — "¿Tienes alguna restricción o preferencia?"
ID: 55550012-0003-0001-0000-000000000001
(sin condición — aparece a TODOS)
  1. Ninguna restricción → sin-restriccion (exclusive via sin-* logic)
  2. Intolerante a la lactosa  → alerg-lactosa    ✓ llega a GPT
  3. Celíaca / sin gluten      → alerg-gluten     ✓ llega a GPT
  4. Alérgico/a a la soya      → alerg-soya       ✓ llega a GPT
  5. Sin azúcar                → alerg-azucar     [!] NO en allergyLabels → NO llega a GPT
  6. Sin cafeína               → alerg-cafeina    [!] NO en allergyLabels → NO llega a GPT
  7. Vegano/a                  → pref-vegano      [!] NO en allergyLabels → NO llega a GPT
  8. Sin fragancia             → pref-sin-fragancia [!] solo cosméticos, no llega a GPT
  9. Orgánico / natural        → pref-organico    → digestivo:1 (¿?)

S3-Q2 [S] — "¿Tienes piel o cuero cabelludo sensible?"
ID: 55550012-0003-0002-0000-000000000001
(cond: obj-belleza)
  1. No, sin problemas              → sin-sensibilidad  → {}
  2. Sí, reacciono a ingredientes   → alerg-piel       → piel:1
  3. Me salen rojeces o irritación  → piel-rojeces     → piel:2

S3-Q3 [S] — "¿Qué tipo de rutina prefieres?"
ID: 55550012-0003-0006-0000-000000000001
(sin condición)
  1. Muy simple, pocos productos → rutina-simple    → {}
  2. Balanceada, lo necesario    → rutina-balanceada → {}
  3. Completa, más opciones      → rutina-completa  → {}
  4. No sé, recomiéndenme        → rutina-guiada    → {}
(informacional para GPT — no afecta scores)

S3-Q4 [S] — "¿Qué presupuesto quieres considerar para tu kit?"
ID: 55550012-0003-0004-0000-000000000001
(sin condición)
  1. Hasta S/80                 → presupuesto-bajo     → {}
  2. S/80 – S/150               → presupuesto-medio    → {}
  3. S/150 – S/250              → presupuesto-alto     → {}
  4. Más de S/250               → presupuesto-premium  → {}
(informacional para GPT — budgetLabel en prompt)
```

---

### Árbol de rutas posibles

| Objetivo Q1 | Preguntas S2 | Preguntas S3 | Total preguntas |
|-------------|-------------|-------------|----------------|
| obj-belleza + foco-piel | Q2d-B, Q2e, Q2f, Q2l | Q3-0, Q3-1, Q3-2, Q3-3, Q3-4 | 10 |
| obj-belleza + foco-cabello | Q2d-B, Q2g, Q2l | Q3-0, Q3-1, Q3-2, Q3-3, Q3-4 | 9 |
| obj-belleza + foco-colageno | Q2d-B, Q2l | Q3-0, Q3-1, Q3-2, Q3-3, Q3-4 | 8 |
| obj-belleza + foco-antiedad | Q2d-B, Q2f, Q2l | Q3-0, Q3-1, Q3-2, Q3-3, Q3-4 | 9 |
| obj-rendimiento | Q2a, Q2b, Q2c, Q2d-R, Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 10 |
| obj-bienestar + foco-sueno/estres | Q2h, Q2i, Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 8 |
| obj-bienestar + foco-energia/pantallas | Q2h, Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 7 |
| obj-digestivo | Q2j, Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 7 |
| obj-nutricion | Q2k, Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 7 |
| obj-solar | Q2m, Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 7 |
| obj-viaje | Q2n, Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 7 |
| obj-hogar | Q2o, Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 7 |
| obj-pies-cuerpo | Q2p, Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 7 |
| obj-guia | solo Q2l | Q3-0, Q3-1, Q3-3, Q3-4 | 6 |

---

## 3. ANÁLISIS DE SLUG_WEIGHTS

Archivo: `src/app/api/kit/recommend/route.ts`, líneas 15–172

### 3.1 Distribución de pesos por categoría

| Categoría | Slugs que la puntúan | Max pts posibles (ruta típica) |
|-----------|---------------------|-------------------------------|
| `gym` | 23 slugs | ~16 pts (tipo-fuerza + nivel-alto + gym-fuerza + obj-rendimiento) |
| `piel` | 19 slugs | ~14 pts (obj-belleza + foco-piel + piel-grasa + manchas + poros) |
| `bienestar` | 18 slugs | ~9 pts (obj-bienestar + foco-sueno + frecuencia-diaria) |
| `digestivo` | 12 slugs | ~9 pts (obj-digestivo + 2 síntomas multi) |
| `solar` | 7 slugs | ~7 pts (obj-solar + solar-playa) |
| `viaje` | 6 slugs | ~6 pts (obj-viaje + viaje-ciudad) |
| `hogar` | 3 slugs | ~7 pts (obj-hogar + hogar-familiar) |
| `pies-cuerpo` | 5 slugs | ~7 pts (obj-pies-cuerpo + pies-durezas) |

### 3.2 Problemas de coherencia semántica

| Slug | Peso actual | Peso esperado | Problema |
|------|------------|---------------|---------|
| `piel-firmeza` | bienestar:3, piel:2 | piel:3, bienestar:1 | "Firmeza" es preocupación de piel, no bienestar |
| `foco-antiedad` | bienestar:3, piel:2 | piel:3, bienestar:1 | Anti-aging es piel primero |
| `dolor-frecuente` | bienestar:3 | gym:2, bienestar:2 | Dolor frecuente en atletas → necesita producto deportivo, no solo bienestar |
| `prefiere-natural` | digestivo:3 | {} o bienestar:1 | Preferencia de ingredientes ≠ objetivo digestivo |
| `natural-importante` | digestivo:1 | {} | Idem |
| `foco-energia` | digestivo:2, bienestar:2 | bienestar:3 | "Me falta energía" es bienestar puro, digestivo es secundario |
| `cuerpo-muscular` | gym:2, pies-cuerpo:2 | gym:2, pies-cuerpo:2 | ✓ Correcto (divide entre ambas) |

### 3.3 Slugs con peso `{}` (solo informativos)

Los siguientes slugs del quiz activo no suman puntos — son señales solo para GPT:
`obj-guia`, `sin-condicion`, `cond-embarazo`, `cond-medicamentos`, `cond-medica`, `cond-reacciones`, `cond-sintomas`, `sin-restriccion`, `alerg-lactosa`, `alerg-gluten`, `alerg-soya`, `alerg-azucar`, `alerg-cafeina`, `pref-vegano`, `pref-sin-fragancia`, `pref-organico`, `rutina-simple`, `rutina-balanceada`, `rutina-completa`, `rutina-guiada`, `presupuesto-bajo`, `presupuesto-medio`, `presupuesto-alto`, `presupuesto-premium`, `frecuencia-ocasional`, `sin-sensibilidad`, `natural-indiferente`

### 3.4 Slugs en quiz NO cubiertos por `allergyLabels` en GPT

```typescript
// código actual en recommend/route.ts línea 319-324:
const allergyLabels: Record<string, string> = {
  'alerg-lactosa': 'lactosa',
  'alerg-gluten': 'gluten',
  'alerg-soya': 'soya',
  'alerg-piel': 'irritantes cutáneos',
}
// FALTANTES:
// 'alerg-azucar' → 'azúcar'
// 'alerg-cafeina' → 'cafeína'
// 'pref-vegano' → 'ingredientes de origen animal'
// 'pref-sin-fragancia' → 'fragancias sintéticas'
```

---

## 4. LOS 18 KITS PLANTILLA

Todos los kits son `type: "static"` y `is_active: true`.  
**Crítico: `num_variants = 0` en todos** — ningún kit tiene productos vinculados en `kit_products`. La tabla `products` tiene 0 filas. El catálogo del motor de recomendación está vacío.

### 4.1 Kits en home (show_in_home = true)

| Pos | Slug | Nombre | Descripción resumida | Categoría inferida |
|-----|------|--------|---------------------|-------------------|
| 1 | kit-piel-grasa-suave | Kit Piel Grasa Suave | Limpiador + hidratante ligera + SPF + parches | piel |
| 2 | kit-solar-diario | Kit Protección Solar Diaria | Protector facial + labial SPF + guía | solar |
| 3 | kit-calma-cotidiana | Kit Calma Cotidiana | Suplemento calma + infusión relajante + guía | bienestar |
| 4 | kit-descanso-nocturno | Kit Descanso Nocturno | Suplemento descanso + infusión nocturna + antifaz | bienestar |
| 5 | kit-gym-esencial | Kit Gym Esencial | Shaker + proteína/snack + electrolitos + guía | gym |
| 6 | kit-viaje-esencial | Kit Viaje Esencial | Sales + curitas + gel antibacterial + toallitas | viaje |

### 4.2 Kits ocultos en home (show_in_home = false)

| Slug | Nombre | Descripción resumida | Categoría inferida |
|------|--------|---------------------|-------------------|
| kit-piel-sensible-inicio | Kit Piel Sensible Inicio | Limpiador suave + crema calmante + SPF mineral | piel |
| kit-barrera-reparadora | Kit Barrera Reparadora | Limpiador suave + crema barrera + bálsamo | piel |
| kit-sol-outdoor | Kit Sol & Outdoor | SPF corporal + facial + after sun + labial SPF | solar |
| kit-oficina-pantallas | Kit Oficina & Pantallas | Lágrimas + toallitas palpebrales + compresa + bálsamo | bienestar |
| kit-dolor-muscular-leve | Kit Dolor Muscular Leve | Gel frío/calor + compresa + venda + parches | gym |
| kit-playa-outdoor | Kit Playa & Outdoor | SPF mini + repelente + after sun + sales rehidratación | viaje/solar |
| kit-digestivo-basico | Kit Digestivo Básico | Simeticona + antiácido + fibra + infusión | digestivo |
| kit-hidratacion-recuperacion | Kit Hidratación & Recuperación | Sales rehidratación + electrolitos + guía | digestivo/gym |
| kit-primeros-auxilios | Kit Primeros Auxilios Familiar | Gasas + curitas + vendas + antiséptico + termómetro | hogar |
| kit-botiquin-compacto | Kit Botiquín Compacto | Curitas + apósitos + toallitas + gel + mini vendas | hogar |
| kit-pies-frescos | Kit Pies Frescos | Spray pies + spray calzado + crema pies + apósitos ampollas | pies-cuerpo |
| kit-cuerpo-reparador | Kit Cuerpo Reparador | Crema corporal + bálsamo antirozaduras + hidratante manos | pies-cuerpo |

### 4.3 Observaciones sobre la colección

- **8 categorías en DB, 8 cubiertas por kits** ✓
- **piel tiene 3 kits** (grasa, sensible, barrera) pero solo 1 visible en home → los otros dos son invisibles
- **bienestar tiene 3 kits** (calma, descanso, pantallas) → correcto, cubre las 3 ramas
- **gym tiene 2 kits** pero `kit-dolor-muscular-leve` no está en home → usuario de gym solo ve el esencial
- **No existe kit específico para**: foco-colageno, foco-antiedad, obj-nutricion, viaje-aventura, viaje-largo
- **Todos los `benefits: []`** — el campo de beneficios está vacío en todos los kits

---

## 5. MAPEO QUIZ → CATEGORÍA → KIT

### 5.1 Rutas directas (coherentes)

| Camino en quiz | Categoría ganadora | Kit más probable |
|---------------|-------------------|-----------------|
| obj-belleza → foco-piel → piel-grasa | piel (~14 pts) | kit-piel-grasa-suave ✓ |
| obj-belleza → foco-piel → piel-sensible | piel (~12 pts) | kit-piel-sensible-inicio ✓ |
| obj-belleza → foco-piel → piel-seca | piel (~12 pts) | kit-barrera-reparadora ✓ |
| obj-solar → solar-playa | solar (7 pts) | kit-sol-outdoor ✓ |
| obj-solar → solar-diario | solar (6 pts) | kit-solar-diario ✓ |
| obj-bienestar → foco-sueno | bienestar (8 pts) | kit-descanso-nocturno ✓ |
| obj-bienestar → foco-estres | bienestar (6-8 pts) | kit-calma-cotidiana ✓ |
| obj-bienestar → foco-pantallas | bienestar (6 pts) | kit-oficina-pantallas ✓ |
| obj-rendimiento → tipo-fuerza → gym-fuerza | gym (13 pts) | kit-gym-esencial ✓ |
| obj-digestivo → síntomas multi | digestivo (7-9 pts) | kit-digestivo-basico ✓ |
| obj-hogar → hogar-familiar | hogar (7 pts) | kit-primeros-auxilios ✓ |
| obj-hogar → hogar-movil | hogar (5 pts) | kit-botiquin-compacto ✓ |
| obj-viaje → viaje-ciudad | viaje (6 pts) | kit-viaje-esencial ✓ |
| obj-pies-cuerpo → pies-durezas | pies-cuerpo (7 pts) | kit-pies-frescos ✓ |
| obj-pies-cuerpo → cuerpo-rozaduras | pies-cuerpo (6 pts) | kit-cuerpo-reparador ✓ |

### 5.2 Rutas con misrouting detectado

| Camino en quiz | Categoría ganadora | Kit probable | Problema |
|---------------|-------------------|-------------|---------|
| obj-belleza → foco-antiedad → piel-firmeza | bienestar (6 pts) > piel (4 pts) | kit-calma-cotidiana | ⚠️ Usuario anti-aging recibe kit de relajación |
| obj-nutricion → nutricion-base + nutricion-inmune | bienestar (6 pts) > digestivo (2 pts) | kit-calma-cotidiana | ⚠️ Usuario de vitaminas recibe kit de calma |
| obj-guia | todos: 0 pts | vacío / random | ⚠️ Sin señal para el motor |
| obj-viaje → viaje-playa | viaje (5 pts) + solar (2 pts) | kit-viaje-esencial | ⚠️ kit-playa-outdoor sería más adecuado |
| obj-rendimiento → dolor-frecuente | bienestar (3 pts adicionales) | puede contaminar gym | ⚠️ Dolor frecuente en atleta suma a bienestar, no a gym |

---

## 6. GAPS DE COBERTURA

### 6.1 Objetivos sin kit dedicado

| Objetivo | Slugs generados | Kit actual | Problema |
|----------|----------------|-----------|---------|
| `obj-nutricion` | nutricion-energia, nutricion-inmune, nutricion-base, nutricion-andino | → bienestar (calma/descanso) | ⚠️ Usuario quiere vitaminas, recibe kit de sueño |
| `foco-antiedad` | bienestar:3+piel:2 | → bienestar | ⚠️ Anti-aging necesita kit propio (colágeno + piel firme) |
| `foco-colageno` | piel:2+bienestar:2 | → empate (impredecible) | ⚠️ Colágeno no tiene kit |
| `viaje-aventura` | viaje:3 | → kit-viaje-esencial (diseñado para playa/ciudad) | ⚠️ Aventura/senderismo necesita diferente surtido |
| `viaje-largo` | viaje:3 | → kit-viaje-esencial | ⚠️ Vuelo largo necesita diferente surtido (anticoagulación, jet-lag) |

### 6.2 Kits sin ruta de quiz directa

| Kit | Cómo llegaría el usuario |
|-----|------------------------|
| kit-barrera-reparadora | obj-belleza → foco-piel → piel-seca/sensible + preocupaciones específicas |
| kit-oficina-pantallas | obj-bienestar → foco-pantallas (único camino) ✓ |
| kit-dolor-muscular-leve | obj-rendimiento → dolor-leve/frecuente (indirecto — no hay slug específico gym-articulaciones que apunte a este kit) |
| kit-hidratacion-recuperacion | obj-digestivo → digestivo-hinchazon / gym-hidratacion (cruce de ramas) |
| kit-playa-outdoor | obj-viaje → viaje-playa / obj-solar → solar-playa (compite con kits solar) |

### 6.3 Categorías sin preguntas específicas

- **`hogar`**: Solo tiene 1 pregunta de profundización (Q2o — tipo de kit). No hay preguntas sobre composición familiar, uso frecuente, etc.
- **`pies-cuerpo`**: Solo 1 pregunta de profundización (Q2p). Sin seguimiento sobre severidad o duración del problema.

---

## 7. SLUGS HUÉRFANOS Y LEGADO

El SLUG_WEIGHTS contiene **~35 slugs de versiones anteriores** del quiz que ya no existen en la DB pero siguen activos en el código. No rompen la lógica (son ignorados si no hay respuesta con ese slug), pero representan deuda técnica.

### 7.1 Slugs legado activos en SLUG_WEIGHTS

| Grupo | Slugs legado |
|-------|-------------|
| Objetivos | `obj-piel`, `obj-cabello` |
| Género (pregunta eliminada) | `genero-femenino`, `genero-masculino`, `genero-no-especifica` |
| Entrenamiento | `entreno-fuerza`, `entreno-cardio`, `entreno-mixto`, `entreno-hiit` |
| Nivel | `alto-rendimiento`, `elite`, `activo`, `principiante` |
| Articulaciones | `sin-dolor-articular`, `dolor-articular-leve`, `dolor-articular-frecuente` |
| Bienestar | `bienestar-sueno`, `bienestar-estres`, `bienestar-ambos`, `bienestar-frecuente` |
| Nutrición | `nutricion-general`, `nutricion-superalimentos`, `natural-puro`, `reset-exceso` |
| Contexto | `exposicion-solar`, `vacaciones-playa`, `viaje-proximo`, `kit-casa`, `cuidado-pies`, `recuperacion-pies` |
| Generales | `gym`, `skin`, `organico`, `energia`, `energia-mental`, `energia-manana`, `energia-entreno`, `energia-tarde`, `inmune`, `efectivo`, `precio-valor`, `resultados` |

### 7.2 Slugs en quiz sin entrada en SLUG_WEIGHTS

Revisión completa: **todos los slugs activos del quiz tienen entrada en SLUG_WEIGHTS** ✓  
No hay slugs huérfanos en la dirección quiz→weights.

---

## 8. RIESGOS DE SEGURIDAD

### 8.1 🔴 CRÍTICO — Condiciones médicas no llegan al prompt de GPT

**Código afectado:** `src/app/api/kit/recommend/route.ts`, línea 318-325

```typescript
// Estado actual: solo estas 4 alergias llegan al prompt
const allergyLabels: Record<string, string> = {
  'alerg-lactosa': 'lactosa',
  'alerg-gluten': 'gluten',
  'alerg-soya': 'soya',
  'alerg-piel': 'irritantes cutáneos',
}
// La restricción se genera así (línea 375):
`RESTRICCIONES: ${restrictions.length ? `EXCLUIR productos que contengan ${restrictions.join(', ')}` : 'Sin restricciones.'}`
```

**Slugs de seguridad no cubiertos:**

| Slug | Dato del usuario | Riesgo si GPT no lo sabe |
|------|-----------------|--------------------------|
| `cond-embarazo` | Embarazada o en lactancia | GPT puede recomendar suplementos de hierro, melatonina, vitamina A alta dosis u otras sustancias contraindicadas en embarazo |
| `cond-medicamentos` | Toma medicamentos | GPT puede recomendar productos con interacciones (omega-3 + anticoagulantes, magnesio + antibióticos, etc.) |
| `cond-medica` | Condición médica relevante | GPT no ajusta recomendación según condición específica |
| `cond-reacciones` | Reacciones previas a productos | GPT no excluye categorías de productos |
| `cond-sintomas` | Síntomas intensos o persistentes | GPT puede recomendar suplementos en lugar de derivar a médico |
| `alerg-azucar` | Sin azúcar | GPT puede recomendar productos con azúcar añadida |
| `alerg-cafeina` | Sin cafeína | GPT puede recomendar productos energéticos con cafeína |
| `pref-vegano` | Vegano/a | GPT puede recomendar colágeno animal, whey, etc. |

### 8.2 🔴 CRÍTICO — Sin advertencia de "consulta a tu médico"

El texto de `diagnosis` generado por GPT no incluye ningún disclaimer legal/médico obligatorio. Para una tienda de suplementos en Perú:
- DIGEMID requiere que los suplementos no hagan claims de cura o tratamiento
- La plataforma debería mostrar "Consulta a tu médico o nutricionista antes de iniciar cualquier suplementación" junto al resultado

### 8.3 🟠 ALTO — Catálogo vacío en producción

Con `products` en 0 filas:
1. El path de OpenAI recibe `catalogText = ""` → GPT no puede seleccionar productos → devuelve IDs inventados → `kit = []`
2. El fallback de scoring también devuelve `kit = []`
3. El resultado al usuario es un kit vacío — sin feedback claro del error

### 8.4 🟡 MEDIO — Lógica `sin-*` exclusiva solo en multi-select

**Código:** `QuizClient.tsx`, función `handleSelect`

```typescript
if (ningunaId && slug?.startsWith('sin-')) {
  setSelected([optId])  // exclusivo si slug empieza con sin-
}
```

Esto cubre correctamente `sin-condicion` y `sin-restriccion`. Sin embargo:
- El slug `sin-dolor` (S2, rama rendimiento) es **single-choice**, por lo que no pasa por este path → correcto
- Verificado: la lógica `sin-*` exclusiva solo aplica en questions de tipo `multi` ✓

### 8.5 🟡 MEDIO — q_orden = 0 en S3

La pregunta de seguridad tiene `sort_order = 0` en lugar de `1`. Si algún componente usa `sort_order` para validar existencia o usa lógica `> 0`, esta pregunta podría omitirse. Requiere verificar el consumo del campo en el cliente.

---

## 9. SIMULACIÓN DE 12 PERFILES DE USUARIO

*Simulación basada en el scoring de SLUG_WEIGHTS. El resultado de GPT-4o-mini puede variar.*  
*Scores mostrados: solo categorías con puntos positivos.*

---

### Perfil 1 — Ana, 28 años, piel grasa con manchas
**Respuestas:** obj-belleza → foco-piel → piel-grasa → piel-manchas + piel-poros → sin-sensibilidad → natural-indiferente → sin-condicion → sin-restriccion → rutina-balanceada → presupuesto-medio

| Categoría | Puntos |
|-----------|--------|
| piel | 3+3+3+3+2 = **14** |
| bienestar | 0 |

**Kit esperado:** kit-piel-grasa-suave ✅  
**Resultado:** Correcto. Score claro y limpio.

---

### Perfil 2 — Carlos, 32 años, gym fuerza élite
**Respuestas:** obj-rendimiento → tipo-fuerza → nivel-elite → sin-dolor → gym-fuerza → natural-indiferente → sin-condicion → sin-restriccion → rutina-completa → presupuesto-alto

| Categoría | Puntos |
|-----------|--------|
| gym | 3+3+3+1+4 = **14** |

**Kit esperado:** kit-gym-esencial ✅  
**Resultado:** Correcto. Score masivo en gym.

---

### Perfil 3 — María, 45 años, mal sueño frecuente
**Respuestas:** obj-bienestar → foco-sueno → frecuencia-diaria → natural-importante → sin-condicion → sin-restriccion → rutina-simple → presupuesto-bajo

| Categoría | Puntos |
|-----------|--------|
| bienestar | 3+3+2 = **8** |
| digestivo | 1 (por natural-importante) |

**Kit esperado:** kit-descanso-nocturno ✅  
**Resultado:** Correcto. El punto extra en digestivo no interfiere.

---

### Perfil 4 — Lucía, 22 años, playa frecuente
**Respuestas:** obj-solar → solar-playa → natural-indiferente → sin-condicion → sin-restriccion → rutina-simple → presupuesto-bajo

| Categoría | Puntos |
|-----------|--------|
| solar | 3+4 = **7** |

**Kit esperado:** kit-sol-outdoor ✅  
**Resultado:** Correcto. Claramente solar.

---

### Perfil 5 — Valeria, 35 años, viaje a la playa
**Respuestas:** obj-viaje → viaje-playa → natural-indiferente → sin-condicion → sin-restriccion → rutina-simple → presupuesto-medio

| Categoría | Puntos |
|-----------|--------|
| viaje | 3+2 = **5** |
| solar | 2 |

**Kit esperado:** kit-viaje-esencial ⚠️  
**Resultado:** Funcional pero subóptimo. `kit-playa-outdoor` sería más adecuado para viaje de playa. El score de solar (2 pts) no es suficiente para superar viaje (5 pts), así que viaje gana correctamente, pero el kit de viaje esencial no incluye after sun ni repelente.

---

### Perfil 6 — Roberto, 40 años, digestión pesada
**Respuestas:** obj-digestivo → digestivo-hinchazon + digestivo-estrenimiento → prefiere-natural → sin-condicion → sin-restriccion → rutina-balanceada → presupuesto-medio

| Categoría | Puntos |
|-----------|--------|
| digestivo | 3+2+2+3 = **10** |
| gym | 1 (por obj-digestivo) |

**Kit esperado:** kit-digestivo-basico ✅  
**Resultado:** Correcto. Score sólido en digestivo.

---

### Perfil 7 — Sofía, 30 años, vitaminas y superalimentos
**Respuestas:** obj-nutricion → nutricion-base + nutricion-inmune + nutricion-andino → prefiere-natural → sin-condicion → sin-restriccion → rutina-completa → presupuesto-alto

| Categoría | Puntos |
|-----------|--------|
| bienestar | 3+3+3 = **9** |
| digestivo | 1+2+3+3 = **9** |

**Kit esperado:** empate bienestar/digestivo → kit-calma-cotidiana o kit-digestivo-basico ❌  
**Resultado:** MISROUTE GRAVE. La usuaria quiere vitaminas (omega, D3, maca, spirulina). El sistema la lleva a un kit de relajación o digestión. **No existe kit de nutrición/vitaminas.**

---

### Perfil 8 — Elena, 55 años, botiquín familiar
**Respuestas:** obj-hogar → hogar-familiar → natural-indiferente → sin-condicion → sin-restriccion → rutina-simple → presupuesto-alto

| Categoría | Puntos |
|-----------|--------|
| hogar | 3+4 = **7** |

**Kit esperado:** kit-primeros-auxilios ✅  
**Resultado:** Correcto.

---

### Perfil 9 — Diego, 25 años, callos y pies cansados
**Respuestas:** obj-pies-cuerpo → pies-durezas → natural-indiferente → sin-condicion → sin-restriccion → rutina-simple → presupuesto-bajo

| Categoría | Puntos |
|-----------|--------|
| pies-cuerpo | 3+4 = **7** |

**Kit esperado:** kit-pies-frescos ✅  
**Resultado:** Correcto.

---

### Perfil 10 — Patricia, 48 años, anti-aging
**Respuestas:** obj-belleza → foco-antiedad → piel-arrugas + piel-firmeza → natural-importante → sin-sensibilidad → sin-condicion → sin-restriccion → rutina-completa → presupuesto-premium

| Categoría | Puntos |
|-----------|--------|
| bienestar | 3+1+3 = **7** |
| piel | 3+2+2 = **7** |
| digestivo | 1 |

**Kit esperado:** empate piel/bienestar → resultado impredecible ⚠️  
**Resultado:** MISROUTE PROBABLE. Con empate exacto, el orden de iteración en el scoring fallback determina el ganador. GPT puede romper el empate con el `obj-belleza` en el texto de Q&A, pero no hay garantía. **No existe kit anti-aging específico.**

---

### Perfil 11 — Julia, indecisa, quiere ser guiada
**Respuestas:** obj-guia → natural-indiferente → sin-condicion → sin-restriccion → rutina-guiada → presupuesto-medio

| Categoría | Puntos |
|-----------|--------|
| (todas) | **0** |

**Kit esperado:** vacío / random ❌  
**Resultado:** FALLO CRÍTICO. El scoring fallback recibe score 0 en todo → `sortedCats` sin ganador → `kitItems = []` → `catalog.slice(0,5)` que también está vacío → `kit = []`. El usuario que más necesita orientación recibe el resultado más vacío.

---

### Perfil 12 — Carmen, 33 años, embarazada, mal sueño
**Respuestas:** obj-bienestar → foco-sueno → frecuencia-semanal → natural-indiferente → cond-embarazo → alerg-cafeina → rutina-simple → presupuesto-bajo

| Categoría | Puntos |
|-----------|--------|
| bienestar | 3+3+1 = **7** |

**Kit esperado:** kit-descanso-nocturno  
**Riesgo de seguridad:** ❌🔴  
El prompt de GPT recibirá:
- `GÉNERO: Género no especificado`
- `RESTRICCIONES: Sin restricciones.` (cond-embarazo y alerg-cafeina no están en allergyLabels)

GPT puede recomendar: melatonina (no recomendada en embarazo), adaptógenos (ashwagandha, contraindicada), productos con cafeína. **Sin ningún disclaimer de embarazo.**

---

## 10. CORRECCIONES RECOMENDADAS

### 🔴 CRÍTICO

**C1 — Cargar catálogo de productos**
- Acción: poblar `products`, `product_variants`, `product_prices` con los productos reales de LIORA
- Impacto: sin esto, el motor no puede funcionar en absoluto
- Archivo: DB directo

**C2 — Extender `allergyLabels` + pasar condiciones médicas al prompt GPT**
```typescript
// Agregar a recommend/route.ts:
const allergyLabels: Record<string, string> = {
  'alerg-lactosa': 'lactosa',
  'alerg-gluten': 'gluten',
  'alerg-soya': 'soya',
  'alerg-piel': 'irritantes cutáneos',
  'alerg-azucar': 'azúcar añadida',      // ← agregar
  'alerg-cafeina': 'cafeína',            // ← agregar
  'pref-vegano': 'ingredientes de origen animal (colágeno, whey, gelatina)', // ← agregar
}
// Y para condiciones médicas, generar una sección separada en el prompt:
const medicalConditions = allSlugs.filter(s => s.startsWith('cond-'))
// prompt: CONDICIONES MÉDICAS: ${medicalConditions.length ? '...' : 'Ninguna'}
```

**C3 — Dar peso a `obj-guia`**
```typescript
// En SLUG_WEIGHTS, cambiar:
'obj-guia': {},
// por algo como:
'obj-guia': { bienestar: 1, piel: 1, digestivo: 1 }, // señal débil genérica
// Y crear ruta de preguntas adicionales para el usuario indeciso
```

**C4 — Agregar disclaimer médico al resultado**
- El componente de resultado del quiz debe mostrar siempre: *"Estos productos son suplementos de bienestar. Consulta a tu médico antes de iniciar cualquier suplementación, especialmente si estás embarazada, tomando medicamentos o tienes una condición médica."*

---

### 🟠 ALTO

**A1 — Corregir pesos invertidos**
```typescript
// Cambiar en SLUG_WEIGHTS:
'piel-firmeza':  { bienestar: 3, piel: 2 },  // actual
'piel-firmeza':  { piel: 3, bienestar: 1 },   // propuesto

'foco-antiedad': { bienestar: 3, piel: 2 },  // actual
'foco-antiedad': { piel: 3, bienestar: 2 },   // propuesto

'prefiere-natural': { digestivo: 3 },  // actual — sin coherencia
'prefiere-natural': {},                // propuesto — solo informacional para GPT
```

**A2 — Crear kit de nutrición/vitaminas**
- No existe ningún kit para `obj-nutricion`. Un usuario de vitaminas necesita un kit tipo "Kit Vitaminas Esenciales" con omega-3, vitamina D3, complejo B, etc.

**A3 — Añadir path de preguntas para `obj-guia`**
- Actualmente el usuario que selecciona "No sé, guíame" solo ve Q2l (naturaleza) y las preguntas de S3
- Sugerencia: agregar una pregunta filtro como "¿Cuál de estas describe mejor cómo te sientes?" con opciones de síntomas amplios

---

### 🟡 MEDIO

**M1 — Corregir `prefiere-natural` → digestivo**  
El SLUG_WEIGHT `prefiere-natural: { digestivo: 3 }` no tiene coherencia. Debería ser `{}` o `{ bienestar: 1 }`.

**M2 — Corregir `q_orden = 0` en pregunta de seguridad**  
Cambiar a `q_orden = 1` y reordenar las demás preguntas de S3 (+1 a cada una) para mantener convención.

**M3 — Kit anti-aging visible en home**  
Si se crea un kit anti-aging, debería aparecer en home. Actualmente solo hay 1 kit de piel en home (grasa).

**M4 — Poblar `benefits[]` en todos los kits**  
El campo `benefits: []` está vacío en los 18 kits. Esto afecta la visualización en la tienda.

**M5 — Revisar `dolor-frecuente → bienestar: 3`**  
Un atleta con dolor frecuente probablemente necesita un producto de movilidad articular (gym), no un kit de bienestar/relajación.

---

### 🟢 BAJO

**B1 — Limpiar slugs legado de SLUG_WEIGHTS**  
Los ~35 slugs legado no rompen nada pero añaden ruido. Considerar moverlos a un objeto separado `LEGACY_SLUG_WEIGHTS`.

**B2 — Unificar sort_order de Q2d**  
Las dos preguntas con `q_orden = 4` (entrenamiento y belleza) están en ramas separadas, por lo que no hay conflicto funcional, pero si se usan para ordenar en admin puede confundir.

**B3 — Agregar `alerg-piel` al allergyLabels consistentemente**  
`alerg-piel` ya está en allergyLabels (línea 324) con `piel: 1` en SLUG_WEIGHTS pero el texto del allergyLabel es "irritantes cutáneos" — verificar que el producto correcto sea excluido.

---

## 11. VERSIÓN SUGERIDA DEL CUESTIONARIO

Cambios propuestos (solo en la lógica de condiciones y pesos, sin cambios estructurales):

### Nuevas preguntas sugeridas

**Para `obj-guia`** — agregar después de Q1:
```
Q1b [M] — "¿Cuál de estas describe cómo te sientes?"
(cond: obj-guia)
  1. Me siento cansada o sin energía  → obj-bienestar (secundario)
  2. Mi piel o cabello necesita ayuda → obj-belleza (secundario)
  3. Quiero organizarme mejor para el deporte → obj-rendimiento (secundario)
  4. Tengo molestias digestivas → obj-digestivo (secundario)
  5. Necesito vitaminas de base → obj-nutricion (secundario)
```

**Para `obj-nutricion`** — diferenciador de kit:
```
Q2k-plus [S] — "¿Qué formato prefieres?"
(cond: obj-nutricion)
  1. Cápsulas o tabletas
  2. Gomas / gomitas
  3. Polvos o batidos
  4. Cualquiera
```

### Correcciones de SLUG_WEIGHTS sugeridas

```typescript
// v2 SLUG_WEIGHTS — cambios propuestos:
'piel-firmeza':    { piel: 3, bienestar: 1 },         // era bienestar:3, piel:2
'foco-antiedad':   { piel: 3, bienestar: 2 },          // era bienestar:3, piel:2
'prefiere-natural': {},                                 // era digestivo:3
'natural-importante': {},                               // era digestivo:1
'dolor-frecuente': { gym: 2, bienestar: 2 },           // era bienestar:3
'obj-guia':        { bienestar: 1, piel: 1, gym: 1 },  // era {}
'obj-nutricion':   { bienestar: 2, digestivo: 1 },     // mantener + crear kit nuevo
```

### Nuevo kit sugerido

```sql
-- Kit Vitaminas Esenciales (para obj-nutricion)
INSERT INTO kits (slug, name, description, is_active, show_in_home, home_sort_order) VALUES (
  'kit-vitaminas-esenciales',
  'Kit Vitaminas Esenciales',
  'Tu base nutricional diaria. Omega-3, Vitamina D3, Complejo B y Zinc para energía e inmunidad.',
  true, true, 7
);
```

---

## 12. RESUMEN PARA CHATGPT

```
Soy LIORA, una marca peruana de bienestar natural. Tenemos un cuestionario de 6-10 preguntas 
que recoge el objetivo del usuario (piel, gym, bienestar, digestivo, solar, viaje, hogar, pies, 
nutrición o "no sé") y luego preguntas de profundización según la rama seleccionada.

El motor de recomendación:
1. Convierte cada respuesta a un "slug" (ej: obj-belleza, foco-piel, piel-grasa)
2. Suma puntos por categoría usando SLUG_WEIGHTS (tabla de ~100 slugs con pesos)
3. Llama a GPT-4o-mini con el catálogo de productos activos y el Q&A humanizado
4. Si GPT falla, usa el scoring como fallback

Estado actual de los 18 kits plantilla:
- Todos son type="static", is_active=true
- Ninguno tiene productos vinculados aún (catálogo vacío)
- Cubren 8 categorías: piel (3 kits), solar (2), bienestar (3), gym (2), viaje (2), digestivo (2), hogar (2), pies-cuerpo (2)

Problemas principales detectados en auditoría:
1. CRÍTICO: Catálogo vacío (products = 0 filas) → motor no funciona
2. CRÍTICO: Condiciones médicas (embarazo, medicamentos) no llegan al prompt de GPT → riesgo de seguridad
3. CRÍTICO: obj-guia recibe score 0 → resultado vacío para usuarios indeciscos
4. ALTO: piel-firmeza y foco-antiedad tienen pesos invertidos → usuarios anti-aging van a kits de relajación
5. ALTO: No existe kit de vitaminas/nutrición → obj-nutricion va a bienestar

El cuestionario tiene 23 preguntas en DB pero el usuario ve 6-10 según su rama.
La sección 3 ("Para terminar") siempre muestra: seguridad + restricciones + rutina + presupuesto.
Las restricciones dietéticas (vegano, sin cafeína, sin azúcar) no se transmiten correctamente al prompt de GPT.

Para cualquier análisis adicional, el archivo SLUG_WEIGHTS completo está en:
src/app/api/kit/recommend/route.ts (líneas 15-172)
```

---

*Auditoría generada el 12/06/2026. Solo lectura — ningún archivo ni tabla fue modificado.*  
*Fuentes: Supabase DB `skcfrccoexscaiayzjzd` + código fuente del repositorio.*
