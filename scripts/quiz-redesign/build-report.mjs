import { QUESTIONS, RETIRED, BRANCHES, GROUPS } from './questionnaire.mjs'
import { writeFileSync } from 'node:fs'

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

// Los dos ramos sin inventario propio se marcan distinto: es información, no decoración.
const HUE = {
  piel:'coral', cabello:'rosa', bienestar:'lavanda', digestivo:'menta',
  solar:'mostaza', rendimiento:'durazno', 'pies-cuerpo':'cielo', hogar:'uva-clara',
  nutricion:'compuesta', viaje:'compuesta',
}
const COMPUESTA = {
  nutricion: 'No existe una categoría «nutrición» en el catálogo. Esta rutina se compone desde bienestar y digestivo.',
  viaje: 'La categoría «viaje» existe pero tiene cero productos activos. Esta rutina se compone desde solar, digestivo y hogar.',
}

const byKey = Object.fromEntries(QUESTIONS.map(q => [q.key, q]))
const OPCIONALES = ['q1b','texto','edad','sexo']

// Preguntas condicionales dentro de una rama (no todos las ven)
const CONDICIONAL_INTERNA = new Set(['piel2','bie2'])

function renderQuestion(q, { branchHue } = {}) {
  const tipo = q.type === 'multi' ? 'Varias respuestas' : q.type === 'text' ? 'Texto libre' : 'Una respuesta'
  const badges = []
  badges.push(`<span class="tag tag-tipo">${tipo}</span>`)
  if (!q.required) badges.push('<span class="tag tag-opt">Se puede saltar</span>')
  if (q.maxSelect) badges.push(`<span class="tag">Máx. ${q.maxSelect}</span>`)
  if (q.status === 'keep') badges.push('<span class="tag tag-keep">Se mantiene igual</span>')
  if (CONDICIONAL_INTERNA.has(q.key)) badges.push('<span class="tag tag-cond">Solo a veces</span>')

  const cond = q.conditions?.if_any_slug
    ? `<p class="cond">Aparece si antes eligió <code>${q.conditions.if_any_slug.map(esc).join('</code> o <code>')}</code></p>`
    : ''

  const opts = q.options
    ? `<ol class="opts">${q.options.map(o => `<li${o.render === 'secundaria' ? ' class="sec"' : ''}><span class="otext">${esc(o.text)}</span><code class="oslug">${esc(o.slug)}</code></li>`).join('')}</ol>`
    : `<div class="textfield"><span class="ph">${esc(q.placeholder)}</span><span class="cnt">0 / ${q.maxLength}</span></div>`

  return `<article class="q${branchHue ? ` hue-${branchHue}` : ''}">
  <div class="qhead"><div class="badges">${badges.join('')}</div></div>
  <h4 class="qtext">${esc(q.text)}</h4>
  ${q.subtext ? `<p class="qsub">${esc(q.subtext)}</p>` : ''}
  ${cond}
  ${opts}
  ${q.note ? `<aside class="note"><span class="nlabel">Por qué</span><p>${esc(q.note)}</p></aside>` : ''}
</article>`
}

// ── Bloques ───────────────────────────────────────────────────────────
const bloque1 = ['q1','q1b'].map(k => renderQuestion(byKey[k])).join('')

const ramas = BRANCHES.map(b => {
  const hue = HUE[b.key]
  const oblig = b.questions.filter(k => !CONDICIONAL_INTERNA.has(k)).length
  return `<section class="branch hue-${hue}" id="rama-${b.key}">
  <header class="bhead">
    <span class="bdot"></span>
    <h3>${esc(b.label)}</h3>
    <span class="btrigger">se abre con <code>${b.trigger}</code></span>
    <span class="bcount">${oblig} pantalla${oblig === 1 ? '' : 's'}</span>
  </header>
  ${COMPUESTA[b.key] ? `<p class="compuesta">${esc(COMPUESTA[b.key])}</p>` : ''}
  ${b.questions.map(k => renderQuestion(byKey[k], { branchHue: hue })).join('')}
</section>`
}).join('')

