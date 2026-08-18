// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnalyticsConsent } from '@/components/analytics/AnalyticsConsent'

describe('AnalyticsConsent', () => {
  beforeEach(() => {
    document.cookie = 'liora_analytics_preference=; path=/; max-age=0'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    document.cookie = 'liora_analytics_preference=; path=/; max-age=0'
  })

  it('shows a non-blocking first-visit notice and remembers acceptance', async () => {
    render(<AnalyticsConsent />)
    const accept = await screen.findByRole('button', { name: 'Aceptar' })
    fireEvent.click(accept)
    await waitFor(() => expect(screen.queryByLabelText('Preferencias de analítica')).not.toBeInTheDocument())
    expect(document.cookie).toContain('liora_analytics_preference=accepted')
  })

  it('offers opt-out from configuration', async () => {
    render(<AnalyticsConsent />)
    fireEvent.click(await screen.findByRole('button', { name: 'Configurar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/analytics/opt-out', expect.objectContaining({ method: 'POST' })))
    expect(document.cookie).toContain('liora_analytics_preference=optout')
  })
})
