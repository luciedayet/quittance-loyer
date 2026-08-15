import { NextResponse, type NextRequest } from "next/server"

import { verifyPassword } from "@/lib/auth/password"
import { createSessionCookie } from "@/lib/auth/session"
import { getUserByEmail } from "@/lib/notion/users"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { email, password } = body ?? {}

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 },
    )
  }

  try {
    const user = await getUserByEmail(email)
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 },
      )
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 },
      )
    }

    await createSessionCookie({ userId: user.id, email: user.email })

    return NextResponse.json({ id: user.id, email: user.email, name: user.name })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
