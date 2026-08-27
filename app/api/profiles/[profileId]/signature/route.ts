import { NextResponse, type NextRequest } from "next/server"

import { forbiddenResponse, requireSession } from "@/lib/auth/session"
import { updateProfile } from "@/lib/notion/profiles"

type RouteParams = {
  params: Promise<{ profileId: string }>
}

async function checkAuth(request: NextRequest, profileId: string) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (session.role === "locataire") return forbiddenResponse()
  if (session.role === "bailleur" && session.profileId !== profileId) {
    return forbiddenResponse()
  }
  return null
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { profileId } = await params
  const authError = await checkAuth(request, profileId)
  if (authError) return authError

  const body = await request.json().catch(() => null)
  const { signatureDataUrl } = body ?? {}

  if (typeof signatureDataUrl !== "string") {
    return NextResponse.json({ error: "Image invalide." }, { status: 400 })
  }
  if (!signatureDataUrl.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "Format d'image non supporté." },
      { status: 400 },
    )
  }

  try {
    const profile = await updateProfile(profileId, {
      signatureSrc: signatureDataUrl,
    })
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { profileId } = await params
  const authError = await checkAuth(request, profileId)
  if (authError) return authError

  try {
    const profile = await updateProfile(profileId, { signatureSrc: "" })
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue." },
      { status: 500 },
    )
  }
}
