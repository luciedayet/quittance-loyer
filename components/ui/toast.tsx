"use client"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

import { toastManager } from "@/lib/toast-manager"
import { cn } from "@/lib/utils"

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      swipeDirection={["up", "down", "left", "right"]}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-2xl bg-popover p-4 pr-9 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 transition-all duration-200 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:ring-foreground/10"
      )}
    >
      {toast.type === "success" ? (
        <HugeiconsIcon
          icon={CheckmarkCircle01Icon}
          strokeWidth={2}
          className="mt-0.5 size-5 shrink-0 text-primary"
        />
      ) : null}
      <div className="flex-1 space-y-0.5">
        <ToastPrimitive.Title className="leading-none font-medium" />
        <ToastPrimitive.Description className="text-muted-foreground" />
      </div>
      <ToastPrimitive.Close
        aria-label="Fermer"
        className="absolute top-3 right-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ))
}

/** Toasts affichés en haut sur mobile (pouce), en bas à droite sur écran large. */
export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} timeout={4000}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport
          data-slot="toast-viewport"
          className="fixed inset-x-4 top-4 z-[100] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:top-auto sm:right-4 sm:bottom-4 sm:w-96 sm:items-end"
        >
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}
