import {
  archivePage,
  createPage,
  getPage,
  queryDataSource,
  updatePage,
} from "./client"
import { getProfilePageId } from "./profiles"
import {
  dateProperty,
  emailProperty,
  getDate,
  getEmail,
  getNumber,
  getRelationIds,
  getRichText,
  getSelect,
  getTitle,
  numberProperty,
  relationProperty,
  richTextProperty,
  selectProperty,
  titleProperty,
} from "./properties"
import type { NotionPage } from "./types"
import type { RentChange, Tenant, TenantCivility } from "@/lib/tenants"
import { generateActivationCode } from "@/lib/auth/activation-code"

function requireDataSourceId(): string {
  const dataSourceId = process.env.NOTION_LOCATAIRES_DATA_SOURCE_ID
  if (!dataSourceId) {
    throw new Error(
      "NOTION_LOCATAIRES_DATA_SOURCE_ID manquant dans les variables d'environnement.",
    )
  }
  return dataSourceId
}

function avatarSeedFromName(name: string): string {
  return name.trim().toLowerCase()
}

function isRentChange(value: unknown): value is RentChange {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.effectiveMonth === "string" &&
    typeof record.rentAmount === "number" &&
    typeof record.chargesAmount === "number"
  )
}

function parseRentHistory(value: string): RentChange[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(isRentChange) : []
  } catch {
    return []
  }
}

function mapPageToTenant(page: NotionPage): Tenant {
  const properties = page.properties
  const name = getTitle(properties["Nom"])
  const avatarSeed = getRichText(properties["Avatar seed"])

  return {
    id: page.id,
    civility: (getSelect(properties["Civilite"]) ?? "M.") as TenantCivility,
    name,
    rentAmount: getNumber(properties["Loyer"]),
    chargesAmount: getNumber(properties["Charges"]),
    avatarSeed: avatarSeed || avatarSeedFromName(name),
    createdAt: page.created_time,
    firstQuittanceDate: getDate(properties["Première quittance"]) ?? null,
    lastQuittanceDate: getDate(properties["Dernière quittance"]) ?? null,
    email: getEmail(properties["Email"]),
    verificationCode: getRichText(properties["Code de vérification"]) || null,
    hasAccount: Boolean(getRichText(properties["Mot de passe"])),
    rentHistory: parseRentHistory(getRichText(properties["Historique loyer"])),
    location: getSelect(properties["Lieu"]) ?? null,
  }
}

export type NewTenantInput = {
  civility: TenantCivility
  name: string
  rentAmount: number
  chargesAmount: number
  firstQuittanceDate?: string | null
  lastQuittanceDate?: string | null
  location?: string | null
}

export type TenantUpdateInput = Partial<NewTenantInput> & {
  rentHistory?: RentChange[]
}

export async function listTenants(profileId: string): Promise<Tenant[]> {
  const dataSourceId = requireDataSourceId()
  const bailleurPageId = await getProfilePageId(profileId)
  if (!bailleurPageId) return []

  const response = await queryDataSource(dataSourceId, {
    filter: { property: "Bailleur", relation: { contains: bailleurPageId } },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  })

  return response.results.map(mapPageToTenant)
}

export async function getTenantById(
  tenantId: string,
): Promise<Tenant | undefined> {
  try {
    const page = await getPage(tenantId)
    if (page.archived) return undefined
    return mapPageToTenant(page)
  } catch {
    return undefined
  }
}

export async function createTenant(
  profileId: string,
  input: NewTenantInput,
): Promise<Tenant> {
  const dataSourceId = requireDataSourceId()
  const bailleurPageId = await getProfilePageId(profileId)
  if (!bailleurPageId) {
    throw new Error(`Bailleur introuvable pour le profil "${profileId}".`)
  }

  const page = await createPage({
    parent: { type: "data_source_id", data_source_id: dataSourceId },
    properties: {
      Nom: titleProperty(input.name),
      Civilite: selectProperty(input.civility),
      Loyer: numberProperty(input.rentAmount),
      Charges: numberProperty(input.chargesAmount),
      Bailleur: relationProperty([bailleurPageId]),
      "Avatar seed": richTextProperty(avatarSeedFromName(input.name)),
      "Première quittance": dateProperty(input.firstQuittanceDate ?? null),
      "Dernière quittance": dateProperty(input.lastQuittanceDate ?? null),
      ...(input.location ? { Lieu: selectProperty(input.location) } : {}),
    },
  })

  return mapPageToTenant(page)
}

