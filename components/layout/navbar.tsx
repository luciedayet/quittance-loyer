import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-heading text-sm font-medium">
          Quittances de loyer
        </Link>
        <LogoutButton />
      </div>
    </header>
  )
}
