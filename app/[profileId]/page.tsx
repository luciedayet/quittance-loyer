import { notFound } from "next/navigation"

import { TenantsBoard } from "@/components/tenants/tenants-board"
import { getProfileById } from "@/lib/profiles"

export const dynamic = "force-dynamic"

type ProfilePageProps = {
  params: Promise<{ profileId: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { profileId } = await params
  const profile = await getProfileById(profileId)

  if (!profile) {
    notFound()
  }

  return <TenantsBoard profile={profile} />
}
