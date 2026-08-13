"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useServiceWorkerUpdate } from "@/hooks/use-service-worker-update"

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate()
  const [dismissed, setDismissed] = useState(false)
  const [previousUpdateAvailable, setPreviousUpdateAvailable] =
    useState(updateAvailable)

  if (updateAvailable !== previousUpdateAvailable) {
    setPreviousUpdateAvailable(updateAvailable)
    if (updateAvailable) setDismissed(false)
  }

  const open = updateAvailable && !dismissed

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setDismissed(true)
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouvelle version disponible</DialogTitle>
          <DialogDescription>
            Une mise à jour de l&apos;application est prête à être installée.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDismissed(true)}>
            Mettre à jour plus tard
          </Button>
          <Button onClick={applyUpdate}>Mettre à jour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
