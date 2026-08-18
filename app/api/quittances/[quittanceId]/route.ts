import { NextResponse, type NextRequest } from "next/server"

import { assertCanManageTenant } from "@/lib/auth/ownership"
import { requireSession } from "@/lib/auth/session"
import {
  deleteQuittance,
  getQuittanceById,
  listQuittancesForTenant,
  updateQuittance,
  type QuittanceUpdateInput,
} from "@/lib/notion/quittances"
import { setTenantQuittanceDates } from "@/lib/notion/tenants"
import { isValidIsoDate, isValidPeriodMonth } from "@/lib/quittance"

type RouteParams = {
  params: Promise<{ quittanceId: string }>
}

async function resyncTenantQuittanceDates(tenantId: string): Promise<void> {
  const remaining = await listQuittancesForTenant(tenantId)
  const paymentDates = remaining
    .map((quittance) => quittance.paymentDate)
    .filter((date): date is string => Boolean(date))
    .sort()

  await setTenantQuittanceDates(
    tenantId,
    paymentDates[0] ?? null,
    paymentDates[paymentDates.length - 1] ?? null,
  )
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const { quittanceId } = await params
  const quittance = await getQuittanceById(quittanceId)
  if (!quittance) {
    return NextResponse.json(
      { error: "Quittance introuvable." },
      { status: 404 },
    )
  }

  const ownershipError = await assertCanManageTenant(
    session,
    quittance.tenantId,
  )
  if (ownershipError) return ownershipError

  const body = await request.json().catch(() => null)
  const { periodMonth, paymentDate, totalAmount } = body ?? {}

  const updates: QuittanceUpdateInput = {}

  if (periodMonth !== undefined) {
    if (typeof periodMonth !== "string" || !isValidPeriodMonth(periodMonth)) {
      return NextResponse.json(
        { error: "Mois concerné invalide." },
        { status: 400 },
      )
    }
    updates.periodMonth = periodMonth
  }

  if (paymentDate !== undefined) {
    if (typeof paymentDate !== "string" || !isValidIsoDate(paymentDate)) {
      return NextResponse.json(
        { error: "Date de paiement invalide." },
        { status: 400 },
      )
    }
    updates.paymentDate = paymentDate
  }

  if (totalAmount !== undefined) {
    if (
      typeof totalAmount !== "number" ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Montant total invalide." },
        { status: 400 },
      )
    }
    updates.totalAmount = totalAmount
  }

  try {
    const updated = await updateQuittance(quittanceId, updates)
    if (updates.paymentDate !== undefined) {
      await resyncTenantQuittanceDates(quittance.tenantId)
    }
    return NextResponse.json(updated)
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

  const { quittanceId } = await params
  const quittance = await getQuittanceById(quittanceId)
  if (!quittance) {
    return NextResponse.json(
      { error: "Quittance introuvable." },
      { status: 404 },
    )
  }

  const ownershipError = await assertCanManageTenant(
    session,
    quittance.tenantId,
  )
  if (ownershipError) return ownershipError

  try {
    await deleteQuittance(quittanceId)
    await resyncTenantQuittanceDates(quittance.tenantId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
