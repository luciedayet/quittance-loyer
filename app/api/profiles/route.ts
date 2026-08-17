import { NextResponse } from "next/server"

import { forbiddenResponse, requireSession } from "@/lib/auth/session"
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
