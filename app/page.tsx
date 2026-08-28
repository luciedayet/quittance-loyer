import Link from "next/link"
import { redirect } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getImpersonation } from "@/lib/auth/impersonation"
import { getSession } from "@/lib/auth/session"
import { getProfiles } from "@/lib/profiles"

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

  const profiles = await getProfiles()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <Link key={profile.id} href={`/${profile.id}`} className="group">
            <Card className="h-full transition-colors group-hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{profile.sciName}</CardTitle>
                <CardDescription>{profile.city}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-primary">
                  Gérer la SCI →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
