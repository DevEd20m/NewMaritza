'use client'
import { create } from 'zustand'

interface UIState {
  searchOpen: boolean
  mobileMenuOpen: boolean
  setSearchOpen: (v: boolean) => void
  setMobileMenuOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  searchOpen: false,
  mobileMenuOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
}))
