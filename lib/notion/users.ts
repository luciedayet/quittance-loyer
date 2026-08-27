import { createPage, queryAllPages, queryDataSource, updatePage } from "./client"
import {
  getRelationIds,
  getRichText,
  getSelect,
  getTitle,
  relationProperty,
  richTextProperty,
  selectProperty,
  titleProperty,
} from "./properties"
import type { NotionPage } from "./types"
import { generateActivationCode } from "@/lib/auth/activation-code"

function requireDataSourceId(): string {
  const dataSourceId = process.env.NOTION_UTILISATEURS_DATA_SOURCE_ID
  if (!dataSourceId) {
    throw new Error(
      "NOTION_UTILISATEURS_DATA_SOURCE_ID manquant dans les variables d'environnement.",
    )
  }
  return dataSourceId
}

export type UserRole = "admin" | "bailleur"

export type NotionUser = {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  role: UserRole
  /** ID (page Notion) du Bailleur géré, uniquement pour le rôle "bailleur". */
  profilePageId: string | null
  activationCode: string | null
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function mapPageToUser(page: NotionPage): NotionUser {
  const properties = page.properties
  const role: UserRole = getSelect(properties["Rôle"]) === "Admin" ? "admin" : "bailleur"
  const activationCode = getRichText(properties["Code d'activation"])

  return {
    id: page.id,
    email: getTitle(properties["Email"]),
    passwordHash: getRichText(properties["Mot de passe"]),
    firstName: getRichText(properties["Prénom"]),
    lastName: getRichText(properties["Nom"]),
    role,
    profilePageId: getRelationIds(properties["Bailleur"])[0] ?? null,
    activationCode: activationCode || null,
  }
}

export async function getUserByEmail(
  email: string,
): Promise<NotionUser | undefined> {
  const dataSourceId = requireDataSourceId()
  const response = await queryDataSource(dataSourceId, {
    filter: { property: "Email", title: { equals: normalizeEmail(email) } },
    page_size: 1,
  })

  const page = response.results[0]
  return page ? mapPageToUser(page) : undefined
}

export async function getAllUsers(): Promise<NotionUser[]> {
  const dataSourceId = requireDataSourceId()
  const pages = await queryAllPages(dataSourceId, {
    sorts: [{ property: "Email", direction: "ascending" }],
  })
  return pages.map(mapPageToUser)
}

export async function createBailleurUser(
  email: string,
  firstName: string,
  lastName: string,
  profilePageId: string,
): Promise<{ email: string; activationCode: string }> {
  const dataSourceId = requireDataSourceId()
  const activationCode = generateActivationCode()
  const normalized = normalizeEmail(email)

  await createPage({
    parent: { type: "data_source_id", data_source_id: dataSourceId },
    properties: {
      Email: titleProperty(normalized),
      Prénom: richTextProperty(firstName.trim()),
      Nom: richTextProperty(lastName.trim()),
      Rôle: selectProperty("Bailleur"),
      Bailleur: relationProperty([profilePageId]),
      "Code d'activation": richTextProperty(activationCode),
    },
  })

  return { email: normalized, activationCode }
}

export async function activateUser(
  userId: string,
  passwordHash: string,
): Promise<void> {
  await updatePage(userId, {
    properties: {
      "Mot de passe": richTextProperty(passwordHash),
      "Code d'activation": richTextProperty(""),
    },
  })
}
