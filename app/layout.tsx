import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ImpersonationBanner } from "@/components/layout/impersonation-banner"
import { Navbar } from "@/components/layout/navbar"
import { UpdateBanner } from "@/components/pwa/update-banner"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import {
  getImpersonation,
  type ImpersonationPayload,
} from "@/lib/auth/impersonation"
import { getSession } from "@/lib/auth/session"
import { getProfileById } from "@/lib/profiles"
import { getTenantById } from "@/lib/notion/tenants"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Quittances de loyer",
  description:
    "Gérez vos locataires et générez des quittances de loyer pour vos SCI.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quittances",
  },
}

export const viewport: Viewport = {
  themeColor: "#28251f",
}

async function getImpersonationLabel(
  impersonation: ImpersonationPayload
): Promise<string> {
  const profile = await getProfileById(impersonation.profileId)
  const sciName = profile?.sciName ?? "SCI inconnue"

  if (impersonation.role === "bailleur") {
    return `Vue admin : tu navigues en tant que bailleur de ${sciName}.`
  }

  const tenant = await getTenantById(impersonation.tenantId)
  const tenantName = tenant ? `${tenant.civility} ${tenant.name}` : "locataire"
  return `Vue admin : tu navigues en tant que ${tenantName} (${sciName}).`
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  const impersonation = await getImpersonation(session?.role === "admin")
  const impersonationLabel = impersonation
    ? await getImpersonationLabel(impersonation)
    : null

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          {session ? (
            <Navbar
              role={session.role}
              impersonating={Boolean(impersonation)}
            />
          ) : null}
          {impersonationLabel ? (
            <ImpersonationBanner label={impersonationLabel} />
          ) : null}
          {children}
        </ThemeProvider>
        <Toaster />
        <UpdateBanner />
      </body>
    </html>
  )
}
