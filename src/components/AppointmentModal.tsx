import React, { useState } from "react"
import toast from "react-hot-toast"
import { lumi } from "../lib/lumi"
import { useEnrollments } from "../hooks/useEnrollments"

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, userId, userName }) => {
  const { enrollments } = useEnrollments()
  const [rdvMode, setRdvMode] = useState<"etudiant" | "autre">("etudiant")
  const [formData, setFormData] = useState({
    titre: "",
    dateRendezVous: "",
    heureRendezVous: "",
    duree: 60,
    lieu: "",
    typeRendezVous: "en_personne" as "en_personne" | "virtuel" | "telephone",
    enrollmentId: "",
    notes: "",
    categoryAutre: "reunion_equipe" as "reunion_equipe" | "partenaire" | "personnel" | "administratif" | "autre",
    participants: [] as Array<{
      type: "parent1" | "parent2" | "eleve"
      nom: string
      email: string
      telephone: string
    }>
  })

  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student)
    setFormData(prev => ({ ...prev, enrollmentId: student._id }))

    // Pré-remplir les participants depuis les données de l'étudiant
    const participants: any[] = []
    
    if (student.parent1Email) {
      participants.push({
        type: "parent1",
        nom: `${student.parent1Prenom || ""} ${student.parent1Nom || ""}`.trim(),
        email: student.parent1Email,
        telephone: student.parent1Tel || ""
      })
    }
    
    if (student.parent2Email) {
      participants.push({
        type: "parent2",
        nom: `${student.parent2Prenom || ""} ${student.parent2Nom || ""}`.trim(),
        email: student.parent2Email,
        telephone: student.parent2Tel || ""
      })
    }

    // Ajouter l'élève si on a un email (généralement non, mais au cas où)
    participants.push({
      type: "eleve",
      nom: `${student.prenom || ""} ${student.nom || ""}`.trim(),
      email: student.parent1Email || "", // Utiliser email parent1 par défaut
      telephone: student.parent1Tel || ""
    })

    setFormData(prev => ({ ...prev, participants }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titre || !formData.dateRendezVous || !formData.heureRendezVous) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (rdvMode === "etudiant" && !formData.enrollmentId) {
      toast.error("Veuillez sélectionner un étudiant")
      return
    }

    if (rdvMode === "etudiant" && formData.participants.length === 0) {
      toast.error("Veuillez ajouter au moins un participant")
      return
    }

    const loadingToast = toast.loading("Création du rendez-vous et envoi des emails...")

    try {
      const response = await lumi.entities.appointments.create({
        ...formData,
        intervenantId: userId,
        intervenantNom: userName,
        rdvType: rdvMode,
        enrollmentId: rdvMode === "etudiant" ? formData.enrollmentId : undefined
      })

      toast.success("✅ Rendez-vous créé et emails de confirmation envoyés !", { id: loadingToast })
      onClose()
      
      // Réinitialiser le formulaire
      setFormData({
        titre: "",
        dateRendezVous: "",
        heureRendezVous: "",
        duree: 60,
        lieu: "",
        typeRendezVous: "en_personne",
        enrollmentId: "",
        notes: "",
        categoryAutre: "reunion_equipe",
        participants: []
      })
      setSelectedStudent(null)
      setRdvMode("etudiant")
    } catch (error: any) {
      console.error("Erreur création rendez-vous:", error)
      toast.error(error?.response?.data?.error || "Erreur lors de la création du rendez-vous", { id: loadingToast })
    }
  }

  const [isGeneratingStudents, setIsGeneratingStudents] = useState(false)

  const handleGenerateTestStudents = async () => {
    if (!window.confirm("Voulez-vous générer 5 étudiants actifs de test ?")) return
    
    setIsGeneratingStudents(true)
    const loadingToast = toast.loading("Génération de 5 étudiants actifs...")
    
    try {
      const noms = ["Tremblay", "Gagnon", "Roy", "Côté", "Bouchard"]
      const prenoms = ["Alexandre", "Sophie", "Gabriel", "Emma", "Nathan"]
      const villes = ["St-Constant", "Delson", "Candiac", "La Prairie", "Sainte-Catherine"]
      const programmes = ["ALT", "INT", "SUP", "REI", "PER", "AUT"]
      const ecoles = ["Jacques-Leber", "Mgr-A.-M.-Parent", "Ozias-Leduc", "Gérard-Filion", "Antoine-Brossard"]
      
      for (let i = 0; i < 5; i++) {
        const now = new Date().toISOString()
        await lumi.entities.enrollments.create({
          nom: noms[i],
          prenom: prenoms[i],
          dateNaissance: `200${5 + i}-0${(i % 9) + 1}-15`,
          age: `${14 + i}`,
          origine: "Canadienne",
          genre: i % 2 === 0 ? "Masculin" : "Féminin",
          degreScolaire: `Secondaire ${i + 1}`,
          adresseComplete: `${100 + i * 10} Rue Test`,
          appartement: "",
          codePostal: "J5A 1B1",
          ville: villes[i],
          demeurAvec: "Les deux parents",
          parent1Type: "Mère",
          parent1Nom: noms[i],
          parent1Prenom: "Marie",
          parent1Tel: `(450) 555-000${i}`,
          parent1Email: `parent${i}@test.com`,
          parent2Type: "",
          parent2Nom: "",
          parent2Prenom: "",
          parent2Tel: "",
          parent2Email: "",
          contactUrgence: `Marie ${noms[i]}`,
          contactUrgenceTel: `(450) 555-000${i}`,
          contactUrgenceLien: "Mère",
          problemeSante: "",
          allergies: "",
          epipen: "non",
          ecoleReferente: ecoles[i],
          intervenantNom: "Test",
          intervenantTitre: "Intervenant",
          intervenantPoste: "1234",
          intervenantEmail: "test@test.com",
          directionNom: "Direction",
          directionEmail: "direction@test.com",
          programme: programmes[i % programmes.length],
          dateEntree: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dateFin: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          apresSejourPlan: "Réintégration",
          motifReference: "Test automatique",
          moyensProposesAutres: "",
          suiviExterne: "",
          motivationsAdolescent: "Test",
          status: "actif",
          creator: "system",
          createdAt: now,
          updatedAt: now
        })
      }
      
      toast.success("✅ 5 étudiants actifs créés !", { id: loadingToast })
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la génération", { id: loadingToast })
    } finally {
      setIsGeneratingStudents(false)
    }
  }

  if (!isOpen) return null

  const activeStudents = enrollments.filter((e: any) => e.status === "actif" && !e.isVirtualProfile)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>📅</span> Créer un nouveau rendez-vous
            </h2>
            <p className="text-indigo-100 text-sm mt-1">Planifiez une rencontre et envoyez les confirmations automatiquement</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all">
            <span className="text-2xl">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sélection du type de RDV */}
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Type de rendez-vous <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRdvMode("etudiant")
                  setSelectedStudent(null)
                  setFormData(prev => ({ ...prev, enrollmentId: "", participants: [] }))
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  rdvMode === "etudiant"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}>
                <div className="text-3xl mb-2">🎓</div>
                <div className="font-bold">Rendez-vous Étudiant</div>
                <div className="text-xs mt-1 opacity-75">Rencontre avec parents/élève</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRdvMode("autre")
                  setSelectedStudent(null)
                  setFormData(prev => ({ ...prev, enrollmentId: "", participants: [] }))
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  rdvMode === "autre"
                    ? "border-purple-500 bg-purple-50 text-purple-900"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}>
                <div className="text-3xl mb-2">📋</div>
                <div className="font-bold">Autre Rendez-vous</div>
                <div className="text-xs mt-1 opacity-75">Réunion, partenaire, etc.</div>
              </button>
            </div>
          </div>

          {/* Mode Étudiant */}
          {rdvMode === "etudiant" && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Étudiant concerné <span className="text-red-500">*</span>
              </label>
              {!selectedStudent ? (
                <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg p-3">
                  {activeStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-3">📭</div>
                      <p className="text-gray-500 font-medium mb-4">Aucun étudiant actif disponible</p>
                      <button
                        type="button"
                        onClick={handleGenerateTestStudents}
                        disabled={isGeneratingStudents}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium shadow-lg disabled:opacity-50">
                        {isGeneratingStudents ? "⏳ Génération..." : "🎓 Générer des étudiants de test"}
                      </button>
                    </div>
                  ) : (
                    activeStudents.map((student: any) => (
                      <button
                        key={student._id}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className="w-full bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-400 rounded-lg p-3 text-left transition-all">
                        <div className="font-bold text-gray-900">{student.prenom} {student.nom}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {student.age} ans • {student.programme || "N/A"} • {student.ecoleReferente || "N/A"}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{selectedStudent.prenom} {selectedStudent.nom}</div>
                      <div className="text-sm text-gray-600">{selectedStudent.age} ans • {selectedStudent.programme || "N/A"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null)
                        setFormData(prev => ({ ...prev, enrollmentId: "", participants: [] }))
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      Changer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode Autre */}
          {rdvMode === "autre" && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryAutre}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryAutre: e.target.value as any }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="reunion_equipe">🤝 Réunion d'équipe</option>
                <option value="partenaire">🏢 Rencontre partenaire</option>
                <option value="personnel">👤 Rendez-vous personnel</option>
                <option value="administratif">📋 Administratif</option>
                <option value="autre">📌 Autre</option>
              </select>
            </div>
          )}

          {(selectedStudent || rdvMode === "autre") && (
            <>
              {/* Titre du rendez-vous */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Titre du rendez-vous <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                  placeholder="Ex: Rencontre de suivi scolaire"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Date et heure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateRendezVous}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateRendezVous: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Heure <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.heureRendezVous}
                    onChange={(e) => setFormData(prev => ({ ...prev, heureRendezVous: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Durée et type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Durée (minutes)</label>
                  <select
                    value={formData.duree}
                    onChange={(e) => setFormData(prev => ({ ...prev, duree: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Type de rendez-vous</label>
                  <select
                    value={formData.typeRendezVous}
                    onChange={(e) => setFormData(prev => ({ ...prev, typeRendezVous: e.target.value as any }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="en_personne">En personne</option>
                    <option value="virtuel">Virtuel (Zoom/Teams)</option>
                    <option value="telephone">Téléphone</option>
                  </select>
                </div>
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Lieu / Lien</label>
                <input
                  type="text"
                  value={formData.lieu}
                  onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
                  placeholder="Adresse ou lien de visioconférence"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Participants */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Participants (recevrpnt les emails)
                </label>
                <div className="space-y-2">
                  {formData.participants.map((participant, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {participant.type === "parent1" ? "👨 Parent 1" : participant.type === "parent2" ? "👩 Parent 2" : "👤 Élève"} : {participant.nom}
                        </div>
                        <div className="text-sm text-gray-600">{participant.email}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          participants: prev.participants.filter((_, i) => i !== index)
                        }))}
                        className="text-red-500 hover:text-red-700 font-bold">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Notes additionnelles</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informations complémentaires..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4 border-t-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium">
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-lg">
                  📅 Créer le rendez-vous
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
