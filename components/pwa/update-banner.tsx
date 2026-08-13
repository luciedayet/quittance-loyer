"use client"

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
  const {
    updateAvailable,
    showPopup,
    applyUpdate,
    dismissToBanner,
    reopenPopup,
  } = useServiceWorkerUpdate()

  const popupOpen = updateAvailable && showPopup
  const bannerOpen = updateAvailable && !showPopup

  return (
    <>
      {bannerOpen && (
        <div className="flex items-center justify-center gap-3 bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
          <span>
            Une nouvelle version de l&apos;application est disponible.
          </span>
          <Button
            variant="secondary"
            size="xs"
            onClick={reopenPopup}
            className="shrink-0"
          >
            Mettre à jour
          </Button>
        </div>
      )}

      <Dialog
        open={popupOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) dismissToBanner()
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
            <Button variant="outline" onClick={dismissToBanner}>
              Mettre à jour plus tard
            </Button>
            <Button onClick={applyUpdate}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
