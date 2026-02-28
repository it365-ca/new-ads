import React, { useMemo } from "react"

interface Enrollment {
  _id: string
  programme: string
  origine: string
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

export const OrigineMonthlyStats: React.FC<Props> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  // Liste complète des origines possibles selon le schéma
  const allOrigines = [
    "Canadienne",
    "Asiatique occidental",
    "Asiatique du Sud-Est",
    "Europe de l'est/l'ouest",
    "Sud-Asiatique",
    "Latino-Américaine",
    "Arabe",
    "Africaine",
    "Haïtienne",
    "Chinoise",
    "Autochtone"
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

  // Calculer les statistiques par origine et par mois
  const stats = useMemo(() => {
    const origineMap: Record<string, Record<string, number>> = {}
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)

    // Initialiser toutes les origines avec 0
    allOrigines.forEach(origine => {
      origineMap[origine] = {}
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

        if (!origineMap[e.origine]) {
          origineMap[e.origine] = {}
        }
        origineMap[e.origine][key] = (origineMap[e.origine][key] || 0) + 1
      }
    })

    // Calculer les totaux par origine
    const origineTotals: Record<string, number> = {}
    allOrigines.forEach(origine => {
      origineTotals[origine] = Object.values(origineMap[origine] || {}).reduce((sum, val) => sum + val, 0)
    })

    return { origineMap, origineTotals }
  }, [enrollments, startYear, startMonth, endYear, endMonth, monthsList, selectedProgramme])

  // Calculer les totaux par mois
  const monthTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let total = 0
      allOrigines.forEach(origine => {
        total += stats.origineMap[origine]?.[key] || 0
      })
      totals[key] = total
    })
    return totals
  }, [monthsList, stats])

  // Calculer le grand total
  const grandTotal = useMemo(() => {
    return Object.values(stats.origineTotals).reduce((sum, val) => sum + val, 0)
  }, [stats.origineTotals])

  // Calculer les pourcentages pour le graphique circulaire (seulement les origines avec des données)
  const originePercentages = useMemo(() => {
    return allOrigines
      .filter(origine => stats.origineTotals[origine] > 0)
      .map(origine => ({
        origine: origine,
        count: stats.origineTotals[origine],
        percentage: ((stats.origineTotals[origine] / grandTotal) * 100).toFixed(1)
      }))
  }, [stats, grandTotal])

  const colors = [
    "bg-blue-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-lime-500",
    "bg-fuchsia-500",
    "bg-teal-500",
    "bg-indigo-500"
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🌍 Nombre d'inscriptions par origine {selectedProgramme !== "tous" && `(${selectedProgramme})`}
      </h2>

      <div className="flex flex-col gap-6">
        {/* Tableau */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-amber-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Origine</th>
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
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-amber-200">Total</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-amber-300">%</th>
              </tr>
            </thead>
            <tbody>
              {allOrigines.map((origine, idx) => {
                const percentage = grandTotal > 0 ? ((stats.origineTotals[origine] / grandTotal) * 100).toFixed(1) : "0.0"
                return (
                  <tr key={origine} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">{origine}</td>
                    {monthsList.map(m => {
                      const key = `${m.year}-${m.month}`
                      const count = stats.origineMap[origine]?.[key] || 0
                      return (
                        <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                          {count}
                        </td>
                      )
                    })}
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-gray-100">
                      {stats.origineTotals[origine]}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold text-amber-700 bg-amber-50">
                      {percentage}%
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-amber-200 font-bold">
                <td className="border border-gray-300 px-3 py-2 text-gray-900">Total</td>
                {monthsList.map(m => {
                  const key = `${m.year}-${m.month}`
                  return (
                    <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-900">
                      {monthTotals[key] || 0}
                    </td>
                  )
                })}
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900 bg-amber-300">
                  {grandTotal}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900 bg-amber-300">
                </td>
              </tr>
            </tbody>
          </table>
        </div>


      </div>
    </div>
  )
}
