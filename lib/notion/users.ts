import { createPage, queryDataSource } from "./client"
import { getRichText, getTitle, richTextProperty, titleProperty } from "./properties"
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

export type NotionUser = {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function mapPageToUser(page: NotionPage): NotionUser {
  const properties = page.properties
  return {
    id: page.id,
    email: getTitle(properties["Email"]),
    passwordHash: getRichText(properties["Mot de passe"]),
    firstName: getRichText(properties["Prénom"]),
    lastName: getRichText(properties["Nom"]),
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

export type NewUserInput = {
  email: string
  passwordHash: string
  firstName: string
  lastName: string
}

export async function createUser(input: NewUserInput): Promise<NotionUser> {
  const dataSourceId = requireDataSourceId()

  const page = await createPage({
    parent: { type: "data_source_id", data_source_id: dataSourceId },
    properties: {
      Email: titleProperty(normalizeEmail(input.email)),
      "Mot de passe": richTextProperty(input.passwordHash),
      Prénom: richTextProperty(input.firstName),
      Nom: richTextProperty(input.lastName),
    },
  })

  return mapPageToUser(page)
}
