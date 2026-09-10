const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

export function generatePassword(length = 20, useUpper = true, useLower = true, useDigits = true, useSymbols = true) {
  let chars = ''
  let required = []

  if (useUpper) {
    chars += UPPER
    required.push(UPPER[Math.floor(Math.random() * UPPER.length)])
  }
  if (useLower) {
    chars += LOWER
    required.push(LOWER[Math.floor(Math.random() * LOWER.length)])
  }
  if (useDigits) {
    chars += DIGITS
    required.push(DIGITS[Math.floor(Math.random() * DIGITS.length)])
  }
  if (useSymbols) {
    chars += SYMBOLS
    required.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  }

  if (!chars) {
    chars = LOWER
    required = [LOWER[Math.floor(Math.random() * LOWER.length)]]
  }

  const array = new Uint32Array(length)
  crypto.getRandomValues(array)

  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length]
  }

  // Ensure at least one of each required type
  const arr = password.split('')
  required.forEach((char, i) => {
    if (i < arr.length) {
      const pos = Math.floor(Math.random() * arr.length)
      arr[pos] = char
    }
  })

  return arr.join('')
}
