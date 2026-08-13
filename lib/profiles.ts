export type Profile = {
  id: string
  sciName: string
  managerName: string
  sciAddress: string[]
  city: string
  property: { shortAddress?: string; lines: string[] }
  signatureSrc: string | null
}

export { getProfileById, getProfiles } from "@/lib/notion/profiles"
