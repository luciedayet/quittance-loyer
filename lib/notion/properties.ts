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
  property: NotionPropertyValue | undefined,
): string | undefined {
  const select = property?.select as { name?: string } | null | undefined
  return select?.name
}

export function getDate(
  property: NotionPropertyValue | undefined,
): string | undefined {
  const date = property?.date as { start?: string } | null | undefined
  return date?.start ?? undefined
}

export function getRelationIds(
  property: NotionPropertyValue | undefined,
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
