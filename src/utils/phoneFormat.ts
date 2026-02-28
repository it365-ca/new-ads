/**
 * Formate un numéro de téléphone au format (450)555-5555
 * Accepte uniquement les chiffres
 */
export function formatPhoneNumber(value: string): string {
  // Retirer tout sauf les chiffres
  const cleaned = value.replace(/\D/g, "")
  
  // Limiter à 10 chiffres
  const limited = cleaned.substring(0, 10)
  
  // Appliquer le format (450)555-5555
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)})${limited.slice(3)}`
  } else {
    return `(${limited.slice(0, 3)})${limited.slice(3, 6)}-${limited.slice(6)}`
  }
}

/**
 * Valide qu'un numéro de téléphone est complet (10 chiffres)
 */
export function isValidPhoneNumber(value: string): boolean {
  const cleaned = value.replace(/\D/g, "")
  return cleaned.length === 10
}

/**
 * Extrait uniquement les chiffres d'un numéro de téléphone
 */
export function extractPhoneDigits(value: string): string {
  return value.replace(/\D/g, "")
}
