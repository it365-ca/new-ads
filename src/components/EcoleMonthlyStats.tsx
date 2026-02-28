import React, { useMemo } from "react"
import { useThemeContext } from "../contexts/ThemeContext"

interface Enrollment {
  _id: string
  programme: string
  ecoleReferente: string
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

export const EcoleMonthlyStats: React.FC<Props> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  const { getTableHeaderClass, getTableTotalClass } = useThemeContext()
  
  // Liste complète des écoles possibles (primaires puis secondaires)
  const allEcoles = [
    // Écoles primaires
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
    // Écoles secondaires
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

  // Calculer les statistiques par école et par mois
  const stats = useMemo(() => {
    const ecoleMap: Record<string, Record<string, number>> = {}
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)

    // Initialiser toutes les écoles avec 0
    allEcoles.forEach(ecole => {
      ecoleMap[ecole] = {}
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

        if (!ecoleMap[e.ecoleReferente]) {
          ecoleMap[e.ecoleReferente] = {}
        }
        ecoleMap[e.ecoleReferente][key] = (ecoleMap[e.ecoleReferente][key] || 0) + 1
      }
    })

    // Calculer les totaux par école
    const ecoleTotals: Record<string, number> = {}
    allEcoles.forEach(ecole => {
      ecoleTotals[ecole] = Object.values(ecoleMap[ecole] || {}).reduce((sum, val) => sum + val, 0)
    })

    return { ecoleMap, ecoleTotals }
  }, [enrollments, startYear, startMonth, endYear, endMonth, monthsList, selectedProgramme])

  // Calculer les totaux par mois
  const monthTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let total = 0
      allEcoles.forEach(ecole => {
        total += stats.ecoleMap[ecole]?.[key] || 0
      })
      totals[key] = total
    })
    return totals
  }, [monthsList, stats])

  // Calculer le grand total
  const grandTotal = useMemo(() => {
    return Object.values(stats.ecoleTotals).reduce((sum, val) => sum + val, 0)
  }, [stats.ecoleTotals])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🏫 Nombre d'inscriptions par écoles {selectedProgramme !== "tous" && `(${selectedProgramme})`}
      </h2>

      <div className="flex flex-col gap-6">
        {/* Tableau */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className={getTableHeaderClass()}>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">École</th>
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
              {allEcoles.map((ecole, idx) => {
                const percentage = grandTotal > 0 ? ((stats.ecoleTotals[ecole] / grandTotal) * 100).toFixed(1) : "0.0"
                
                // Ajouter une ligne de séparation après la 14ème école (fin des primaires)
                const showSeparator = idx === 14
                
                return (
                  <React.Fragment key={ecole}>
                    {idx === 0 && (
                      <tr className="bg-blue-100">
                        <td colSpan={monthsList.length + 3} className="border border-gray-300 px-3 py-2 font-bold text-blue-900 text-center">
                          📚 ÉCOLES PRIMAIRES
                        </td>
                      </tr>
                    )}
                    {showSeparator && (
                      <tr className="bg-indigo-100">
                        <td colSpan={monthsList.length + 3} className="border border-gray-300 px-3 py-2 font-bold text-indigo-900 text-center">
                          🎓 ÉCOLES SECONDAIRES
                        </td>
                      </tr>
                    )}
                    <tr className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">{ecole}</td>
                      {monthsList.map(m => {
                        const key = `${m.year}-${m.month}`
                        const count = stats.ecoleMap[ecole]?.[key] || 0
                        return (
                          <td key={key} className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                            {count}
                          </td>
                        )
                      })}
                      <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-gray-100">
                        {stats.ecoleTotals[ecole]}
                      </td>
                      <td className={`border border-gray-300 px-3 py-2 text-center font-bold ${getTableHeaderClass()}`}>
                        {percentage}%
                      </td>
                    </tr>
                  </React.Fragment>
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
