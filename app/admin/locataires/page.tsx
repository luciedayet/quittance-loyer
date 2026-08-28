import { AdminLocatairesView } from "@/components/admin/admin-locataires-view"
import { getAdminData } from "@/lib/admin-data"

export const dynamic = "force-dynamic"

export default async function AdminLocatairesPage() {
  const { tenants, sciByPageId } = await getAdminData()

  return <AdminLocatairesView tenants={tenants} sciByPageId={sciByPageId} />
}
