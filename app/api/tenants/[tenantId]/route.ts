import { NextResponse, type NextRequest } from "next/server"

import { assertCanManageTenant } from "@/lib/auth/ownership"
import { requireSession } from "@/lib/auth/session"
import { removeTenant, updateTenant } from "@/lib/notion/tenants"
import { isValidIsoDate, isValidPeriodMonth } from "@/lib/quittance"
import type { RentChange, TenantCivility } from "@/lib/tenants"

function isValidCivility(value: unknown): value is TenantCivility {
  return value === "M." || value === "Mme"
}

function isValidRentChange(value: unknown): value is RentChange {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    Boolean(record.id) &&
    typeof record.effectiveMonth === "string" &&
    isValidPeriodMonth(record.effectiveMonth) &&
    typeof record.rentAmount === "number" &&
    Number.isFinite(record.rentAmount) &&
    record.rentAmount > 0 &&
    typeof record.chargesAmount === "number" &&
    Number.isFinite(record.chargesAmount) &&
    record.chargesAmount >= 0
  )
}

type RouteParams = {
  params: Promise<{ tenantId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const { tenantId } = await params

  const ownershipError = await assertCanManageTenant(session, tenantId)
  if (ownershipError) return ownershipError

  const body = await request.json()
  const {
    civility,
    name,
    rentAmount,
    chargesAmount,
    firstQuittanceDate,
    lastQuittanceDate,
    rentHistory,
  } = body ?? {}

  const updates: Parameters<typeof updateTenant>[1] = {}

  if (civility !== undefined) {
    if (!isValidCivility(civility)) {
      return NextResponse.json(
        { error: "Civilité invalide." },
        { status: 400 },
      )
    }
    updates.civility = civility
  }

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nom invalide." }, { status: 400 })
    }
    updates.name = name.trim()
  }

  if (rentAmount !== undefined) {
    if (typeof rentAmount !== "number" || !Number.isFinite(rentAmount) || rentAmount <= 0) {
      return NextResponse.json({ error: "Loyer invalide." }, { status: 400 })
    }
    updates.rentAmount = rentAmount
  }

  if (chargesAmount !== undefined) {
    if (
      typeof chargesAmount !== "number" ||
      !Number.isFinite(chargesAmount) ||
      chargesAmount < 0
    ) {
      return NextResponse.json({ error: "Charges invalides." }, { status: 400 })
    }
    updates.chargesAmount = chargesAmount
  }

  if (firstQuittanceDate !== undefined) {
    if (firstQuittanceDate !== null && !isValidIsoDate(firstQuittanceDate)) {
      return NextResponse.json(
        { error: "Date de première quittance invalide." },
        { status: 400 },
      )
    }
    updates.firstQuittanceDate = firstQuittanceDate
  }

  if (lastQuittanceDate !== undefined) {
    if (lastQuittanceDate !== null && !isValidIsoDate(lastQuittanceDate)) {
      return NextResponse.json(
        { error: "Date de dernière quittance invalide." },
        { status: 400 },
      )
    }
    updates.lastQuittanceDate = lastQuittanceDate
  }

  if (rentHistory !== undefined) {
    if (!Array.isArray(rentHistory) || !rentHistory.every(isValidRentChange)) {
      return NextResponse.json(
        { error: "Historique de loyer invalide." },
        { status: 400 },
      )
    }
    updates.rentHistory = rentHistory
  }

  try {
    const tenant = await updateTenant(tenantId, updates)
    return NextResponse.json(tenant)
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

  const { tenantId } = await params

  const ownershipError = await assertCanManageTenant(session, tenantId)
  if (ownershipError) return ownershipError

  try {
    await removeTenant(tenantId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
