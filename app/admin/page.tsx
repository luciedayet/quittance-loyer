import { redirect } from "next/navigation"

import { AdminPanel } from "@/app/admin/admin-panel"
import { getSession } from "@/lib/auth/session"
import { getProfileSciNameByPageId } from "@/lib/notion/profiles"
import { listAllTenants } from "@/lib/notion/tenants"
import { getAllUsers } from "@/lib/notion/users"
import { getProfiles } from "@/lib/profiles"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await getSession()
  if (session?.role !== "admin") redirect("/login")

  const [users, allTenants, profiles, sciByPageId] = await Promise.all([
    getAllUsers(),
    listAllTenants(),
    getProfiles(),
    getProfileSciNameByPageId(),
  ])

  // Nombre de locataires par profileId (slug) pour l'onglet SCIs
  const tenantCountByProfileId: Record<string, number> = {}
  for (const profile of profiles) {
    tenantCountByProfileId[profile.id] = 0
  }
  for (const tenant of allTenants) {
    if (!tenant.profilePageId) continue
    const sciName = sciByPageId.get(tenant.profilePageId)
    const profile = profiles.find((p) => p.sciName === sciName)
    if (profile) {
      tenantCountByProfileId[profile.id] =
        (tenantCountByProfileId[profile.id] ?? 0) + 1
    }
  }

  return (
    <AdminPanel
      users={users}
      tenants={allTenants}
      profiles={profiles}
      sciByPageId={Object.fromEntries(sciByPageId)}
      tenantCountByProfileId={tenantCountByProfileId}
    />
  )
}
