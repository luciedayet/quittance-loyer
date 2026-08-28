import { NextResponse, type NextRequest } from "next/server"

import { forbiddenResponse, requireSession } from "@/lib/auth/session"
import { createBien, listBiens } from "@/lib/notion/biens"

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

export async function GET(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const profileId = request.nextUrl.searchParams.get("profileId")
  if (!profileId) {
    return NextResponse.json(
      { error: "Le paramètre profileId est requis." },
      { status: 400 }
    )
  }

  if (session.role === "locataire") return forbiddenResponse()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    return forbiddenResponse()
  }

  try {
    const biens = await listBiens(profileId)
    return NextResponse.json({ biens })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const body = await request.json()
  const { profileId, name, shortAddress, lines } = body ?? {}

  if (session.role === "locataire") return forbiddenResponse()
  if (
    session.role === "bailleur" &&
    typeof profileId === "string" &&
    session.profileId !== profileId
  ) {
    return forbiddenResponse()
  }

  if (
    typeof profileId !== "string" ||
    typeof name !== "string" ||
    !name.trim() ||
    (shortAddress !== undefined && typeof shortAddress !== "string") ||
    !isStringArray(lines)
  ) {
    return NextResponse.json(
      { error: "Données de bien invalides." },
      { status: 400 }
    )
  }

  try {
    const bien = await createBien(profileId, {
      name: name.trim(),
      shortAddress:
        typeof shortAddress === "string" ? shortAddress.trim() : undefined,
      lines,
    })
    return NextResponse.json(bien, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 }
    )
  }
}
