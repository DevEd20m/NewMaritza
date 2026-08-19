import { describe, expect, it } from 'vitest'
import { quizWelcomeEmail } from '@/lib/email/templates/quiz-welcome'

describe('quiz welcome email', () => {
  it('is branded, Spanish and links only to the private result', () => {
    const html = quizWelcomeEmail({
      resultUrl: 'https://liora.pe/api/quiz/result?token=opaque',
      siteUrl: 'https://liora.pe',
    })

    expect(html).toContain('Tu kit personalizado está listo')
    expect(html).toContain('Ver mi kit personalizado')
    expect(html).toContain('token=opaque')
    expect(html).toContain('no te suscribe')
    expect(html).not.toContain('Confirm your email address')
    expect(html).not.toContain('mail.app.supabase.io')
  })
})
