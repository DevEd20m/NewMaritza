'use client'
import { create } from 'zustand'

export interface QuizAnswer {
  questionId: string
  optionIds: string[]
}

interface QuizState {
  templateId: string | null
  profileId: string | null
  answers: QuizAnswer[]
  currentStep: number
  isComplete: boolean

  setTemplateId: (id: string) => void
  setProfileId: (id: string) => void
  addAnswer: (answer: QuizAnswer) => void
  setCurrentStep: (step: number) => void
  complete: () => void
  reset: () => void
}

export const useQuizStore = create<QuizState>()((set) => ({
  templateId: null,
  profileId: null,
  answers: [],
  currentStep: 0,
  isComplete: false,

  setTemplateId: (id) => set({ templateId: id }),
  setProfileId: (id) => set({ profileId: id }),
  addAnswer: (answer) =>
    set((state) => {
      const existing = state.answers.findIndex((a) => a.questionId === answer.questionId)
      if (existing >= 0) {
        const updated = [...state.answers]
        updated[existing] = answer
        return { answers: updated }
      }
      return { answers: [...state.answers, answer] }
    }),
  setCurrentStep: (step) => set({ currentStep: step }),
  complete: () => set({ isComplete: true }),
  reset: () =>
    set({ templateId: null, profileId: null, answers: [], currentStep: 0, isComplete: false }),
}))
