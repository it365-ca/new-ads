import { useState, useEffect } from "react"

interface Theme {
  id: string
  name: string
  emoji: string
  primary: string
  secondary: string
  preview: { bg: string; text: string; button: string }
}

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>({
    id: "ocean",
    name: "Bleu Océan",
    emoji: "🌊",
    primary: "indigo",
    secondary: "blue",
    preview: { bg: "from-indigo-50 to-blue-50", text: "text-indigo-600", button: "from-indigo-600 to-blue-600" }
  })

  const applyTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    
    // Appliquer les classes CSS au document
    const root = document.documentElement
    root.style.setProperty("--theme-primary", theme.primary)
    root.style.setProperty("--theme-secondary", theme.secondary)
  }

  return {
    currentTheme,
    applyTheme,
    getHeaderClass: () => currentTheme.preview.bg,
    getButtonClass: () => `bg-gradient-to-r ${currentTheme.preview.button}`,
    getTextClass: () => currentTheme.preview.text,
    getBgClass: () => `bg-gradient-to-br ${currentTheme.preview.bg}`
  }
}