import React, { useState, useEffect } from "react"
import { useProgrammes, Programme, StatsConfiguration } from "../hooks/useProgrammes"
import { CustomStatForm } from "./CustomStatForm"

interface CustomStat {
  id: string
  label: string
  icon: string
  type: "text" | "number" | "date" | "select"
  options?: string[]
}

interface ProgrammeFormProps {
  programme?: Programme | null
  onClose: () => void
}

export const ProgrammeForm: React.FC<ProgrammeFormProps> = ({ programme, onClose }) => {
  const { createProgramme, updateProgramme } = useProgrammes()
  const [showCustomStatForm, setShowCustomStatForm] = useState(false)
  const [customStats, setCustomStats] = useState<CustomStat[]>([])
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    statsConfiguration: {
      afficherGenre: false,
      afficherAge: false,
      afficherDegre: false,
      afficherEcole: false,
      afficherVille: false,
      afficherOrigine: false,
      afficherDemeurAvec: false,
      afficherInterventions: false,
      afficherPresence: false,
      afficherEvolution: false,
      afficherConversion: false
    } as StatsConfiguration
  })

  useEffect(() => {
    if (programme) {
      setFormData({
        nom: programme.nom,
        description: programme.description || "",
        statsConfiguration: programme.statsConfiguration
      })
    }
  }, [programme])

  const handleStatsToggle = (key: keyof StatsConfiguration) => {
    setFormData({
      ...formData,
      statsConfiguration: {
        ...formData.statsConfiguration,
        [key]: !formData.statsConfiguration[key]
      }
    })
  }

  const handleAddCustomStat = (stat: Omit<CustomStat, "id">) => {
    const newStat: CustomStat = {
      ...stat,
      id: `custom-${Date.now()}`
    }
    setCustomStats([...customStats, newStat])
    setShowCustomStatForm(false)
  }

  const handleRemoveCustomStat = (id: string) => {
    setCustomStats(customStats.filter(stat => stat.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        nom: formData.nom,
        code: formData.nom.toUpperCase().replace(/\s+/g, '_'),
        description: formData.description,
        actif: true,
        statsConfiguration: formData.statsConfiguration
      }

      if (programme) {
        await updateProgramme(programme._id, submitData)
      } else {
        await createProgramme(submitData)
      }
      onClose()
    } catch (error) {
      console.error("Erreur lors de la soumission:", error)
    }
  }

  const statsOptions = [
    { key: "afficherGenre" as keyof StatsConfiguration, label: "Statistiques par Genre", icon: "👥" },
    { key: "afficherAge" as keyof StatsConfiguration, label: "Statistiques par Âge", icon: "🎂" },
    { key: "afficherDegre" as keyof StatsConfiguration, label: "Statistiques par Degré Scolaire", icon: "🎓" },
    { key: "afficherEcole" as keyof StatsConfiguration, label: "Statistiques par École", icon: "🏫" },
    { key: "afficherVille" as keyof StatsConfiguration, label: "Statistiques par Ville", icon: "🏙️" },
    { key: "afficherOrigine" as keyof StatsConfiguration, label: "Statistiques par Origine", icon: "🌍" },
    { key: "afficherDemeurAvec" as keyof StatsConfiguration, label: "Statistiques par Situation Familiale", icon: "🏠" },
    { key: "afficherInterventions" as keyof StatsConfiguration, label: "Statistiques d'Interventions", icon: "💼" },
    { key: "afficherPresence" as keyof StatsConfiguration, label: "Statistiques de Présence", icon: "📋" },
    { key: "afficherEvolution" as keyof StatsConfiguration, label: "Évolution Mensuelle", icon: "📈" },
    { key: "afficherConversion" as keyof StatsConfiguration, label: "Taux de Conversion", icon: "🔄" }
  ]

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations générales */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                📋 Informations du programme
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du programme *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="ex: Programme ALT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Description du programme..."
                  />
                </div>
              </div>
            </div>

            {/* Configuration des statistiques */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                📊 Statistiques à afficher pour ce programme
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Cochez les statistiques que vous souhaitez voir apparaître pour ce programme dans la page des statistiques
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {statsOptions.map(({ key, label, icon }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      formData.statsConfiguration[key]
                        ? "bg-indigo-50 border-indigo-500 shadow-sm"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.statsConfiguration[key]}
                      onChange={() => handleStatsToggle(key)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-2xl">{icon}</span>
                    <span className={`text-sm font-medium ${formData.statsConfiguration[key] ? 'text-indigo-900' : 'text-gray-700'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Statistiques personnalisées - Section supprimée pour simplifier */}

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium"
              >
                {programme ? "Mettre à jour" : "Créer le programme"}
              </button>
            </div>
          </form>
        </div>

      {/* Modal CustomStatForm */}
      {showCustomStatForm && (
        <CustomStatForm
          onSave={handleAddCustomStat}
          onClose={() => setShowCustomStatForm(false)}
        />
      )}
    </>
  )
}
