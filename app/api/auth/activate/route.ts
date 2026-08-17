import { NextResponse, type NextRequest } from "next/server"

import { hashPassword } from "@/lib/auth/password"
import { createSessionCookie } from "@/lib/auth/session"
import { getProfileByPageId } from "@/lib/notion/profiles"
import { activateTenant, getTenantAuthByEmail } from "@/lib/notion/tenants"
import { activateUser, getUserByEmail } from "@/lib/notion/users"

const INVALID_CODE = "Email ou code d'activation invalide."

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { email, code, password } = body ?? {}

  if (
    typeof email !== "string" ||
    typeof code !== "string" ||
    typeof password !== "string"
  ) {
    return NextResponse.json(
      { error: "Champs requis manquants." },
      { status: 400 },
    )
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    )
  }

  const submittedCode = code.trim().toUpperCase()

  try {
    const user = await getUserByEmail(email)
    if (
      user &&
      !user.passwordHash &&
      user.activationCode &&
      user.activationCode === submittedCode
    ) {
      const passwordHash = await hashPassword(password)
      await activateUser(user.id, passwordHash)

      if (user.role === "admin") {
        await createSessionCookie({
          role: "admin",
          userId: user.id,
          email: user.email,
        })
        return NextResponse.json({ redirectTo: "/" }, { status: 201 })
      }

      const profile = user.profilePageId
        ? await getProfileByPageId(user.profilePageId)
        : undefined
      if (!profile) {
        return NextResponse.json(
          { error: "Compte bailleur mal configuré : SCI introuvable." },
          { status: 500 },
        )
      }

      await createSessionCookie({
        role: "bailleur",
        userId: user.id,
        email: user.email,
        profileId: profile.id,
      })
      return NextResponse.json({ redirectTo: `/${profile.id}` }, { status: 201 })
    }

    const tenant = await getTenantAuthByEmail(email)
    if (
      tenant &&
      !tenant.passwordHash &&
      tenant.verificationCode &&
      tenant.verificationCode === submittedCode
    ) {
      const passwordHash = await hashPassword(password)
      await activateTenant(tenant.id, passwordHash)

      const profile = await getProfileByPageId(tenant.profilePageId)
      if (!profile) {
        return NextResponse.json(
          { error: "Compte locataire mal configuré : SCI introuvable." },
          { status: 500 },
        )
      }

      await createSessionCookie({
        role: "locataire",
        tenantId: tenant.id,
        email: tenant.email,
        profileId: profile.id,
      })
      return NextResponse.json(
        { redirectTo: `/${profile.id}/tenants/${tenant.id}` },
        { status: 201 },
      )
    }

    return NextResponse.json({ error: INVALID_CODE }, { status: 401 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
