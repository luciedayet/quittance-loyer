import { NextResponse, type NextRequest } from "next/server"

import { hashPassword } from "@/lib/auth/password"
import { createSessionCookie } from "@/lib/auth/session"
import { createUser, getUserByEmail } from "@/lib/notion/users"

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { email, password, firstName, lastName, registrationSecret } = body ?? {}

  const expectedSecret = process.env.AUTH_REGISTRATION_SECRET
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "L'inscription n'est pas activée sur ce serveur." },
      { status: 403 },
    )
  }
  if (
    typeof registrationSecret !== "string" ||
    registrationSecret !== expectedSecret
  ) {
    return NextResponse.json(
      { error: "Code d'invitation invalide." },
      { status: 403 },
    )
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 })
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    )
  }
  if (typeof firstName !== "string" || !firstName.trim()) {
    return NextResponse.json({ error: "Prénom invalide." }, { status: 400 })
  }
  if (typeof lastName !== "string" || !lastName.trim()) {
    return NextResponse.json({ error: "Nom invalide." }, { status: 400 })
  }

  try {
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({
      email,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    })

    await createSessionCookie({ userId: user.id, email: user.email })

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
