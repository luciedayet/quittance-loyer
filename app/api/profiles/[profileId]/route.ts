import { NextResponse, type NextRequest } from "next/server"

import { forbiddenResponse, requireSession } from "@/lib/auth/session"
import { removeProfile, updateProfile } from "@/lib/notion/profiles"
import { listTenants } from "@/lib/notion/tenants"
import { listQuittancesForProfile } from "@/lib/notion/quittances"

type RouteParams = {
  params: Promise<{ profileId: string }>
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const { profileId } = await params

  if (session.role === "locataire") return forbiddenResponse()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    return forbiddenResponse()
  }

  const body = await request.json()
  const {
    sciName,
    managerName,
    city,
    sciAddress,
    propertyShortAddress,
    propertyLines,
  } = body ?? {}

  const updates: Parameters<typeof updateProfile>[1] = {}

  if (sciName !== undefined) {
    if (typeof sciName !== "string" || !sciName.trim()) {
      return NextResponse.json({ error: "Nom de SCI invalide." }, { status: 400 })
    }
    updates.sciName = sciName.trim()
  }

  if (managerName !== undefined) {
    if (typeof managerName !== "string" || !managerName.trim()) {
      return NextResponse.json({ error: "Nom du gérant invalide." }, { status: 400 })
    }
    updates.managerName = managerName.trim()
  }

  if (city !== undefined) {
    if (typeof city !== "string" || !city.trim()) {
      return NextResponse.json({ error: "Ville invalide." }, { status: 400 })
    }
    updates.city = city.trim()
  }

  if (sciAddress !== undefined) {
    if (!isStringArray(sciAddress) || sciAddress.length === 0) {
      return NextResponse.json(
        { error: "Adresse de la SCI invalide." },
        { status: 400 },
      )
    }
    updates.sciAddress = sciAddress
  }

  if (propertyShortAddress !== undefined) {
    if (typeof propertyShortAddress !== "string") {
      return NextResponse.json(
        { error: "Adresse courte du bien invalide." },
        { status: 400 },
      )
    }
    updates.propertyShortAddress = propertyShortAddress
  }

  if (propertyLines !== undefined) {
    if (!isStringArray(propertyLines) || propertyLines.length === 0) {
      return NextResponse.json(
        { error: "Adresse du bien invalide." },
        { status: 400 },
      )
    }
    updates.propertyLines = propertyLines
  }

  try {
    const profile = await updateProfile(profileId, updates)
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== "admin") return forbiddenResponse()

  const { profileId } = await params

  const [tenants, quittances] = await Promise.all([
    listTenants(profileId),
    listQuittancesForProfile(profileId),
  ])

  if (tenants.length > 0) {
    return NextResponse.json(
      { error: "Cette SCI a des locataires. Supprimez-les d'abord." },
      { status: 400 },
    )
  }
  if (quittances.length > 0) {
    return NextResponse.json(
      { error: "Cette SCI a des quittances enregistrées." },
      { status: 400 },
    )
  }

  try {
    await removeProfile(profileId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
