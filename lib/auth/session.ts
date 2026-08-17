import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { signSessionToken, verifySessionToken, type SessionPayload } from "./jwt"

export const SESSION_COOKIE_NAME = "session"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export async function createSessionCookie(
  payload: SessionPayload,
): Promise<void> {
  const token = await signSessionToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function requireSession(): Promise<SessionPayload | NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: "Authentification requise." },
      { status: 401 },
    )
  }
  return session
}

export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
}
