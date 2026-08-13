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
  getDate,
  getNumber,
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
import type { Tenant, TenantCivility } from "@/lib/tenants"

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
  }
}

export type NewTenantInput = {
  civility: TenantCivility
  name: string
  rentAmount: number
  chargesAmount: number
  firstQuittanceDate?: string | null
  lastQuittanceDate?: string | null
}

export type TenantUpdateInput = Partial<NewTenantInput>

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

  const page = await updatePage(tenantId, { properties })
  return mapPageToTenant(page)
}

export async function removeTenant(tenantId: string): Promise<void> {
  await archivePage(tenantId)
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
