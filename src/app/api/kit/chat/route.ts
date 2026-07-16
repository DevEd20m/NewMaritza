import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  message:      z.string().min(1).max(300),
  kitItems:     z.array(z.string().max(120)).max(10).optional(),
  routineName:  z.string().max(120).optional(),
  routineSteps: z.array(z.string().max(300)).max(10).optional(),
})

// In-memory rate limiter: max 20 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const LIMIT = 20
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  let ctxItems: string[] = []
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ reply: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ reply: 'Mensaje inválido.' }, { status: 400 })
    }

    const { message, kitItems, routineName, routineSteps } = parsed.data
    ctxItems = kitItems ?? []

    // Respuesta de cortesía cuando la IA no está disponible: describir el kit
    // en vez de mostrar un error que parece un bug.
    const offlineReply = routineName
      ? `Ahora mismo no puedo responder preguntas, pero tu ${routineName} incluye: ${(kitItems ?? []).join(', ') || 'los productos que ves arriba'}. Si necesitas ayuda, escríbenos por WhatsApp 💬`
      : `Ahora mismo no puedo responder preguntas, pero tu kit incluye: ${(kitItems ?? []).join(', ') || 'los productos que ves arriba'}. Si necesitas ayuda, escríbenos por WhatsApp 💬`

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: offlineReply })
    }

    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 180,
      messages: [
        {
          role: 'system',
          content: `Eres Lía, asistente de bienestar de LIORA (marca peruana). Eres cálida, experta en nutrición y bienestar.
${routineName ? `Rutina recomendada: ${routineName}.` : ''}
${routineSteps?.length ? `Pasos de la rutina:\n${routineSteps.join('\n')}` : ''}
Kit actual: ${(kitItems ?? []).join(', ') || 'no disponible'}.
Responde en español, máximo 2 oraciones. Sé concisa y útil. Si preguntan de qué trata su kit o rutina, explícalo con los datos de arriba. No respondas preguntas que no sean sobre bienestar, nutrición o los productos del kit.`,
        },
        { role: 'user', content: message },
      ],
    })

    const reply = completion.choices[0]?.message?.content?.trim() ?? 'Entendido. ¿En qué más puedo ayudarte?'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[kit/chat]', err)
    return NextResponse.json({ reply: `Ahora mismo no puedo responder preguntas${ctxItems.length ? `, pero tu kit incluye: ${ctxItems.slice(0, 6).join(', ')}` : ''}. Escríbenos por WhatsApp si necesitas ayuda 💬` })
  }
}
