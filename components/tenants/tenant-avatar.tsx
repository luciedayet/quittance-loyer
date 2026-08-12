import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAvatarUrl } from "@/lib/avatars"
import { cn } from "@/lib/utils"

type TenantAvatarProps = {
  seed: string
  name: string
  className?: string
  size?: "default" | "sm" | "lg"
}

export function TenantAvatar({
  seed,
  name,
  className,
  size = "default",
}: TenantAvatarProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <Avatar className={cn(className)} size={size}>
      <AvatarImage src={getAvatarUrl(seed)} alt={name} />
      <AvatarFallback>{initials || "?"}</AvatarFallback>
    </Avatar>
  )
}
