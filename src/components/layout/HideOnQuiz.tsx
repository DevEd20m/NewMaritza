'use client'
import { usePathname } from 'next/navigation'

export default function HideOnQuiz({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/cuestionario')) return null
  return <>{children}</>
}
