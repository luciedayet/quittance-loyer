import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"
import { ImpersonateDialog } from "@/components/layout/impersonate-dialog"
import type { SessionPayload } from "@/lib/auth/jwt"

type NavbarProps = {
  role: SessionPayload["role"]
}

export function Navbar({ role }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-heading text-sm font-medium">
          Quittances de loyer
        </Link>
        <div className="flex items-center gap-1">
          {role === "admin" ? <ImpersonateDialog /> : null}
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
