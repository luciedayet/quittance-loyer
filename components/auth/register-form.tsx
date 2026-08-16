"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [registrationSecret, setRegistrationSecret] = useState("")
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          registrationSecret,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error ?? "Erreur lors de la création du compte.")
      }

      router.push("/")
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de la création du compte.",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="register-first-name">Prénom</Label>
          <Input
            id="register-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="register-last-name">Nom</Label>
          <Input
            id="register-last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-password">Mot de passe</Label>
        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-confirm-password">
          Confirmer le mot de passe
        </Label>
        <PasswordInput
          id="register-confirm-password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-secret">Code d&apos;invitation</Label>
        <Input
          id="register-secret"
          type="password"
          value={registrationSecret}
          onChange={(event) => setRegistrationSecret(event.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Création..." : "Créer le compte"}
      </Button>
    </form>
  )
}
