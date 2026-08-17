"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type ImpersonationBannerProps = {
  label: string
}

export function ImpersonationBanner({ label }: ImpersonationBannerProps) {
  const router = useRouter()
  const [stopping, setStopping] = useState(false)

  async function handleStop() {
    setStopping(true)
    await fetch("/api/impersonate", { method: "DELETE" }).catch(() => null)
    router.push("/")
    router.refresh()
  }

  return (
    <div className="border-b border-amber-600/30 bg-amber-500/15 text-amber-900 dark:text-amber-200">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-2 text-sm">
        <p className="font-medium">{label}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleStop}
          disabled={stopping}
        >
          {stopping ? "Sortie…" : "Quitter l'impersonation"}
        </Button>
      </div>
    </div>
  )
}
