import React, { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

interface VirtualProfileEditModalProps {
  profile: any
  onClose: () => void
  onSuccess: () => void
}

export function VirtualProfileEditModal({ profile, onClose, onSuccess }: VirtualProfileEditModalProps) {
  const [titre, setTitre] = useState(profile.titre || "")
  const [programme, setProgramme] = useState(profile.programme || "")
  const [ecole, setEcole] = useState(profile.ecoleReferente || "")
  const [age, setAge] = useState(profile.age || 0)
  const [ville, setVille] = useState(profile.ville || "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!titre.trim() || !programme || !ecole) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setSaving(true)
    try {
      await lumi.entities.enrollments.update(profile._id, {
        titre,
        programme,
        ecoleReferente: ecole,
        age: Number(age),
        ville
      })
      
      toast.success("Profil virtuel mis à jour avec succès")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erreur mise à jour profil virtuel:", error)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          ✏️ Modifier le profil virtuel
        </h2>
        
        <div className="space-y-4">
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
              <optgroup label="── ÉCOLES PRIMAIRES ──">
                <option value="J-L Vinet-Souligny">J-L Vinet-Souligny</option>
                <option value="J-L Des Cheminots">J-L Des Cheminots</option>
                <option value="J-L Félix-Leclerc">J-L Félix-Leclerc</option>
                <option value="J-L Piché-Dufrost">J-L Piché-Dufrost</option>
                <option value="J-L Aquarelle-Armand-Frappier">J-L Aquarelle-Armand-Frappier</option>
                <option value="L-C Saint-Romain">L-C Saint-Romain</option>
                <option value="L-C Saint-Patrice">L-C Saint-Patrice</option>
                <option value="L-C St-Édouard">L-C St-Édouard</option>
                <option value="L-C Daigneau">L-C Daigneau</option>
                <option value="L-C Saint-Bernard-de-Lacolle">L-C Saint-Bernard-de-Lacolle</option>
                <option value="P-B Saint-Michel-Archange">P-B Saint-Michel-Archange</option>
                <option value="P-B Saint-Isidore Langevin">P-B Saint-Isidore Langevin</option>
                <option value="P-B Sainte- Clotilde">P-B Sainte- Clotilde</option>
                <option value="P-B Saint-Viateur-Clothilde-Raymond">P-B Saint-Viateur-Clothilde-Raymond</option>
              </optgroup>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Âge (optionnel)
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              min="0"
              max="99"
              placeholder="Ex: 15"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville (optionnel)
            </label>
            <select
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="">Sélectionner...</option>
              <option value="Candiac">Candiac</option>
              <option value="Châteauguay">Châteauguay</option>
              <option value="La Prairie">La Prairie</option>
              <option value="Mercier">Mercier</option>
              <option value="Napierville">Napierville</option>
              <option value="Sherrington">Sherrington</option>
              <option value="St-Bernard de Lacolle">St-Bernard de Lacolle</option>
              <option value="St-Constant">St-Constant</option>
              <option value="St-Isidore">St-Isidore</option>
              <option value="St-Michel">St-Michel</option>
              <option value="St-Philippe">St-Philippe</option>
              <option value="St-Rémi">St-Rémi</option>
              <option value="Ste-Catherine">Ste-Catherine</option>
              <option value="Ste-Clotilde">Ste-Clotilde</option>
              <option value="St-Mathieu">St-Mathieu</option>
              <option value="St-Édouard">St-Édouard</option>
              <option value="Hemmingford">Hemmingford</option>
              <option value="Léry">Léry</option>
              <option value="Delson">Delson</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
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
            {saving ? "Enregistrement..." : "💾 Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  )
}
