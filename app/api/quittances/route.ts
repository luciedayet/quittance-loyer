import { NextResponse, type NextRequest } from "next/server"

import { assertCanManageTenant, assertCanViewTenant } from "@/lib/auth/ownership"
import { requireSession } from "@/lib/auth/session"
import { listQuittancesForTenant, logQuittance } from "@/lib/notion/quittances"
import { syncTenantQuittanceDates } from "@/lib/notion/tenants"

export async function GET(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const tenantId = request.nextUrl.searchParams.get("tenantId")
  if (!tenantId) {
    return NextResponse.json(
      { error: "Le paramètre tenantId est requis." },
      { status: 400 },
    )
  }

  const ownershipError = await assertCanViewTenant(session, tenantId)
  if (ownershipError) return ownershipError

  try {
    const quittances = await listQuittancesForTenant(tenantId)
    return NextResponse.json({ quittances })
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
  const { title, profileId, tenantId, periodMonth, paymentDate, totalAmount } =
    body ?? {}

  if (
    typeof title !== "string" ||
    typeof profileId !== "string" ||
    typeof tenantId !== "string" ||
    typeof periodMonth !== "string" ||
    typeof paymentDate !== "string" ||
    typeof totalAmount !== "number"
  ) {
    return NextResponse.json(
      { error: "Données de quittance invalides." },
      { status: 400 },
    )
  }

  const ownershipError = await assertCanManageTenant(session, tenantId)
  if (ownershipError) return ownershipError

  try {
    await logQuittance({
      title,
      profileId,
      tenantId,
      periodMonth,
      paymentDate,
      totalAmount,
    })
    await syncTenantQuittanceDates(tenantId, paymentDate)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
