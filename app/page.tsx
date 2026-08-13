import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getProfiles } from "@/lib/profiles"

export const dynamic = "force-dynamic"

export default async function Page() {
  const profiles = await getProfiles()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 p-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-medium">
          Quittances de loyer
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Choisissez une SCI pour gérer vos locataires et générer des quittances
          de loyer au format PDF.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <Link key={profile.id} href={`/${profile.id}`} className="group">
            <Card className="h-full transition-colors group-hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{profile.sciName}</CardTitle>
                <CardDescription>{profile.city}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {profile.property.lines[0]}
                </p>
                <p className="mt-3 text-sm font-medium text-primary">
                  Gérer les locataires →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
