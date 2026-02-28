import React, { useMemo } from "react"
import { useThemeContext } from "../contexts/ThemeContext"

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
  dateEntree: string
  createdAt: string
  status: string
}

interface Props {
  notes: Note[]
  enrollments: Enrollment[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
}

export const InterventionsParProgrammeStats: React.FC<Props> = ({
  notes,
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth
}) => {
  const { getTableHeaderClass, getTableTotalClass } = useThemeContext()

  // Liste complète des programmes
  const allProgrammes = [
    "ALT",
    "OPTION",
    "PIVOT",
    "APOSTROPHE",
    "SAUTS",
    "Suivis Estivaux"
  ]

  // Types d'interventions
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

  // Calculer les statistiques par programme
  const stats = useMemo(() => {
    // Validation des paramètres de date
    if (!startYear || !startMonth || !endYear || !endMonth) {
      return {}
    }
    
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)
    
    // Vérifier que les dates sont valides
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {}
    }

    // Initialiser les stats par programme
    const programmeStats: Record<string, Record<string, number>> = {}
    allProgrammes.forEach(prog => {
      programmeStats[prog] = {}
      interventionTypes.forEach(type => {
        programmeStats[prog][type] = 0
      })
    })

    // Parcourir toutes les notes (exclure les notes supprimées)
    console.log("🔥 === DÉBUT COMPILATION STATS ===")
    console.log("📊 Total notes reçues:", (notes || []).length)
    console.log("📊 Total étudiants:", (enrollments || []).length)
    console.log("📊 Période:", startDate.toISOString(), "→", endDate.toISOString())
    
    // Afficher tous les enrollmentIds disponibles
    console.log("📋 Liste des étudiants disponibles:")
    enrollments.forEach(e => {
      console.log(`  - ${e.prenom} ${e.nom} (${e.programme}) → ID: ${e._id}`)
    })
    
    console.log("\n🔍 === ANALYSE DES NOTES ===")
    ;(notes || []).forEach((note, index) => {
      console.log(`\n📝 Note ${index + 1}/${(notes || []).length}:`)
      console.log(`  - ID: ${note._id}`)
      console.log(`  - enrollmentId: ${note.enrollmentId}`)
      console.log(`  - auteurNom: ${note.auteurNom}`)
      console.log(`  - status: ${note.status}`)
      console.log(`  - suivi: ${note.suivi}`)
      console.log(`  - dateCreation: ${note.dateCreation || note.createdAt}`)
      
      // Exclure les notes supprimées
      if (note.status === "supprime") {
        console.log("  ❌ Note supprimée → ignorée")
        return
      }
      
      const noteDate = new Date(note.dateCreation || note.createdAt)
      console.log(`  📅 Date parsée: ${noteDate.toISOString()}`)
      
      // Vérifier si la note est dans la période
      const dansLaPeriode = noteDate >= startDate && noteDate <= endDate
      console.log(`  ⏰ Dans la période? ${dansLaPeriode ? "✅ OUI" : "❌ NON"}`)
      
      if (dansLaPeriode) {
        // Trouver l'étudiant correspondant
        const enrollment = enrollments.find(e => e._id === note.enrollmentId)
        
        if (!enrollment) {
          console.log(`  ⚠️ PROBLÈME: enrollmentId "${note.enrollmentId}" ne correspond à AUCUN étudiant!`)
          console.log(`  → Cette note ne sera PAS comptée dans les stats`)
          return
        }
        
        console.log(`  ✅ Étudiant trouvé: ${enrollment.prenom} ${enrollment.nom}`)
        console.log(`  📚 Programme: ${enrollment.programme}`)
        console.log(`  📊 Status étudiant: ${enrollment.status}`)
        
        const programme = enrollment.programme
        
        // Vérifier si le programme existe dans allProgrammes
        if (!programmeStats[programme]) {
          console.warn(`  ⚠️ Programme "${programme}" n'existe pas dans allProgrammes. Ajout dynamique.`)
          programmeStats[programme] = {}
          interventionTypes.forEach(type => {
            programmeStats[programme][type] = 0
          })
        }
        
        // Afficher les compteurs de cette note
        console.log(`  🔢 Compteurs d'intervention dans cette note:`)
        interventionTypes.forEach(type => {
          // CORRECTION : Chercher dans note.counters OU directement dans note
          const value = (note as any).counters?.[type] || (note as any)[type] || 0
          if (value > 0) {
            console.log(`    - ${type}: ${value}`)
            programmeStats[programme][type] += value
          }
        })
      }
    })
    
    console.log("\n🔥 === FIN COMPILATION ===")
    console.log("📊 RÉSULTAT FINAL:", programmeStats)
    
    console.log("📊 FINAL STATS:", programmeStats)

    return programmeStats
  }, [notes, enrollments, startYear, startMonth, endYear, endMonth])

  // Calculer les totaux par programme
  const programmeTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    allProgrammes.forEach(prog => {
      totals[prog] = interventionTypes.reduce((sum, type) => sum + (stats[prog]?.[type] || 0), 0)
    })
    return totals
  }, [stats])

  // Calculer les totaux par type d'intervention
  const typeTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    interventionTypes.forEach(type => {
      totals[type] = allProgrammes.reduce((sum, prog) => sum + (stats[prog]?.[type] || 0), 0)
    })
    return totals
  }, [stats])

  // Calculer le grand total
  const grandTotal = useMemo(() => {
    return Object.values(programmeTotals).reduce((sum, val) => sum + val, 0)
  }, [programmeTotals])

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Interventions par programme</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className={getTableHeaderClass()}>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Type d'intervention</th>
              {allProgrammes.map(prog => (
                <th key={prog} className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-700 min-w-[80px]">
                  {prog}
                </th>
              ))}
              <th className={`border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 ${getTableTotalClass()}`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {interventionTypes.map((type, idx) => (
              <tr key={type} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">{interventionLabels[type]}</td>
                {allProgrammes.map(prog => {
                  const count = stats[prog]?.[type] || 0
                  return (
                    <td key={prog} className="border border-gray-300 px-2 py-2 text-center text-gray-700">
                      {count > 0 ? <span className="font-semibold text-indigo-600">{count}</span> : <span className="text-gray-400">0</span>}
                    </td>
                  )
                })}
                <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900 bg-gray-100">
                  {typeTotals[type]}
                </td>
              </tr>
            ))}
            <tr className={`${getTableTotalClass()} font-bold`}>
              <td className="border border-gray-300 px-3 py-2 text-gray-900">Total</td>
              {allProgrammes.map(prog => (
                <td key={prog} className="border border-gray-300 px-2 py-2 text-center text-gray-900">
                  {programmeTotals[prog]}
                </td>
              ))}
              <td className={`border border-gray-300 px-3 py-2 text-center text-gray-900 ${getTableTotalClass()}`}>
                {grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Graphiques récapitulatifs par catégorie */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {allProgrammes.map((prog, idx) => {
          const colors = [
            "from-blue-50 to-blue-100 text-blue-600",
            "from-green-50 to-green-100 text-green-600",
            "from-purple-50 to-purple-100 text-purple-600",
            "from-orange-50 to-orange-100 text-orange-600",
            "from-pink-50 to-pink-100 text-pink-600",
            "from-teal-50 to-teal-100 text-teal-600"
          ]
          const color = colors[idx % colors.length]
          return (
            <div key={prog} className={`bg-gradient-to-br ${color} rounded-lg p-4`}>
              <div className="text-sm text-gray-600 mb-1">{prog}</div>
              <div className={`text-2xl font-bold ${color.split(" ")[2]}`}>
                {programmeTotals[prog]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
