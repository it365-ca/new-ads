import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { WeatherWidget } from "./WeatherWidget"

interface SharedHeaderProps {
  user?: {
    prenom?: string
    nom?: string
    userId?: string
    email?: string
    userName?: string
    userRole?: string
  }
  onSignOut?: () => void
  showNotifications?: boolean
  showSupport?: boolean
  showLogout?: boolean
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({
  user,
  onSignOut,
  showNotifications = true,
  showSupport = true,
  showLogout = true
}) => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Mise à jour de l'heure chaque minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getGreetingMessage = () => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 12) return "☀️ Bon Matin"
    if (hour >= 12 && hour < 18) return "☁️ Bon après-midi"
    return "🌙 Bonne soirée"
  }

  const formatDate = () => {
    const jour = currentTime.toLocaleDateString("fr-FR", { weekday: "long" })
    const jourCapitalized = jour.charAt(0).toUpperCase() + jour.slice(1)
    const mois = currentTime.toLocaleDateString("fr-FR", { month: "long" })
    const date = String(currentTime.getDate()).padStart(2, "0")
    const annee = String(currentTime.getFullYear())
    return `${jourCapitalized}, ${date} ${mois}, ${annee}`
  }

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-xl border-b border-gray-200/50 relative z-[100]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between gap-8">
          {/* Logo à gauche */}
          <div className="flex-shrink-0">
            <img 
              src="https://static.lumi.new/8e/8e5f2a40e2bc63b9928e6d01978f5ebb.webp" 
              alt="Logo Benado" 
              className="w-28 h-28 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                navigate("/")
                window.location.reload()
              }}
            />
          </div>
          
          {/* Température et heure fondues dans l'en-tête */}
          <div className="flex items-center gap-6 flex-1 justify-center">
            <div className="flex items-center gap-6">
              <WeatherWidget />
              <span className="text-gray-400">|</span>
              <div className="flex flex-col items-start gap-1">
                <span className="text-xl font-bold text-gray-800 tabular-nums">
                  {currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-base font-semibold text-gray-700">
                  {formatDate()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Boutons d'action à droite */}
          <div className="flex flex-col items-end gap-2 relative z-[200]">
            <div className="text-lg font-bold text-gray-900">
              Bonjour {user?.prenom || user?.nom || "Utilisateur"}
            </div>
            <div className="flex items-center gap-3">
              {showNotifications && (
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  🔔
                </button>
              )}
              {showSupport && (
                <button className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm font-medium">
                  💬 Support
                </button>
              )}
              {showLogout && onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-sm font-medium">
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
