import { AdminHomeView } from "@/components/admin/admin-home-view"
import { getAdminData } from "@/lib/admin-data"

export const dynamic = "force-dynamic"

export default async function AdminHomePage() {
  const data = await getAdminData()

  return <AdminHomeView data={data} />
}
