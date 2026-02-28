import React, { useState, useEffect } from "react"

export const WeatherWidget: React.FC = () => {
  const [temperature, setTemperature] = useState<string>("Chargement...")

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

  useEffect(() => {
    // Fonction pour récupérer la météo de Delson, QC via Open-Meteo
    async function fetchDelsonWeather() {
      try {
        // Coordonnées de Delson, QC: 45.37°N, 73.55°W
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=45.37&longitude=-73.55&current_weather=true",
          {
            signal: AbortSignal.timeout(10000) // Timeout de 10 secondes
          }
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data?.current_weather?.temperature !== undefined) {
          const temp = roundToHalf(data.current_weather.temperature)
          setTemperature(`${temp}°C`)
        } else {
          setTemperature("--°C")
        }
      } catch (error) {
        // Gestion silencieuse de l'erreur météo - ne pas polluer la console
        setTemperature("--°C")
      }
    }

    fetchDelsonWeather()
    
    // Actualiser toutes les 10 minutes
    const interval = setInterval(fetchDelsonWeather, 600000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      padding: "10px",
      background: "#ffffff",
      borderRadius: "5px",
      display: "inline-block"
    }}>
      <span style={{ fontWeight: "bold" }}>Delson, QC : </span>
      <span id="temp-val">{temperature}</span>
    </div>
  )
}
