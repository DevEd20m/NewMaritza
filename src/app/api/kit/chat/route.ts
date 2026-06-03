import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  message:  z.string().min(1).max(300),
  kitItems: z.array(z.string().max(120)).max(10).optional(),
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

    const { message, kitItems } = parsed.data

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: 'Hola 👋 Puedo ayudarte con preguntas sobre cómo tomar los productos, ingredientes, o si quieres cambiar algo de tu kit.' })
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
Kit actual: ${(kitItems ?? []).join(', ') || 'no disponible'}.
Responde en español, máximo 2 oraciones. Sé concisa y útil. No respondas preguntas que no sean sobre bienestar, nutrición o los productos del kit.`,
        },
        { role: 'user', content: message },
      ],
    })

    const reply = completion.choices[0]?.message?.content?.trim() ?? 'Entendido. ¿En qué más puedo ayudarte?'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[kit/chat]', err)
    return NextResponse.json({ reply: 'Hubo un error. Intenta de nuevo.' })
  }
}
