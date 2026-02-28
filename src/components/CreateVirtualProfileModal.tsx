import React, { useState } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

interface CreateVirtualProfileModalProps {
  onClose: () => void
  onSuccess: () => void
}

// Tous les champs optionnels disponibles
const OPTIONAL_FIELDS = [
  { id: "age", label: "Âge", type: "number" },
  { id: "ville", label: "Ville", type: "select" },
  { id: "genre", label: "Genre", type: "select" },
  { id: "degreScolaire", label: "Degré scolaire", type: "select" },
  { id: "origine", label: "Origine", type: "select" }
]

export function CreateVirtualProfileModal({ onClose, onSuccess }: CreateVirtualProfileModalProps) {
  const [titre, setTitre] = useState("")
  const [programme, setProgramme] = useState("")
  const [ecole, setEcole] = useState("")
  
  // Champs optionnels sélectionnés
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  
  // Valeurs des champs optionnels
  const [optionalValues, setOptionalValues] = useState<any>({
    age: 0,
    ville: "",
    genre: "",
    degreScolaire: "",
    origine: ""
  })
  
  const [saving, setSaving] = useState(false)

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    )
  }

  const handleSave = async () => {
    if (!titre.trim() || !programme || !ecole) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setSaving(true)
    try {
      const baseData = {
        titre,
        programme,
        ecoleReferente: ecole,
        isVirtualProfile: true,
        status: "actif",
        prenom: "",
        nom: "",
        dateNaissance: new Date().toISOString(),
        origine: "Canadienne",
        degreScolaire: "Secondaire 1",
        adresse: "",
        codePostal: "",
        demeurAvec: "Les deux parents",
        parent1Type: "Mère",
        parent1Nom: "",
        parent1Prenom: "",
        parent1Tel: "",
        parent1Email: "",
        contactUrgence: "",
        contactUrgenceTel: "",
        contactUrgenceLien: "Mère",
        epipen: "non",
        intervenantNom: "",
        intervenantTitre: "",
        intervenantPoste: "",
        intervenantEmail: "",
        directionNom: "",
        directionEmail: "",
        dateEntree: new Date().toISOString(),
        dateFin: new Date().toISOString(),
        apresSejourPlan: "À évaluer",
        motifReference: "Profil virtuel",
        motivationsAdolescent: "",
        age: 0,
        genre: "",
        ville: ""
      }

      // Ajouter uniquement les champs sélectionnés
      selectedFields.forEach(fieldId => {
        if (optionalValues[fieldId]) {
          baseData[fieldId as keyof typeof baseData] = optionalValues[fieldId]
        }
      })

      await lumi.entities.enrollments.create(baseData as any)
      toast.success("Profil virtuel créé avec succès")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erreur création profil virtuel:", error)
      toast.error("Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          ➕ Créer un nouvel étudiant virtuel
        </h2>
        
        {/* Champs obligatoires */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Groupe A - Mathématiques"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programme <span className="text-red-500">*</span>
            </label>
            <select
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="">Sélectionner...</option>
              <option value="ALT">ALT : Comportements d'intimidation (5 ou 10 jours)</option>
              <option value="OPTION">OPTION : Suspension scolaire (3 ou 10 jours)</option>
              <option value="PIVOT">PIVOT : Non fréquentation, absentéisme (15 ans+)</option>
              <option value="APOSTROPHE">APOSTROPHE : Difficultés d'adaptation (13-14 ans, 8 semaines)</option>
              <option value="SAUTS">SAUTS : Transition vers le secondaire (Estival)</option>
              <option value="Suivis Estivaux">Suivis Estivaux : Accompagnement individualisé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              École <span className="text-red-500">*</span>
            </label>
            <select
              value={ecole}
              onChange={(e) => setEcole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="">Sélectionner...</option>
              <optgroup label="── ÉCOLES SECONDAIRES ──">
                <option value="Bonnier">Bonnier</option>
                <option value="Des Timoniers">Des Timoniers</option>
                <option value="Gabrielle-Roy">Gabrielle-Roy</option>
                <option value="Jacques-Leber">Jacques-Leber</option>
                <option value="Marguerite-Bourgeois">Marguerite-Bourgeois</option>
                <option value="Louis-Cyr">Louis-Cyr</option>
                <option value="St-François-Xavier">St-François-Xavier</option>
                <option value="Louis-Philippe-Paré">Louis-Philippe-Paré</option>
                <option value="De La Magdeleine">De La Magdeleine</option>
                <option value="Du Tournant">Du Tournant</option>
                <option value="Pierre-Bédard">Pierre-Bédard</option>
                <option value="Fernand-Séguin">Fernand-Séguin</option>
                <option value="Hors Territoire">Hors Territoire</option>
                <option value="École aux adultes">École aux adultes</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Sélection des champs optionnels */}
        <div className="border-t pt-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            📋 Champs optionnels à inclure
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Cochez les informations que vous souhaitez ajouter à ce profil virtuel
          </p>
          
          <div className="space-y-3">
            {OPTIONAL_FIELDS.map(field => (
              <div key={field.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id={field.id}
                  checked={selectedFields.includes(field.id)}
                  onChange={() => toggleField(field.id)}
                  className="mt-1 rounded border-gray-300 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor={field.id} className="font-medium text-gray-900 cursor-pointer">
                    {field.label}
                  </label>
                  
                  {/* Afficher le champ si sélectionné */}
                  {selectedFields.includes(field.id) && (
                    <div className="mt-2">
                      {field.type === "number" && (
                        <input
                          type="number"
                          value={optionalValues[field.id]}
                          onChange={(e) => setOptionalValues((prev: any) => ({ ...prev, [field.id]: Number(e.target.value) }))}
                          placeholder={`Ex: ${field.id === "age" ? "15" : ""}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                      
                      {field.type === "select" && field.id === "ville" && (
                        <select
                          value={optionalValues[field.id]}
                          onChange={(e) => setOptionalValues((prev: any) => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Sélectionner...</option>
                          <option value="Candiac">Candiac</option>
                          <option value="Châteauguay">Châteauguay</option>
                          <option value="La Prairie">La Prairie</option>
                          <option value="Mercier">Mercier</option>
                          <option value="St-Constant">St-Constant</option>
                          <option value="St-Rémi">St-Rémi</option>
                          <option value="Ste-Catherine">Ste-Catherine</option>
                          <option value="Delson">Delson</option>
                        </select>
                      )}
                      
                      {field.type === "select" && field.id === "genre" && (
                        <select
                          value={optionalValues[field.id]}
                          onChange={(e) => setOptionalValues((prev: any) => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Sélectionner...</option>
                          <option value="Masculin">Masculin</option>
                          <option value="Féminin">Féminin</option>
                          <option value="Autres">Autres</option>
                        </select>
                      )}
                      
                      {field.type === "select" && field.id === "degreScolaire" && (
                        <select
                          value={optionalValues[field.id]}
                          onChange={(e) => setOptionalValues((prev: any) => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Sélectionner...</option>
                          <option value="6e Année">6e Année</option>
                          <option value="Secondaire 1">Secondaire 1</option>
                          <option value="Secondaire 2">Secondaire 2</option>
                          <option value="Secondaire 3">Secondaire 3</option>
                          <option value="Secondaire 4">Secondaire 4</option>
                          <option value="Secondaire 5">Secondaire 5</option>
                        </select>
                      )}
                      
                      {field.type === "select" && field.id === "origine" && (
                        <select
                          value={optionalValues[field.id]}
                          onChange={(e) => setOptionalValues((prev: any) => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Sélectionner...</option>
                          <option value="Canadienne">Canadienne</option>
                          <option value="Haïtienne">Haïtienne</option>
                          <option value="Latino-Américaine">Latino-Américaine</option>
                          <option value="Africaine">Africaine</option>
                          <option value="Asiatique">Asiatique</option>
                          <option value="Européenne">Européenne</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium disabled:opacity-50">
            {saving ? "Création..." : "✅ Créer le profil"}
          </button>
        </div>
      </div>
    </div>
  )
}
