import { notFound } from "next/navigation"

import { AccesPageClient } from "@/components/tenants/acces-page-client"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

type AccesPageProps = {
  params: Promise<{ profileId: string }>
}

export default async function AccesPage({ params }: AccesPageProps) {
  const { profileId } = await params
  const session = await getSession()
  if (!session) notFound()
  if (session.role === "locataire") notFound()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    notFound()
  }

  return <AccesPageClient />
}
