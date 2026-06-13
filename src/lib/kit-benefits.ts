import { Lightning, ArrowsClockwise, ShieldCheck, Leaf, Sparkle, Heart, Moon, Drop, type Icon } from '@phosphor-icons/react'

export interface KitBenefit {
  icon: string
  title: string
  desc: string
}

// Iconos disponibles para beneficios de kits — compartido entre el card público y el admin
export const BENEFIT_ICONS: Record<string, { icon: Icon; label: string }> = {
  energia:      { icon: Lightning,       label: 'Energía' },
  recuperacion: { icon: ArrowsClockwise, label: 'Recuperación' },
  proteccion:   { icon: ShieldCheck,     label: 'Protección' },
  natural:      { icon: Leaf,            label: 'Natural' },
  brillo:       { icon: Sparkle,         label: 'Brillo' },
  bienestar:    { icon: Heart,           label: 'Bienestar' },
  sueno:        { icon: Moon,            label: 'Sueño' },
  hidratacion:  { icon: Drop,            label: 'Hidratación' },
}

export function getBenefitIcon(key: string): Icon {
  return BENEFIT_ICONS[key]?.icon ?? Sparkle
}
