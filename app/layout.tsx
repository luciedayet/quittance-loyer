import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { UpdateBanner } from "@/components/pwa/update-banner"
import { ThemeProvider } from "@/components/theme-provider"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
        <ThemeProvider>{children}</ThemeProvider>
        <UpdateBanner />
      </body>
    </html>
  )
}
