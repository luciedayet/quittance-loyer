import {
  archivePage,
  createPage,
  getPage,
  queryDataSource,
  updatePage,
} from "./client"
import { getProfilePageId } from "./profiles"
import { getQuittanceDateSummaryByBailleur } from "./quittances"
import {
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
import type {
  Tenant,
  TenantCivility,
  TenantWithQuittanceDates,
} from "@/lib/tenants"

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
  }
}

export type NewTenantInput = {
  civility: TenantCivility
  name: string
  rentAmount: number
  chargesAmount: number
}

export type TenantUpdateInput = Partial<NewTenantInput>

export async function listTenants(
  profileId: string,
): Promise<TenantWithQuittanceDates[]> {
  const dataSourceId = requireDataSourceId()
  const bailleurPageId = await getProfilePageId(profileId)
  if (!bailleurPageId) return []

  const [response, quittanceSummary] = await Promise.all([
    queryDataSource(dataSourceId, {
      filter: { property: "Bailleur", relation: { contains: bailleurPageId } },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    }),
    getQuittanceDateSummaryByBailleur(bailleurPageId),
  ])

  return response.results.map((page) => {
    const tenant = mapPageToTenant(page)
    const summary = quittanceSummary.get(tenant.id)
    return {
      ...tenant,
      firstQuittanceDate: summary?.first ?? null,
      lastQuittanceDate: summary?.last ?? null,
    }
  })
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

  const page = await updatePage(tenantId, { properties })
  return mapPageToTenant(page)
}

export async function removeTenant(tenantId: string): Promise<void> {
  await archivePage(tenantId)
}
