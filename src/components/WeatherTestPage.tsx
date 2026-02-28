import React from "react"
import { lumi } from "../lib/lumi"

export const WeatherTestPage: React.FC = () => {
  const [weather, setWeather] = React.useState<{temp: number, condition: string, icon: string, city: string} | null>(null)
  const [weatherLoading, setWeatherLoading] = React.useState(true)
  const [currentTime, setCurrentTime] = React.useState(new Date())

  // Fonction pour arrondir : >= 0.5 vers le haut, 0.1-0.4 vers le bas
  const roundToHalf = (num: number) => {
    const decimal = num - Math.floor(num)
    if (decimal < 0.5) {
      return Math.floor(num)
    } else if (decimal === 0.5) {
      return Math.floor(num) + 0.5
    } else {
      return Math.ceil(num)
    }
  }

  // Mise à jour de l'heure chaque minute
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Fonction pour récupérer la météo
  const fetchWeather = async () => {
    try {
      setWeatherLoading(true)
      const data = await lumi.functions.invoke('getWeather', {
        method: 'POST',
        body: { lat: 45.5017, lon: -73.5673 }
      })
      if (data.success) {
        setWeather(data.data)
      }
    } catch (error) {
      console.error('Erreur météo:', error)
    } finally {
      setWeatherLoading(false)
    }
  }

  // Charger la météo au démarrage
  React.useEffect(() => {
    fetchWeather()
  }, [])

  // Auto-rafraîchissement de la météo toutes les 10 minutes
  React.useEffect(() => {
    const weatherTimer = setInterval(() => {
      fetchWeather()
    }, 600000)
    return () => clearInterval(weatherTimer)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Bon Matin"
    if (hour < 18) return "Bon Après-midi"
    return "Bonne Soirée"
  }

  const formatDate = () => {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
    return `${days[currentTime.getDay()]} ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Titre de la page */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🌤️ Test d'affichage Météo</h1>
          <p className="text-gray-600">Différentes variantes esthétiques pour la température</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            ← Retour
          </button>
        </div>

        {/* Variante 1: Carte compacte avec gradient bleu */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Variante 1: Carte Compacte (Actuelle)</h2>
          {weatherLoading ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-md inline-block">
              <p className="text-gray-600">Chargement météo...</p>
            </div>
          ) : weather ? (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl px-8 py-4 shadow-lg flex items-center gap-4 inline-flex">
              <img 
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.condition}
                className="w-16 h-16"
              />
              <div className="text-white">
                <p className="text-3xl font-bold">{roundToHalf(weather.temp)}°C</p>
                <p className="text-sm opacity-90 capitalize">{weather.condition}</p>
                <p className="text-xs opacity-75">{weather.city}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-md inline-block">
              <p className="text-gray-600">Météo indisponible</p>
            </div>
          )}
        </div>

        {/* Variante 2: Carte large avec fond coloré */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Variante 2: Carte Large avec Dégradé</h2>
          {weather && !weatherLoading ? (
            <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-6">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
                    alt={weather.condition}
                    className="w-32 h-32 drop-shadow-2xl"
                  />
                  <div>
                    <div className="text-7xl font-bold mb-2">{roundToHalf(weather.temp)}°</div>
                    <p className="text-2xl capitalize opacity-90 mb-1">{weather.condition}</p>
                    <p className="text-lg opacity-75">📍 {weather.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-75 mb-1">{formatDate()}</p>
                  <p className="text-xl font-semibold">{getGreeting()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center bg-gray-100 rounded-2xl">
              <p className="text-gray-500">Chargement...</p>
            </div>
          )}
        </div>

        {/* Variante 3: Style minimal et élégant */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Variante 3: Style Minimal Élégant</h2>
          {weather && !weatherLoading ? (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full p-4 shadow-lg">
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                      alt={weather.condition}
                      className="w-16 h-16"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Température Actuelle</p>
                    <p className="text-5xl font-bold text-gray-900">{roundToHalf(weather.temp)}°C</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-700 font-medium capitalize mb-1">{weather.condition}</p>
                  <p className="text-sm text-gray-500">📍 {weather.city}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center bg-gray-50 rounded-2xl">
              <p className="text-gray-400">Chargement...</p>
            </div>
          )}
        </div>

        {/* Variante 4: Style néomorphisme moderne */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Variante 4: Style Néomorphisme</h2>
          {weather && !weatherLoading ? (
            <div className="bg-gray-100 rounded-3xl p-8 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
              <div className="flex items-center gap-6">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-24 h-24 flex items-center justify-center shadow-inner">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.condition}
                    className="w-20 h-20"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-bold text-gray-800">{roundToHalf(weather.temp)}</span>
                    <span className="text-3xl text-gray-600">°C</span>
                  </div>
                  <p className="text-lg text-gray-700 capitalize font-medium">{weather.condition}</p>
                  <p className="text-sm text-gray-500 mt-1">📍 {weather.city}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center bg-gray-100 rounded-3xl">
              <p className="text-gray-400">Chargement...</p>
            </div>
          )}
        </div>

        {/* Variante 5: Style glassmorphisme */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Variante 5: Style Glassmorphisme</h2>
          <div className="relative bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-3xl p-1 overflow-hidden">
            {weather && !weatherLoading ? (
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 border border-white/30">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-6">
                    <div className="bg-white/30 backdrop-blur-md rounded-full p-3 border border-white/40">
                      <img 
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                        alt={weather.condition}
                        className="w-20 h-20"
                      />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold drop-shadow-lg">{roundToHalf(weather.temp)}</span>
                        <span className="text-3xl">°C</span>
                      </div>
                      <p className="text-xl capitalize mt-2 drop-shadow">{weather.condition}</p>
                    </div>
                  </div>
                  <div className="text-right bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                    <p className="text-sm mb-1 opacity-90">📍 {weather.city}</p>
                    <p className="text-xs opacity-75">{formatDate()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center bg-white/20 backdrop-blur-xl rounded-3xl">
                <p className="text-white">Chargement...</p>
              </div>
            )}
          </div>
        </div>

        {/* Variante 6: Coin supérieur droit (comme widget) */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Variante 6: Widget Coin Droit (Header)</h2>
          <div className="relative h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            {weather && !weatherLoading ? (
              <div className="absolute top-4 right-4 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl px-6 py-3 shadow-lg">
                <div className="flex items-center gap-3 text-white">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.condition}
                    className="w-12 h-12"
                  />
                  <div>
                    <p className="text-2xl font-bold">{roundToHalf(weather.temp)}°C</p>
                    <p className="text-xs opacity-90">{weather.city}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute top-4 right-4 bg-gray-200 rounded-xl px-6 py-3">
                <p className="text-gray-500 text-sm">Chargement...</p>
              </div>
            )}
            <p className="absolute bottom-4 left-4 text-gray-400 text-sm">← Simule le coin d'un header</p>
          </div>
        </div>

        {/* Variante 7: Intégré dans la barre de bienvenue */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Variante 7: Intégré au Message de Bienvenue</h2>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Bonjour Administrateur, {getGreeting()}
                </h3>
                <p className="text-lg text-gray-700">{formatDate()}</p>
              </div>
              {weather && !weatherLoading && (
                <div className="flex items-center gap-4 bg-white rounded-xl px-6 py-4 shadow-md border-2 border-indigo-200">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.condition}
                    className="w-16 h-16"
                  />
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{roundToHalf(weather.temp)}°C</p>
                    <p className="text-sm text-gray-600 capitalize">{weather.condition}</p>
                    <p className="text-xs text-gray-500">📍 {weather.city}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommandation */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Recommandation</h2>
          <p className="text-gray-700 mb-4">
            Pour le dashboard principal, je recommande la <strong>Variante 7</strong> : elle intègre harmonieusement
            la météo avec le message de bienvenue, créant une expérience cohérente et professionnelle sans surcharger
            l'interface.
          </p>
          <p className="text-gray-700">
            Pour la page Statistiques, la <strong>Variante 6</strong> (widget coin droit) est idéale car elle reste
            discrète tout en restant visible et accessible.
          </p>
        </div>
      </div>
    </div>
  )
}
