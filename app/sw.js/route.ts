import { NextResponse } from "next/server"

import { buildServiceWorkerSource } from "@/lib/pwa/service-worker-source"

export const dynamic = "force-dynamic"

const SW_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.SOURCE_VERSION ??
  process.env.GIT_COMMIT_SHA ??
  String(Date.now())

export function GET() {
  return new NextResponse(buildServiceWorkerSource(SW_VERSION), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  })
}
