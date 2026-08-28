"use client"

import { createContext, useContext } from "react"

import { useTenants } from "@/hooks/use-tenants"

type TenantsContextValue = ReturnType<typeof useTenants>

const TenantsContext = createContext<TenantsContextValue | null>(null)

type TenantsProviderProps = {
  profileId: string
  children: React.ReactNode
}

/** Partage la liste des locataires d'un bailleur entre les pages Locataires/Quittances/Accès. */
export function TenantsProvider({ profileId, children }: TenantsProviderProps) {
  const value = useTenants(profileId)
  return (
    <TenantsContext.Provider value={value}>{children}</TenantsContext.Provider>
  )
}

export function useTenantsContext() {
  const context = useContext(TenantsContext)
  if (!context) {
    throw new Error("useTenantsContext must be used within a TenantsProvider")
  }
  return context
}
