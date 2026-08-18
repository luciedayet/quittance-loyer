import { notFound } from "next/navigation"

import { ProfileSettingsView } from "@/components/tenants/profile-settings-view"
import { getSession } from "@/lib/auth/session"
import { getProfileById } from "@/lib/profiles"

export const dynamic = "force-dynamic"

type ProfileSettingsPageProps = {
  params: Promise<{ profileId: string }>
}

export default async function ProfileSettingsPage({
  params,
}: ProfileSettingsPageProps) {
  const { profileId } = await params
  const session = await getSession()
  if (!session) notFound()
  if (session.role === "locataire") notFound()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    notFound()
  }

  const profile = await getProfileById(profileId)
  if (!profile) notFound()

  return <ProfileSettingsView profile={profile} />
}