const bloqueTexto = renderQuestion(byKey.texto)
const bloque3 = ['seg1','seg2'].map(k => renderQuestion(byKey[k])).join('')
const bloque4 = ['edad','sexo','ritual'].map(k => renderQuestion(byKey[k])).join('')

// ── Recorrido ─────────────────────────────────────────────────────────
const recorrido = BRANCHES.map(b => {
  const oblig = 1 + b.questions.filter(k => !CONDICIONAL_INTERNA.has(k)).length + 2 + 1
  return `<tr><td>${esc(b.label)}</td><td class="num">${oblig}</td><td class="num">${oblig + 4}</td></tr>`
}).join('')

// ── Trazabilidad ──────────────────────────────────────────────────────
const TRAZA = [
  ['Piel', '«¿Cómo sé si mi piel es seca, grasa o mixta?»', 'Salida «No estoy seguro/a» + la pregunta proxy de media tarde'],
  ['Piel', '«Tengo piel grasa pero se me reseca, ¿qué hago?»', 'Opción «Brillosa y tirante a la vez» → <code>piel-deshidratada</code>'],
  ['Piel', '«¿Retinol, vitamina C o ácido hialurónico?»', '«¿Cómo es tu rutina hoy?» — distingue quien nunca usó activos de quien ya los tolera'],
  ['Piel', '«Quiero una rutina completa, ¿qué compro?»', 'Rutina actual + nivel del ritual'],
  ['Digestión', '«Me siento muy hinchado después de comer»', 'Síntoma <code>digestivo-hinchazon</code> + momento <code>digestivo-postcomida</code>'],
  ['Digestión', '«¿Probióticos o prebióticos?» / «¿Cuándo debo tomarlos?»', 'Momento del síntoma + qué ya tomó'],
  ['Vitaminas', '«No sé qué necesito, ¿me recomiendan según mis objetivos?»', 'Opción <code>nutricion-no-se</code>, y la salida de texto libre en la primera pantalla'],
  ['Vitaminas', '«¿Qué vitaminas para hombres? ¿Y para mujeres? ¿Según la edad?»', 'Las preguntas de edad y sexo, que hoy no existen'],
  ['Vitaminas', '«¿Para qué sirve la vitamina D?»', 'Cuánto sol y aire libre recibe al día'],
  ['Sueño', '«Duermo pero sigo cansado»', 'Opción <code>sueno-no-repara</code>, hoy indistinguible de «no puedo dormir»'],
  ['Sueño', '«¿Magnesio o melatonina?»', 'Patrón de sueño + «¿necesitas estar alerta de día?»'],
  ['Sueño', '«Quiero dormir mejor sin depender del café al día siguiente»', 'La pregunta de cafeína, incluida la franja de la tarde'],
  ['Sol', '«¿SPF 30 o SPF 50?»', 'Fototipo por reacción al sol + tipo de exposición'],
  ['Sol', '«¿Hay protector que no deje la cara blanca?»', 'Opción <code>solar-sin-blanco</code> en la pregunta de textura'],
  ['Sol', '«Me quemé con el sol, ¿qué uso para calmar la piel?»', 'Eje antes / durante / después → <code>solar-post</code>'],
  ['Gym', '«¿Necesito creatina si recién estoy empezando?»', '«¿Qué tomas hoy?» cruzado con cómo y cuánto entrena'],
  ['Gym', '«¿Whey protein o proteína vegetal?»', 'Objetivo de gym cruzado con lactosa y con la preferencia vegana'],
  ['Gym', '«¿Cómo evito sentirme destruido al día siguiente?»', 'Opción <code>gym-friccion-dolor</code>'],
  ['Pies', '«¿Qué uso después de estar todo el día parado?»', 'Horas de pie al día + <code>pies-cansados</code>'],
  ['Pies', '«¿Cómo quito la piel dura?» / «¿Talones agrietados?»', 'Opciones separadas para durezas y talones, más intensivo vs mantenimiento'],
  ['Pies', '«¿Cómo evitar el mal olor de los pies?»', 'Opción <code>pies-olor</code>, que hoy no tiene dónde caer'],
]
const traza = TRAZA.map(([area, preg, donde]) =>
  `<tr><td class="tarea">${esc(area)}</td><td class="tpreg">${esc(preg)}</td><td class="tdonde">${donde}</td></tr>`).join('')

