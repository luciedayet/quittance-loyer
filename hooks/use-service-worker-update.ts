"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const SERVICE_WORKER_URL = "/sw.js"

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [showPopup, setShowPopup] = useState(true)
  const waitingWorkerRef = useRef<ServiceWorker | null>(null)
  const isApplyingUpdateRef = useRef(false)
  const hasReloadedRef = useRef(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    function handleWaitingWorker(worker: ServiceWorker | null) {
      if (!worker) return
      waitingWorkerRef.current = worker
      setUpdateAvailable(true)
      setShowPopup(true)
    }

    function trackInstallingWorker(worker: ServiceWorker) {
      worker.addEventListener("statechange", () => {
        if (
          worker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          handleWaitingWorker(worker)
        }
      })
    }

    function checkForUpdate(registration: ServiceWorkerRegistration) {
      return () => {
        if (document.visibilityState === "visible") registration.update()
      }
    }

    let removeVisibilityListener: (() => void) | undefined

    navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { updateViaCache: "none" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) {
          handleWaitingWorker(reg.waiting)
        }

        reg.addEventListener("updatefound", () => {
          if (reg.installing) trackInstallingWorker(reg.installing)
        })

        const handleVisibilityChange = checkForUpdate(reg)
        document.addEventListener("visibilitychange", handleVisibilityChange)
        removeVisibilityListener = () =>
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          )
      })
      .catch(() => undefined)

    function handleControllerChange() {
      if (!isApplyingUpdateRef.current) return
      if (hasReloadedRef.current) return
      hasReloadedRef.current = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    )

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      )
      removeVisibilityListener?.()
    }
  }, [])

  const applyUpdate = useCallback(() => {
    const waitingWorker = waitingWorkerRef.current
    if (!waitingWorker) return

    isApplyingUpdateRef.current = true
    waitingWorker.postMessage({ type: "SKIP_WAITING" })
  }, [])

  const dismissToBanner = useCallback(() => {
    setShowPopup(false)
  }, [])

  const reopenPopup = useCallback(() => {
    setShowPopup(true)
  }, [])

  return {
    updateAvailable,
    showPopup,
    applyUpdate,
    dismissToBanner,
    reopenPopup,
  }
}
