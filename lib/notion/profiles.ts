import { getPage, queryAllPages, queryDataSource, updatePage } from "./client"
import {
  getRichText,
  getTitle,
  richTextChunkedProperty,
  richTextProperty,
  titleProperty,
} from "./properties"
import type { NotionPage } from "./types"
import type { Profile } from "@/lib/profiles"

function requireDataSourceId(): string {
  const dataSourceId = process.env.NOTION_BAILLEURS_DATA_SOURCE_ID
  if (!dataSourceId) {
    throw new Error(
      "NOTION_BAILLEURS_DATA_SOURCE_ID manquant dans les variables d'environnement.",
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

function mapPageToProfile(page: NotionPage): Profile {
  const properties = page.properties
  const shortAddress = getRichText(properties["Adresse bien (courte)"])
  const signaturePath = getRichText(properties["Signature (chemin)"])

  return {
    id: getRichText(properties["Slug"]),
    sciName: getTitle(properties["Nom SCI"]),
    managerName: getRichText(properties["Gerant"]),
    sciAddress: toLines(getRichText(properties["Adresse SCI"])),
    city: getRichText(properties["Ville"]),
    property: {
      shortAddress: shortAddress || undefined,
      lines: toLines(getRichText(properties["Adresse bien (lignes)"])),
    },
    signatureSrc: signaturePath || null,
  }
}

export async function getProfiles(): Promise<Profile[]> {
  const dataSourceId = requireDataSourceId()
  const response = await queryDataSource(dataSourceId, {
    sorts: [{ property: "Nom SCI", direction: "ascending" }],
  })

  return response.results.map(mapPageToProfile)
}

export async function getProfileById(
  profileId: string,
): Promise<Profile | undefined> {
  const dataSourceId = requireDataSourceId()
  const response = await queryDataSource(dataSourceId, {
    filter: { property: "Slug", rich_text: { equals: profileId } },
    page_size: 1,
  })

  const page = response.results[0]
  return page ? mapPageToProfile(page) : undefined
}

export async function getProfileByPageId(
  pageId: string,
): Promise<Profile | undefined> {
  try {
    const page = await getPage(pageId)
    if (page.archived) return undefined
    return mapPageToProfile(page)
  } catch {
    return undefined
  }
}

export async function getProfilePageId(
  profileId: string,
): Promise<string | undefined> {
  const dataSourceId = requireDataSourceId()
  const response = await queryDataSource(dataSourceId, {
    filter: { property: "Slug", rich_text: { equals: profileId } },
    page_size: 1,
  })

  return response.results[0]?.id
}

/** Retourne un Map de pageId Notion → nom de la SCI, pour l'affichage admin. */
export async function getProfileSciNameByPageId(): Promise<Map<string, string>> {
  const dataSourceId = requireDataSourceId()
  const pages = await queryAllPages(dataSourceId)
  const map = new Map<string, string>()
  for (const page of pages) {
    const sciName = getTitle(page.properties["Nom SCI"])
    map.set(page.id, sciName)
  }
  return map
}

export type ProfileUpdateInput = Partial<{
  sciName: string
  managerName: string
  city: string
  sciAddress: string[]
  propertyShortAddress: string
  propertyLines: string[]
  signatureSrc: string
}>

export async function updateProfile(
  profileId: string,
  updates: ProfileUpdateInput,
): Promise<Profile> {
  const pageId = await getProfilePageId(profileId)
  if (!pageId) {
    throw new Error(`Bailleur introuvable pour le profil "${profileId}".`)
  }

  const properties: Record<string, unknown> = {}

  if (updates.sciName !== undefined) {
    properties["Nom SCI"] = titleProperty(updates.sciName)
  }
  if (updates.managerName !== undefined) {
    properties["Gerant"] = richTextProperty(updates.managerName)
  }
  if (updates.city !== undefined) {
    properties["Ville"] = richTextProperty(updates.city)
  }
  if (updates.sciAddress !== undefined) {
    properties["Adresse SCI"] = richTextProperty(
      updates.sciAddress.join("\n"),
    )
  }
  if (updates.propertyShortAddress !== undefined) {
    properties["Adresse bien (courte)"] = richTextProperty(
      updates.propertyShortAddress,
    )
  }
  if (updates.propertyLines !== undefined) {
    properties["Adresse bien (lignes)"] = richTextProperty(
      updates.propertyLines.join("\n"),
    )
  }

  if (updates.signatureSrc !== undefined) {
    properties["Signature (chemin)"] = richTextChunkedProperty(updates.signatureSrc)
  }

  const page = await updatePage(pageId, { properties })
  return mapPageToProfile(page)
}
