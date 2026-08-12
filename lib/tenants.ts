export type TenantCivility = "M." | "Mme"

export type Tenant = {
  id: string
  civility: TenantCivility
  name: string
  rentAmount: number
  chargesAmount: number
  avatarSeed: string
  createdAt: string
}

const STORAGE_PREFIX = "quittances.v1.tenants."

function storageKey(profileId: string): string {
  return `${STORAGE_PREFIX}${profileId}`
}

function isTenant(value: unknown): value is Tenant {
  if (!value || typeof value !== "object") return false

  const tenant = value as Record<string, unknown>

  return (
    typeof tenant.id === "string" &&
    (tenant.civility === "M." || tenant.civility === "Mme") &&
    typeof tenant.name === "string" &&
    typeof tenant.rentAmount === "number" &&
    typeof tenant.chargesAmount === "number" &&
    typeof tenant.avatarSeed === "string" &&
    typeof tenant.createdAt === "string"
  )
}

export function readTenants(profileId: string): Tenant[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(storageKey(profileId))
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isTenant)
  } catch {
    return []
  }
}

export function writeTenants(profileId: string, tenants: Tenant[]): void {
  if (typeof window === "undefined") return

  window.localStorage.setItem(storageKey(profileId), JSON.stringify(tenants))
}

export function createTenant(
  input: Omit<Tenant, "id" | "avatarSeed" | "createdAt">
): Tenant {
  return {
    ...input,
    id: crypto.randomUUID(),
    avatarSeed: input.name.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  }
}
