export type TenantCivility = "M." | "Mme"

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
}
