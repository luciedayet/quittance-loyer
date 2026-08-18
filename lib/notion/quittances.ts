import {
  archivePage,
  createPage,
  getPage,
  queryAllPages,
  updatePage,
} from "./client"
import { getProfilePageId } from "./profiles"
import {
  dateProperty,
  getDate,
  getNumber,
  getRelationIds,
  getRichText,
  getTitle,
  numberProperty,
  relationProperty,
  richTextProperty,
  titleProperty,
} from "./properties"
import type { NotionPage } from "./types"

export type NewQuittanceLogInput = {
  title: string
  profileId: string
  tenantId: string
  periodMonth: string
  paymentDate: string
  totalAmount: number
}

export async function logQuittance(
  input: NewQuittanceLogInput,
): Promise<void> {
  const dataSourceId = process.env.NOTION_QUITTANCES_DATA_SOURCE_ID
  if (!dataSourceId) return

  const bailleurPageId = await getProfilePageId(input.profileId)

  await createPage({
    parent: { type: "data_source_id", data_source_id: dataSourceId },
    properties: {
      Titre: titleProperty(input.title),
      Locataire: relationProperty([input.tenantId]),
      Bailleur: relationProperty(bailleurPageId ? [bailleurPageId] : []),
      Periode: richTextProperty(input.periodMonth),
      "Date de paiement": dateProperty(input.paymentDate),
      "Montant total": numberProperty(input.totalAmount),
    },
  })
}

export type QuittanceRecord = {
  id: string
  title: string
  tenantId: string
  periodMonth: string
  paymentDate: string | null
  totalAmount: number
  loggedAt: string
}

function mapPageToQuittance(page: NotionPage): QuittanceRecord {
  const properties = page.properties
  const tenantIds = getRelationIds(properties["Locataire"])

  return {
    id: page.id,
    title: getTitle(properties["Titre"]),
    tenantId: tenantIds[0] ?? "",
    periodMonth: getRichText(properties["Periode"]),
    paymentDate: getDate(properties["Date de paiement"]) ?? null,
    totalAmount: getNumber(properties["Montant total"]),
    loggedAt: page.created_time,
  }
}

export async function listQuittancesForTenant(
  tenantId: string,
): Promise<QuittanceRecord[]> {
  const dataSourceId = process.env.NOTION_QUITTANCES_DATA_SOURCE_ID
  if (!dataSourceId) return []

  const pages = await queryAllPages(dataSourceId, {
    filter: { property: "Locataire", relation: { contains: tenantId } },
    sorts: [{ property: "Date de paiement", direction: "descending" }],
  })

  return pages.map(mapPageToQuittance)
}

export async function getQuittanceById(
  quittanceId: string,
): Promise<QuittanceRecord | undefined> {
  if (!process.env.NOTION_QUITTANCES_DATA_SOURCE_ID) return undefined

  try {
    const page = await getPage(quittanceId)
    if (page.archived) return undefined
    return mapPageToQuittance(page)
  } catch {
    return undefined
  }
}

export type QuittanceUpdateInput = Partial<{
  periodMonth: string
  paymentDate: string
  totalAmount: number
}>

export async function updateQuittance(
  quittanceId: string,
  updates: QuittanceUpdateInput,
): Promise<QuittanceRecord> {
  const properties: Record<string, unknown> = {}

  if (updates.periodMonth !== undefined) {
    properties["Periode"] = richTextProperty(updates.periodMonth)
  }
  if (updates.paymentDate !== undefined) {
    properties["Date de paiement"] = dateProperty(updates.paymentDate)
  }
  if (updates.totalAmount !== undefined) {
    properties["Montant total"] = numberProperty(updates.totalAmount)
  }

  const page = await updatePage(quittanceId, { properties })
  return mapPageToQuittance(page)
}

export async function deleteQuittance(quittanceId: string): Promise<void> {
  await archivePage(quittanceId)
}

export async function listQuittancesForProfile(
  profileId: string,
): Promise<QuittanceRecord[]> {
  const dataSourceId = process.env.NOTION_QUITTANCES_DATA_SOURCE_ID
  if (!dataSourceId) return []

  const bailleurPageId = await getProfilePageId(profileId)
  if (!bailleurPageId) return []

  const pages = await queryAllPages(dataSourceId, {
    filter: { property: "Bailleur", relation: { contains: bailleurPageId } },
    sorts: [{ property: "Date de paiement", direction: "descending" }],
  })

  return pages.map(mapPageToQuittance)
}
