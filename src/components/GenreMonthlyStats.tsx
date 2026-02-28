import React, { useMemo } from "react"
import { useThemeContext } from "../contexts/ThemeContext"

interface Enrollment {
  _id: string
  genre: string
  dateEntree: string
  createdAt: string
  status: string
  programme: string
}

interface Props {
  enrollments: Enrollment[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  selectedProgramme: string
}

export const GenreMonthlyStats: React.FC<Props> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  const { getTableHeaderClass, getTableTotalClass } = useThemeContext()
  
  // Liste complète des genres possibles selon le schéma
  const allGenres = [
    "Masculin",
    "Féminin",
    "Autres"
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

  // Calculer les statistiques par genre et par mois
  const stats = useMemo(() => {
    const genreMap: Record<string, Record<string, number>> = {}
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)

    // Initialiser tous les genres avec 0
    allGenres.forEach(genre => {
      genreMap[genre] = {}
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

        if (!genreMap[e.genre]) {
          genreMap[e.genre] = {}
        }
        genreMap[e.genre][key] = (genreMap[e.genre][key] || 0) + 1
      }
    })

    // Calculer les totaux par genre
    const genreTotals: Record<string, number> = {}
    allGenres.forEach(genre => {
      genreTotals[genre] = Object.values(genreMap[genre] || {}).reduce((sum, val) => sum + val, 0)
    })

    return { genreMap, genreTotals }
  }, [enrollments, startYear, startMonth, endYear, endMonth, selectedProgramme])

  // Calculer les totaux par mois
  const monthTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let total = 0
      allGenres.forEach(genre => {
        total += stats.genreMap[genre]?.[key] || 0
      })
      totals[key] = total
    })
    return totals
  }, [monthsList, stats])

  // Calculer le grand total
  const grandTotal = useMemo(() => {
    return Object.values(stats.genreTotals).reduce((sum, val) => sum + val, 0)
  }, [stats.genreTotals])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 Nombre d'inscriptions par genre</h2>

      <div className="flex flex-col gap-6">
        {/* Tableau */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className={getTableHeaderClass()}>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Genre</th>
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
              {allGenres.map((genre, idx) => {
                const percentage = grandTotal > 0 ? ((stats.genreTotals[genre] / grandTotal) * 100).toFixed(1) : "0.0"
                return (
                  <tr key={genre} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">{genre}</td>
                    {monthsList.map(m => {
                      const key = `${m.year}-${m.month}`
                      const count = stats.genreMap[genre]?.[key] || 0
                      return (
                        <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                          {count}
                        </td>
                      )
                    })}
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-gray-100">
                      {stats.genreTotals[genre]}
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
