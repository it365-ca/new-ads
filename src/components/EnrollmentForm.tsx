import React, { useState, useEffect } from "react"
import { useEnrollments } from "../hooks/useEnrollments"
import { useProgrammes } from "../hooks/useProgrammes"
import { formatPhoneNumber } from "../utils/phoneFormat"
import { AddressAutocomplete } from "./AddressAutocomplete"
import { lumi } from "../lib/lumi"
import { useThemeContext } from "../contexts/ThemeContext"
import { useModal } from "../contexts/ModalContext"
import { useNotifications } from "../hooks/useNotifications"

interface FormData {
  // Fiche personnelle
  nom: string
  prenom: string
  dateNaissance: string
  age: string
  origine: string
  genre: string
  degreScolaire: string
  adresseComplete: string
  appartement: string
  codePostal: string
  ville: string
  demeurAvec: string
  
  // Coordonnées parents
  parent1Type: string
  parent1Nom: string
  parent1Prenom: string
  parent1Tel: string
  parent1Email: string
  parent2Type: string
  parent2Nom: string
  parent2Prenom: string
  parent2Tel: string
  parent2Email: string
  
  // Fiche médicale
  contactUrgence: string
  contactUrgenceTel: string
  contactUrgenceLien: string
  problemeSante: string
  allergies: string
  epipen: string
  
  // Contacts scolaires
  ecoleReferente: string
  intervenantNom: string
  intervenantTitre: string
  intervenantPoste: string
  intervenantEmail: string
  directionNom: string
  directionEmail: string
  
  // Programme
  programme: string
  dateEntree: string
  dateFin: string
  apresSejourPlan: string
  motifReference: string
  moyensProposesAutres: string
  suiviExterne: string
  motivationsAdolescent: string
}

interface EnrollmentFormProps {
  onSuccess?: () => void
}

