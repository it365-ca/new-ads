import React, { useMemo } from "react"

interface Note {
  _id: string
  enrollmentId: string
  contenu: string
  auteurNom: string
  suivi: boolean
  status?: string
  creator: string
  createdAt: string
  updatedAt: string
  dateCreation?: string
  contactScolaire?: number
  rencontreScolaire?: number
  nombreScolaire?: number
  contactJeune?: number
  rencontreJeune?: number
  nombreJeune?: number
  contactParent?: number
  rencontreParent?: number
  nombreParent?: number
  contactAutre?: number
  rencontreAutre?: number
  nombreAutre?: number
  organismeCommunautaire?: number
  protectionJeunesse?: number
  cisssmo?: number
  ecoleAuxAdultes?: number
  milieuStage?: number
  policierPreventionniste?: number
  ressourcePsychologique?: number
}

interface Enrollment {
  _id: string
  programme: string
  status: string
  prenom?: string
}

interface Props {
  notes: Note[]
  enrollments: Enrollment[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  selectedProgramme: string
}

export const InterventionsSansSuiviMonthlyStats: React.FC<Props> = ({
  notes,
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  const monthlyStats = useMemo(() => {
    const months: string[] = []
    const stats: Record<string, Record<string, number>> = {}
    
    // Initialiser les types d'interventions
    const interventionTypes = [
      "contactScolaire",
      "rencontreScolaire",
      "nombreScolaire",
      "contactJeune",
      "rencontreJeune",
      "nombreJeune",
      "contactParent",
      "rencontreParent",
      "nombreParent",
      "contactAutre",
      "rencontreAutre",
      "nombreAutre",
      "organismeCommunautaire",
      "protectionJeunesse",
      "cisssmo",
      "ecoleAuxAdultes",
      "milieuStage",
      "policierPreventionniste",
      "ressourcePsychologique"
    ]
    
    interventionTypes.forEach(type => {
      stats[type] = {}
    })
    
    // Générer la liste des mois dans la période
    let currentDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth - 1, 1)
    
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      months.push(monthKey)
      interventionTypes.forEach(type => {
        stats[type][monthKey] = 0
      })
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    }
    
    // Créer un map des profils virtuels (prenom === "")
    const virtualProfileIds = new Set(
      enrollments.filter(e => e.prenom === "" || !e.prenom).map(e => e._id)
    )
    
    // Calculer les stats par mois - Notes des profils virtuels uniquement
    const virtualNotes = (notes || []).filter(note => virtualProfileIds.has(note.enrollmentId))
    virtualNotes.forEach(note => {
      const noteDate = new Date(note.dateCreation || note.createdAt)
      const monthKey = `${noteDate.getFullYear()}-${String(noteDate.getMonth() + 1).padStart(2, '0')}`
      
      if (months.includes(monthKey)) {
        interventionTypes.forEach(type => {
          const value = ((note as any).counters?.[type] ?? (note as any)[type]) || 0
          stats[type][monthKey] += value
        })
      }
    })
    
    return { months, stats, interventionTypes }
  }, [notes, enrollments, startYear, startMonth, endYear, endMonth])

  const interventionLabels: Record<string, string> = {
    contactScolaire: "Contact scolaire",
    rencontreScolaire: "Rencontre scolaire",
    nombreScolaire: "Nombre scolaire",
    contactJeune: "Contact jeune",
    rencontreJeune: "Rencontre jeune",
    nombreJeune: "Nombre jeune",
    contactParent: "Contact parent",
    rencontreParent: "Rencontre parent",
    nombreParent: "Nombre parent",
    contactAutre: "Contact autre",
    rencontreAutre: "Rencontre autre",
    nombreAutre: "Nombre autre",
    organismeCommunautaire: "Organisme communautaire",
    protectionJeunesse: "Protection jeunesse",
    cisssmo: "CISSSMO",
    ecoleAuxAdultes: "École aux adultes",
    milieuStage: "Milieu de stage",
    policierPreventionniste: "Policier préventionniste",
    ressourcePsychologique: "Ressource psychologique"
  }

  const calculateRowTotal = (type: string) => {
    return monthlyStats.months.reduce((sum, month) => sum + monthlyStats.stats[type][month], 0)
  }

  const calculateColumnTotal = (month: string) => {
    return monthlyStats.interventionTypes.reduce((sum, type) => sum + monthlyStats.stats[type][month], 0)
  }

