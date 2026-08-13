import { NextResponse, type NextRequest } from "next/server"

import { createTenant, listTenants } from "@/lib/notion/tenants"
import type { TenantCivility } from "@/lib/tenants"

function isValidCivility(value: unknown): value is TenantCivility {
  return value === "M." || value === "Mme"
}

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId")
  if (!profileId) {
    return NextResponse.json(
      { error: "Le paramètre profileId est requis." },
      { status: 400 },
    )
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
  const body = await request.json()
  const { profileId, civility, name, rentAmount, chargesAmount } = body ?? {}

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
    chargesAmount < 0
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
    })
    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