export async function updateTenant(
  tenantId: string,
  updates: TenantUpdateInput,
): Promise<Tenant> {
  const properties: Record<string, unknown> = {}

  if (updates.name !== undefined) {
    properties.Nom = titleProperty(updates.name)
    properties["Avatar seed"] = richTextProperty(
      avatarSeedFromName(updates.name),
    )
  }
  if (updates.civility !== undefined) {
    properties.Civilite = selectProperty(updates.civility)
  }
  if (updates.rentAmount !== undefined) {
    properties.Loyer = numberProperty(updates.rentAmount)
  }
  if (updates.chargesAmount !== undefined) {
    properties.Charges = numberProperty(updates.chargesAmount)
  }
  if (updates.firstQuittanceDate !== undefined) {
    properties["Première quittance"] = dateProperty(updates.firstQuittanceDate)
  }
  if (updates.lastQuittanceDate !== undefined) {
    properties["Dernière quittance"] = dateProperty(updates.lastQuittanceDate)
  }
  if (updates.rentHistory !== undefined) {
    properties["Historique loyer"] = richTextProperty(
      JSON.stringify(updates.rentHistory),
    )
  }
  if (updates.location !== undefined) {
    properties["Lieu"] = updates.location
      ? selectProperty(updates.location)
      : { select: null }
  }

  const page = await updatePage(tenantId, { properties })
  return mapPageToTenant(page)
}

export async function removeTenant(tenantId: string): Promise<void> {
  await archivePage(tenantId)
}

export type TenantAuth = {
  id: string
  email: string
  passwordHash: string
  verificationCode: string | null
  profilePageId: string
}

export async function getTenantAuthByEmail(
  email: string,
): Promise<TenantAuth | undefined> {
  const dataSourceId = requireDataSourceId()
  const response = await queryDataSource(dataSourceId, {
    filter: {
      property: "Email",
      email: { equals: email.trim().toLowerCase() },
    },
    page_size: 1,
  })

  const page = response.results[0]
  if (!page) return undefined

  const profilePageId = getRelationIds(page.properties["Bailleur"])[0]
  if (!profilePageId) return undefined

  return {
    id: page.id,
    email: getEmail(page.properties["Email"]) ?? "",
    passwordHash: getRichText(page.properties["Mot de passe"]),
    verificationCode: getRichText(page.properties["Code de vérification"]) || null,
    profilePageId,
  }
}

export async function getTenantOwnerProfilePageId(
  tenantId: string,
): Promise<string | undefined> {
  try {
    const page = await getPage(tenantId)
    if (page.archived) return undefined
    return getRelationIds(page.properties["Bailleur"])[0]
  } catch {
    return undefined
  }
}

export async function inviteTenant(
  tenantId: string,
  email: string,
): Promise<{ email: string; verificationCode: string }> {
  const verificationCode = generateActivationCode()

  await updatePage(tenantId, {
    properties: {
      Email: emailProperty(email.trim().toLowerCase()),
      "Code de vérification": richTextProperty(verificationCode),
      "Mot de passe": richTextProperty(""),
    },
  })

  return { email: email.trim().toLowerCase(), verificationCode }
}

export async function activateTenant(
  tenantId: string,
  passwordHash: string,
): Promise<void> {
  await updatePage(tenantId, {
    properties: {
      "Mot de passe": richTextProperty(passwordHash),
      "Code de vérification": richTextProperty(""),
    },
  })
}

export async function syncTenantQuittanceDates(
  tenantId: string,
  paymentDate: string,
): Promise<void> {
  const tenant = await getTenantById(tenantId)
  if (!tenant) return

  const nextFirst =
    !tenant.firstQuittanceDate || paymentDate < tenant.firstQuittanceDate
      ? paymentDate
      : tenant.firstQuittanceDate
  const nextLast =
    !tenant.lastQuittanceDate || paymentDate > tenant.lastQuittanceDate
      ? paymentDate
      : tenant.lastQuittanceDate

  if (
    nextFirst === tenant.firstQuittanceDate &&
    nextLast === tenant.lastQuittanceDate
  ) {
    return
  }

  await updatePage(tenantId, {
    properties: {
      "Première quittance": dateProperty(nextFirst),
      "Dernière quittance": dateProperty(nextLast),
    },
  })
}

/** Recalcule première/dernière quittance après édition ou suppression. */
export async function setTenantQuittanceDates(
  tenantId: string,
  firstQuittanceDate: string | null,
  lastQuittanceDate: string | null,
): Promise<void> {
  await updatePage(tenantId, {
    properties: {
      "Première quittance": dateProperty(firstQuittanceDate),
      "Dernière quittance": dateProperty(lastQuittanceDate),
    },
  })
}
