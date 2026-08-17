import { randomInt } from "crypto"

// Alphabet sans caractères ambigus (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateActivationCode(length = 8): string {
  let code = ""
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)]
  }
  return code
}
