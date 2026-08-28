"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon } from "@hugeicons/core-free-icons"
import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"
import { ImpersonateDialog } from "@/components/layout/impersonate-dialog"
import { buttonVariants } from "@/components/ui/button"
import type { SessionPayload } from "@/lib/auth/jwt"
import { cn } from "@/lib/utils"

type NavbarProps = {
  role: SessionPayload["role"]
  impersonating?: boolean
}

export function Navbar({ role, impersonating = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
        {impersonating ? (
          <span className="font-heading text-sm font-medium">
            Quittances de loyer
          </span>
        ) : (
          <Link href="/" className="font-heading text-sm font-medium">
            Quittances de loyer
          </Link>
        )}
        <div className="flex items-center gap-1">
          {role === "admin" && !impersonating ? (
            <Link
              href="/admin"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" })
              )}
            >
              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
              <span className="sr-only">Administration</span>
            </Link>
          ) : null}
          {role === "admin" && !impersonating ? <ImpersonateDialog /> : null}
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
