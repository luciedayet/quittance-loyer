import { redirect } from "next/navigation"

import { AdminPanel } from "@/app/admin/admin-panel"
import { getSession } from "@/lib/auth/session"
import { getProfilesWithPageIds } from "@/lib/notion/profiles"
import { listAllTenants } from "@/lib/notion/tenants"
import { getAllUsers } from "@/lib/notion/users"
import type { NotionUser } from "@/lib/notion/users"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await getSession()
  if (session?.role !== "admin") redirect("/login")

  const [users, allTenants, profilesWithPageIds] = await Promise.all([
    getAllUsers(),
    listAllTenants(),
    getProfilesWithPageIds(),
  ])

  const profiles = profilesWithPageIds.map(({ profile }) => profile)

  // Maps dérivées des profiles
  const sciByPageId: Record<string, string> = {}
  const profilePageIdBySlug: Record<string, string> = {}
  for (const { profile, pageId } of profilesWithPageIds) {
    sciByPageId[pageId] = profile.sciName
    profilePageIdBySlug[profile.id] = pageId
  }

  // Bailleur par profilePageId
  const bailleurByProfilePageId: Record<string, NotionUser> = {}
  for (const user of users) {
    if (user.role === "bailleur" && user.profilePageId) {
      bailleurByProfilePageId[user.profilePageId] = user
    }
  }

  // Nombre de locataires par profileId (slug)
  const tenantCountByProfileId: Record<string, number> = {}
  for (const profile of profiles) {
    tenantCountByProfileId[profile.id] = 0
  }
  for (const tenant of allTenants) {
    if (!tenant.profilePageId) continue
    const sciName = sciByPageId[tenant.profilePageId]
    const profile = profiles.find((p) => p.sciName === sciName)
    if (profile) {
      tenantCountByProfileId[profile.id] = (tenantCountByProfileId[profile.id] ?? 0) + 1
    }
  }

  return (
    <AdminPanel
      users={users}
      tenants={allTenants}
      profiles={profiles}
      sciByPageId={sciByPageId}
      tenantCountByProfileId={tenantCountByProfileId}
      bailleurByProfilePageId={bailleurByProfilePageId}
      profilePageIdBySlug={profilePageIdBySlug}
    />
  )
}
