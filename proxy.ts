import { NextResponse, type NextRequest } from "next/server"

import { verifySessionToken } from "@/lib/auth/jwt"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session"

function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register"
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null

  if (isAuthPage(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (session) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentification requise." },
      { status: 401 },
    )
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|manifest.webmanifest|sw.js|icons/).*)",
  ],
}
