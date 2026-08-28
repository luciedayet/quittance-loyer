import { notFound } from "next/navigation"

import { QuittancesPageClient } from "@/components/tenants/quittances-page-client"
import { getSession } from "@/lib/auth/session"
import { getProfileById } from "@/lib/profiles"

export const dynamic = "force-dynamic"

type QuittancesPageProps = {
  params: Promise<{ profileId: string }>
}

export default async function QuittancesPage({ params }: QuittancesPageProps) {
  const { profileId } = await params
  const session = await getSession()
  if (!session) notFound()
  if (session.role === "locataire") notFound()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    notFound()
  }

  const profile = await getProfileById(profileId)
  if (!profile) notFound()

  return <QuittancesPageClient profile={profile} />
}
