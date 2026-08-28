import { NextResponse, type NextRequest } from "next/server"

import { assertCanManageBien } from "@/lib/auth/ownership"
import { requireSession } from "@/lib/auth/session"
import { removeBien, updateBien } from "@/lib/notion/biens"
import { countTenantsForBien } from "@/lib/notion/tenants"

type RouteParams = {
  params: Promise<{ bienId: string }>
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const { bienId } = await params

  const ownershipError = await assertCanManageBien(session, bienId)
  if (ownershipError) return ownershipError

  const body = await request.json()
  const { name, shortAddress, lines } = body ?? {}

  const updates: Parameters<typeof updateBien>[1] = {}

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nom invalide." }, { status: 400 })
    }
    updates.name = name.trim()
  }

  if (shortAddress !== undefined) {
    if (typeof shortAddress !== "string") {
      return NextResponse.json(
        { error: "Adresse courte invalide." },
        { status: 400 }
      )
    }
    updates.shortAddress = shortAddress.trim()
  }

  if (lines !== undefined) {
    if (!isStringArray(lines)) {
      return NextResponse.json({ error: "Adresse invalide." }, { status: 400 })
    }
    updates.lines = lines
  }

  try {
    const bien = await updateBien(bienId, updates)
    return NextResponse.json(bien)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const { bienId } = await params

  const ownershipError = await assertCanManageBien(session, bienId)
  if (ownershipError) return ownershipError

  try {
    const tenantCount = await countTenantsForBien(bienId)
    if (tenantCount > 0) {
      return NextResponse.json(
        { error: "Ce bien a des locataires. Réassignez-les d'abord." },
        { status: 400 }
      )
    }
    await removeBien(bienId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 }
    )
  }
}
