import React, { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

interface Theme {
  id: string
  name: string
  emoji: string
  primary: string
  secondary: string
  preview: { bg: string; text: string; button: string }
}

const THEMES: Theme[] = [
  { id: "ocean", name: "Bleu Océan", emoji: "🌊", primary: "indigo", secondary: "blue", preview: { bg: "from-indigo-50 to-blue-50", text: "text-indigo-600", button: "from-indigo-600 to-blue-600" } },
  { id: "violet", name: "Violet Moderne", emoji: "💜", primary: "purple", secondary: "pink", preview: { bg: "from-purple-50 to-pink-50", text: "text-purple-600", button: "from-purple-600 to-pink-600" } },
  { id: "nature", name: "Vert Nature", emoji: "🌿", primary: "green", secondary: "teal", preview: { bg: "from-green-50 to-teal-50", text: "text-green-600", button: "from-green-600 to-teal-600" } },
  { id: "rose", name: "Rose Doux", emoji: "🌸", primary: "rose", secondary: "pink", preview: { bg: "from-rose-50 to-pink-50", text: "text-rose-600", button: "from-rose-600 to-pink-600" } },
  { id: "orange", name: "Orange Énergique", emoji: "🔶", primary: "orange", secondary: "amber", preview: { bg: "from-orange-50 to-amber-50", text: "text-orange-600", button: "from-orange-600 to-amber-600" } },
  { id: "sombre", name: "Mode Sombre", emoji: "🌙", primary: "gray", secondary: "slate", preview: { bg: "from-gray-800 to-slate-900", text: "text-gray-300", button: "from-gray-700 to-slate-700" } },
  { id: "rouge", name: "Rouge Passion", emoji: "❤️", primary: "red", secondary: "rose", preview: { bg: "from-red-50 to-rose-50", text: "text-red-600", button: "from-red-600 to-rose-600" } },
  { id: "turquoise", name: "Turquoise Frais", emoji: "🏝️", primary: "cyan", secondary: "teal", preview: { bg: "from-cyan-50 to-teal-50", text: "text-cyan-600", button: "from-cyan-600 to-teal-600" } },
  { id: "lavande", name: "Lavande Calme", emoji: "🪻", primary: "violet", secondary: "purple", preview: { bg: "from-violet-50 to-purple-50", text: "text-violet-600", button: "from-violet-600 to-purple-600" } },
  { id: "menthe", name: "Menthe Glacée", emoji: "🍃", primary: "emerald", secondary: "green", preview: { bg: "from-emerald-50 to-green-50", text: "text-emerald-600", button: "from-emerald-600 to-green-600" } },
  { id: "corail", name: "Corail Tropical", emoji: "🪸", primary: "orange", secondary: "red", preview: { bg: "from-orange-50 to-red-50", text: "text-orange-600", button: "from-orange-600 to-red-600" } },
  { id: "bleuNuit", name: "Bleu Nuit", emoji: "🌃", primary: "blue", secondary: "indigo", preview: { bg: "from-blue-900 to-indigo-950", text: "text-blue-300", button: "from-blue-700 to-indigo-700" } },
  { id: "or", name: "Or Luxe", emoji: "✨", primary: "yellow", secondary: "amber", preview: { bg: "from-yellow-50 to-amber-50", text: "text-yellow-700", button: "from-yellow-500 to-amber-600" } },
  { id: "amethyste", name: "Améthyste", emoji: "💎", primary: "purple", secondary: "violet", preview: { bg: "from-purple-50 to-violet-50", text: "text-purple-600", button: "from-purple-600 to-violet-600" } },
  { id: "emeraude", name: "Émeraude", emoji: "💚", primary: "teal", secondary: "emerald", preview: { bg: "from-teal-50 to-emerald-50", text: "text-teal-600", button: "from-teal-600 to-emerald-600" } },
  { id: "saumon", name: "Saumon Sunset", emoji: "🌅", primary: "pink", secondary: "orange", preview: { bg: "from-pink-50 to-orange-50", text: "text-pink-600", button: "from-pink-600 to-orange-600" } },
  { id: "indigo", name: "Indigo Profond", emoji: "🔵", primary: "indigo", secondary: "purple", preview: { bg: "from-indigo-50 to-purple-50", text: "text-indigo-600", button: "from-indigo-600 to-purple-600" } },
  { id: "cyan", name: "Cyan Électrique", emoji: "⚡", primary: "cyan", secondary: "blue", preview: { bg: "from-cyan-50 to-blue-50", text: "text-cyan-600", button: "from-cyan-600 to-blue-600" } },
  { id: "magenta", name: "Magenta Vibrant", emoji: "🎨", primary: "fuchsia", secondary: "pink", preview: { bg: "from-fuchsia-50 to-pink-50", text: "text-fuchsia-600", button: "from-fuchsia-600 to-pink-600" } },
  { id: "bronze", name: "Bronze Automne", emoji: "🍂", primary: "amber", secondary: "orange", preview: { bg: "from-amber-50 to-orange-50", text: "text-amber-700", button: "from-amber-600 to-orange-600" } }
]

const FONT_FAMILIES = [
  { id: "inter", name: "Inter (Moderne)", value: "Inter, sans-serif" },
  { id: "roboto", name: "Roboto (Classique)", value: "Roboto, sans-serif" },
  { id: "poppins", name: "Poppins (Élégant)", value: "Poppins, sans-serif" },
  { id: "montserrat", name: "Montserrat (Pro)", value: "Montserrat, sans-serif" },
  { id: "playfair", name: "Playfair Display (Serif)", value: "'Playfair Display', serif" },
  { id: "lora", name: "Lora (Lecture)", value: "Lora, serif" }
]

interface CustomColors {
  primary: string
  secondary: string
  background: string
  text: string
  accent: string
}

type FontSize = "14" | "15" | "16" | "17" | "18"
type Spacing = "compact" | "normal" | "spacious"

interface ThemeCustomizerProps {
  userId: string
  onThemeChange: (theme: Theme) => void
  onClose?: () => void
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ userId, onThemeChange }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>("ocean")
  const [loading, setLoading] = useState(false)
  const [useCustomColors, setUseCustomColors] = useState(false)
  const [customPrimary, setCustomPrimary] = useState("#6366f1")
  const [customSecondary, setCustomSecondary] = useState("#3b82f6")
  const [customBackground, setCustomBackground] = useState("#f8fafc")
  const [customText, setCustomText] = useState("#1e293b")
  const [customAccent, setCustomAccent] = useState("#8b5cf6")
  const [fontSize, setFontSize] = useState<FontSize>("16")
  const [spacing, setSpacing] = useState<Spacing>("normal")
  const [fontFamily, setFontFamily] = useState("inter")

  useEffect(() => {
    loadUserTheme()
  }, [userId])

  const loadUserTheme = async () => {
    try {
      const { list } = await lumi.entities.userSettings.list({
        filter: { userId },
        limit: 1
      })
      if (list.length > 0) {
        const settings = list[0]
        setSelectedTheme(settings.theme || "ocean")
        if (settings.useCustomColors) {
          setUseCustomColors(true)
          setCustomPrimary(settings.customPrimary || "#6366f1")
          setCustomSecondary(settings.customSecondary || "#3b82f6")
          setCustomBackground(settings.customBackground || "#f8fafc")
          setCustomText(settings.customText || "#1e293b")
          setCustomAccent(settings.customAccent || "#8b5cf6")
        }
        if (settings.fontSize) setFontSize(settings.fontSize as FontSize)
        if (settings.spacing) setSpacing(settings.spacing)
        if (settings.fontFamily) setFontFamily(settings.fontFamily)
        const theme = THEMES.find(t => t.id === settings.theme)
        if (theme) onThemeChange(theme)
      }
    } catch (error) {
      console.error("Erreur chargement thème:", error)
    }
  }

  const handleSaveTheme = async (themeId: string) => {
    setLoading(true)
    const loadingToast = toast.loading("Sauvegarde du thème...")

    try {
      const { list } = await lumi.entities.userSettings.list({
        filter: { userId },
        limit: 1
      })

      const themeData = {
        userId,
        theme: themeId,
        useCustomColors: false,
        fontSize,
        spacing,
        fontFamily,
        updatedAt: new Date().toISOString()
      }

      if (list.length > 0) {
        await lumi.entities.userSettings.update(list[0]._id, themeData)
      } else {
        await lumi.entities.userSettings.create({
          ...themeData,
          createdAt: new Date().toISOString()
        })
      }

      setSelectedTheme(themeId)
      setUseCustomColors(false)
      const theme = THEMES.find(t => t.id === themeId)
      if (theme) onThemeChange(theme)
      
      toast.success("✅ Thème appliqué avec succès !", { id: loadingToast })
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde", { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCustomColors = async () => {
    setLoading(true)
    const loadingToast = toast.loading("Sauvegarde des couleurs personnalisées...")

    try {
      const { list } = await lumi.entities.userSettings.list({
        filter: { userId },
        limit: 1
      })

      const themeData = {
        userId,
        theme: selectedTheme,
        useCustomColors: true,
        customPrimary,
        customSecondary,
        customBackground,
        customText,
        customAccent,
        fontSize,
        spacing,
        fontFamily,
        updatedAt: new Date().toISOString()
      }

      if (list.length > 0) {
        await lumi.entities.userSettings.update(list[0]._id, themeData)
      } else {
        await lumi.entities.userSettings.create({
          ...themeData,
          createdAt: new Date().toISOString()
        })
      }

      setUseCustomColors(true)
      
      // Appliquer immédiatement les couleurs CSS
      const root = document.documentElement
      root.style.setProperty("--custom-primary", customPrimary)
      root.style.setProperty("--custom-secondary", customSecondary)
      root.style.setProperty("--custom-background", customBackground)
      root.style.setProperty("--custom-text", customText)
      root.style.setProperty("--custom-accent", customAccent)
      
      toast.success("✅ Couleurs personnalisées appliquées !", { id: loadingToast })
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde", { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    setLoading(true)
    const loadingToast = toast.loading("Sauvegarde des préférences...")

    try {
      const { list } = await lumi.entities.userSettings.list({
        filter: { userId },
        limit: 1
      })

      const themeData = {
        userId,
        theme: selectedTheme,
        useCustomColors,
        customPrimary,
        customSecondary,
        customBackground,
        customText,
        customAccent,
        fontSize,
        spacing,
        fontFamily,
        updatedAt: new Date().toISOString()
      }

      if (list.length > 0) {
        await lumi.entities.userSettings.update(list[0]._id, themeData)
      } else {
        await lumi.entities.userSettings.create({
          ...themeData,
          createdAt: new Date().toISOString()
        })
      }

      // Appliquer la police
      document.documentElement.style.setProperty("--font-family", FONT_FAMILIES.find(f => f.id === fontFamily)?.value || "Inter, sans-serif")

      toast.success("✅ Préférences appliquées avec succès !", { id: loadingToast })
      window.location.reload()
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde", { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  const selectedThemeObj = THEMES.find(t => t.id === selectedTheme)

  return (
    <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎨 Personnalisation de l'interface</h2>
            <p className="text-sm text-gray-600 mt-1">
              Personnalisez les couleurs, le fond, la police et l'espacement
            </p>
          </div>
          <button
            onClick={() => onClose?.()}
            className="text-gray-400 hover:text-gray-900 text-2xl">
            ✕
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Section Thèmes prédéfinis */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>🌈</span> Thèmes prédéfinis
          </h3>
          <select
            value={selectedTheme}
            onChange={(e) => handleSaveTheme(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-base">
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.emoji} {theme.name}
              </option>
            ))}
          </select>
          
          {selectedThemeObj && !useCustomColors && (
            <div className="mt-4 p-4 rounded-lg border-2 border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Aperçu :</div>
              <div className={`h-24 rounded-lg bg-gradient-to-br ${selectedThemeObj.preview.bg} flex items-center justify-center`}>
                <div className="text-4xl">{selectedThemeObj.emoji}</div>
              </div>
              <div className={`text-center mt-2 font-semibold ${selectedThemeObj.preview.text}`}>
                {selectedThemeObj.name}
              </div>
            </div>
          )}
        </div>

        {/* Section Couleurs personnalisées */}
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>🎨</span> Couleurs personnalisées avancées
          </h3>
          <p className="text-sm text-gray-600 mb-4">Créez votre propre palette de couleurs complète</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Couleur principale
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="w-16 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg"
                  placeholder="#6366f1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎨 Couleur secondaire
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customSecondary}
                  onChange={(e) => setCustomSecondary(e.target.value)}
                  className="w-16 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={customSecondary}
                  onChange={(e) => setCustomSecondary(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌫️ Fond d'application
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customBackground}
                  onChange={(e) => setCustomBackground(e.target.value)}
                  className="w-16 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={customBackground}
                  onChange={(e) => setCustomBackground(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg"
                  placeholder="#f8fafc"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Couleur du texte
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-16 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg"
                  placeholder="#1e293b"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ✨ Couleur d'accent
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="w-16 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg"
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>

          {/* Aperçu des couleurs personnalisées */}
          <div className="mb-4 p-4 rounded-lg border-2 border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Aperçu de votre palette :</div>
            <div 
              className="h-32 rounded-lg flex items-center justify-center p-4"
              style={{ 
                background: customBackground
              }}>
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg shadow-lg" style={{ background: customPrimary }}></div>
                <div className="w-16 h-16 rounded-lg shadow-lg" style={{ background: customSecondary }}></div>
                <div className="w-16 h-16 rounded-lg shadow-lg" style={{ background: customAccent }}></div>
              </div>
              <div className="ml-4" style={{ color: customText }}>
                <p className="font-bold text-lg">Exemple de texte</p>
                <p className="text-sm">Sur le fond personnalisé</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveCustomColors}
            disabled={loading}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium">
            Appliquer les couleurs personnalisées
          </button>
        </div>

        {/* Section Style de police */}
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>✍️</span> Style de police
          </h3>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-base">
            {FONT_FAMILIES.map((font) => (
              <option key={font.id} value={font.id} style={{ fontFamily: font.value }}>
                {font.name}
              </option>
            ))}
          </select>
          <div className="mt-3 p-3 bg-white rounded border" style={{ fontFamily: FONT_FAMILIES.find(f => f.id === fontFamily)?.value }}>
            <p className="text-lg font-bold">Aperçu de la police</p>
            <p className="text-sm text-gray-600">Voici comment apparaîtra le texte dans l'application</p>
          </div>
        </div>

        {/* Section Taille du texte */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>🔤</span> Taille du texte
          </h3>
          <div className="grid grid-cols-5 gap-3">
            <button
              onClick={() => setFontSize("14")}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                fontSize === "14"
                  ? "border-gray-800 bg-gray-100 text-gray-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}>
              <div className="text-xs font-bold">14px</div>
            </button>
            <button
              onClick={() => setFontSize("15")}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                fontSize === "15"
                  ? "border-gray-800 bg-gray-100 text-gray-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}>
              <div className="text-xs font-bold">15px</div>
            </button>
            <button
              onClick={() => setFontSize("16")}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                fontSize === "16"
                  ? "border-gray-800 bg-gray-100 text-gray-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}>
              <div className="text-sm font-bold">16px</div>
            </button>
            <button
              onClick={() => setFontSize("17")}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                fontSize === "17"
                  ? "border-gray-800 bg-gray-100 text-gray-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}>
              <div className="text-sm font-bold">17px</div>
            </button>
            <button
              onClick={() => setFontSize("18")}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                fontSize === "18"
                  ? "border-gray-800 bg-gray-100 text-gray-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}>
              <div className="text-base font-bold">18px</div>
            </button>
          </div>
        </div>

        {/* Section Espacement */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>📏</span> Espacement des éléments
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSpacing("compact")}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                spacing === "compact"
                  ? "border-gray-800 bg-gray-100 text-gray-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}>
              <div className="text-sm font-bold">Compact</div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="h-1 bg-current rounded"></div>
                <div className="h-1 bg-current rounded"></div>
              </div>
            </button>
            <button
              onClick={() => setSpacing("normal")}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                spacing === "normal"
                  ? "border-gray-800 bg-gray-100 text-gray-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}>
              <div className="text-sm font-bold">Normal</div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="h-1 bg-current rounded"></div>
                <div className="h-1 bg-current rounded"></div>
              </div>
            </button>
            <button
              onClick={() => setSpacing("spacious")}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                spacing === "spacious"
                  ? "border-gray-800 bg-gray-100 text-gray-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}>
              <div className="text-sm font-bold">Spacieux</div>
              <div className="flex flex-col gap-3 mt-2">
                <div className="h-1 bg-current rounded"></div>
                <div className="h-1 bg-current rounded"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Bouton de sauvegarde finale */}
        <button
          onClick={handleSavePreferences}
          disabled={loading}
          className="w-full px-6 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg">
          ✅ Enregistrer toutes les préférences
        </button>
      </div>
    </div>
  )
}
