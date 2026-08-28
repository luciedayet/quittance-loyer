export type Bien = {
  id: string
  /** Nom ou libellé du bien, ex: "Appartement principal". */
  name: string
  shortAddress?: string
  lines: string[]
}

export {
  listBiens,
  getBienById,
  createBien,
  updateBien,
  removeBien,
} from "@/lib/notion/biens"
export type { NewBienInput, BienUpdateInput } from "@/lib/notion/biens"
