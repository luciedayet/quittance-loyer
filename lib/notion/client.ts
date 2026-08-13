import type { NotionPage, NotionQueryResponse } from "./types"

const NOTION_API_URL = "https://api.notion.com/v1"
const NOTION_VERSION = "2025-09-03"

function getApiKey(): string {
  const apiKey = process.env.NOTION_API_KEY
  if (!apiKey) {
    throw new Error(
      "NOTION_API_KEY manquant dans les variables d'environnement.",
    )
  }
  return apiKey
}

async function notionFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${NOTION_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Notion API error ${response.status}: ${body}`)
  }

  return response.json() as Promise<T>
}

export function queryDataSource(
  dataSourceId: string,
  body: Record<string, unknown> = {},
): Promise<NotionQueryResponse> {
  return notionFetch<NotionQueryResponse>(
    `/data_sources/${dataSourceId}/query`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  )
}

export function createPage(
  body: Record<string, unknown>,
): Promise<NotionPage> {
  return notionFetch<NotionPage>(`/pages`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function updatePage(
  pageId: string,
  body: Record<string, unknown>,
): Promise<NotionPage> {
  return notionFetch<NotionPage>(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function archivePage(pageId: string): Promise<NotionPage> {
  return updatePage(pageId, { archived: true })
}
