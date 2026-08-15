import Link from "next/link"
import { Suspense } from "react"

import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-8 p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-medium">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour gérer vos quittances de loyer.
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
