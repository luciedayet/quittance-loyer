import Link from "next/link"

import { ActivationForm } from "@/components/auth/activation-form"

export default function ActivationPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-8 p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-medium">
          Première connexion
        </h1>
        <p className="text-sm text-muted-foreground">
          Entre l&apos;email et le code d&apos;activation que tu as reçus pour
          définir ton mot de passe.
        </p>
      </div>
      <ActivationForm />
      <p className="text-center text-sm text-muted-foreground">
        Déjà activé ton compte ?{" "}
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  )
}
