export type TenantCivility = "M." | "Mme"

/** Une augmentation de loyer/charges effective à partir d'un mois donné. */
export type RentChange = {
  id: string
  effectiveMonth: string
  rentAmount: number
  chargesAmount: number
}

export type Tenant = {
  id: string
  civility: TenantCivility
  name: string
  rentAmount: number
  chargesAmount: number
  avatarSeed: string
  createdAt: string
  firstQuittanceDate: string | null
  lastQuittanceDate: string | null
  email: string | null
  /** Code d'activation en attente, visible uniquement par le bailleur/admin. */
  verificationCode: string | null
  hasAccount: boolean
  rentHistory: RentChange[]
}

/** Loyer/charges applicables pour un mois, augmentations comprises. */
export function effectiveRateAt(
  tenant: Tenant,
  periodMonth: string,
): { rentAmount: number; chargesAmount: number } {
  let applicable: RentChange | null = null

  for (const change of tenant.rentHistory) {
    if (change.effectiveMonth > periodMonth) continue
    if (!applicable || change.effectiveMonth > applicable.effectiveMonth) {
      applicable = change
    }
  }

  return applicable
    ? {
        rentAmount: applicable.rentAmount,
        chargesAmount: applicable.chargesAmount,
      }
    : { rentAmount: tenant.rentAmount, chargesAmount: tenant.chargesAmount }
}
