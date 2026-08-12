"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { buildQuittanceFilename, type QuittanceFields } from "@/lib/quittance"

export function useQuittancePdf() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
      setPreviewUrl(null)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const generate = useCallback(
    async (data: QuittanceFields) => {
      setIsGenerating(true)
      setError(null)

      try {
        revokePreview()

        const [{ pdf }, { QuittanceDocument }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("./quittance-document"),
        ])

        const blob = await pdf(<QuittanceDocument data={data} />).toBlob()
        const url = URL.createObjectURL(blob)
        previewUrlRef.current = url
        setPreviewUrl(url)
        return blob
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Erreur lors de la génération du PDF"
        setError(message)
        return null
      } finally {
        setIsGenerating(false)
      }
    },
    [revokePreview]
  )

  const download = useCallback(
    async (data: QuittanceFields, blob?: Blob | null) => {
      const fileBlob =
        blob ??
        (previewUrlRef.current
          ? await fetch(previewUrlRef.current).then((response) =>
              response.blob()
            )
          : await generate(data))

      if (!fileBlob) return

      const url = URL.createObjectURL(fileBlob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = buildQuittanceFilename(data)
      anchor.click()
      URL.revokeObjectURL(url)
    },
    [generate]
  )

  return {
    previewUrl,
    isGenerating,
    error,
    generate,
    download,
    revokePreview,
  }
}
