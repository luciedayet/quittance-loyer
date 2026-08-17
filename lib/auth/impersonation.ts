import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export const IMPERSONATION_COOKIE_NAME = "impersonation"
const IMPERSONATION_DURATION = "4h"
const IMPERSONATION_MAX_AGE_SECONDS = 60 * 60 * 4

export type ImpersonationPayload =
  | { role: "bailleur"; profileId: string }
  | { role: "locataire"; profileId: string; tenantId: string }

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET manquant dans les variables d'environnement.")
  }
  return new TextEncoder().encode(secret)
}

function isImpersonationPayload(value: unknown): value is ImpersonationPayload {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>

  if (record.role === "bailleur") {
    return typeof record.profileId === "string"
  }
  if (record.role === "locataire") {
    return (
      typeof record.profileId === "string" &&
      typeof record.tenantId === "string"
    )
  }
  return false
}

async function signImpersonationToken(
  payload: ImpersonationPayload,
): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(IMPERSONATION_DURATION)
    .sign(getSecretKey())
}

async function verifyImpersonationToken(
  token: string,
): Promise<ImpersonationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    })
    return isImpersonationPayload(payload) ? payload : null
  } catch {
    return null
  }
}

export async function createImpersonationCookie(
  payload: ImpersonationPayload,
): Promise<void> {
  const token = await signImpersonationToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATION_MAX_AGE_SECONDS,
  })
}

export async function clearImpersonationCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(IMPERSONATION_COOKIE_NAME)
}

/** Ne renvoie une impersonation que pour une vraie session admin. */
export async function getImpersonation(
  isAdmin: boolean,
): Promise<ImpersonationPayload | null> {
  if (!isAdmin) return null
  const cookieStore = await cookies()
  const token = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value
  if (!token) return null
  return verifyImpersonationToken(token)
}
