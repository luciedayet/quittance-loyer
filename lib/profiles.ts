export type Profile = {
  id: string
  /** Nom de la SCI, ou nom de famille si le bailleur est un particulier. */
  sciName: string
  /** Prénom du bailleur, uniquement si ce n'est pas une SCI. */
  firstName: string
  managerName: string
  sciAddress: string[]
  city: string
  signatureSrc: string | null
  /** Coché si le bailleur est une SCI/société, décoché si c'est un particulier. */
  isCompany: boolean
}

export { getProfileById, getProfiles } from "@/lib/notion/profiles"
