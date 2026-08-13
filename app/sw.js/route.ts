import { readFileSync } from "node:fs"
import { join } from "node:path"

import { NextResponse } from "next/server"

import { buildServiceWorkerSource } from "@/lib/pwa/service-worker-source"

export const dynamic = "force-dynamic"

function readBuildId(): string | null {
  try {
    return readFileSync(join(process.cwd(), ".next/BUILD_ID"), "utf8").trim()
  } catch {
    return null
  }
}

// Next.js writes a fresh BUILD_ID on every `next build`. Unlike git-sha env
// vars (not set on every host) or Date.now() (evaluated once per server
// process, so it can differ between replicas of the same deployment), the
// BUILD_ID is identical across every instance serving a given build and
// changes on every deploy, which is what makes the update check reliable.
const SW_VERSION =
  readBuildId() ??
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
