import Link from "next/link"

import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-8 p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-medium">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Un code d&apos;invitation est nécessaire pour créer un compte.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
