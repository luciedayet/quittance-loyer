import { NextResponse, type NextRequest } from "next/server"

import { forbiddenResponse, requireSession } from "@/lib/auth/session"
import {
  clearImpersonationCookie,
  createImpersonationCookie,
} from "@/lib/auth/impersonation"
import { getProfilePageId } from "@/lib/notion/profiles"
import { getTenantOwnerProfilePageId } from "@/lib/notion/tenants"

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== "admin") return forbiddenResponse()

  const body = await request.json().catch(() => null)
  const { role, profileId, tenantId } = body ?? {}

  if (role === "bailleur") {
    if (typeof profileId !== "string" || !profileId) {
      return NextResponse.json({ error: "SCI invalide." }, { status: 400 })
    }
    const profilePageId = await getProfilePageId(profileId)
    if (!profilePageId) {
      return NextResponse.json({ error: "SCI introuvable." }, { status: 404 })
    }
    await createImpersonationCookie({ role: "bailleur", profileId })
    return NextResponse.json({ ok: true })
  }

  if (role === "locataire") {
    if (
      typeof profileId !== "string" ||
      !profileId ||
      typeof tenantId !== "string" ||
      !tenantId
    ) {
      return NextResponse.json(
        { error: "SCI ou locataire invalide." },
        { status: 400 },
      )
    }
    const [profilePageId, tenantOwnerPageId] = await Promise.all([
      getProfilePageId(profileId),
      getTenantOwnerProfilePageId(tenantId),
    ])
    if (
      !profilePageId ||
      !tenantOwnerPageId ||
      profilePageId !== tenantOwnerPageId
    ) {
      return NextResponse.json(
        { error: "Locataire introuvable pour cette SCI." },
        { status: 404 },
      )
    }
    await createImpersonationCookie({ role: "locataire", profileId, tenantId })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Rôle invalide." }, { status: 400 })
}

export async function DELETE() {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== "admin") return forbiddenResponse()

  await clearImpersonationCookie()
  return NextResponse.json({ ok: true })
}
