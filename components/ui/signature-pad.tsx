"use client"

import { useRef } from "react"

import { Button } from "@/components/ui/button"

type SignaturePadProps = {
  onSave: (dataUrl: string) => void
  onCancel?: () => void
  isSaving?: boolean
}

export function SignaturePad({ onSave, onCancel, isSaving }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  function getCtx() {
    const canvas = canvasRef.current
    return canvas ? { canvas, ctx: canvas.getContext("2d")! } : null
  }

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    isDrawingRef.current = true
    const point = getPoint(event)
    if (!point) return
    lastPointRef.current = point
    const r = getCtx()
    if (!r) return
    r.ctx.beginPath()
    r.ctx.arc(point.x, point.y, 0.8, 0, Math.PI * 2)
    r.ctx.fillStyle = "#111111"
    r.ctx.fill()
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !lastPointRef.current) return
    const point = getPoint(event)
    if (!point) return
    const r = getCtx()
    if (!r) return
    r.ctx.beginPath()
    r.ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    r.ctx.lineTo(point.x, point.y)
    r.ctx.strokeStyle = "#111111"
    r.ctx.lineWidth = 1.8
    r.ctx.lineCap = "round"
    r.ctx.lineJoin = "round"
    r.ctx.stroke()
    lastPointRef.current = point
  }

  function onPointerUp() {
    isDrawingRef.current = false
    lastPointRef.current = null
  }

  function handleClear() {
    const r = getCtx()
    if (!r) return
    r.ctx.clearRect(0, 0, r.canvas.width, r.canvas.height)
  }

  function isEmpty() {
    const r = getCtx()
    if (!r) return true
    const data = r.ctx.getImageData(0, 0, r.canvas.width, r.canvas.height).data
    return !Array.from(data).some((v, i) => i % 4 === 3 && v > 0)
  }

  function handleSave() {
    if (isEmpty()) return
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL("image/png"))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full cursor-crosshair touch-none"
          style={{ height: 150 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Dessinez votre signature ci-dessus avec la souris ou le doigt.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Enregistrement…" : "Enregistrer la signature"}
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          Effacer
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
      </div>
    </div>
  )
}
