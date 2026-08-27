"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown02Icon } from "@hugeicons/core-free-icons"
import { useState } from "react"

import { cn } from "@/lib/utils"

type AccordionProps = {
  title: React.ReactNode
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function Accordion({
  title,
  badge,
  defaultOpen = true,
  children,
  className,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn("rounded-2xl border border-border bg-card", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {badge}
        </div>
        <HugeiconsIcon
          icon={ArrowDown02Icon}
          strokeWidth={2}
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="border-t border-border px-5 pb-4 pt-3">{children}</div>
      ) : null}
    </div>
  )
}