  const grandTotal = monthlyStats.interventionTypes.reduce((sum, type) => sum + calculateRowTotal(type), 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Interventions des étudiants virtuels</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-orange-100 to-orange-50">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 sticky left-0 bg-orange-100 z-10 text-xs">
                Type d'intervention
              </th>
              {monthlyStats.months.map((month, idx) => {
                const [year, monthNum] = month.split('-')
                const monthLabel = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString("fr-CA", { month: "short" })
                const monthMap: Record<string, string> = {
                  "janv.": "Janv", "févr.": "Févr", "mars": "Mars", "avr.": "Avr",
                  "mai": "Mai", "juin": "Juin", "juill.": "Juill", "août": "Août",
                  "sept.": "Sept", "oct.": "Oct", "nov.": "Nov", "déc.": "Déc"
                }
                return (
                  <th key={month} className="border border-gray-300 px-2 py-2 text-center font-medium text-gray-700 min-w-[55px] text-xs">
                    {monthMap[monthLabel] || monthLabel}
                  </th>
                )
              })}
              <th className="border border-gray-300 px-3 py-2 text-center font-bold text-orange-700 bg-orange-50 min-w-[70px] text-xs">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {monthlyStats.interventionTypes.map((type, index) => {
              const rowTotal = calculateRowTotal(type)
              const bgColor = index % 2 === 0 ? "bg-white" : "bg-gray-50"
              
              return (
                <tr key={type} className={`${bgColor} hover:bg-orange-50 transition-colors`}>
                  <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700 sticky left-0 z-10 text-xs" style={{ backgroundColor: index % 2 === 0 ? "white" : "#f9fafb" }}>
                    {interventionLabels[type]}
                  </td>
                  {monthlyStats.months.map(month => {
                    const value = monthlyStats.stats[type][month]
                    return (
                      <td key={month} className="border border-gray-300 px-2 py-2 text-center text-gray-900 text-xs">
                        {value > 0 ? (
                          <span className="font-semibold text-orange-700">{value}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold text-orange-700 bg-orange-50 text-xs">
                    {rowTotal}
                  </td>
                </tr>
              )
            })}
            {/* Ligne des totaux par colonne */}
            <tr className="bg-gradient-to-r from-orange-100 to-orange-50 font-bold">
              <td className="border border-gray-300 px-3 py-2 text-gray-800 sticky left-0 z-10 bg-orange-100 text-xs">
                Total mensuel
              </td>
              {monthlyStats.months.map(month => {
                const columnTotal = calculateColumnTotal(month)
                return (
                  <td key={month} className="border border-gray-300 px-2 py-2 text-center text-orange-700 text-xs">
                    {columnTotal}
                  </td>
                )
              })}
              <td className="border border-gray-300 px-3 py-2 text-center text-white bg-orange-600 text-sm">
                {grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Statistiques récapitulatives */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Contacts Scolaires</div>
          <div className="text-2xl font-bold text-blue-600">
            {calculateRowTotal("contactScolaire") + calculateRowTotal("rencontreScolaire") + calculateRowTotal("nombreScolaire")}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Contacts Jeunes</div>
          <div className="text-2xl font-bold text-green-600">
            {calculateRowTotal("contactJeune") + calculateRowTotal("rencontreJeune") + calculateRowTotal("nombreJeune")}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Contacts Parents</div>
          <div className="text-2xl font-bold text-purple-600">
            {calculateRowTotal("contactParent") + calculateRowTotal("rencontreParent") + calculateRowTotal("nombreParent")}
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Contacts Autres</div>
          <div className="text-2xl font-bold text-orange-600">
            {calculateRowTotal("contactAutre") + calculateRowTotal("rencontreAutre") + calculateRowTotal("nombreAutre")}
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Organismes Externes</div>
          <div className="text-2xl font-bold text-teal-600">
            {calculateRowTotal("organismeCommunautaire") + calculateRowTotal("protectionJeunesse") + calculateRowTotal("cisssmo") + 
             calculateRowTotal("ecoleAuxAdultes") + calculateRowTotal("milieuStage") + calculateRowTotal("policierPreventionniste") + 
             calculateRowTotal("ressourcePsychologique")}
          </div>
        </div>
      </div>
    </div>
  )
}
