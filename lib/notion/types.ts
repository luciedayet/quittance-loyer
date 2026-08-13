export type NotionPropertyValue = Record<string, unknown>

export type NotionPage = {
  id: string
  created_time: string
  archived?: boolean
  properties: Record<string, NotionPropertyValue>
}

export type NotionQueryResponse = {
  results: NotionPage[]
  next_cursor: string | null
  has_more: boolean
}
