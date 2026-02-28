import React, { createContext, useContext, useState, useEffect } from "react"

interface Theme {
  id: string
  name: string
  emoji: string
  primary: string
  secondary: string
  preview: { bg: string; text: string; button: string }
}

interface CustomColors {
  primary: string
  secondary: string
}

type FontSize = "14" | "15" | "16" | "17" | "18"
type Spacing = "compact" | "normal" | "spacious"

interface ThemeContextType {
  currentTheme: Theme
  customColors: CustomColors | null
  fontSize: FontSize
  spacing: Spacing
  applyTheme: (theme: Theme) => void
  applyCustomColors: (colors: CustomColors) => void
  setFontSize: (size: FontSize) => void
  setSpacing: (spacing: Spacing) => void
  getHeaderClass: () => string
  getButtonClass: () => string
  getTextClass: () => string
  getBgClass: () => string
  getCardClass: () => string
  getHoverButtonClass: () => string
  getBadgeClass: (type: "success" | "warning" | "error" | "info") => string
  getTableHeaderClass: () => string
  getTableTotalClass: () => string
  getFontSizeClass: () => string
  getSpacingClass: () => string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

import { lumi } from "../lib/lumi"

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>({
    id: "ocean",
    name: "Bleu Océan",
    emoji: "🌊",
    primary: "indigo",
    secondary: "blue",
    preview: { bg: "from-indigo-50 to-blue-50", text: "text-indigo-600", button: "from-indigo-600 to-blue-600" }
  })
  const [customColors, setCustomColors] = useState<CustomColors | null>(null)
  const [fontSize, setFontSizeState] = useState<FontSize>("16")
  const [spacing, setSpacingState] = useState<Spacing>("normal")
  const [isLoaded, setIsLoaded] = useState(false)

  // Charger les préférences utilisateur au démarrage
  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const user = lumi.auth.user
        if (!user?.userId) return

        const { list } = await lumi.entities.userSettings.list({
          filter: { userId: user.userId },
          limit: 1
        })

        if (list.length > 0) {
          const settings = list[0]
          
          // Charger le thème
          if (settings.theme) {
            const THEMES: Theme[] = [
              { id: "ocean", name: "Bleu Océan", emoji: "🌊", primary: "indigo", secondary: "blue", preview: { bg: "from-indigo-50 to-blue-50", text: "text-indigo-600", button: "from-indigo-600 to-blue-600" } },
              { id: "violet", name: "Violet Moderne", emoji: "💜", primary: "purple", secondary: "pink", preview: { bg: "from-purple-50 to-pink-50", text: "text-purple-600", button: "from-purple-600 to-pink-600" } },
              { id: "nature", name: "Vert Nature", emoji: "🌿", primary: "green", secondary: "teal", preview: { bg: "from-green-50 to-teal-50", text: "text-green-600", button: "from-green-600 to-teal-600" } },
              { id: "rose", name: "Rose Doux", emoji: "🌸", primary: "rose", secondary: "pink", preview: { bg: "from-rose-50 to-pink-50", text: "text-rose-600", button: "from-rose-600 to-pink-600" } },
              { id: "orange", name: "Orange Énergique", emoji: "🔶", primary: "orange", secondary: "amber", preview: { bg: "from-orange-50 to-amber-50", text: "text-orange-600", button: "from-orange-600 to-amber-600" } }
            ]
            const theme = THEMES.find(t => t.id === settings.theme)
            if (theme) {
              setCurrentTheme(theme)
            }
          }

          // Charger les couleurs personnalisées
          if (settings.useCustomColors && settings.customPrimary && settings.customSecondary) {
            applyCustomColors({
              primary: settings.customPrimary,
              secondary: settings.customSecondary
            })
          }

          // Charger la taille de police
          if (settings.fontSize) {
            setFontSize(settings.fontSize)
          }

          // Charger l'espacement
          if (settings.spacing) {
            setSpacing(settings.spacing)
          }
        }
        setIsLoaded(true)
      } catch (error) {
        console.error("Erreur chargement thème:", error)
        setIsLoaded(true)
      }
    }

    loadUserTheme()
  }, [])

  const applyTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    setCustomColors(null)
    
    // Injecter les couleurs du thème dans des variables CSS globales
    const root = document.documentElement
    root.style.setProperty("--theme-primary", theme.primary)
    root.style.setProperty("--theme-text", theme.preview.text)
    root.style.setProperty("--theme-bg", theme.preview.bg)
  }

  const applyCustomColors = (colors: CustomColors) => {
    setCustomColors(colors)
    const root = document.documentElement
    root.style.setProperty("--custom-primary", colors.primary)
    root.style.setProperty("--custom-secondary", colors.secondary)
  }

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
    const root = document.documentElement
    root.style.setProperty("--base-font-size", `${size}px`)
  }

  const setSpacing = (space: Spacing) => {
    setSpacingState(space)
    const root = document.documentElement
    const spacings = { compact: "0.75", normal: "1", spacious: "1.5" }
    root.style.setProperty("--spacing-multiplier", spacings[space])
  }

  const getHeaderClass = () => currentTheme.preview.bg
  const getButtonClass = () => `bg-gradient-to-r ${currentTheme.preview.button} hover:shadow-xl hover:scale-105 transition-all duration-300`
  const getTextClass = () => currentTheme.preview.text
  const getBgClass = () => `bg-gradient-to-br ${currentTheme.preview.bg} min-h-screen`
  const getCardClass = () => `bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300`
  const getHoverButtonClass = () => `hover:opacity-90 hover:shadow-lg transition-all duration-200`
  
  const getBadgeClass = (type: "success" | "warning" | "error" | "info") => {
    const baseClasses = {
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      info: currentTheme.preview.text.replace("text-", "bg-").replace("-600", "-100") + " " + currentTheme.preview.text
    }
    return baseClasses[type]
  }

  // Nouvelles fonctions pour les tableaux statistiques
  const getTableHeaderClass = () => currentTheme.preview.text.replace("text-", "bg-").replace("-600", "-100")
  const getTableTotalClass = () => currentTheme.preview.text.replace("text-", "bg-").replace("-600", "-200")

  const getFontSizeClass = () => {
    const sizes = { "14": "text-sm", "15": "text-[15px]", "16": "text-base", "17": "text-[17px]", "18": "text-lg" }
    return sizes[fontSize]
  }

  const getSpacingClass = () => {
    const spacings = { compact: "space-y-2 gap-2", normal: "space-y-4 gap-4", spacious: "space-y-6 gap-6" }
    return spacings[spacing]
  }

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      customColors,
      fontSize,
      spacing,
      applyTheme,
      applyCustomColors,
      setFontSize,
      setSpacing,
      getHeaderClass,
      getButtonClass,
      getTextClass,
      getBgClass,
      getCardClass,
      getHoverButtonClass,
      getBadgeClass,
      getTableHeaderClass,
      getTableTotalClass,
      getFontSizeClass,
      getSpacingClass
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider")
  }
  return context
}
