import { NextResponse, type NextRequest } from "next/server"

import { logQuittance } from "@/lib/notion/quittances"

export async function POST(request: NextRequest) {
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

  try {
    await logQuittance({
      title,
      profileId,
      tenantId,
      periodMonth,
      paymentDate,
      totalAmount,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
