import { NextResponse, type NextRequest } from "next/server"

import { verifySessionToken, type SessionPayload } from "@/lib/auth/jwt"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session"
import { IMPERSONATION_COOKIE_NAME } from "@/lib/auth/impersonation"

function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/activation"
}

function homeFor(session: SessionPayload): string {
  if (session.role === "bailleur") return `/${session.profileId}`
  if (session.role === "locataire") {
    return `/${session.profileId}/tenants/${session.tenantId}`
  }
  return "/admin"
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
      return NextResponse.redirect(new URL(homeFor(session), request.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      )
    }
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session.role === "admin") {
    const isImpersonating = Boolean(
      request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value
    )
    if (pathname === "/" && !isImpersonating) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.next()
  }

  // Les routes API appliquent elles-mêmes les vérifications de propriété
  // (defense in depth) ; le proxy ne fait que router les pages.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (session.role === "bailleur") {
    if (pathname === "/") {
      return NextResponse.redirect(new URL(homeFor(session), request.url))
    }
    const [rootSegment] = pathname.split("/").filter(Boolean)
    if (rootSegment !== session.profileId) {
      return NextResponse.redirect(new URL(homeFor(session), request.url))
    }
    return NextResponse.next()
  }

  // role === "locataire" : accès à sa seule page de quittances.
  if (pathname !== homeFor(session)) {
    return NextResponse.redirect(new URL(homeFor(session), request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|manifest.webmanifest|sw.js|icons/).*)",
  ],
}
