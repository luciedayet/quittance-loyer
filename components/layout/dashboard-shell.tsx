"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import type { Profile } from "@/lib/profiles"
import { cn } from "@/lib/utils"

type DashboardShellProps = {
  profile: Profile
  /** Masque le lien retour vers la liste des SCI (impersonation admin). */
  hideBackLink?: boolean
  children: React.ReactNode
}

const SECTIONS = [
  { href: "", label: "Accueil" },
  { href: "/locataires", label: "Locataires" },
  { href: "/quittances", label: "Quittances" },
  { href: "/acces", label: "Accès" },
  { href: "/profile", label: "Profil" },
]

/** Bandeau de navigation partagé entre les pages Accueil/Locataires/Quittances/Accès/Profil d'une SCI. */
export function DashboardShell({
  profile,
  hideBackLink = false,
  children,
}: DashboardShellProps) {
  const pathname = usePathname()
  const base = `/${profile.id}`

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <div className="space-y-3">
        {hideBackLink ? null : (
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            ← Retour aux SCI
          </Link>
        )}
        <h1 className="font-heading text-2xl font-medium">{profile.sciName}</h1>

        <nav className="flex items-center gap-1 self-start overflow-x-auto rounded-2xl bg-muted p-1 text-sm">
          {SECTIONS.map((section) => {
            const href = `${base}${section.href}`
            const isActive =
              section.href === ""
                ? pathname === base
                : pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={section.href}
                href={href}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-1.5 font-medium text-muted-foreground transition-colors",
                  isActive && "bg-background text-foreground shadow-sm"
                )}
              >
                {section.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {children}
    </div>
  )
}
