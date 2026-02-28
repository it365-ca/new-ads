import React, { useState } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

export const CreateTestStudent = () => {
  const navigate = useNavigate()
  const [count, setCount] = useState(1)
  const [status, setStatus] = useState<"actif" | "ferme" | "en_attente">("actif")
  const [isCreating, setIsCreating] = useState(false)

  const noms = ["Tremblay", "Gagnon", "Roy", "Cote", "Bouchard", "Jean-Baptiste", "Diallo", "El Amrani", "Nguyen", "Singh", "Martinez", "Chen", "Mohammed", "Silva", "Dubois", "Patel", "Kim", "Santos", "Ali", "Lopez"]
  
  const prenoms = ["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Avery", "Riley", "Jamie", "Chris", "Pat", "Skyler", "Dakota", "Sage", "River", "Phoenix", "Quinn", "Reese", "Drew", "Kendall"]
  
  const villes = [
    "Candiac", "Châteauguay", "La Prairie", "Mercier", "Napierville", "Sherrington",
    "St-Bernard de Lacolle", "St-Constant", "St-Isidore", "St-Michel", "St-Philippe",
    "St-Rémi", "Ste-Catherine", "Ste-Clotilde", "St-Mathieu", "St-Édouard", "Hemmingford", "Léry", "Delson"
  ]
  
  const ecoles = [
    "Bonnier", "Des Timoniers", "Gabrielle-Roy", "Jacques-Leber", "Marguerite-Bourgeois",
    "Louis-Cyr", "St-François-Xavier", "Louis-Philippe-Paré", "De La Magdeleine", "Du Tournant",
    "Pierre-Bédard", "Fernand-Séguin", "Hors Territoire", "École aux adultes", "J-L Vinet-Souligny",
    "J-L Des Cheminots", "J-L Félix-Leclerc", "J-L Piché-Dufrost", "J-L Aquarelle-Armand-Frappier"
  ]
  
  const programmes = ["ALT", "OPTION", "PIVOT", "APOSTROPHE", "SAUTS", "Suivis Estivaux"]
  
  const degres = ["6e Année", "Secondaire 1", "Secondaire 2", "Secondaire 3", "Secondaire 4", "Secondaire 5", "FPT", "FMS", "GADP", "GADSP", "PEP"]
  
  const origines = [
    "Canadienne", "Asiatique occidental", "Asiatique du Sud-Est", "Europe de l'est/l'ouest",
    "Sud-Asiatique", "Latino-Américaine", "Arabe", "Africaine", "Haïtienne", "Chinoise", "Autochtone"
  ]
  
  const genres = ["Masculin", "Féminin", "Autres"]
  
  const demeurAvecOptions = [
    "Mère", "Père", "Les deux parents", "Garde partagée",
    "Beaux-parents de la mère", "Beaux-parents du père", "Tante", "Oncle",
    "Oncle et tante (couple)", "Grands-oncles et grandes tantes",
    "Grands-parents (maternels)", "Grands-parents (paternels)",
    "Arrière-grands-parents", "Frères et/ou Sœurs (majeurs)",
    "Demi-frères et/ou Demi-sœurs", "Beaux-frères et/ou Belles-sœurs",
    "Cousins et/ou cousines", "Tuteur et/ou Tutrice",
    "En résidence", "Foyer de groupe", "Famille d'accueil", "Un ou une Ami(e)"
  ]

  const createStudents = async () => {
    if (count < 1 || count > 100) {
      toast.error("Veuillez entrer un nombre entre 1 et 100")
      return
    }

    setIsCreating(true)
    const loadingToast = toast.loading(`Création de ${count} étudiant(s) fictif(s) (${status})...`)

    try {
      const now = new Date().toISOString()
      const students = []
      let emailsSent = 0

      for (let i = 0; i < count; i++) {
        const age = 9 + Math.floor(Math.random() * 9)
        const year = 2025 - age
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
        
        const entreeStartDate = new Date("2024-04-01")
        const entreeEndDate = new Date("2025-03-31")
        const randomTime = entreeStartDate.getTime() + Math.random() * (entreeEndDate.getTime() - entreeStartDate.getTime())
        const randomDate = new Date(randomTime)
        const entreeYear = randomDate.getFullYear()
        const entreeMonth = String(randomDate.getMonth() + 1).padStart(2, "0")
        const entreeDay = String(randomDate.getDate()).padStart(2, "0")
        
        const finYear = entreeYear + 1

        const studentData = {
          nom: noms[i % noms.length],
          prenom: prenoms[i % prenoms.length],
          dateNaissance: `${year}-${month}-${day}`,
          age: String(age),
          origine: origines[i % origines.length],
          genre: genres[i % genres.length],
          degreScolaire: degres[i % degres.length],
          adresseComplete: `${100 + i} Rue Principale`,
          appartement: "",
          codePostal: `H${Math.floor(Math.random() * 9) + 1}A ${Math.floor(Math.random() * 9) + 1}B${Math.floor(Math.random() * 9) + 1}`,
          ville: villes[i % villes.length],
          demeurAvec: demeurAvecOptions[i % demeurAvecOptions.length],
          parent1Type: i % 2 === 0 ? "Mère" : "Père",
          parent1Nom: noms[(i + 5) % noms.length],
          parent1Prenom: i % 2 === 0 ? "Marie" : "Jean",
          parent1Tel: `(514)555-${String(1000 + i).padStart(4, "0")}`,
          parent1Email: `parent${i + 1}@exemple.com`,
          parent2Type: i % 2 === 0 ? "Père" : "Mère",
          parent2Nom: noms[(i + 5) % noms.length],
          parent2Prenom: i % 2 === 0 ? "Jean" : "Marie",
          parent2Tel: `(514)555-${String(2000 + i).padStart(4, "0")}`,
          parent2Email: `parent${i + 1}b@exemple.com`,
          contactUrgence: `Contact Urgence ${i + 1}`,
          contactUrgenceTel: `(438)555-${String(3000 + i).padStart(4, "0")}`,
          contactUrgenceLien: i % 3 === 0 ? "Tante" : i % 3 === 1 ? "Oncle" : "Grand-parent",
          problemeSante: "",
          allergies: "",
          epipen: Math.random() < 0.1 ? "oui" : "non",
          ecoleReferente: ecoles[i % ecoles.length],
          intervenantNom: `Intervenant-${i + 1}`,
          intervenantTitre: i % 3 === 0 ? "TES" : i % 3 === 1 ? "Psychologue" : "Travailleur social",
          intervenantPoste: String(1000 + i),
          intervenantEmail: `intervenant${i + 1}@ecole.qc.ca`,
          directionNom: `Direction-${(i % 5) + 1}`,
          directionEmail: `direction${(i % 5) + 1}@ecole.qc.ca`,
          programme: programmes[i % programmes.length],
          dateEntree: `${entreeYear}-${entreeMonth}-${entreeDay}`,
          dateFin: `${finYear}-${entreeMonth}-${entreeDay}`,
          apresSejourPlan: i % 4 === 0 ? "Changement d'école" : i % 4 === 1 ? "Changement de programme" : i % 4 === 2 ? "Réintégration" : "À évaluer",
          motifReference: `Difficultés d'adaptation et besoin d'un cadre structuré (étudiant fictif #${i + 1})`,
          moyensProposesAutres: "Suivi hebdomadaire avec intervenant",
          suiviExterne: Math.random() < 0.3 ? "Suivi CISSS" : "",
          motivationsAdolescent: `Veut améliorer ses résultats scolaires (étudiant #${i + 1})`,
          status: status,
          creator: "admin-test",
          createdAt: now,
          updatedAt: now
        }

        students.push(studentData)
      }

      // Créer tous les étudiants
      for (const student of students) {
        const created = await lumi.entities.enrollments.create(student)
        
        // Si status = actif ou fermé, créer des notes avec interventions
        if (status === "actif" || status === "ferme") {
          try {
            const noteCount = Math.floor(Math.random() * 3) + 1 // 1 à 3 notes
            const interventionTypes = [
              { key: "teleEcole", label: "Téléphone École" },
              { key: "teleParent", label: "Téléphone Parent" },
              { key: "teleJeune", label: "Téléphone Jeune" },
              { key: "rencontreIndividuelle", label: "Rencontre Individuelle" },
              { key: "rencontreGroupe", label: "Rencontre de Groupe" },
              { key: "rencontreFamiliale", label: "Rencontre Familiale" },
              { key: "suiviBesoin", label: "Suivi Besoin" },
              { key: "sortieExterieure", label: "Sortie Extérieure" },
              { key: "interventionCrise", label: "Intervention de Crise" },
              { key: "accompagnementRDV", label: "Accompagnement RDV" },
              { key: "nombreAutre", label: "Nombre autre" },
              { key: "organismeCommunautaire", label: "Organisme communautaire" },
              { key: "protectionJeunesse", label: "Protection jeunesse" },
              { key: "CISSSMO", label: "CISSSMO" },
              { key: "ecoleAuxAdultes", label: "École aux adultes" },
              { key: "milieuStage", label: "Milieu de stage" },
              { key: "policierPreventionniste", label: "Policier préventionniste" },
              { key: "ressourcePsychologique", label: "Ressource psychologique" },
              { key: "courrielParent", label: "Courriel Parent" }
            ]
            
            const noteTemplates = [
              "Suivi régulier avec l'étudiant. Progrès notables dans l'attitude et la motivation.",
              "Rencontre familiale pour discuter du plan d'intervention personnalisé.",
              "Contact téléphonique avec l'école. Collaboration positive avec l'équipe éducative.",
              "Accompagnement lors d'un rendez-vous médical important.",
              "Intervention de crise gérée efficacement. Retour au calme progressif.",
              "Sortie éducative au musée. Participation active et intérêt manifeste."
            ]

            for (let j = 0; j < noteCount; j++) {
              const interventionCounters: any = {}
              const interventionLabels = []

              // Créer des compteurs pour TOUS les 19 types d'interventions
              for (const intervention of interventionTypes) {
                const count = Math.floor(Math.random() * 3) + 1 // 1 à 3 par type
                interventionCounters[intervention.key] = count
                interventionLabels.push(`${intervention.label} (${count})`)
              }

              // Créer une date aléatoire dans les 6 derniers mois
              const daysAgo = Math.floor(Math.random() * 180)
              const noteDate = new Date()
              noteDate.setDate(noteDate.getDate() - daysAgo)

              const noteData = {
                enrollmentId: created._id,
                titre: `Note de suivi ${j + 1}`,
                contenu: `${noteTemplates[j % noteTemplates.length]}\n\nInterventions effectuées: ${interventionLabels.join(', ')}`,
                counters: interventionCounters,
                suivi: true,
                status: "actif",
                dateCreation: noteDate.toISOString(),
                auteurNom: "Système Test",
                creator: "admin-test",
                createdAt: noteDate.toISOString(),
                updatedAt: noteDate.toISOString()
              }

              await lumi.entities.notes.create(noteData)
            }
          } catch (noteError) {
            console.warn(`Notes non créées pour ${student.prenom} ${student.nom}:`, noteError)
          }
        }
        
        // Si status = en_attente, envoyer notification email
        if (status === "en_attente") {
          try {
            await lumi.functions.invoke("notifyNewEnrollment", {
              method: "POST",
              body: {
                enrollment: {
                  nom: student.nom,
                  prenom: student.prenom,
                  dateNaissance: student.dateNaissance,
                  age: student.age,
                  programme: student.programme,
                  dateEntree: student.dateEntree,
                  ecoleReferente: student.ecoleReferente,
                  parent1Nom: student.parent1Nom,
                  parent1Email: student.parent1Email,
                  parent1Tel: student.parent1Tel,
                  motifReference: student.motifReference
                }
              }
            })
            emailsSent++
          } catch (emailError) {
            console.warn(`Email non envoyé pour ${student.prenom} ${student.nom}:`, emailError)
          }
        }
      }
      
      let successMessage = `✅ ${count} étudiant(s) fictif(s) créé(s) avec succès (${status})!`
      if (status === "actif" || status === "ferme") {
        successMessage += ` 📝 Notes avec interventions ajoutées (19 types)!`
      }
      if (status === "en_attente" && emailsSent > 0) {
        successMessage += ` 📧 ${emailsSent} notification(s) email envoyée(s)!`
      }
      
      toast.success(successMessage, { id: loadingToast, duration: 5000 })
      
      // Rediriger vers la vue appropriée selon le statut
      setTimeout(() => {
        if (status === "en_attente") {
          navigate("/?view=en_attente")
        } else if (status === "ferme") {
          navigate("/?view=ferme")
        } else if (status === "actif") {
          navigate("/?view=actif")
        } else {
          navigate("/")
        }
        window.location.reload()
      }, 2000)

    } catch (error: any) {
      console.error("Erreur complète:", error)
      toast.error(`❌ Erreur: ${error.message || "Erreur inconnue"}`, { id: loadingToast, duration: 10000 })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Créer des étudiants fictifs
          </h1>
          <p className="text-gray-600">
            Générez des étudiants avec données variées pour vos statistiques
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-blue-900 mb-3">📊 Données variées incluses:</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
            <div>
              <div className="font-semibold mb-2">✓ Données personnelles:</div>
              <ul className="space-y-1 ml-4">
                <li>• {noms.length} noms différents</li>
                <li>• {prenoms.length} prénoms unisexes</li>
                <li>• Âges: 9 à 17 ans</li>
                <li>• {genres.length} genres</li>
                <li>• {origines.length} origines</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">✓ Données scolaires:</div>
              <ul className="space-y-1 ml-4">
                <li>• {ecoles.length} écoles différentes</li>
                <li>• {programmes.length} programmes (ALT, OPTION, PIVOT...)</li>
                <li>• {degres.length} degrés scolaires</li>
                <li>• {villes.length} villes</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-300">
            <div className="font-semibold text-blue-900 mb-2">✓ Autres données:</div>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Parents complets (père + mère) avec coordonnées</li>
              <li>• Contacts d'urgence variés</li>
              <li>• Dates d'entrée aléatoires (2024-2025)</li>
              <li>• Statut personnalisable (actif/fermé/en attente)</li>
              <li>• <strong>📋 19 types d'interventions</strong> dans chaque note de suivi</li>
            </ul>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Nombre d'étudiants à créer:
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-lg font-bold text-center"
            disabled={isCreating}
          />
          <p className="text-sm text-gray-500 mt-2 text-center">
            Min: 1 | Max: 100 | Recommandé: 10-25 pour tests
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Statut des étudiants:
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setStatus("actif")}
              disabled={isCreating}
              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                status === "actif"
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}>
              ✅ Actif
            </button>
            <button
              type="button"
              onClick={() => setStatus("ferme")}
              disabled={isCreating}
              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                status === "ferme"
                  ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}>
              🔒 Fermé
            </button>
            <button
              type="button"
              onClick={() => setStatus("en_attente")}
              disabled={isCreating}
              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                status === "en_attente"
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}>
              ⏳ En attente
            </button>
          </div>
          {status === "en_attente" && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>📧 Notification automatique:</strong> Un email sera envoyé pour chaque étudiant en attente créé.
              </p>
            </div>
          )}
          {(status === "actif" || status === "ferme") && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>📋 Notes complètes:</strong> Chaque note inclura des statistiques sur les 19 types d'interventions.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={createStudents}
          disabled={isCreating}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
          {isCreating ? "⏳ Création en cours..." : `🚀 Créer ${count} étudiant(s) (${status})`}
        </button>

        <button
          onClick={() => navigate("/")}
          disabled={isCreating}
          className="w-full mt-4 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all disabled:opacity-50">
          ← Retour au tableau de bord
        </button>
      </div>
    </div>
  )
}
