import React, { useMemo } from "react"

interface Enrollment {
  _id: string
  degreScolaire: string
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

export const DegreMonthlyStats: React.FC<Props> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  // Liste complète des degrés scolaires possibles selon le schéma
  const allDegres = [
    "6e Année",
    "Secondaire 1",
    "Secondaire 2",
    "Secondaire 3",
    "Secondaire 4",
    "Secondaire 5",
    "FPT",
    "FMS",
    "GADP",
    "GADSP",
    "PEP"
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

  // Calculer les statistiques par degré scolaire et par mois
  const stats = useMemo(() => {
    const degreMap: Record<string, Record<string, number>> = {}
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)

    // Initialiser tous les degrés avec 0
    allDegres.forEach(degre => {
      degreMap[degre] = {}
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

        if (!degreMap[e.degreScolaire]) {
          degreMap[e.degreScolaire] = {}
        }
        degreMap[e.degreScolaire][key] = (degreMap[e.degreScolaire][key] || 0) + 1
      }
    })

    // Calculer les totaux par degré
    const degreTotals: Record<string, number> = {}
    allDegres.forEach(degre => {
      degreTotals[degre] = Object.values(degreMap[degre] || {}).reduce((sum, val) => sum + val, 0)
    })

    return { degreMap, degreTotals }
  }, [enrollments, startYear, startMonth, endYear, endMonth, selectedProgramme])

  // Calculer les totaux par mois
  const monthTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let total = 0
      allDegres.forEach(degre => {
        total += stats.degreMap[degre]?.[key] || 0
      })
      totals[key] = total
    })
    return totals
  }, [monthsList, stats])

  // Calculer le grand total
  const grandTotal = useMemo(() => {
    return Object.values(stats.degreTotals).reduce((sum, val) => sum + val, 0)
  }, [stats.degreTotals])

  // Calculer les pourcentages pour le graphique circulaire (seulement les degrés avec des données)
  const degrePercentages = useMemo(() => {
    return allDegres
      .filter(degre => stats.degreTotals[degre] > 0)
      .map(degre => ({
        degre: degre,
        count: stats.degreTotals[degre],
        percentage: ((stats.degreTotals[degre] / grandTotal) * 100).toFixed(1)
      }))
  }, [stats, grandTotal])

  const colors = [
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500"
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🎓 Nombre d'inscriptions par degré scolaire</h2>

      <div className="flex flex-col gap-6">
        {/* Tableau */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-teal-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Degré scolaire</th>
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
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-teal-200">Total</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-teal-300">%</th>
              </tr>
            </thead>
            <tbody>
              {allDegres.map((degre, idx) => {
                const percentage = grandTotal > 0 ? ((stats.degreTotals[degre] / grandTotal) * 100).toFixed(1) : "0.0"
                return (
                  <tr key={degre} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">{degre}</td>
                    {monthsList.map(m => {
                      const key = `${m.year}-${m.month}`
                      const count = stats.degreMap[degre]?.[key] || 0
                      return (
                        <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                          {count}
                        </td>
                      )
                    })}
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-gray-100">
                      {stats.degreTotals[degre]}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold text-teal-700 bg-teal-50">
                      {percentage}%
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-teal-200 font-bold">
                <td className="border border-gray-300 px-3 py-2 text-gray-900">Total</td>
                {monthsList.map(m => {
                  const key = `${m.year}-${m.month}`
                  return (
                    <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-900">
                      {monthTotals[key] || 0}
                    </td>
                  )
                })}
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900 bg-teal-300">
                  {grandTotal}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900 bg-teal-300">
                </td>
              </tr>
            </tbody>
          </table>
        </div>


      </div>
    </div>
  )
}
