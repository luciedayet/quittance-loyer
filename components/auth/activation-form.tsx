"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ActivationForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Erreur lors de l'activation du compte.",
        )
      }

      router.push(data.redirectTo ?? "/")
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de l'activation du compte.",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="activation-email">Email</Label>
        <Input
          id="activation-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="activation-code">Code d&apos;activation</Label>
        <Input
          id="activation-code"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="XXXXXXXX"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="activation-password">Mot de passe</Label>
        <PasswordInput
          id="activation-password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="activation-confirm-password">
          Confirmer le mot de passe
        </Label>
        <PasswordInput
          id="activation-confirm-password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Activation..." : "Définir mon mot de passe"}
      </Button>
    </form>
  )
}
