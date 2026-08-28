import type { QuittanceRecord } from "@/lib/notion/quittances"
import type { Profile } from "@/lib/profiles"
import {
  arrivalStartMonth,
  departureEndMonth,
  monthFromDate,
  monthsBetweenInclusive,
  todayIsoDate,
} from "@/lib/quittance"
import type { Tenant } from "@/lib/tenants"

export type TenantMissingQuittances = {
  tenant: Tenant
  missingMonths: string[]
  hasStartDate: boolean
}

/** Quittances manquantes par locataire, du premier mois attendu jusqu'au mois courant (ou au départ). */
export function computeMissingQuittances(
  tenants: Tenant[],
  quittances: QuittanceRecord[]
): TenantMissingQuittances[] {
  const currentMonth = monthFromDate(todayIsoDate())
  const monthsByTenant = new Map<string, Set<string>>()
  for (const q of quittances) {
    const existing = monthsByTenant.get(q.tenantId) ?? new Set()
    existing.add(q.periodMonth)
    monthsByTenant.set(q.tenantId, existing)
  }

  return tenants.map((tenant) => {
    if (!tenant.firstQuittanceDate) {
      return { tenant, missingMonths: [], hasStartDate: false }
    }
    const startMonth = arrivalStartMonth(tenant.firstQuittanceDate)
    const endMonth = departureEndMonth(tenant.lastQuittanceDate, currentMonth)
    if (startMonth > endMonth) {
      return { tenant, missingMonths: [], hasStartDate: true }
    }
    const expectedMonths = monthsBetweenInclusive(startMonth, endMonth)
    const existingMonths = monthsByTenant.get(tenant.id) ?? new Set()
    const missingMonths = expectedMonths.filter((m) => !existingMonths.has(m))
    return { tenant, missingMonths, hasStartDate: true }
  })
}

export function countMissingQuittances(
  list: TenantMissingQuittances[]
): number {
  return list.reduce((sum, { missingMonths }) => sum + missingMonths.length, 0)
}

/** Champs du profil SCI requis pour pouvoir générer des quittances. */
export function profileMissingFields(profile: Profile): string[] {
  const missing: string[] = []
  if (!profile.sciName.trim()) missing.push("Nom de la SCI")
  if (!profile.managerName.trim()) missing.push("Nom du gérant")
  if (!profile.city.trim()) missing.push("Ville")
  if (profile.sciAddress.length === 0) missing.push("Adresse de la SCI")
  if (!profile.signatureSrc) missing.push("Signature")
  return missing
}
