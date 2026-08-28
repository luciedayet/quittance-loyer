import { notFound } from "next/navigation"

import { TenantsBoard } from "@/components/tenants/tenants-board"
import { getSession } from "@/lib/auth/session"
import { getProfileById } from "@/lib/profiles"

export const dynamic = "force-dynamic"

type LocatairesPageProps = {
  params: Promise<{ profileId: string }>
}

export default async function LocatairesPage({ params }: LocatairesPageProps) {
  const { profileId } = await params
  const session = await getSession()
  if (!session) notFound()
  if (session.role === "locataire") notFound()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    notFound()
  }

  const profile = await getProfileById(profileId)

  if (!profile) {
    notFound()
  }

  return <TenantsBoard profile={profile} />
}
