import { SignJWT, jwtVerify } from "jose"

const SESSION_DURATION = "7d"

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET manquant dans les variables d'environnement.")
  }
  return new TextEncoder().encode(secret)
}

export type SessionPayload =
  | { role: "admin"; userId: string; email: string }
  | { role: "bailleur"; userId: string; email: string; profileId: string }
  | { role: "locataire"; tenantId: string; email: string; profileId: string }

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  if (typeof record.email !== "string") return false

  if (record.role === "admin") {
    return typeof record.userId === "string"
  }
  if (record.role === "bailleur") {
    return (
      typeof record.userId === "string" && typeof record.profileId === "string"
    )
  }
  if (record.role === "locataire") {
    return (
      typeof record.tenantId === "string" && typeof record.profileId === "string"
    )
  }
  return false
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey())
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    })
    return isSessionPayload(payload) ? payload : null
  } catch {
    return null
  }
}
