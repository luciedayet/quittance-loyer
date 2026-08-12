export type Profile = {
  id: string
  sciName: string
  managerName: string
  sciAddress: string[]
  city: string
  property: { shortAddress?: string; lines: string[] }
  signatureSrc: string | null
}

export const PROFILES: Profile[] = [
  {
    id: "nema",
    sciName: "SCI NEMA",
    managerName: "Thibault MORASSIN",
    sciAddress: ["346 Avenue du Mal Lattre de Tassigny", "33600 Pessac"],
    city: "Pessac",
    property: {
      shortAddress: "Appartement 28, Bâtiment 2B, Résidence Les Terrasses",
      lines: [
        "Appartement 28, Bâtiment 2B, Résidence Les Terrasses",
        "Avenue Jean Racine sans numéro, rue Henri de Montherlant sans numéro et rue Eugène Delacroix sans numéro",
        "33400 Talence",
      ],
    },
    signatureSrc: "/signatures/nema.png",
  },
  {
    id: "sci-exemple-2",
    sciName: "SCI EXEMPLE 2",
    managerName: "Thibault MORASSIN",
    sciAddress: ["12 Rue Exemple", "33000 Bordeaux"],
    city: "Bordeaux",
    property: {
      lines: [
        "Appartement T2, Résidence Exemple",
        "12 Rue Exemple",
        "33000 Bordeaux",
      ],
    },
    signatureSrc: null,
  },
  {
    id: "sci-exemple-3",
    sciName: "SCI EXEMPLE 3",
    managerName: "Thibault MORASSIN",
    sciAddress: ["45 Avenue Exemple", "33100 Talence"],
    city: "Talence",
    property: {
      lines: ["Studio, Bâtiment A", "45 Avenue Exemple", "33100 Talence"],
    },
    signatureSrc: null,
  },
]

export function getProfileById(id: string): Profile | undefined {
  return PROFILES.find((profile) => profile.id === id)
}
