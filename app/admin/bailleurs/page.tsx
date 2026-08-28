import { AdminBailleursView } from "@/components/admin/admin-bailleurs-view"
import { getAdminData } from "@/lib/admin-data"

export const dynamic = "force-dynamic"

export default async function AdminBailleursPage() {
  const {
    profiles,
    tenantCountByProfileId,
    bailleurByProfilePageId,
    profilePageIdBySlug,
  } = await getAdminData()

  return (
    <AdminBailleursView
      profiles={profiles}
      tenantCountByProfileId={tenantCountByProfileId}
      bailleurByProfilePageId={bailleurByProfilePageId}
      profilePageIdBySlug={profilePageIdBySlug}
    />
  )
}
