import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, kitItems } = await req.json()

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
Kit actual: ${(kitItems as string[])?.join(', ') ?? 'no disponible'}.
Responde en español, máximo 2 oraciones. Sé concisa y útil.`,
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
