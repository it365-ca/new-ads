import React, { useMemo } from "react"

interface InterventionsHeatmapProps {
  notes: any[]
  enrollments: any[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  selectedProgramme: string
}

export const InterventionsHeatmap: React.FC<InterventionsHeatmapProps> = ({
  notes,
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  const heatmapData = useMemo(() => {
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)
    
    // Liste des écoles dans l'ordre : PRIMAIRES puis SECONDAIRES
    const orderedSchools = [
      // PRIMAIRES (14)
      "J-L Vinet-Souligny",
      "J-L Des Cheminots",
      "J-L Félix-Leclerc",
      "J-L Piché-Dufrost",
      "J-L Aquarelle-Armand-Frappier",
      "L-C Saint-Romain",
      "L-C Saint-Patrice",
      "L-C St-Édouard",
      "L-C Daigneau",
      "L-C Saint-Bernard-de-Lacolle",
      "P-B Saint-Michel-Archange",
      "P-B Saint-Isidore Langevin",
      "P-B Sainte- Clotilde",
      "P-B Saint-Viateur-Clothilde-Raymond",
      // SECONDAIRES (14)
      "Bonnier",
      "Des Timoniers",
      "Gabrielle-Roy",
      "Jacques-Leber",
      "Marguerite-Bourgeois",
      "Louis-Cyr",
      "St-François-Xavier",
      "Louis-Philippe-Paré",
      "De La Magdeleine",
      "Du Tournant",
      "Pierre-Bédard",
      "Fernand-Séguin",
      "Hors Territoire",
      "École aux adultes"
    ]
    
    // Récupérer les écoles présentes dans les inscriptions
    const schoolsPresent = new Set<string>()
    enrollments.forEach(e => {
      if (e.ecoleReferente) schoolsPresent.add(e.ecoleReferente)
    })
    
    // Filtrer uniquement les écoles présentes dans l'ordre défini
    const schools = orderedSchools.filter(school => schoolsPresent.has(school))
    
    // Créer la structure de données par mois et école
    const data: Record<string, Record<string, number>> = {}
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const monthKey = currentDate.toLocaleDateString("fr-CA", { year: "numeric", month: "short" })
      data[monthKey] = {}
      schools.forEach(school => {
        data[monthKey][school] = 0
      })
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    // Compter les notes par mois et école
    notes.forEach(note => {
      const enrollment = enrollments.find(e => e._id === note.enrollmentId)
      if (enrollment) {
        const noteDate = new Date(note.createdAt)
        if (noteDate >= startDate && noteDate <= endDate) {
          if (selectedProgramme === "tous" || enrollment.programme === selectedProgramme) {
            const monthKey = noteDate.toLocaleDateString("fr-CA", { year: "numeric", month: "short" })
            if (data[monthKey] && enrollment.ecoleReferente) {
              if (!(enrollment.ecoleReferente in data[monthKey])) {
                data[monthKey][enrollment.ecoleReferente] = 0
              }
              data[monthKey][enrollment.ecoleReferente]++
            }
          }
        }
      }
    })
    
    return { months: Object.keys(data), schools, data }
  }, [notes, enrollments, startYear, startMonth, endYear, endMonth, selectedProgramme])

  const maxValue = useMemo(() => {
    let max = 0
    Object.values(heatmapData.data).forEach(monthData => {
      Object.values(monthData).forEach(count => {
        if (count > max) max = count
      })
    })
    return max
  }, [heatmapData])

  const getColorIntensity = (value: number) => {
    if (value === 0) return "bg-gray-100"
    const intensity = (value / maxValue) * 100
    if (intensity < 20) return "bg-blue-200"
    if (intensity < 40) return "bg-blue-300"
    if (intensity < 60) return "bg-blue-400"
    if (intensity < 80) return "bg-blue-500"
    return "bg-blue-600"
  }

  const getTextColor = (value: number) => {
    const intensity = (value / maxValue) * 100
    return intensity > 60 ? "text-white" : "text-gray-900"
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        🔥 Heatmap des interventions par école et par mois
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Visualisation de l'intensité des interventions (notes) par école au fil du temps
      </p>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border border-gray-300 p-3 text-left font-semibold text-gray-900 min-w-[150px]">
                  École
                </th>
                {heatmapData.months.map(month => (
                  <th key={month} className="border border-gray-300 p-3 text-center font-semibold text-gray-900 min-w-[80px]">
                    <div className="text-xs">{month}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.schools.map(school => (
                  <tr key={school}>
                    <td className="sticky left-0 z-10 bg-white border border-gray-300 p-3 font-medium text-gray-900 text-sm">
                      {school}
                    </td>
                    {heatmapData.months.map(month => {
                      const value = heatmapData.data[month][school] || 0
                      return (
                        <td 
                          key={`${school}-${month}`}
                          className={`border border-gray-300 p-3 text-center font-bold ${getColorIntensity(value)} ${getTextColor(value)} transition-all hover:scale-110 cursor-pointer`}
                          title={`${school} - ${month}: ${value} intervention${value !== 1 ? "s" : ""}`}>
                          {value > 0 ? value : "·"}
                        </td>
                      )
                    })}
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="text-sm text-gray-600 font-medium">Intensité :</span>
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-xs">0</div>
          <div className="w-8 h-8 bg-blue-200 border border-gray-300 rounded"></div>
          <div className="w-8 h-8 bg-blue-300 border border-gray-300 rounded"></div>
          <div className="w-8 h-8 bg-blue-400 border border-gray-300 rounded"></div>
          <div className="w-8 h-8 bg-blue-500 border border-gray-300 rounded"></div>
          <div className="w-8 h-8 bg-blue-600 border border-gray-300 rounded flex items-center justify-center text-xs text-white">{maxValue}+</div>
        </div>
      </div>
    </div>
  )
}
