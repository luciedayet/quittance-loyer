import { SignJWT, jwtVerify } from "jose"

const SESSION_DURATION = "7d"

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET manquant dans les variables d'environnement.")
  }
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  userId: string
  email: string
}

function isSessionPayload(value: unknown): value is SessionPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).userId === "string" &&
    typeof (value as Record<string, unknown>).email === "string"
  )
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT(payload)
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
