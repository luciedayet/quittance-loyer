"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const SECTIONS = [
  { href: "", label: "Accueil" },
  { href: "/bailleurs", label: "Bailleurs" },
  { href: "/locataires", label: "Locataires" },
]

/** Bandeau de navigation partagé entre les pages Accueil/Bailleurs/Locataires de l'administration. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const base = "/admin"

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <div className="space-y-3">
        <h1 className="font-heading text-2xl font-medium">Administration</h1>

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
