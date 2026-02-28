import React, { useMemo } from "react"
import { useThemeContext } from "../contexts/ThemeContext"

interface Enrollment {
  _id: string
  programme: string
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

export const ProgrammeMonthlyStats: React.FC<Props> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  const { getTableHeaderClass, getTableTotalClass } = useThemeContext()
  
  // Liste complète des programmes possibles selon le schéma
  const allProgrammes = [
    "ALT",
    "OPTION",
    "PIVOT",
    "APOSTROPHE",
    "SAUTS",
    "Suivis Estivaux"
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

  // Calculer les statistiques par programme et par mois
  const stats = useMemo(() => {
    const programmeMap: Record<string, Record<string, number>> = {}
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)

    // Initialiser tous les programmes avec 0
    allProgrammes.forEach(prog => {
      programmeMap[prog] = {}
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

        if (!programmeMap[e.programme]) {
          programmeMap[e.programme] = {}
        }
        programmeMap[e.programme][key] = (programmeMap[e.programme][key] || 0) + 1
      }
    })

    // Calculer les totaux par programme
    const programmeTotals: Record<string, number> = {}
    allProgrammes.forEach(prog => {
      programmeTotals[prog] = Object.values(programmeMap[prog] || {}).reduce((sum, val) => sum + val, 0)
    })

    return { programmeMap, programmeTotals }
  }, [enrollments, startYear, startMonth, endYear, endMonth, monthsList, selectedProgramme])

  // Calculer les totaux par mois
  const monthTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let total = 0
      allProgrammes.forEach(prog => {
        total += stats.programmeMap[prog]?.[key] || 0
      })
      totals[key] = total
    })
    return totals
  }, [monthsList, stats])

  // Calculer le grand total
  const grandTotal = useMemo(() => {
    return Object.values(stats.programmeTotals).reduce((sum, val) => sum + val, 0)
  }, [stats.programmeTotals])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Programmes</h2>

      <div className="flex flex-col gap-6">
        {/* Tableau */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className={getTableHeaderClass()}>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Programme</th>
                {monthsList.map(m => (
                  <th key={`${m.year}-${m.month}`} className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-700 min-w-[60px]">
                    {m.shortLabel.charAt(0).toUpperCase() + m.shortLabel.slice(1)}
                  </th>
                ))}
                <th className={`border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 ${getTableTotalClass()}`}>Total</th>
                <th className={`border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 ${getTableTotalClass()}`}>%</th>
              </tr>
            </thead>
            <tbody>
              {allProgrammes.map((prog, idx) => {
                const percentage = grandTotal > 0 ? ((stats.programmeTotals[prog] / grandTotal) * 100).toFixed(1) : "0.0"
                return (
                  <tr key={prog} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">{prog}</td>
                    {monthsList.map(m => {
                      const key = `${m.year}-${m.month}`
                      const count = stats.programmeMap[prog]?.[key] || 0
                      return (
                        <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                          {count}
                        </td>
                      )
                    })}
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-gray-100">
                      {stats.programmeTotals[prog]}
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
