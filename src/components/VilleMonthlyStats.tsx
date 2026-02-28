import React, { useMemo } from "react"
import { useThemeContext } from "../contexts/ThemeContext"

interface Enrollment {
  _id: string
  programme: string
  ville: string
  dateEntree: string
  createdAt: string
  status: string
}

interface Props {
  enrollments: Enrollment[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  selectedProgramme: string
}

export const VilleMonthlyStats: React.FC<Props> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  const { getTableHeaderClass, getTableTotalClass } = useThemeContext()
  
  // Liste complète des villes possibles
  const allVilles = [
    "Candiac",
    "Châteauguay",
    "La Prairie",
    "Mercier",
    "Napierville",
    "Sherrington",
    "St-Bernard de Lacolle",
    "St-Constant",
    "St-Isidore",
    "St-Michel",
    "St-Philippe",
    "St-Rémi",
    "Ste-Catherine",
    "Ste-Clotilde",
    "St-Mathieu",
    "St-Édouard",
    "Hemmingford",
    "Léry",
    "Delson"
  ]

  // Générer la liste des mois dans la période
  const monthsList = useMemo(() => {
    const months: { year: number; month: number; label: string; shortLabel: string }[] = []
    let currentYear = startYear
    let currentMonth = startMonth

    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      const date = new Date(currentYear, currentMonth - 1, 1)
      const label = date.toLocaleDateString("fr-CA", { year: "numeric", month: "long" })
      const shortLabel = date.toLocaleDateString("fr-CA", { month: "short" }).replace(".", "")
      months.push({ year: currentYear, month: currentMonth, label, shortLabel })

      currentMonth++
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }
    }

    return months
  }, [startYear, startMonth, endYear, endMonth])

  // Calculer les statistiques par ville et par mois
  const stats = useMemo(() => {
    const villeMap: Record<string, Record<string, number>> = {}
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)

    // Initialiser toutes les villes avec 0
    allVilles.forEach(ville => {
      villeMap[ville] = {}
    })

    enrollments.forEach(e => {
      // Filtre par statut (exclure en_attente)
      if (e.status !== "actif" && e.status !== "ferme") {
        return
      }
      
      // Filtre par programme
      if (selectedProgramme !== "tous" && e.programme !== selectedProgramme) {
        return
      }
      
      const entryDate = new Date(e.dateEntree || e.createdAt)
      if (entryDate >= startDate && entryDate <= endDate) {
        const year = entryDate.getFullYear()
        const month = entryDate.getMonth() + 1
        const key = `${year}-${month}`

        if (!villeMap[e.ville]) {
          villeMap[e.ville] = {}
        }
        villeMap[e.ville][key] = (villeMap[e.ville][key] || 0) + 1
      }
    })

    // Calculer les totaux par ville
    const villeTotals: Record<string, number> = {}
    allVilles.forEach(ville => {
      villeTotals[ville] = Object.values(villeMap[ville] || {}).reduce((sum, val) => sum + val, 0)
    })

    return { villeMap, villeTotals }
  }, [enrollments, startYear, startMonth, endYear, endMonth, monthsList, selectedProgramme])

  // Calculer les totaux par mois
  const monthTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let total = 0
      allVilles.forEach(ville => {
        total += stats.villeMap[ville]?.[key] || 0
      })
      totals[key] = total
    })
    return totals
  }, [monthsList, stats])

  // Calculer le grand total
  const grandTotal = useMemo(() => {
    return Object.values(stats.villeTotals).reduce((sum, val) => sum + val, 0)
  }, [stats.villeTotals])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🌆 Nombre d'inscriptions par villes {selectedProgramme !== "tous" && `(${selectedProgramme})`}
      </h2>

      <div className="flex flex-col gap-6">
        {/* Tableau */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className={getTableHeaderClass()}>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Ville</th>
                {monthsList.map(m => {
                  const monthMap: Record<string, string> = {
                    "janv": "Janv", "févr": "Févr", "mars": "Mars", "avr": "Avr",
                    "mai": "Mai", "juin": "Juin", "juil": "Juill", "août": "Août",
                    "sept": "Sept", "oct": "Oct", "nov": "Nov", "déc": "Déc"
                  }
                  return (
                    <th key={`${m.year}-${m.month}`} className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-700 min-w-[60px]">
                      {monthMap[m.shortLabel] || m.shortLabel.charAt(0).toUpperCase() + m.shortLabel.slice(1)}
                    </th>
                  )
                })}
                <th className={`border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 ${getTableTotalClass()}`}>Total</th>
                <th className={`border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 ${getTableTotalClass()}`}>%</th>
              </tr>
            </thead>
            <tbody>
              {allVilles.map((ville, idx) => {
                const percentage = grandTotal > 0 ? ((stats.villeTotals[ville] / grandTotal) * 100).toFixed(1) : "0.0"
                return (
                  <tr key={ville} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">{ville}</td>
                    {monthsList.map(m => {
                      const key = `${m.year}-${m.month}`
                      const count = stats.villeMap[ville]?.[key] || 0
                      return (
                        <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                          {count}
                        </td>
                      )
                    })}
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-gray-100">
                      {stats.villeTotals[ville]}
                    </td>
                    <td className={`border border-gray-300 px-3 py-2 text-center font-bold ${getTableHeaderClass()}`}>
                      {percentage}%
                    </td>
                  </tr>
                )
              })}
              <tr className={`${getTableTotalClass()} font-bold`}>
                <td className="border border-gray-300 px-3 py-2 text-gray-900">Total</td>
                {monthsList.map(m => {
                  const key = `${m.year}-${m.month}`
                  return (
                    <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-900">
                      {monthTotals[key] || 0}
                    </td>
                  )
                })}
                <td className={`border border-gray-300 px-3 py-2 text-center text-gray-900 ${getTableTotalClass()}`}>
                  {grandTotal}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900">
                </td>
              </tr>
            </tbody>
          </table>
        </div>


      </div>
    </div>
  )
}
