import type { NotionPropertyValue } from "./types"

type RichTextItem = { plain_text?: string }

export function getTitle(property: NotionPropertyValue | undefined): string {
  const items = (property?.title as RichTextItem[] | undefined) ?? []
  return items.map((item) => item.plain_text ?? "").join("")
}

export function getRichText(property: NotionPropertyValue | undefined): string {
  const items = (property?.rich_text as RichTextItem[] | undefined) ?? []
  return items.map((item) => item.plain_text ?? "").join("")
}

export function getNumber(property: NotionPropertyValue | undefined): number {
  const value = property?.number
  return typeof value === "number" ? value : 0
}

export function getSelect(
  property: NotionPropertyValue | undefined
): string | undefined {
  const select = property?.select as { name?: string } | null | undefined
  return select?.name
}

export function getDate(
  property: NotionPropertyValue | undefined
): string | undefined {
  const date = property?.date as { start?: string } | null | undefined
  return date?.start ?? undefined
}

export function getEmail(
  property: NotionPropertyValue | undefined
): string | null {
  const value = property?.email
  return typeof value === "string" && value ? value : null
}

export function getCheckbox(
  property: NotionPropertyValue | undefined
): boolean {
  return property?.checkbox === true
}

export function getRelationIds(
  property: NotionPropertyValue | undefined
): string[] {
  const items = (property?.relation as { id: string }[] | undefined) ?? []
  return items.map((item) => item.id)
}

export function titleProperty(value: string): NotionPropertyValue {
  return { title: [{ text: { content: value } }] }
}

export function richTextProperty(value: string): NotionPropertyValue {
  return { rich_text: value ? [{ text: { content: value } }] : [] }
}

export function richTextChunkedProperty(value: string): NotionPropertyValue {
  if (!value) return { rich_text: [] }
  const CHUNK = 2000
  const chunks: { text: { content: string } }[] = []
  for (let i = 0; i < value.length; i += CHUNK) {
    chunks.push({ text: { content: value.slice(i, i + CHUNK) } })
  }
  return { rich_text: chunks }
}

export function emailProperty(value: string | null): NotionPropertyValue {
  return { email: value || null }
}

export function numberProperty(value: number): NotionPropertyValue {
  return { number: value }
}

export function selectProperty(value: string): NotionPropertyValue {
  return { select: { name: value } }
}

export function relationProperty(pageIds: string[]): NotionPropertyValue {
  return { relation: pageIds.map((id) => ({ id })) }
}

export function dateProperty(value: string | null): NotionPropertyValue {
  return { date: value ? { start: value } : null }
}

export function checkboxProperty(value: boolean): NotionPropertyValue {
  return { checkbox: value }
}
