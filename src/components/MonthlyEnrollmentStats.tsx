import React, { useMemo } from "react"

interface Enrollment {
  _id: string
  programme: string
  dateEntree: string
  createdAt: string
}

interface Props {
  enrollments: Enrollment[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  selectedProgramme: string
}

export const MonthlyEnrollmentStats: React.FC<Props> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  // Générer la liste des mois dans la période (avril à mars)
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

  // Calculer le nombre d'inscriptions par mois
  const monthlyStats = useMemo(() => {
    const stats: Record<string, number> = {}
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)

    enrollments.forEach(e => {
      // Filtre par programme
      if (selectedProgramme !== "tous" && e.programme !== selectedProgramme) {
        return
      }
      
      const entryDate = new Date(e.dateEntree || e.createdAt)
      if (entryDate >= startDate && entryDate <= endDate) {
        const year = entryDate.getFullYear()
        const month = entryDate.getMonth() + 1
        const key = `${year}-${month}`
        stats[key] = (stats[key] || 0) + 1
      }
    })

    return stats
  }, [enrollments, startYear, startMonth, endYear, endMonth, selectedProgramme])

  // Calculer le total
  const grandTotal = useMemo(() => {
    return Object.values(monthlyStats).reduce((sum, val) => sum + val, 0)
  }, [monthlyStats])

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        📅 Nombre d'inscriptions par mois {selectedProgramme !== "tous" && `(${selectedProgramme})`}
      </h2>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-purple-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Mois</th>
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
              <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-purple-200">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">Inscriptions</td>
              {monthsList.map(m => {
                const key = `${m.year}-${m.month}`
                const count = monthlyStats[key] || 0
                return (
                  <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                    {count}
                  </td>
                )
              })}
              <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-purple-100">
                {grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
