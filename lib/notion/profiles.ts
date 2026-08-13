import { queryDataSource } from "./client"
import { getRichText, getTitle } from "./properties"
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
