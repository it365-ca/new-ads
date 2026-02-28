/**
 * Formate une date au format "jour date année" en français
 * Exemple: "15 janvier 2024"
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return ""
  
  const date = new Date(dateString)
  
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric"
  }
  
  return date.toLocaleDateString("fr-CA", options)
}

/**
 * Formate une date au format court "JJ/MM/AAAA"
 */
export const formatDateShort = (dateString: string): string => {
  if (!dateString) return ""
  
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * Formate une date avec l'heure "jour date année à HH:MM"
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return ""
  
  const date = new Date(dateString)
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric"
  }
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit"
  }
  
  const formattedDate = date.toLocaleDateString("fr-CA", dateOptions)
  const formattedTime = date.toLocaleTimeString("fr-CA", timeOptions)
  
  return `${formattedDate} à ${formattedTime}`
}
