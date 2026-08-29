"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function buildEmailTemplate({
  email,
  firstName,
  activationCode,
  tenant,
}: {
  email: string
  firstName?: string
  activationCode: string
  tenant?: boolean
}): string {
  const appUrl = window.location.origin
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,"
  if (tenant) {
    return [
      greeting,
      "",
      "Vous avez été invité(e) à accéder à votre espace locataire.",
      "",
      `Rendez-vous sur : ${appUrl}/activation`,
      "",
      "Renseignez ces informations :",
      `• Email : ${email}`,
      `• Code de vérification : ${activationCode}`,
      "",
      "Vous pourrez ensuite définir votre mot de passe.",
    ].join("\n")
  }
  return [
    greeting,
    "",
    "Votre compte a été créé.",
    "",
    `Rendez-vous sur : ${appUrl}/activation`,
    "",
    "Renseignez ces informations :",
    `• Email : ${email}`,
    `• Code d'activation : ${activationCode}`,
    "",
    "Vous pourrez ensuite définir votre mot de passe.",
  ].join("\n")
}

export function EmailModal({
  open,
  onClose,
  email,
  firstName,
  activationCode,
  tenant,
}: {
  open: boolean
  onClose: () => void
  email: string
  firstName?: string
  activationCode: string
  tenant?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const template = open
    ? buildEmailTemplate({ email, firstName, activationCode, tenant })
    : ""

  async function handleCopy() {
    await navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleMailto() {
    const subject = tenant ? "Votre accès locataire" : "Votre accès bailleur"
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(template)}`
    window.open(mailtoUrl, "_blank")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modèle d&apos;invitation</DialogTitle>
        </DialogHeader>
        <pre className="rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
          {template}
        </pre>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? "Copié !" : "Copier le texte"}
          </Button>
          <Button type="button" onClick={handleMailto}>
            Utiliser ma boite mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CopyEmailButton({
  email,
  firstName,
  activationCode,
  tenant,
}: {
  email: string
  firstName?: string
  activationCode: string
  tenant?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const template = buildEmailTemplate({
      email,
      firstName,
      activationCode,
      tenant,
    })
    await navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? "Copié !" : "Copier l'email"}
    </Button>
  )
}
