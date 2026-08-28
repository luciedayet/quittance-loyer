import { notFound } from "next/navigation"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { BiensProvider } from "@/components/tenants/biens-context"
import { TenantsProvider } from "@/components/tenants/tenants-context"
import { getImpersonation } from "@/lib/auth/impersonation"
import { getSession } from "@/lib/auth/session"
import { getProfileById } from "@/lib/profiles"

export const dynamic = "force-dynamic"

type DashboardLayoutProps = {
  children: React.ReactNode
  params: Promise<{ profileId: string }>
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { profileId } = await params
  const session = await getSession()
  if (!session) notFound()
  if (session.role === "locataire") notFound()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    notFound()
  }

  const profile = await getProfileById(profileId)
  if (!profile) notFound()

  const impersonation = await getImpersonation(session.role === "admin")
  const isImpersonating =
    impersonation?.role === "bailleur" && impersonation.profileId === profileId

  return (
    <BiensProvider profileId={profile.id}>
      <TenantsProvider profileId={profile.id}>
        <DashboardShell profile={profile} hideBackLink={isImpersonating}>
          {children}
        </DashboardShell>
      </TenantsProvider>
    </BiensProvider>
  )
}
