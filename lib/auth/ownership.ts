import { NextResponse } from "next/server"

import type { SessionPayload } from "@/lib/auth/jwt"
import { forbiddenResponse } from "@/lib/auth/session"
import { getProfilePageId } from "@/lib/notion/profiles"
import { getTenantOwnerProfilePageId } from "@/lib/notion/tenants"

async function ownsTenantProfile(
  profileId: string,
  tenantId: string,
): Promise<boolean> {
  const [tenantOwnerPageId, sessionProfilePageId] = await Promise.all([
    getTenantOwnerProfilePageId(tenantId),
    getProfilePageId(profileId),
  ])
  return Boolean(
    tenantOwnerPageId &&
      sessionProfilePageId &&
      tenantOwnerPageId === sessionProfilePageId,
  )
}

/** Peut modifier/supprimer/inviter ce locataire : admin, ou bailleur propriétaire. */
export async function assertCanManageTenant(
  session: SessionPayload,
  tenantId: string,
): Promise<NextResponse | null> {
  if (session.role === "admin") return null
  if (session.role === "locataire") return forbiddenResponse()

  const owns = await ownsTenantProfile(session.profileId, tenantId)
  return owns ? null : forbiddenResponse()
}

/** Peut consulter les quittances de ce locataire : admin, bailleur propriétaire, ou le locataire lui-même. */
export async function assertCanViewTenant(
  session: SessionPayload,
  tenantId: string,
): Promise<NextResponse | null> {
  if (session.role === "admin") return null
  if (session.role === "locataire") {
    return session.tenantId === tenantId ? null : forbiddenResponse()
  }

  const owns = await ownsTenantProfile(session.profileId, tenantId)
  return owns ? null : forbiddenResponse()
}
