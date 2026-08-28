import { getProfilesWithPageIds } from "@/lib/notion/profiles"
import { listAllTenants } from "@/lib/notion/tenants"
import { getAllUsers } from "@/lib/notion/users"
import type { NotionUser } from "@/lib/notion/users"

/** Données agrégées partagées entre les pages de l'administration. */
export async function getAdminData() {
  const [users, tenants, profilesWithPageIds] = await Promise.all([
    getAllUsers(),
    listAllTenants(),
    getProfilesWithPageIds(),
  ])

  const profiles = profilesWithPageIds.map(({ profile }) => profile)

  const sciByPageId: Record<string, string> = {}
  const profilePageIdBySlug: Record<string, string> = {}
  for (const { profile, pageId } of profilesWithPageIds) {
    sciByPageId[pageId] = profile.sciName
    profilePageIdBySlug[profile.id] = pageId
  }

  const bailleurByProfilePageId: Record<string, NotionUser> = {}
  for (const user of users) {
    if (user.role === "bailleur" && user.profilePageId) {
      bailleurByProfilePageId[user.profilePageId] = user
    }
  }

  const tenantCountByProfileId: Record<string, number> = {}
  for (const profile of profiles) {
    tenantCountByProfileId[profile.id] = 0
  }
  for (const tenant of tenants) {
    if (!tenant.profilePageId) continue
    const sciName = sciByPageId[tenant.profilePageId]
    const profile = profiles.find((p) => p.sciName === sciName)
    if (profile) {
      tenantCountByProfileId[profile.id] =
        (tenantCountByProfileId[profile.id] ?? 0) + 1
    }
  }

  return {
    users,
    tenants,
    profiles,
    sciByPageId,
    tenantCountByProfileId,
    bailleurByProfilePageId,
    profilePageIdBySlug,
  }
}

export type AdminData = Awaited<ReturnType<typeof getAdminData>>
