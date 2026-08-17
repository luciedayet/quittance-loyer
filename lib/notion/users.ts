import { queryDataSource, updatePage } from "./client"
import {
  getRelationIds,
  getRichText,
  getSelect,
  getTitle,
  richTextProperty,
} from "./properties"
import type { NotionPage } from "./types"

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
