import { NextResponse, type NextRequest } from "next/server"

import { forbiddenResponse, requireSession } from "@/lib/auth/session"
import { createProfile } from "@/lib/notion/profiles"
import { getProfiles } from "@/lib/profiles"

export async function GET() {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  if (session.role !== "admin") return forbiddenResponse()

  try {
    const profiles = await getProfiles()
    return NextResponse.json({ profiles })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== "admin") return forbiddenResponse()

  const body = await request.json().catch(() => null)
  const { sciName } = body ?? {}

  if (typeof sciName !== "string" || !sciName.trim()) {
    return NextResponse.json({ error: "Nom de SCI invalide." }, { status: 400 })
  }

  try {
    const profile = await createProfile(sciName.trim())
    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
