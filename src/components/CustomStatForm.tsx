import React, { useState } from "react"

interface CustomStat {
  id: string
  label: string
  icon: string
  type: "text" | "number" | "select" | "date" | "multiselect"
  options?: string[]
  defaultValue?: any
}

interface CustomStatFormProps {
  onSave: (stat: CustomStat) => void
  onClose: () => void
  existingStat?: CustomStat
}

export const CustomStatForm: React.FC<CustomStatFormProps> = ({ onSave, onClose, existingStat }) => {
  const [formData, setFormData] = useState<CustomStat>(
    existingStat || {
      id: `custom_${Date.now()}`,
      label: "",
      icon: "📊",
      type: "text",
      options: [],
      defaultValue: ""
    }
  )

  const [optionInput, setOptionInput] = useState("")

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setFormData({
        ...formData,
        options: [...(formData.options || []), optionInput.trim()]
      })
      setOptionInput("")
    }
  }

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options?.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.label.trim()) {
      alert("Le nom de la statistique est requis")
      return
    }
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {existingStat ? "Modifier la statistique" : "Créer une statistique personnalisée"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Informations de base</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la statistique *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="ex: Nombre de frères et sœurs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icône / Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="ex: 👨‍👩‍👧‍👦"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de donnée *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="text">Texte libre</option>
                  <option value="number">Nombre</option>
                  <option value="date">Date</option>
                  <option value="select">Liste de choix unique</option>
                  <option value="multiselect">Liste de choix multiples</option>
                </select>
              </div>
            </div>

            {/* Options pour les listes */}
            {(formData.type === "select" || formData.type === "multiselect") && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Options de choix</h3>
                
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddOption())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ajouter une option..."
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    + Ajouter
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.options?.map((option, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                      <span className="text-gray-700">{option}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {(!formData.options || formData.options.length === 0) && (
                  <p className="text-sm text-gray-500 mt-2">Aucune option ajoutée</p>
                )}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium"
              >
                {existingStat ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
