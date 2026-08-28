import { redirect } from "next/navigation"

import { getImpersonation } from "@/lib/auth/impersonation"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  if (session?.role === "bailleur") redirect(`/${session.profileId}`)
  if (session?.role === "locataire") {
    redirect(`/${session.profileId}/tenants/${session.tenantId}`)
  }

  const impersonation = await getImpersonation(session?.role === "admin")
  if (impersonation?.role === "bailleur") {
    redirect(`/${impersonation.profileId}`)
  }
  if (impersonation?.role === "locataire") {
    redirect(`/${impersonation.profileId}/tenants/${impersonation.tenantId}`)
  }

  if (session?.role === "admin") redirect("/admin")

  redirect("/login")
}
