import { createPage } from "./client"
import { getProfilePageId } from "./profiles"
import {
  dateProperty,
  numberProperty,
  relationProperty,
  richTextProperty,
  titleProperty,
} from "./properties"

export type NewQuittanceLogInput = {
  title: string
  profileId: string
  tenantId: string
  periodMonth: string
  paymentDate: string
  totalAmount: number
}

export async function logQuittance(
  input: NewQuittanceLogInput,
): Promise<void> {
  const dataSourceId = process.env.NOTION_QUITTANCES_DATA_SOURCE_ID
  if (!dataSourceId) return

  const bailleurPageId = await getProfilePageId(input.profileId)

  await createPage({
    parent: { type: "data_source_id", data_source_id: dataSourceId },
    properties: {
      Titre: titleProperty(input.title),
      Locataire: relationProperty([input.tenantId]),
      Bailleur: relationProperty(bailleurPageId ? [bailleurPageId] : []),
      Periode: richTextProperty(input.periodMonth),
      "Date de paiement": dateProperty(input.paymentDate),
      "Montant total": numberProperty(input.totalAmount),
    },
  })
}
