import { notFound } from "next/navigation"

import { assertCanViewTenant } from "@/lib/auth/ownership"
import { TenantQuittancesView } from "@/components/tenants/tenant-quittances-view"
import { getSession } from "@/lib/auth/session"
import { getProfileById } from "@/lib/profiles"
import { getTenantById } from "@/lib/notion/tenants"
import { listQuittancesForTenant } from "@/lib/notion/quittances"

export const dynamic = "force-dynamic"

type TenantQuittancesPageProps = {
  params: Promise<{ profileId: string; tenantId: string }>
}

export default async function TenantQuittancesPage({
  params,
}: TenantQuittancesPageProps) {
  const { profileId, tenantId } = await params
  const session = await getSession()
  if (!session) notFound()

  // Vérifie que le locataire appartient bien à la SCI de l'URL (et pas
  // seulement que le rôle correspond) pour éviter toute fuite entre SCI.
  if (await assertCanViewTenant(session, tenantId)) notFound()

  const profile = await getProfileById(profileId)
  if (!profile) notFound()

  const tenant = await getTenantById(tenantId)
  if (!tenant) notFound()

  const quittances = await listQuittancesForTenant(tenantId)

  return (
    <TenantQuittancesView
      profile={profile}
      tenant={tenant}
      initialQuittances={quittances}
      readOnly={session.role === "locataire"}
      canPreviewAsLocataire={session.role === "admin"}
    />
  )
}
