import { NextResponse, type NextRequest } from "next/server"

import { forbiddenResponse, requireSession } from "@/lib/auth/session"
import { getProfilePageId } from "@/lib/notion/profiles"
import { createBailleurUser } from "@/lib/notion/users"

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== "admin") return forbiddenResponse()

  const body = await request.json().catch(() => null)
  const { email, firstName, lastName, profileId } = body ?? {}

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 })
  }
  if (typeof profileId !== "string" || !profileId) {
    return NextResponse.json({ error: "SCI invalide." }, { status: 400 })
  }

  const profilePageId = await getProfilePageId(profileId)
  if (!profilePageId) {
    return NextResponse.json({ error: "SCI introuvable." }, { status: 404 })
  }

  try {
    const result = await createBailleurUser(
      email,
      typeof firstName === "string" ? firstName : "",
      typeof lastName === "string" ? lastName : "",
      profilePageId,
    )
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
