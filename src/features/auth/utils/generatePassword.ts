const RANDOM_SUFFIX_LENGTH = 12

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz"
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const DIGITS = "0123456789"
const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?"
const ALL_CHARS = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS

function randomIndex(max: number): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % max
}

export function generatePassword(): string {
  // Guarantee at least one character from each required class
  const chars: string[] = [
    LOWERCASE[randomIndex(LOWERCASE.length)],
    UPPERCASE[randomIndex(UPPERCASE.length)],
    DIGITS[randomIndex(DIGITS.length)],
    SYMBOLS[randomIndex(SYMBOLS.length)],
  ]

  for (let i = 0; i < RANDOM_SUFFIX_LENGTH; i++) {
    chars.push(ALL_CHARS[randomIndex(ALL_CHARS.length)])
  }

  // Fisher-Yates shuffle using crypto.getRandomValues
  const indices = new Uint32Array(chars.length)
  crypto.getRandomValues(indices)

  for (let i = chars.length - 1; i > 0; i--) {
    const j = indices[i] % (i + 1)
    const temp = chars[i]
    chars[i] = chars[j]
    chars[j] = temp
  }

  return chars.join("")
}
