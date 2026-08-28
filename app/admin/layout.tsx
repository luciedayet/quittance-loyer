import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin/admin-shell"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (session?.role !== "admin") redirect("/login")

  return <AdminShell>{children}</AdminShell>
}
