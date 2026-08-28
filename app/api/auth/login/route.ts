import { NextResponse, type NextRequest } from "next/server"

import { verifyPassword } from "@/lib/auth/password"
import { createSessionCookie } from "@/lib/auth/session"
import { getProfileByPageId } from "@/lib/notion/profiles"
import { getTenantAuthByEmail } from "@/lib/notion/tenants"
import { getUserByEmail } from "@/lib/notion/users"

const INVALID_CREDENTIALS = "Email ou mot de passe incorrect."
const NOT_ACTIVATED =
  "Ce compte n'est pas encore activé. Utilise ton code d'activation sur la page \"Première connexion\"."

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { email, password } = body ?? {}

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 }
    )
  }

  try {
    const user = await getUserByEmail(email)
    if (user) {
      if (!user.passwordHash) {
        return NextResponse.json({ error: NOT_ACTIVATED }, { status: 401 })
      }
      if (!(await verifyPassword(password, user.passwordHash))) {
        return NextResponse.json(
          { error: INVALID_CREDENTIALS },
          { status: 401 }
        )
      }

      if (user.role === "admin") {
        await createSessionCookie({
          role: "admin",
          userId: user.id,
          email: user.email,
        })
        return NextResponse.json({ redirectTo: "/" })
      }

      const profile = user.profilePageId
        ? await getProfileByPageId(user.profilePageId)
        : undefined
      if (!profile) {
        return NextResponse.json(
          { error: "Compte bailleur mal configuré : profil introuvable." },
          { status: 500 }
        )
      }

      await createSessionCookie({
        role: "bailleur",
        userId: user.id,
        email: user.email,
        profileId: profile.id,
      })
      return NextResponse.json({ redirectTo: `/${profile.id}` })
    }

    const tenant = await getTenantAuthByEmail(email)
    if (tenant) {
      if (!tenant.passwordHash) {
        return NextResponse.json({ error: NOT_ACTIVATED }, { status: 401 })
      }
      if (!(await verifyPassword(password, tenant.passwordHash))) {
        return NextResponse.json(
          { error: INVALID_CREDENTIALS },
          { status: 401 }
        )
      }

      const profile = await getProfileByPageId(tenant.profilePageId)
      if (!profile) {
        return NextResponse.json(
          { error: "Compte locataire mal configuré : profil introuvable." },
          { status: 500 }
        )
      }

      await createSessionCookie({
        role: "locataire",
        tenantId: tenant.id,
        email: tenant.email,
        profileId: profile.id,
      })
      return NextResponse.json({
        redirectTo: `/${profile.id}/tenants/${tenant.id}`,
      })
    }

    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 }
    )
  }
}