const retiradas = RETIRED.map(r =>
  `<tr><td class="rtext">${esc(r.text)}</td><td>${esc(r.motivo)}</td></tr>`).join('')

const nOpts = QUESTIONS.reduce((s, q) => s + (q.options?.length || 0), 0)
const nNuevas = QUESTIONS.filter(q => q.status === 'new').length

// ── HTML ──────────────────────────────────────────────────────────────
const html = `<title>Cuestionario LIORA v2</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap">
<style>
:root{
  --uva:#3D1A3A; --uva-deep:#2C1129; --uva-soft:#5B3458;
  --crema:#FBF1E2; --crema-deep:#F2E4CB; --arena:#E8DDC5;
  --tinta:#1A0A18; --lima:#C9F048; --lima-deep:#A8D02E;
  --h-coral:#E0654A; --h-rosa:#D95C7E; --h-lavanda:#7A5BBF; --h-menta:#2E8B5F;
  --h-mostaza:#C7920A; --h-durazno:#E8853C; --h-cielo:#2E7FA8; --h-uva-clara:#8E5A89;
  --h-compuesta:#8A7F72;

  --ground:var(--crema); --panel:#FFFFFF; --panel-2:var(--crema-deep);
  --ink:var(--tinta); --ink-2:#5C4A59; --ink-3:#8B7A87;
  --rule:#DFD2BC; --rule-soft:#EBE0CC;
  --accent:var(--uva); --mark:var(--lima);
  --shadow:0 1px 2px rgba(61,26,58,.05), 0 8px 24px -16px rgba(61,26,58,.22);
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --ground:#241020; --panel:#31182D; --panel-2:#3B1F36;
    --ink:#F6EBDD; --ink-2:#CBB4C5; --ink-3:#9C8799;
    --rule:#4B2C45; --rule-soft:#3E2439;
    --accent:var(--lima); --mark:var(--lima);
    --h-coral:#FFB5A8; --h-rosa:#FFC3D0; --h-lavanda:#D4C2F0; --h-menta:#B4E5C9;
    --h-mostaza:#FFD66B; --h-durazno:#FFD2B0; --h-cielo:#BFE0F0; --h-uva-clara:#E8D5E6;
    --h-compuesta:#B5A79A;
    --shadow:0 1px 2px rgba(0,0,0,.3), 0 10px 28px -18px rgba(0,0,0,.6);
  }
}
:root[data-theme="dark"]{
  --ground:#241020; --panel:#31182D; --panel-2:#3B1F36;
  --ink:#F6EBDD; --ink-2:#CBB4C5; --ink-3:#9C8799;
  --rule:#4B2C45; --rule-soft:#3E2439;
  --accent:var(--lima); --mark:var(--lima);
  --h-coral:#FFB5A8; --h-rosa:#FFC3D0; --h-lavanda:#D4C2F0; --h-menta:#B4E5C9;
  --h-mostaza:#FFD66B; --h-durazno:#FFD2B0; --h-cielo:#BFE0F0; --h-uva-clara:#E8D5E6;
  --h-compuesta:#B5A79A;
  --shadow:0 1px 2px rgba(0,0,0,.3), 0 10px 28px -18px rgba(0,0,0,.6);
}

*{box-sizing:border-box}
body{
  margin:0; background:var(--ground); color:var(--ink);
  font-family:'DM Sans',system-ui,sans-serif; font-size:16px; line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.wrap{max-width:56rem; margin:0 auto; padding:0 1.5rem 6rem}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.82em; letter-spacing:-.01em}

/* ── Cabecera ───────────────────────────────────────── */
header.top{padding:5rem 0 3rem; border-bottom:1px solid var(--rule)}
.eyebrow{
  font-size:.72rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  color:var(--ink-3); margin:0 0 1.25rem;
}
h1{
  font-family:'Fraunces',Georgia,serif; font-weight:600; font-size:clamp(2.4rem,6vw,3.9rem);
  line-height:1.02; letter-spacing:-.022em; margin:0 0 1.25rem; text-wrap:balance;
}
h1 em{font-style:normal; color:var(--accent); position:relative; white-space:nowrap}
h1 em::after{
  content:""; position:absolute; left:-.06em; right:-.06em; bottom:.06em; height:.34em;
  background:var(--mark); opacity:.5; z-index:-1; border-radius:2px;
}
.lede{font-size:1.16rem; line-height:1.62; color:var(--ink-2); max-width:44rem; margin:0 0 2rem}
.lede strong{color:var(--ink); font-weight:600}

.stats{display:flex; flex-wrap:wrap; gap:2.5rem; margin-top:2.5rem}
.stat{display:flex; flex-direction:column; gap:.2rem}
.stat b{
  font-family:'Fraunces',Georgia,serif; font-size:2rem; font-weight:600;
  line-height:1; font-variant-numeric:tabular-nums; letter-spacing:-.02em;
}
.stat span{font-size:.8rem; color:var(--ink-3); letter-spacing:.01em}

/* ── Secciones ──────────────────────────────────────── */
section.blk{padding-top:4.5rem}
h2{
  font-family:'Fraunces',Georgia,serif; font-weight:600; font-size:1.85rem;
  letter-spacing:-.016em; margin:0 0 .5rem; text-wrap:balance;
}
.sublede{color:var(--ink-2); margin:0 0 2rem; max-width:42rem}
h3{font-family:'Fraunces',Georgia,serif; font-weight:600; font-size:1.2rem; margin:0; letter-spacing:-.01em}

/* ── Hallazgos ──────────────────────────────────────── */
.finds{display:grid; gap:0; border-top:1px solid var(--rule)}
.find{
  display:grid; grid-template-columns:1fr auto; gap:1rem 2rem; align-items:baseline;
  padding:1.05rem 0; border-bottom:1px solid var(--rule-soft);
}
.find p{margin:0; color:var(--ink-2); font-size:.95rem}
.find p b{color:var(--ink); font-weight:600}
.find .val{
  font-family:'Fraunces',Georgia,serif; font-size:1.05rem; font-weight:600;
  white-space:nowrap; font-variant-numeric:tabular-nums;
}

/* ── Tablas ─────────────────────────────────────────── */
.tbox{overflow-x:auto; border:1px solid var(--rule); border-radius:10px; background:var(--panel)}
table{width:100%; border-collapse:collapse; font-size:.9rem; min-width:34rem}
th{
  text-align:left; font-size:.7rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
  color:var(--ink-3); padding:.85rem 1rem; border-bottom:1px solid var(--rule); white-space:nowrap;
}
td{padding:.8rem 1rem; border-bottom:1px solid var(--rule-soft); vertical-align:top; color:var(--ink-2)}
tr:last-child td{border-bottom:0}
td.num{text-align:right; font-variant-numeric:tabular-nums; font-weight:600; color:var(--ink); width:1%; white-space:nowrap}
.tarea{font-weight:600; color:var(--ink); white-space:nowrap}
.tpreg{color:var(--ink); font-style:italic}
.rtext{color:var(--ink); font-weight:500}

/* ── Pregunta ───────────────────────────────────────── */
.q{
  background:var(--panel); border:1px solid var(--rule); border-radius:12px;
  padding:1.4rem 1.5rem 1.5rem; margin-bottom:1rem; box-shadow:var(--shadow);
  border-left:3px solid var(--hue,var(--uva-soft));
}
.badges{display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:.85rem}
.tag{
  font-size:.66rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  padding:.24rem .5rem; border-radius:4px; background:var(--panel-2); color:var(--ink-3);
  border:1px solid var(--rule-soft);
}
.tag-tipo{color:var(--hue,var(--ink-2)); border-color:currentColor}
.tag-opt,.tag-cond,.tag-keep{background:transparent}
.qtext{
  font-family:'Fraunces',Georgia,serif; font-weight:600; font-size:1.22rem; line-height:1.3;
  margin:0 0 .35rem; color:var(--ink); letter-spacing:-.012em; text-wrap:balance;
}
.qsub{margin:0 0 .5rem; font-size:.92rem; color:var(--ink-2)}
.cond{
  margin:.5rem 0 0; font-size:.8rem; color:var(--ink-3);
}
.cond code{color:var(--hue,var(--ink-2))}

.opts{list-style:none; margin:1rem 0 0; padding:0; display:grid; gap:.3rem}
.opts li{
  display:flex; justify-content:space-between; align-items:baseline; gap:1.25rem;
  padding:.5rem .7rem; border-radius:7px; background:var(--panel-2);
}
.opts li.sec{background:transparent; border:1px dashed var(--rule)}
.otext{color:var(--ink); font-size:.94rem}
.oslug{color:var(--ink-3); font-size:.72rem; white-space:nowrap; flex-shrink:0}

.textfield{
  margin-top:1rem; padding:.9rem 1rem; border:1px dashed var(--rule); border-radius:8px;
  display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; min-height:5.5rem;
}
.ph{color:var(--ink-3); font-size:.92rem; font-style:italic}
.cnt{color:var(--ink-3); font-size:.75rem; font-variant-numeric:tabular-nums; flex-shrink:0}

.note{
  margin:1.1rem 0 0; padding:.75rem 0 0; border-top:1px solid var(--rule-soft);
  display:grid; grid-template-columns:auto 1fr; gap:.75rem; align-items:baseline;
}
.nlabel{
  font-size:.65rem; font-weight:700; letter-spacing:.11em; text-transform:uppercase;
  color:var(--hue,var(--ink-3));
}
.note p{margin:0; font-size:.88rem; line-height:1.55; color:var(--ink-2)}

/* ── Rama ───────────────────────────────────────────── */
.branch{margin-bottom:2.75rem}
.bhead{
  display:flex; align-items:center; gap:.7rem; flex-wrap:wrap;
  padding-bottom:.8rem; margin-bottom:1rem; border-bottom:1px solid var(--rule);
}
.bdot{width:9px; height:9px; border-radius:50%; background:var(--hue); flex-shrink:0}
.btrigger{font-size:.78rem; color:var(--ink-3)}
.btrigger code{color:var(--hue)}
.bcount{
  margin-left:auto; font-size:.72rem; font-weight:700; letter-spacing:.09em;
  text-transform:uppercase; color:var(--ink-3);
}
.compuesta{
  margin:0 0 1rem; padding:.7rem .9rem; border-radius:8px; font-size:.86rem;
  color:var(--ink-2); background:var(--panel-2); border-left:3px solid var(--hue);
}

.hue-coral{--hue:var(--h-coral)} .hue-rosa{--hue:var(--h-rosa)}
.hue-lavanda{--hue:var(--h-lavanda)} .hue-menta{--hue:var(--h-menta)}
.hue-mostaza{--hue:var(--h-mostaza)} .hue-durazno{--hue:var(--h-durazno)}
.hue-cielo{--hue:var(--h-cielo)} .hue-uva-clara{--hue:var(--h-uva-clara)}
.hue-compuesta{--hue:var(--h-compuesta)}
.branch.hue-compuesta .q{border-left-style:dashed}

/* ── Aviso ──────────────────────────────────────────── */
.flag{
  border:1px solid var(--rule); border-left:3px solid var(--h-mostaza);
  background:var(--panel); border-radius:10px; padding:1.25rem 1.4rem; margin:1.5rem 0;
}
.flag h4{
  font-family:'Fraunces',Georgia,serif; font-size:1.02rem; font-weight:600;
  margin:0 0 .45rem; color:var(--ink);
}
.flag p{margin:0 0 .6rem; font-size:.93rem; color:var(--ink-2)}
.flag p:last-child{margin-bottom:0}

ul.plain{margin:0; padding-left:1.15rem; color:var(--ink-2)}
ul.plain li{margin-bottom:.5rem}
ul.plain li b{color:var(--ink); font-weight:600}

.ask{
  margin-top:4.5rem; padding:1.75rem; border-radius:12px;
  background:var(--uva); color:var(--crema); border:1px solid var(--uva);
}
:root[data-theme="dark"] .ask,
:root:not([data-theme="light"]) .ask{}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ask{background:var(--panel-2); border-color:var(--rule)}}
:root[data-theme="dark"] .ask{background:var(--panel-2); border-color:var(--rule)}
.ask h2{color:inherit; margin-bottom:.6rem}
.ask p{color:inherit; opacity:.86; margin:0 0 .8rem; max-width:42rem}
.ask ul{margin:0; padding-left:1.15rem; opacity:.86}
.ask li{margin-bottom:.4rem}
.ask code{opacity:1}
</style>

<div class="wrap">

<header class="top">
  <p class="eyebrow">Rediseño del cuestionario · para revisión de copy</p>
  <h1>El cuestionario deja de preguntar por el <em>estante</em></h1>
  <p class="lede">Hoy cada respuesta existe para sumar puntos a una de ocho categorías del catálogo y terminar eligiendo un kit. Por eso se siente impreciso: <strong>toda la profundidad que aporta el cliente se colapsa en un solo slug de categoría</strong>. La versión nueva describe a la persona y le entrega ese retrato a la IA, que es quien busca los productos.</p>
  <p class="lede">Esto es el guion completo, pantalla por pantalla, con el texto exacto que verá el cliente. <strong>Revísalo antes de que lo escriba en la base de datos.</strong></p>
  <div class="stats">
    <div class="stat"><b>${QUESTIONS.length}</b><span>preguntas</span></div>
    <div class="stat"><b>${nOpts}</b><span>opciones</span></div>
    <div class="stat"><b>${BRANCHES.length}</b><span>ramas</span></div>
    <div class="stat"><b>${RETIRED.length}</b><span>preguntas se retiran</span></div>
  </div>
</header>

<section class="blk">
  <h2>Qué encontramos</h2>
  <p class="sublede">Medido sobre la base de datos de producción y el código, no sobre supuestos.</p>
  <div class="finds">
    <div class="find"><p><b>El cuestionario tiene menos resolución de la que parece.</b> Doscientas variantes simuladas producen ocho salidas distintas.</p><span class="val">200 → 8</span></div>
    <div class="find"><p><b>La IA elige entre 248 productos leyendo solo el nombre.</b> El catálogo ya carga descripción e indicaciones de cada producto, y ninguna llega al prompt.</p><span class="val">0 atributos</span></div>
    <div class="find"><p><b>La rama «guíame» es un callejón sin salida.</b> Sus opciones no disparan ninguna pregunta de profundidad: quien más ayuda necesita entrega menos información que nadie.</p><span class="val">sin rama</span></div>
    <div class="find"><p><b>Cabello es invisible para el motor.</b> Tiene productos vendibles pero ninguna respuesta puede llegar a ellos.</p><span class="val">28 productos</span></div>
    <div class="find"><p><b>La profundidad está muy mal repartida.</b> Piel y gym tienen cuatro preguntas; cabello, solar, digestión, pies y hogar tienen una.</p><span class="val">4 vs 1</span></div>
    <div class="find"><p><b>Nunca se pregunta lo que más determina el producto:</b> edad, sexo, qué usa hoy, formato preferido, para quién es, alimentación ni cafeína.</p><span class="val">7 vacíos</span></div>
    <div class="find"><p><b>Dos preguntas ocupan pantalla sin informar nada.</b> «¿Qué tan importante que sean naturales?» solo cambia el resultado en una de sus tres opciones; «¿Qué tipo de rutina prefieres?» duplica la del nivel del ritual.</p><span class="val">2 de más</span></div>
  </div>
</section>

<section class="blk">
  <h2>Bloque 1 · Qué te trae</h2>
  <p class="sublede">La primera pantalla sigue siendo el gancho. Cambian dos cosas: piel y cabello se separan, y las dos salidas de escape se fusionan en una que lleva al campo abierto.</p>
  ${bloque1}
</section>

<section class="blk">
  <h2>Bloque 2 · Profundidad por área</h2>
  <p class="sublede">Cada rama llega ahora a un nivel comparable. Las preguntas de autodiagnóstico llevan siempre una salida «no estoy seguro/a», y detrás una pregunta que lo deduce por comportamiento observable. Las dos ramas con borde punteado no tienen inventario propio: se componen desde otras categorías.</p>
  ${ramas}
</section>

<section class="blk">
  <h2>El campo abierto</h2>
  <p class="sublede">Una sola pantalla con dos usos. Es el canal que recoge lo que ninguna opción cerrada anticipó — y es como los clientes se expresan de verdad.</p>
  ${bloqueTexto}
  <div class="flag">
    <h4>Cuatro reglas que van con este campo</h4>
    <p><b>El texto no manda.</b> Va al prompt encapsulado como descripción del cliente, nunca como instrucción, con el tope de longitud aplicado en el servidor y no solo en el navegador.</p>
    <p><b>Solo suma banderas de seguridad, nunca las quita.</b> Si alguien escribe que está embarazada pero marcó «Nada de lo siguiente» en la pantalla de salud, la bandera se activa igual. La contradicción se resuelve siempre del lado seguro.</p>
    <p><b>Sin promesas médicas.</b> Ante una condición nombrada por la persona, la respuesta habla de apoyo y bienestar y deriva a consulta profesional; nunca de tratar ni curar.</p>
    <p><b>Va a recoger datos de salud sensibles</b> y quedan guardados con el perfil. Conviene que la política de privacidad lo diga.</p>
  </div>
</section>

<section class="blk">
  <h2>Bloque 3 · Seguridad</h2>
  <p class="sublede">Hoy cinco banderas médicas comparten una lista de trece con ocho preferencias alimentarias, con «Ninguna» de primera y «Embarazo o lactancia» en la posición nueve. Separarlas es lo que evita que se subreporten.</p>
  ${bloque3}
</section>

<section class="blk">
  <h2>Bloque 4 · Cómo lo vas a usar</h2>
  <p class="sublede">Dos preguntas nuevas y una que se mantiene sin tocar. Van al final, cuando la persona ya está comprometida, y las dos nuevas se pueden saltar.</p>
  ${bloque4}
</section>

<section class="blk">
  <h2>Cuánto dura</h2>
  <p class="sublede">Hoy son entre 6 y 9 pantallas. Este es el dato que hay que mirar con más cuidado del documento.</p>
  <div class="tbox">
    <table>
      <thead><tr><th>Ruta</th><th class="num">Obligatorias</th><th class="num">Si responde todo</th></tr></thead>
      <tbody>${recorrido}</tbody>
    </table>
  </div>
  <div class="flag">
    <h4>El cuestionario se alarga, y eso tiene un costo real</h4>
    <p>Siete u ocho pantallas son obligatorias; cuatro más se pueden saltar de un toque. Aun así, cualquier pantalla adicional se paga en abandono, y todavía falta la captura de correo al final.</p>
    <p>Tres cosas lo compensan: la salida de escape en la primera pantalla permite saltarse el árbol entero, las preguntas del bloque 4 llevan un «Saltar» visible, y hay que <b>guardar el progreso</b> — hoy el cuestionario vive solo en memoria y recargar la página lo pierde todo, que con once pantallas es abandono asegurado.</p>
    <p>Ya recortamos dos pantallas respecto del primer borrador: se quitó la pregunta de formatos preferidos y la de orientación para indecisos, que era la primera pregunta reformulada. Si hiciera falta recortar más, el siguiente lugar es la pregunta de objetivos secundarios.</p>
  </div>
</section>

<section class="blk">
  <h2>¿Responde lo que la gente pregunta de verdad?</h2>
  <p class="sublede">Este es el criterio de aceptación: tomamos las consultas reales de clientes y verificamos que el nuevo cuestionario capture lo necesario para responder cada una. Muestra representativa.</p>
  <div class="tbox">
    <table>
      <thead><tr><th>Área</th><th>Lo que pregunta el cliente</th><th>Qué lo captura ahora</th></tr></thead>
      <tbody>${traza}</tbody>
    </table>
  </div>
</section>

<section class="blk">
  <h2>Lo que se retira</h2>
  <p class="sublede">Ninguna pregunta se borra: los perfiles históricos referencian sus identificadores y el motor los resuelve por ahí. Se ocultan con una condición que nunca se cumple, igual que se hizo antes con la pregunta de restricciones.</p>
  <div class="tbox">
    <table>
      <thead><tr><th>Pregunta</th><th>Por qué</th></tr></thead>
      <tbody>${retiradas}</tbody>
    </table>
  </div>
</section>

<section class="blk">
  <h2>Del lado del catálogo</h2>
  <p class="sublede">El cuestionario tiene un techo que no depende de las preguntas. Esto es lo que se hace del otro lado.</p>
  <ul class="plain">
    <li><b>La descripción y las indicaciones ya se van al prompt.</b> Estaban cargadas en prácticamente todos los productos y no llegaban a la IA: ese era el techo real de la personalización. Queda una salvedad — el campo de indicaciones está sucio: en varios productos contiene la lista de ingredientes en vez del «indicado para», así que hay que detectarlo antes de inyectarlo o se mete ruido.</li>
    <li><b>Las etiquetas van al prompt, pero nunca como filtro.</b> Decisión tomada: el catálogo cambia todo el tiempo — se añaden y se retiran productos — así que nada puede quedar amarrado a un producto concreto. Las 74 etiquetas curadas (objetivo, uso, tipo de piel, preferencias, momento y alertas) se envían como texto junto a cada producto para que la IA las use como señal, y las 399 etiquetas de ruido generadas por los importadores se excluyen. Un producto nuevo sin etiquetas sigue funcionando: solo aporta menos señal. Las opciones del cuestionario, en cambio, apuntan a etiquetas que se borraron en junio y se recrearon con otros identificadores — ese mapeo muerto se retira del flujo en vez de repararse.</li>
    <li><b>Los kits curados son mejor material del que estamos usando.</b> Sus 58 pasos están escritos a mano y son buenos. Meter dos o tres en el prompt como ejemplo de referencia es barato y probablemente sube más la calidad percibida que cualquier otro cambio suelto.</li>
  </ul>
</section>

<section class="ask">
  <h2>Qué necesito de ti</h2>
  <p>El copy de arriba es lo que verá el cliente, palabra por palabra. Antes de escribirlo en la base de datos:</p>
  <ul>
    <li>Marca cualquier pregunta u opción cuyo texto quieras cambiar.</li>
    <li>Dime si falta alguna opción en tu experiencia con clientes — sobre todo en las ramas nuevas de cabello, pies y hogar.</li>
    <li>Decide sobre la longitud: 12 pantallas frente a las 6–9 de hoy.</li>
    <li>Confirma si quieres las preguntas de edad y sexo. Son las que más ayudan en vitaminas y antiedad, y también las más personales.</li>
    <li>Revisa la salida de escape de la primera pantalla: ahora es una sola opción para quien no sabe y para quien prefiere escribir.</li>
  </ul>
</section>

</div>`

writeFileSync(new URL('./quiz-v2.html', import.meta.url), html)
console.log('OK', (html.length / 1024).toFixed(0) + ' KB')
