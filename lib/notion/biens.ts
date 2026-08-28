import {
  archivePage,
  createPage,
  getPage,
  queryDataSource,
  updatePage,
} from "./client"
import { getProfilePageId } from "./profiles"
import {
  getRelationIds,
  getRichText,
  getTitle,
  relationProperty,
  richTextProperty,
  titleProperty,
} from "./properties"
import type { NotionPage } from "./types"
import type { Bien } from "@/lib/biens"

function requireDataSourceId(): string {
  const dataSourceId = process.env.NOTION_BIENS_DATA_SOURCE_ID
  if (!dataSourceId) {
    throw new Error(
      "NOTION_BIENS_DATA_SOURCE_ID manquant dans les variables d'environnement."
    )
  }
  return dataSourceId
}

function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function mapPageToBien(page: NotionPage): Bien {
  const properties = page.properties
  const shortAddress = getRichText(properties["Adresse (courte)"])

  return {
    id: page.id,
    name: getTitle(properties["Nom"]),
    shortAddress: shortAddress || undefined,
    lines: toLines(getRichText(properties["Adresse (lignes)"])),
  }
}

export async function listBiens(profileId: string): Promise<Bien[]> {
  const dataSourceId = requireDataSourceId()
  const bailleurPageId = await getProfilePageId(profileId)
  if (!bailleurPageId) return []

  const response = await queryDataSource(dataSourceId, {
    filter: { property: "Bailleur", relation: { contains: bailleurPageId } },
    sorts: [{ property: "Nom", direction: "ascending" }],
  })

  return response.results.map(mapPageToBien)
}

export async function getBienById(bienId: string): Promise<Bien | undefined> {
  try {
    const page = await getPage(bienId)
    if (page.archived) return undefined
    return mapPageToBien(page)
  } catch {
    return undefined
  }
}

export type NewBienInput = {
  name: string
  shortAddress?: string
  lines: string[]
}

export async function createBien(
  profileId: string,
  input: NewBienInput
): Promise<Bien> {
  const dataSourceId = requireDataSourceId()
  const bailleurPageId = await getProfilePageId(profileId)
  if (!bailleurPageId) {
    throw new Error(`Bailleur introuvable pour le profil "${profileId}".`)
  }

  const page = await createPage({
    parent: { type: "data_source_id", data_source_id: dataSourceId },
    properties: {
      Nom: titleProperty(input.name),
      "Adresse (courte)": richTextProperty(input.shortAddress ?? ""),
      "Adresse (lignes)": richTextProperty(input.lines.join("\n")),
      Bailleur: relationProperty([bailleurPageId]),
    },
  })

  return mapPageToBien(page)
}

export type BienUpdateInput = Partial<NewBienInput>

export async function updateBien(
  bienId: string,
  updates: BienUpdateInput
): Promise<Bien> {
  const properties: Record<string, unknown> = {}

  if (updates.name !== undefined) {
    properties.Nom = titleProperty(updates.name)
  }
  if (updates.shortAddress !== undefined) {
    properties["Adresse (courte)"] = richTextProperty(updates.shortAddress)
  }
  if (updates.lines !== undefined) {
    properties["Adresse (lignes)"] = richTextProperty(updates.lines.join("\n"))
  }

  const page = await updatePage(bienId, { properties })
  return mapPageToBien(page)
}

export async function removeBien(bienId: string): Promise<void> {
  await archivePage(bienId)
}

export async function getBienOwnerProfilePageId(
  bienId: string
): Promise<string | undefined> {
  try {
    const page = await getPage(bienId)
    if (page.archived) return undefined
    return getRelationIds(page.properties["Bailleur"])[0]
  } catch {
    return undefined
  }
}
