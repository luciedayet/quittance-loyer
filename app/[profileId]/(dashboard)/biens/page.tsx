import { notFound } from "next/navigation"

import { BiensView } from "@/components/tenants/biens-view"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

type BiensPageProps = {
  params: Promise<{ profileId: string }>
}

export default async function BiensPage({ params }: BiensPageProps) {
  const { profileId } = await params
  const session = await getSession()
  if (!session) notFound()
  if (session.role === "locataire") notFound()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    notFound()
  }

  return <BiensView />
}
