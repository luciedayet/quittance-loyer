import { NextResponse, type NextRequest } from "next/server"

import { assertCanManageTenant } from "@/lib/auth/ownership"
import { requireSession } from "@/lib/auth/session"
import { inviteTenant } from "@/lib/notion/tenants"

type RouteParams = {
  params: Promise<{ tenantId: string }>
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  const { tenantId } = await params

  const ownershipError = await assertCanManageTenant(session, tenantId)
  if (ownershipError) return ownershipError

  const body = await request.json().catch(() => null)
  const { email } = body ?? {}

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Email du locataire invalide." },
      { status: 400 },
    )
  }

  try {
    const result = await inviteTenant(tenantId, email)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
