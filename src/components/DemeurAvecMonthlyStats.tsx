import React, { useMemo } from "react"
import type { Enrollment } from "../hooks/useEnrollments"

interface DemeurAvecMonthlyStatsProps {
  enrollments: Enrollment[]
  startYear: number
  startMonth: number
  startDay: number
  endYear: number
  endMonth: number
  endDay: number
}

interface DemeurAvecMonthlyStatsPropsExtended extends DemeurAvecMonthlyStatsProps {
  selectedProgramme?: string
}

export const DemeurAvecMonthlyStats: React.FC<DemeurAvecMonthlyStatsPropsExtended> = ({
  enrollments,
  startYear,
  startMonth,
  startDay,
  endYear,
  endMonth,
  endDay,
  selectedProgramme = "tous"
}) => {
  const monthlyStats = useMemo(() => {
    const startDate = new Date(startYear, startMonth - 1, startDay)
    const endDate = new Date(endYear, endMonth - 1, endDay)
    
    console.log("DemeurAvec - Période:", { 
      startDate: startDate.toLocaleDateString('fr-CA'), 
      endDate: endDate.toLocaleDateString('fr-CA'),
      startYear, startMonth, startDay,
      endYear, endMonth, endDay
    })
    
    // Générer tous les mois dans la période avec année+mois comme clé unique
    const months: string[] = []
    const monthLabels: Record<string, string> = {}
    const current = new Date(startDate)
    while (current <= endDate) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      const label = current.toLocaleDateString("fr-CA", { month: "short" })
      months.push(key)
      monthLabels[key] = label
      current.setMonth(current.getMonth() + 1)
    }
    
    // Liste complète des types "demeurAvec" du formulaire (ordre fixe)
    const allDemeurTypes = [
      "Mère",
      "Père",
      "Les deux parents",
      "Garde partagée",
      "Beaux-parents de la mère",
      "Beaux-parents du père",
      "Tante",
      "Oncle",
      "Oncle et tante (couple)",
      "Grands-oncles et grandes tantes",
      "Grands-parents (maternels)",
      "Grands-parents (paternels)",
      "Arrière-grands-parents",
      "Frères et/ou Sœurs (majeurs)",
      "Demi-frères et/ou Demi-sœurs",
      "Beaux-frères et/ou Belles-sœurs",
      "Cousins et/ou cousines",
      "Tuteur et/ou Tutrice",
      "En résidence",
      "Foyer de groupe",
      "Famille d'accueil",
      "Un ou une Ami(e)"
    ]
    
    // Calculer les statistiques par mois et par type
    const stats: Record<string, Record<string, number>> = {}
    months.forEach(month => {
      stats[month] = {}
      allDemeurTypes.forEach(type => {
        stats[month][type] = 0
      })
    })
    
    enrollments.forEach(e => {
      // Filtre par statut (exclure en_attente)
      if (e.status !== "actif" && e.status !== "ferme") {
        return
      }
      
      // Filtrer par programme si nécessaire
      if (selectedProgramme !== "tous" && e.programme !== selectedProgramme) {
        return
      }
      
      // Vérifier si l'étudiant est dans la période
      const entryDate = new Date(e.dateEntree || e.createdAt)
      if (entryDate >= startDate && entryDate <= endDate) {
        // Compter une seule fois par étudiant (dans le mois d'entrée)
        const entryMonthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`
        if (months.includes(entryMonthKey)) {
          stats[entryMonthKey][e.demeurAvec] = (stats[entryMonthKey][e.demeurAvec] || 0) + 1
        }
      }
    })
    
    // Calculer les totaux (garder l'ordre fixe de la liste)
    const totals: Record<string, number> = {}
    allDemeurTypes.forEach(type => {
      totals[type] = months.reduce((sum, month) => sum + (stats[month][type] || 0), 0)
    })
    
    return { months, monthLabels, demeurTypes: allDemeurTypes, stats, totals }
  }, [enrollments, startYear, startMonth, startDay, endYear, endMonth, endDay, selectedProgramme])

  const { months, monthLabels, demeurTypes, stats, totals } = monthlyStats

  const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0)

  // Mapper les noms de mois français courts
  const monthNames: Record<string, string> = {
    "janv.": "Janv",
    "févr.": "Févr",
    "mars": "Mars",
    "avr.": "Avr",
    "mai": "Mai",
    "juin": "Juin",
    "juil.": "Juill",
    "août": "Août",
    "sept.": "Sept",
    "oct.": "Oct",
    "nov.": "Nov",
    "déc.": "Déc"
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🏠 L'élève demeure avec</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-900">
                
              </th>
              {months.map(month => (
                <th key={month} className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-gray-900">
                  {monthNames[monthLabels[month]] || monthLabels[month]}
                </th>
              ))}
              <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-blue-700 bg-blue-200">
                Total
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-blue-700 bg-blue-300">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {demeurTypes.map((type, index) => {
              const percentage = grandTotal > 0 ? ((totals[type] / grandTotal) * 100).toFixed(1) : "0.0"
              return (
                <tr key={type} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900">
                    {type}
                  </td>
                  {months.map(month => (
                    <td key={month} className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                      {stats[month][type] || 0}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-gray-900 bg-gray-100">
                    {totals[type]}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-blue-700 bg-blue-50">
                    {percentage}%
                  </td>
                </tr>
              )
            })}
            <tr className="bg-blue-200 font-bold">
              <td className="border border-gray-300 px-4 py-3 text-sm text-blue-900">
                Total
              </td>
              {months.map(month => {
                const monthTotal = demeurTypes.reduce((sum, type) => sum + (stats[month][type] || 0), 0)
                return (
                  <td key={month} className="border border-gray-300 px-4 py-3 text-center text-sm text-blue-900">
                    {monthTotal}
                  </td>
                )
              })}
              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-blue-900">
                {grandTotal}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-blue-900">
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
