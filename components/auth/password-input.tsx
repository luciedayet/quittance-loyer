"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={isVisible ? "text" : "password"}
        className={cn("pr-8", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setIsVisible((value) => !value)}
        className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon
          icon={isVisible ? EyeOffIcon : EyeIcon}
          strokeWidth={2}
          className="size-4"
        />
        <span className="sr-only">
          {isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        </span>
      </button>
    </div>
  )
}