export const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ onSuccess }) => {
  const { createEnrollment } = useEnrollments()
  const { getButtonClass, getBgClass, getTextClass, getCardClass } = useThemeContext()
  const { showSuccess, showError } = useModal()
  const { createNotification } = useNotifications()
  const [currentSection, setCurrentSection] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    nom: "", prenom: "", dateNaissance: "", age: "", origine: "", genre: "",
    degreScolaire: "", adresseComplete: "", appartement: "", codePostal: "", ville: "", demeurAvec: "",
    parent1Type: "", parent1Nom: "", parent1Prenom: "", parent1Tel: "", parent1Email: "",
    parent2Type: "", parent2Nom: "", parent2Prenom: "", parent2Tel: "", parent2Email: "",
    contactUrgence: "", contactUrgenceTel: "", contactUrgenceLien: "",
    problemeSante: "", allergies: "", epipen: "",
    ecoleReferente: "", intervenantNom: "", intervenantTitre: "", intervenantPoste: "",
    intervenantEmail: "", directionNom: "", directionEmail: "",
    programme: "", dateEntree: "", dateFin: "", apresSejourPlan: "",
    motifReference: "", moyensProposesAutres: "", suiviExterne: "", motivationsAdolescent: ""
  })
  
  const [moyensProposesChecked, setMoyensProposesChecked] = useState({
    emulation: false,
    rencontreParents: false,
    horaireAdapte: false,
    suiviTES: false,
    planIntervention: false,
    suiviPsycho: false,
    rencontreTutrice: false
  })
  
  const [confirmation, setConfirmation] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const sections = [
    { title: "Fiche personnelle de l'élève", count: 11 },
    { title: "Coordonnées des parents", count: 10 },
    { title: "Fiche Médicale", count: 6 },
    { title: "Contacts scolaires", count: 7 },
    { title: "Choix du programme et description", count: 9 }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmation) {
      showError("Veuillez confirmer l'attestation")
      return
    }

    try {
      const moyensProposesString = Object.entries(moyensProposesChecked)
        .filter(([_, checked]) => checked)
        .map(([key]) => {
          const labels: Record<string, string> = {
            emulation: "Système d'émulation",
            rencontreParents: "Rencontre avec les parents",
            horaireAdapte: "Horaire adapté",
            suiviTES: "Suivi avec une T.E.S",
            planIntervention: "Plan d'intervention",
            suiviPsycho: "Suivi avec une psychoéducatrice",
            rencontreTutrice: "Rencontre avec la tutrice"
          }
          return labels[key] || key
        })
        .join(", ")

      const newEnrollment = await createEnrollment({
        ...formData,
        moyensProposesAutres: moyensProposesString,
        status: "en_attente"
      })

      // Envoi de la notification email
      try {
        await lumi.functions.invoke("notifyNewEnrollment", {
          method: "POST",
          body: {
            enrollment: {
              nom: formData.nom,
              prenom: formData.prenom,
              dateNaissance: formData.dateNaissance,
              age: formData.age,
              programme: formData.programme,
              dateEntree: formData.dateEntree,
              ecoleReferente: formData.ecoleReferente,
              parent1Nom: formData.parent1Nom,
              parent1Email: formData.parent1Email,
              parent1Tel: formData.parent1Tel,
              motifReference: formData.motifReference
            }
          }
        })
        console.log("Email de notification envoyé avec succès")
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError)
        // Ne pas bloquer le processus si l'email échoue
      }

      // Créer notification dans la cloche pour tous les administrateurs
      try {
        console.log("🔔 Début création notifications pour administrateurs")
        const allIntervenants = await lumi.entities.intervenants.list({})
        console.log("📋 Intervenants récupérés:", allIntervenants?.list?.length || 0)
        
        if (allIntervenants?.list && allIntervenants.list.length > 0) {
          // Filtrer les administrateurs (ceux avec permissions.accessAdministration = true)
          const adminUsers = allIntervenants.list.filter(
            (intervenant: any) => {
              console.log("👤 Intervenant:", intervenant.prenom, intervenant.nom, "Permissions:", intervenant.permissions)
              return intervenant.permissions?.accessAdministration === true
            }
          )
          
          console.log("✅ Administrateurs trouvés:", adminUsers.length)
          console.log("📝 Liste admins:", adminUsers.map((a: any) => `${a.prenom} ${a.nom}`))
          
          for (const admin of adminUsers) {
            console.log("📨 Création notification pour:", admin.prenom, admin.nom, "ID:", admin._id)
            try {
              await createNotification({
                userId: admin._id,
                type: "new_enrollment",
                titre: "Nouvel étudiant en attente",
                message: `${formData.prenom} ${formData.nom} - Programme ${formData.programme}`,
                entityId: newEnrollment._id,
                entityType: "enrollment",
                lu: false
              })
              console.log("✅ Notification créée avec succès pour:", admin.prenom, admin.nom)
            } catch (createError) {
              console.error("❌ Erreur création notification pour", admin.prenom, admin.nom, ":", createError)
            }
          }
        } else {
          console.log("⚠️ Aucun intervenant trouvé")
        }
      } catch (notifError) {
        console.error("❌ Erreur lors de la création des notifications:", notifError)
      }

      // Afficher la page de confirmation
      setShowConfirmation(true)
      
      // Reset form
      setFormData({
        nom: "", prenom: "", dateNaissance: "", age: "", origine: "", genre: "",
        degreScolaire: "", adresseComplete: "", appartement: "", codePostal: "", ville: "", demeurAvec: "",
        parent1Type: "", parent1Nom: "", parent1Prenom: "", parent1Tel: "", parent1Email: "",
        parent2Type: "", parent2Nom: "", parent2Prenom: "", parent2Tel: "", parent2Email: "",
        contactUrgence: "", contactUrgenceTel: "", contactUrgenceLien: "",
        problemeSante: "", allergies: "", epipen: "",
        ecoleReferente: "", intervenantNom: "", intervenantTitre: "", intervenantPoste: "",
        intervenantEmail: "", directionNom: "", directionEmail: "",
        programme: "", dateEntree: "", dateFin: "", apresSejourPlan: "",
        motifReference: "", moyensProposesAutres: "", suiviExterne: "", motivationsAdolescent: ""
      })
      setMoyensProposesChecked({
        emulation: false,
        rencontreParents: false,
        horaireAdapte: false,
        suiviTES: false,
        planIntervention: false,
        suiviPsycho: false,
        rencontreTutrice: false
      })
      setConfirmation(false)
      setCurrentSection(0)

      if (onSuccess) onSuccess()
    } catch (error) {
      showError("Erreur lors de la soumission du formulaire")
      console.error(error)
    }
  }

  const calculateAge = (dateNaissance: string): string => {
    if (!dateNaissance) return ""
    const today = new Date()
    const birthDate = new Date(dateNaissance)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age.toString()
  }

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (field === "dateNaissance") {
        updated.age = calculateAge(value)
      }
      return updated
    })
  }

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  // Page de confirmation après soumission
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header succès */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-6xl">✓</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Formulaire envoyé avec succès !</h1>
              <p className="text-green-100">Votre demande d'inscription a bien été transmise</p>
            </div>

            {/* Contenu */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <p className="text-lg text-gray-700 mb-4">
                  📋 Votre formulaire a bien été envoyé et sera traité dans les plus brefs délais.
                </p>
                <p className="text-gray-600">
                  Nous vous contacterons prochainement pour la suite du processus d'inscription.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
                <p className="text-sm text-gray-700">
                  <strong>📧 Prochaines étapes :</strong><br/>
                  • Vous recevrez un courriel de confirmation<br/>
                  • Notre équipe étudiera votre demande<br/>
                  • Nous vous contacterons pour planifier la suite
                </p>
              </div>

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setShowConfirmation(false)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
                  Soumettre une nouvelle inscription
                </button>
                <button
                  onClick={() => window.location.href = "/"}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all">
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${getBgClass()} py-8`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className={`${getCardClass()} rounded-xl overflow-hidden`}>
          {/* Header */}
          <div className={`${getButtonClass()} p-6 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
              <h1 className="text-3xl font-bold">Formulaire d'inscription</h1>
            </div>
            <p className="text-blue-100">Fiche personnelle de l'élève</p>
          </div>

          {/* Progress */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Section {currentSection + 1} sur {sections.length}
              </span>
              <span className="text-sm text-gray-600">
                {sections[currentSection].title}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${getButtonClass().split(" ")[0]} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Section 1: Fiche personnelle */}
            {currentSection === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Fiche personnelle de l'élève</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1. Nom *</label>
                    <input type="text" required value={formData.nom} onChange={(e) => updateField("nom", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">2. Prénom *</label>
                    <input type="text" required value={formData.prenom} onChange={(e) => updateField("prenom", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3. Date de naissance *</label>
                    <input type="date" required value={formData.dateNaissance} onChange={(e) => updateField("dateNaissance", e.target.value)}
                      min="2000-01-01" max="2020-12-31"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">4. Âge *</label>
                    <input type="number" required value={formData.age} readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">5. Origine ethnoculturelle *</label>
                  <select required value={formData.origine} onChange={(e) => updateField("origine", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Sélectionner...</option>
                    <option value="Canadienne">Canadienne</option>
                    <option value="Asiatique occidental">Asiatique occidental</option>
                    <option value="Asiatique du Sud-Est">Asiatique du Sud-Est</option>
                    <option value="Europe de l'est/l'ouest">Europe de l'est/l'ouest</option>
                    <option value="Sud-Asiatique">Sud-Asiatique</option>
                    <option value="Latino-Américaine">Latino-Américaine</option>
                    <option value="Arabe">Arabe</option>
                    <option value="Africaine">Africaine</option>
                    <option value="Haïtienne">Haïtienne</option>
                    <option value="Chinoise">Chinoise</option>
                    <option value="Autochtone">Autochtone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">6. Genre *</label>
                  <select required value={formData.genre} onChange={(e) => updateField("genre", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Sélectionner...</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                    <option value="Autres">Autres (non binaire, personne transgenre, etc.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">7. Degré scolaire *</label>
                  <select required value={formData.degreScolaire} onChange={(e) => updateField("degreScolaire", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Sélectionner...</option>
                    <option value="6e Année">6e Année</option>
                    <option value="Secondaire 1">Secondaire 1</option>
                    <option value="Secondaire 2">Secondaire 2</option>
                    <option value="Secondaire 3">Secondaire 3</option>
                    <option value="Secondaire 4">Secondaire 4</option>
                    <option value="Secondaire 5">Secondaire 5</option>
                    <option value="FPT">FPT</option>
                    <option value="FMS">FMS</option>
                    <option value="GADP">GADP</option>
                    <option value="GADSP">GADSP</option>
                    <option value="PEP">PEP</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">8. Adresse complète (No civique + rue) *</label>
                    <AddressAutocomplete
                      value={formData.adresseComplete}
                      onChange={(value) => updateField("adresseComplete", value)}
                      onVilleChange={(ville) => updateField("ville", ville)}
                      onCodePostalChange={(codePostal) => updateField("codePostal", codePostal)}
                      placeholder="Ex: 123 Rue de la Montagne"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">9. Appartement</label>
                    <input type="text" value={formData.appartement} onChange={(e) => updateField("appartement", e.target.value)}
                      placeholder="App. 101"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">10. Code postal *</label>
                    <input type="text" required value={formData.codePostal} onChange={(e) => updateField("codePostal", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">11. Ville de résidence *</label>
                    <select required value={formData.ville} onChange={(e) => updateField("ville", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">12. L'élève demeure avec *</label>
                  <select required value={formData.demeurAvec} onChange={(e) => updateField("demeurAvec", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Sélectionner...</option>
                    <option value="Mère">Mère</option>
                    <option value="Père">Père</option>
                    <option value="Les deux parents">Les deux parents</option>
                    <option value="Garde partagée">Garde partagée</option>
                    <option value="Beaux-parents de la mère">Beaux-parents de la mère</option>
                    <option value="Beaux-parents du père">Beaux-parents du père</option>
                    <option value="Tante">Tante</option>
                    <option value="Oncle">Oncle</option>
                    <option value="Oncle et tante (couple)">Oncle et tante (couple)</option>
                    <option value="Grands-oncles et grandes tantes">Grands-oncles et grandes tantes</option>
                    <option value="Grands-parents (maternels)">Grands-parents (maternels)</option>
                    <option value="Grands-parents (paternels)">Grands-parents (paternels)</option>
                    <option value="Arrière-grands-parents">Arrière-grands-parents</option>
                    <option value="Frères et/ou Sœurs (majeurs)">Frères et/ou Sœurs (majeurs)</option>
                    <option value="Demi-frères et/ou Demi-sœurs">Demi-frères et/ou Demi-sœurs</option>
                    <option value="Beaux-frères et/ou Belles-sœurs">Beaux-frères et/ou Belles-sœurs</option>
                    <option value="Cousins et/ou cousines">Cousins et/ou cousines</option>
                    <option value="Tuteur et/ou Tutrice">Tuteur et/ou Tutrice</option>
                    <option value="En résidence">En résidence</option>
                    <option value="Foyer de groupe">Foyer de groupe</option>
                    <option value="Famille d'accueil">Famille d'accueil</option>
                    <option value="Un ou une Ami(e)">Un ou une Ami(e)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Section 2: Coordonnées des parents */}
            {currentSection === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Coordonnées des parents</h2>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Premier ou première répondant.e</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">12. Type (père, mère ou tuteur) *</label>
                      <input type="text" required value={formData.parent1Type} onChange={(e) => updateField("parent1Type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">13. Nom *</label>
                        <input type="text" required value={formData.parent1Nom} onChange={(e) => updateField("parent1Nom", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">14. Prénom *</label>
                        <input type="text" required value={formData.parent1Prenom} onChange={(e) => updateField("parent1Prenom", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">15. Numéro de téléphone *</label>
                        <input type="tel" required value={formData.parent1Tel} onChange={(e) => updateField("parent1Tel", formatPhoneNumber(e.target.value))}
                          placeholder="(450)555-5555"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">16. Adresse courriel *</label>
                        <input type="email" required value={formData.parent1Email} onChange={(e) => updateField("parent1Email", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Deuxième répondant.e</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">17. Type (père, mère ou tuteur)</label>
                      <input type="text" value={formData.parent2Type} onChange={(e) => updateField("parent2Type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">18. Nom</label>
                        <input type="text" value={formData.parent2Nom} onChange={(e) => updateField("parent2Nom", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">19. Prénom</label>
                        <input type="text" value={formData.parent2Prenom} onChange={(e) => updateField("parent2Prenom", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">20. Numéro de téléphone</label>
                        <input type="tel" value={formData.parent2Tel} onChange={(e) => updateField("parent2Tel", formatPhoneNumber(e.target.value))}
                          placeholder="(450)555-5555"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">21. Adresse courriel</label>
                        <input type="email" value={formData.parent2Email} onChange={(e) => updateField("parent2Email", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Fiche Médicale */}
            {currentSection === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Fiche Médicale</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">22. Personne à contacter en cas d'urgence *</label>
                    <input type="text" required value={formData.contactUrgence} onChange={(e) => updateField("contactUrgence", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">23. Numéro de téléphone *</label>
                    <input type="tel" required value={formData.contactUrgenceTel} onChange={(e) => updateField("contactUrgenceTel", formatPhoneNumber(e.target.value))}
                      placeholder="(450)555-5555"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">24. Lien de parenté *</label>
                  <input type="text" required value={formData.contactUrgenceLien} onChange={(e) => updateField("contactUrgenceLien", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">25. Problème(s) de santé? Si oui, spécifiez</label>
                  <textarea value={formData.problemeSante} onChange={(e) => updateField("problemeSante", e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">26. Allergie(s), spécifier</label>
                  <textarea value={formData.allergies} onChange={(e) => updateField("allergies", e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">27. Nécessite un épipen *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input type="radio" name="epipen" value="oui" checked={formData.epipen === "oui"}
                        onChange={(e) => updateField("epipen", e.target.value)}
                        className="mr-2" />
                      Oui
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="epipen" value="non" checked={formData.epipen === "non"}
                        onChange={(e) => updateField("epipen", e.target.value)}
                        className="mr-2" />
                      Non
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Contacts scolaires */}
            {currentSection === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Contacts scolaires</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">28. École référente *</label>
                  <select required value={formData.ecoleReferente} onChange={(e) => updateField("ecoleReferente", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">29. Nom de l'intervenant.e scolaire *</label>
                    <input type="text" required value={formData.intervenantNom} onChange={(e) => updateField("intervenantNom", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">30. Titre *</label>
                    <input type="text" required value={formData.intervenantTitre} onChange={(e) => updateField("intervenantTitre", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">31. Numéro de poste *</label>
                    <input type="text" required value={formData.intervenantPoste} onChange={(e) => updateField("intervenantPoste", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">32. Adresse courriel *</label>
                    <input type="email" required value={formData.intervenantEmail} onChange={(e) => updateField("intervenantEmail", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">33. Nom de la direction *</label>
                    <input type="text" required value={formData.directionNom} onChange={(e) => updateField("directionNom", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">34. Adresse courriel *</label>
                    <input type="email" required value={formData.directionEmail} onChange={(e) => updateField("directionEmail", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Programme */}
            {currentSection === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Choix du programme et description de la situation</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">35. Je souhaite référer l'élève au programme suivant *</label>
                  <select required value={formData.programme} onChange={(e) => updateField("programme", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Sélectionner...</option>
                    <option value="ALT">ALT : Comportements d'intimidation (5 ou 10 jours)</option>
                    <option value="OPTION">OPTION : Suspension scolaire (3 ou 10 jours)</option>
                    <option value="PIVOT">PIVOT : Non fréquentation, absentéisme (15 ans+)</option>
                    <option value="APOSTROPHE">APOSTROPHE : Difficultés d'adaptation (13-14 ans, 8 semaines)</option>
                    <option value="SAUTS">SAUTS : Transition vers le secondaire (Estival)</option>
                    <option value="Suivis Estivaux">Suivis Estivaux : Accompagnement individualisé</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">36. Date d'entrée au programme *</label>
                    <input type="date" required value={formData.dateEntree} onChange={(e) => updateField("dateEntree", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">37. Date de fin du programme *</label>
                    <input type="date" required value={formData.dateFin} onChange={(e) => updateField("dateFin", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">38. Suite au séjour, l'école envisage *</label>
                  <select required value={formData.apresSejourPlan} onChange={(e) => updateField("apresSejourPlan", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Sélectionner...</option>
                    <option value="Changement d'école">Un changement d'école</option>
                    <option value="Changement de programme">Un changement de programme scolaire</option>
                    <option value="Réintégration">Une réintégration dans la même classe</option>
                    <option value="À évaluer">À évaluer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">39. Motif principal de référence *</label>
                  <textarea required value={formData.motifReference} onChange={(e) => updateField("motifReference", e.target.value)} rows={4}
                    placeholder="Comportements, attitudes, particularités et explication de la difficulté"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">40. Moyens déjà proposés à l'élève</label>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {[
                      { key: "emulation", label: "Système d'émulation" },
                      { key: "rencontreParents", label: "Rencontre avec les parents" },
                      { key: "horaireAdapte", label: "Horaire adapté" },
                      { key: "suiviTES", label: "Suivi avec une T.E.S" },
                      { key: "planIntervention", label: "Plan d'intervention" },
                      { key: "suiviPsycho", label: "Suivi avec une psychoéducatrice" },
                      { key: "rencontreTutrice", label: "Rencontre avec la tutrice" }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center">
                        <input type="checkbox"
                          checked={moyensProposesChecked[key as keyof typeof moyensProposesChecked]}
                          onChange={(e) => setMoyensProposesChecked(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">41. Suivi externe, préciser</label>
                  <textarea value={formData.suiviExterne} onChange={(e) => updateField("suiviExterne", e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">42. Motivations de l'adolescent.e *</label>
                  <textarea required value={formData.motivationsAdolescent} onChange={(e) => updateField("motivationsAdolescent", e.target.value)} rows={3}
                    placeholder="Motivations nommées par l'adolescent.e à participer au programme"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <label className="flex items-start">
                    <input type="checkbox" required checked={confirmation} onChange={(e) => setConfirmation(e.target.checked)}
                      className="mt-1 mr-3 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                    <span className="text-sm text-gray-800">
                      <strong>43. Je confirme que les informations mentionnées sont véridiques *</strong><br/>
                      J'atteste que la direction ainsi que l'équipe école ont pris connaissance de cette demande et consentent à la référence
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <button type="button" onClick={prevSection}
                disabled={currentSection === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  currentSection === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}>
                ← Précédent
              </button>

              {currentSection < sections.length - 1 ? (
                <button type="button" onClick={nextSection}
                  className={`px-6 py-2 ${getButtonClass()} text-white rounded-lg font-medium hover:opacity-90 transition-all`}>
                  Suivant →
                </button>
              ) : (
                <button type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg">
                  ✓ Confirmer
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
