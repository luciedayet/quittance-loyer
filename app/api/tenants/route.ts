import { NextResponse, type NextRequest } from "next/server"

import { forbiddenResponse, requireSession } from "@/lib/auth/session"
import { createTenant, listTenants } from "@/lib/notion/tenants"
import { isValidIsoDate } from "@/lib/quittance"
import type { TenantCivility } from "@/lib/tenants"

function isValidCivility(value: unknown): value is TenantCivility {
  return value === "M." || value === "Mme"
}

function isValidOptionalDate(value: unknown): value is string | null | undefined {
  if (value === undefined || value === null) return true
  return typeof value === "string" && isValidIsoDate(value)
}

export async function GET(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const profileId = request.nextUrl.searchParams.get("profileId")
  if (!profileId) {
    return NextResponse.json(
      { error: "Le paramètre profileId est requis." },
      { status: 400 },
    )
  }

  if (session.role === "locataire") return forbiddenResponse()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    return forbiddenResponse()
  }

  try {
    const tenants = await listTenants(profileId)
    return NextResponse.json({ tenants })
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

  const body = await request.json()
  const {
    profileId,
    civility,
    name,
    rentAmount,
    chargesAmount,
    firstQuittanceDate,
    lastQuittanceDate,
    location,
  } = body ?? {}

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
    !isValidCivility(civility) ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof rentAmount !== "number" ||
    !Number.isFinite(rentAmount) ||
    rentAmount <= 0 ||
    typeof chargesAmount !== "number" ||
    !Number.isFinite(chargesAmount) ||
    chargesAmount < 0 ||
    !isValidOptionalDate(firstQuittanceDate) ||
    !isValidOptionalDate(lastQuittanceDate)
  ) {
    return NextResponse.json(
      { error: "Données de locataire invalides." },
      { status: 400 },
    )
  }

  try {
    const tenant = await createTenant(profileId, {
      civility,
      name: name.trim(),
      rentAmount,
      chargesAmount,
      firstQuittanceDate: firstQuittanceDate ?? null,
      lastQuittanceDate: lastQuittanceDate ?? null,
      location: typeof location === "string" && location.trim() ? location.trim() : null,
    })
    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
