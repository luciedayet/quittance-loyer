"use client"

import { createContext, useContext } from "react"

import { useBiens } from "@/hooks/use-biens"

type BiensContextValue = ReturnType<typeof useBiens>

const BiensContext = createContext<BiensContextValue | null>(null)

type BiensProviderProps = {
  profileId: string
  children: React.ReactNode
}

/** Partage la liste des biens d'une SCI entre les pages Biens/Locataires/Quittances. */
export function BiensProvider({ profileId, children }: BiensProviderProps) {
  const value = useBiens(profileId)
  return <BiensContext.Provider value={value}>{children}</BiensContext.Provider>
}

export function useBiensContext() {
  const context = useContext(BiensContext)
  if (!context) {
    throw new Error("useBiensContext must be used within a BiensProvider")
  }
  return context
}
