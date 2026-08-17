import { NextResponse } from "next/server"

import { clearImpersonationCookie } from "@/lib/auth/impersonation"
import { clearSessionCookie } from "@/lib/auth/session"

export async function POST() {
  await clearSessionCookie()
  await clearImpersonationCookie()
  return NextResponse.json({ ok: true })
}
