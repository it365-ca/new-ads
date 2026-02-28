import React, { useState, useMemo, useEffect } from "react"
import { useEnrollments } from "../hooks/useEnrollments"
import { useAllNotes } from "../hooks/useAllNotes"
import { EnrollmentDetails } from "./EnrollmentDetails"
import { EnrollmentForm } from "./EnrollmentForm"
import { StickyNotesBoard } from "./StickyNotesBoard"
import { StatsSamplePage } from "./StatsSamplePage"
import toast from "react-hot-toast"
import { formatDate } from "../utils/dateFormat"
import { lumi } from "../lib/lumi"

interface EnrollmentDashboardProps {
  openFormTrigger?: boolean
  onFormOpenComplete?: () => void
  onInitiateTransfer?: (virtualProfile: any) => void
  onOpenAppointmentModal?: () => void
}

export function EnrollmentDashboard({ openFormTrigger, onFormOpenComplete, onInitiateTransfer, onOpenAppointmentModal }: EnrollmentDashboardProps) {
  const { enrollments, loading, error, refreshEnrollments, deleteEnrollment, createEnrollment } = useEnrollments()
  const { notes: allNotes, fetchAllNotes } = useAllNotes()
  
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null)
  const [activeFilter, setActiveFilter] = useState<"tous" | "en_attente" | "actif" | "ferme" | "refuse">("tous")
  const [searchQuery, setSearchQuery] = useState("")
  const [showVirtualProfiles, setShowVirtualProfiles] = useState(false)
  const [showNotesBoard, setShowNotesBoard] = useState(false)
  const [showStatusView, setShowStatusView] = useState<"en_attente" | "actif" | "ferme" | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [showCreateVirtualModal, setShowCreateVirtualModal] = useState(false)
  const [newVirtualTitle, setNewVirtualTitle] = useState("")
  const [newVirtualProgramme, setNewVirtualProgramme] = useState("")
  const [newVirtualSchool, setNewVirtualSchool] = useState("")
  const [virtualFilter, setVirtualFilter] = useState<"actif" | "ferme">("actif")
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dateFilterStart, setDateFilterStart] = useState<string>("")
  const [dateFilterEnd, setDateFilterEnd] = useState<string>("")
  const [sortBy, setSortBy] = useState<"dateEntree" | "programme">("dateEntree")
  const [programmeFilter, setProgrammeFilter] = useState<string>("tous")

  React.useEffect(() => {
    if (openFormTrigger) {
      setShowForm(true)
      onFormOpenComplete?.()
    }
  }, [openFormTrigger, onFormOpenComplete])

  // Écouter le paramètre URL enrollment pour ouvrir le dashboard automatiquement
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const enrollmentId = params.get('enrollment')
    
    if (enrollmentId && enrollments.length > 0) {
      const enrollment = enrollments.find(e => e._id === enrollmentId)
      if (enrollment) {
        // Fermer tous les autres modals/vues
        setShowForm(false)
        setShowVirtualProfiles(false)
        setShowNotesBoard(false)
        setShowStatusView(null)
        
        // Ouvrir le dashboard de l'étudiant
        setSelectedEnrollment(enrollment)
        
        // Nettoyer l'URL après ouverture
        setTimeout(() => {
          window.history.replaceState({}, '', '/')
        }, 100)
      }
    }
  }, [enrollments, window.location.search])

  // Filtrage des étudiants (excluant les profils virtuels)
  const realEnrollments = useMemo(() => {
    return enrollments.filter(e => !e.isVirtualProfile)
  }, [enrollments])

  const pendingEnrollments = useMemo(() => {
    return realEnrollments.filter(e => e.status === "en_attente")
  }, [realEnrollments])

  const activeEnrollments = useMemo(() => {
    return realEnrollments.filter(e => e.status === "actif")
  }, [realEnrollments])

  const closedEnrollments = useMemo(() => {
    return realEnrollments.filter(e => e.status === "ferme")
  }, [realEnrollments])

  const refusedEnrollments = useMemo(() => {
    return realEnrollments.filter(e => e.status === "refuse")
  }, [realEnrollments])

  // Notes sans suivi
  const notesWithoutTracking = useMemo(() => {
    return (allNotes || []).filter((note: any) => 
      (!note.enrollmentId || note.enrollmentId === "global") && 
      note.status !== "supprime" && 
      note.status !== "ferme"
    )
  }, [allNotes])

  // Profils virtuels
  const virtualProfiles = useMemo(() => {
    return enrollments.filter(e => e.isVirtualProfile === true)
  }, [enrollments])

  // Profils virtuels filtrés par statut et triés
  const filteredVirtualProfiles = useMemo(() => {
    // Filtre par statut (actif ou fermé uniquement)
    let filtered = virtualProfiles.filter(v => v.status === virtualFilter)
    
    // Filtre par dates
    if (dateFilterStart || dateFilterEnd) {
      filtered = filtered.filter(v => {
        const entreeDate = v.dateEntree ? new Date(v.dateEntree) : null
        if (!entreeDate) return false
        
        if (dateFilterStart && dateFilterEnd) {
          const start = new Date(dateFilterStart)
          const end = new Date(dateFilterEnd)
          return entreeDate >= start && entreeDate <= end
        } else if (dateFilterStart) {
          return entreeDate >= new Date(dateFilterStart)
        } else if (dateFilterEnd) {
          return entreeDate <= new Date(dateFilterEnd)
        }
        return true
      })
    }
    
    // Tri automatique : Date d'entrée puis Programme
    return filtered.sort((a, b) => {
      // Tri par date d'entrée d'abord
      const dateA = a.dateEntree ? new Date(a.dateEntree).getTime() : 0
      const dateB = b.dateEntree ? new Date(b.dateEntree).getTime() : 0
      if (dateA !== dateB) return dateB - dateA // Plus récent en premier
      
      // Si dates égales, tri par programme
      const progA = (a.programme || "").toLowerCase()
      const progB = (b.programme || "").toLowerCase()
      return progA.localeCompare(progB)
    })
  }, [virtualProfiles, virtualFilter, dateFilterStart, dateFilterEnd])

  // Statistiques
  const statsCards = [
    { id: "en_attente", label: "En attente", count: pendingEnrollments.length, icon: "⏳", color: "bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-300" },
    { id: "actif", label: "Actifs", count: activeEnrollments.length, icon: "✓", color: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-300" },
    { id: "ferme", label: "Fermés", count: closedEnrollments.length, icon: "📁", color: "bg-gray-100", textColor: "text-gray-800", borderColor: "border-gray-300" },
    { id: "virtuels", label: "Étudiants Virtuels", count: virtualProfiles.length, icon: "👤", color: "bg-blue-100", textColor: "text-blue-800", borderColor: "border-blue-300" },
    { id: "notes", label: "Notes", count: notesWithoutTracking.length, icon: "📝", color: "bg-orange-100", textColor: "text-orange-800", borderColor: "border-orange-300" },
    { id: "stats", label: "Statistiques", count: activeEnrollments.length + closedEnrollments.length, icon: "📊", color: "bg-purple-100", textColor: "text-purple-800", borderColor: "border-purple-300" }
  ]

  // Extraire les programmes uniques
  const uniqueProgrammes = useMemo(() => {
    const programmes = realEnrollments.map(e => e.programme).filter(p => p && p.trim())
    return Array.from(new Set(programmes)).sort()
  }, [realEnrollments])

  // Filtrage par recherche et statut
  const filteredEnrollments = useMemo(() => {
    let filtered = realEnrollments

    // Filtre par statut
    if (activeFilter === "en_attente") filtered = pendingEnrollments
    else if (activeFilter === "actif") filtered = activeEnrollments
    else if (activeFilter === "ferme") filtered = closedEnrollments
    else if (activeFilter === "refuse") filtered = refusedEnrollments

    // Filtre par programme (pour TOUS les statuts)
    if (programmeFilter !== "tous") {
      filtered = filtered.filter(e => e.programme === programmeFilter)
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => {
        const fullName = `${e.prenom || ""} ${e.nom || ""}`.toLowerCase()
        const ville = (e.ville || "").toLowerCase()
        const ecole = (e.ecoleReferente || "").toLowerCase()
        const programme = (e.programme || "").toLowerCase()
        return fullName.includes(query) || ville.includes(query) || ecole.includes(query) || programme.includes(query)
      })
    }

    // Tri par statut pour regrouper les étudiants avec le même statut ensemble
    // Ordre de priorité: en_attente > actif > ferme > refuse
    const statusOrder = { en_attente: 1, actif: 2, ferme: 3, refuse: 4 }
    return filtered.sort((a, b) => {
      const orderA = statusOrder[a.status as keyof typeof statusOrder] || 999
      const orderB = statusOrder[b.status as keyof typeof statusOrder] || 999
      if (orderA !== orderB) return orderA - orderB
      // Si même statut, trier par date d'entrée (plus récent en premier)
      const dateA = a.dateEntree ? new Date(a.dateEntree).getTime() : 0
      const dateB = b.dateEntree ? new Date(b.dateEntree).getTime() : 0
      return dateB - dateA
    })
  }, [realEnrollments, activeFilter, searchQuery, pendingEnrollments, activeEnrollments, closedEnrollments, refusedEnrollments, programmeFilter])

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet étudiant ?")) return
    
    try {
      await deleteEnrollment(id)
      toast.success("Étudiant supprimé avec succès")
    } catch (error) {
      console.error("Erreur suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error("Aucun étudiant sélectionné")
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} étudiant(s) ?`)) return

    const loadingToast = toast.loading(`Suppression de ${selectedIds.length} étudiant(s)...`)
    
    try {
      let successCount = 0
      for (const id of selectedIds) {
        try {
          await deleteEnrollment(id)
          successCount++
        } catch (error) {
          console.error(`Erreur suppression ${id}:`, error)
        }
      }
      
      toast.dismiss(loadingToast)
      toast.success(`${successCount} étudiant(s) supprimé(s) avec succès`)
      setSelectedIds([])
      await refreshEnrollments()
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Erreur suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEnrollments.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredEnrollments.map(e => e._id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Génération des initiales pour avatar
  const getInitials = (prenom: string, nom: string) => {
    const p = (prenom || "").charAt(0).toUpperCase()
    const n = (nom || "").charAt(0).toUpperCase()
    return p + n || "?"
  }

  // Couleur de fond avatar selon statut
  const getAvatarColor = (status: string) => {
    switch (status) {
      case "actif": return "bg-green-500"
      case "ferme": return "bg-gray-500"
      case "en_attente": return "bg-yellow-500"
      case "refuse": return "bg-red-500"
      default: return "bg-blue-500"
    }
  }

  const handleGenerateVirtualProfiles = async () => {
    const loadingToast = toast.loading("Génération de 10 profils virtuels avec notes...")
    
    try {
      const villes = ["Candiac", "Châteauguay", "La Prairie", "Mercier", "St-Constant", "St-Rémi", "Ste-Catherine", "Delson"]
      const ecoles = ["Bonnier", "Des Timoniers", "Gabrielle-Roy", "Jacques-Leber", "Louis-Cyr", "Louis-Philippe-Paré", "Pierre-Bédard", "Fernand-Séguin", "J-L Vinet-Souligny", "J-L Des Cheminots"]
      const programmes = ["ALT", "OPTION", "PIVOT", "APOSTROPHE", "SAUTS", "Suivis Estivaux"]
      const typesIntervention = [
        "Rencontre individuelle",
        "Intervention de crise",
        "Suivi académique",
        "Médiation familiale",
        "Atelier de groupe",
        "Évaluation comportementale",
        "Plan d'intervention",
        "Soutien émotionnel",
        "Coordination avec l'école",
        "Suivi psychosocial",
        "Rencontre collective",
        "Consultation téléphonique",
        "Accompagnement sortie",
        "Suivi disciplinaire",
        "Intervention comportementale",
        "Référence externe",
        "Rencontre parentale",
        "Évaluation psychologique",
        "Contact autres"
      ]
      const noteTemplates = [
        "L'élève démontre des progrès significatifs dans sa gestion des émotions.",
        "Besoin d'un suivi renforcé concernant l'assiduité scolaire.",
        "Excellente participation aux activités de groupe cette semaine.",
        "Situation familiale complexe nécessitant une attention particulière.",
        "Amélioration notable du comportement en classe.",
        "Difficultés persistantes en mathématiques, orientation vers du tutorat.",
        "Conflit résolu avec un pair grâce à la médiation.",
        "Parents très collaboratifs, bon partenariat école-famille.",
        "Besoin d'un plan d'action pour la gestion de l'anxiété.",
        "Retour positif des enseignants sur l'attitude de l'élève."
      ]
      
      let successCount = 0
      
      for (let i = 0; i < 10; i++) {
        const ville = villes[i % villes.length]
        const ecole = ecoles[i % ecoles.length]
        const programme = programmes[i % programmes.length]
        
        const virtualData = {
          titre: `Groupe ${String.fromCharCode(65 + i)} - ${programme} - ${ville}`,
          programme: programme,
          ecoleReferente: ecole,
          ville: ville,
          isVirtualProfile: true,
          status: "actif",
          prenom: "",
          nom: "",
          age: 0,
          genre: "",
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
          motifReference: "Profil virtuel de test",
          motivationsAdolescent: ""
        }
        
        try {
          const createdProfile = await lumi.entities.enrollments.create(virtualData)
          successCount++
          
          // Créer 1-5 notes pour ce profil virtuel avec interventions aléatoires
          const noteCount = 1 + Math.floor(Math.random() * 5)
          
          // Les 19 types d'intervention disponibles dans le schéma
          const interventionFields = [
            'rencontreJeune', 'contactJeune', 'rencontreParent', 'contactParent',
            'rencontreScolaire', 'contactScolaire', 'rencontreAutre', 'contactAutre',
            'nombreAutre', 'organismeCommunautaire', 'protectionJeunesse', 'cisssmo',
            'ecoleAuxAdultes', 'milieuStage', 'policierPreventionniste', 'ressourcePsychologique'
          ]
          
          for (let j = 0; j < noteCount; j++) {
            const daysAgo = Math.floor(Math.random() * 30)
            const noteDate = new Date()
            noteDate.setDate(noteDate.getDate() - daysAgo)
            
            // Sélectionner aléatoirement 1 à 5 types d'intervention parmi les 16 disponibles
            const numInterventions = 1 + Math.floor(Math.random() * 5)
            const selectedInterventions = [...interventionFields]
              .sort(() => Math.random() - 0.5)
              .slice(0, Math.min(numInterventions, interventionFields.length))
            
            // Construire l'objet note avec les compteurs d'intervention
            const interventionCounters: any = {}
            const interventionLabels: string[] = []
            
            selectedInterventions.forEach(field => {
              // Nombre aléatoire entre 1 et 3 pour chaque intervention
              const count = 1 + Math.floor(Math.random() * 3)
              interventionCounters[field] = count
              interventionLabels.push(`${field}: ${count}`)
            })
            
            const noteData = {
              enrollmentId: createdProfile._id,
              titre: `Note ${j + 1}`,
              contenu: `${noteTemplates[j % noteTemplates.length]}\n\nInterventions: ${interventionLabels.join(', ')}`,
              counters: interventionCounters,
              suivi: true,
              status: "actif",
              dateCreation: noteDate.toISOString(),
              auteurNom: "Système",
              creator: "system",
              createdAt: noteDate.toISOString(),
              updatedAt: noteDate.toISOString()
            }
            
            try {
              await lumi.entities.notes.create(noteData)
            } catch (error) {
              console.error(`Erreur création note ${j + 1} pour profil ${i + 1}:`, error)
            }
            
            await new Promise(resolve => setTimeout(resolve, 50))
          }
          
        } catch (error) {
          console.error(`Erreur création profil ${i + 1}:`, error)
        }
        
        if (i < 9) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      toast.dismiss(loadingToast)
      toast.success(`${successCount} profils virtuels créés avec notes !`)
      await refreshEnrollments()
      await fetchAllNotes()
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Erreur:", error)
      toast.error("Erreur lors de la génération des profils")
    }
  }

  const handleGenerateTestStudents = async () => {
    const loadingToast = toast.loading("Génération de 25 étudiants actifs...")
    
    try {
      const noms = ["Tremblay", "Gagnon", "Roy", "Cote", "Bouchard", "Jean-Baptiste", "Diallo", "El Amrani", "Nguyen", "Singh", "Martinez", "Chen", "Mohammed", "Silva", "Dubois", "Patel", "Kim", "Santos", "Ali", "Lopez"]
      const prenoms = ["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Avery", "Riley", "Jamie", "Chris", "Pat", "Skyler", "Dakota", "Sage", "River", "Phoenix", "Quinn", "Reese", "Drew", "Kendall"]
      const villes = ["Candiac", "Châteauguay", "La Prairie", "Mercier", "Napierville", "Sherrington", "St-Bernard de Lacolle", "St-Constant", "St-Isidore", "St-Michel", "St-Philippe", "St-Rémi", "Ste-Catherine", "Ste-Clotilde", "St-Mathieu", "St-Édouard", "Hemmingford", "Léry", "Delson"]
      const ecoles = ["Bonnier", "Des Timoniers", "Gabrielle-Roy", "Jacques-Leber", "Marguerite-Bourgeois", "Louis-Cyr", "St-François-Xavier", "Louis-Philippe-Paré", "De La Magdeleine", "Du Tournant", "Pierre-Bédard", "Fernand-Séguin", "Hors Territoire", "École aux adultes", "J-L Vinet-Souligny", "J-L Des Cheminots", "J-L Félix-Leclerc", "J-L Piché-Dufrost", "J-L Aquarelle-Armand-Frappier"]
      const programmes = ["ALT", "OPTION", "PIVOT", "APOSTROPHE", "SAUTS", "Suivis Estivaux"]
      const degres = ["6e Année", "Secondaire 1", "Secondaire 2", "Secondaire 3", "Secondaire 4", "Secondaire 5", "FPT", "FMS", "GADP", "GADSP", "PEP"]
      const origines = ["Canadienne", "Asiatique occidental", "Asiatique du Sud-Est", "Europe de l'est/l'ouest", "Sud-Asiatique", "Latino-Américaine", "Arabe", "Africaine", "Haïtienne", "Chinoise", "Autochtone"]
      const genres = ["Masculin", "Féminin", "Autres"]
      const demeurAvecOptions = ["Mère", "Père", "Les deux parents", "Garde partagée", "Beaux-parents de la mère", "Beaux-parents du père", "Tante", "Oncle", "Oncle et tante (couple)", "Grands-oncles et grandes tantes", "Grands-parents (maternels)", "Grands-parents (paternels)", "Arrière-grands-parents", "Frères et/ou Sœurs (majeurs)", "Demi-frères et/ou Demi-sœurs", "Beaux-frères et/ou Belles-sœurs", "Cousins et/ou cousines", "Tuteur et/ou Tutrice", "En résidence", "Foyer de groupe", "Famille d'accueil", "Un ou une Ami(e)"]
      
      let successCount = 0
      
      for (let i = 0; i < 25; i++) {
        const age = 9 + Math.floor(Math.random() * 9)
        const year = 2025 - age
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
        
        const entreeStartDate = new Date("2024-04-01")
        const entreeEndDate = new Date("2025-03-31")
        const randomTime = entreeStartDate.getTime() + Math.random() * (entreeEndDate.getTime() - entreeStartDate.getTime())
        const randomDate = new Date(randomTime)
        const entreeYear = String(randomDate.getFullYear())
        const entreeMonth = String(randomDate.getMonth() + 1).padStart(2, "0")
        const entreeDay = String(randomDate.getDate()).padStart(2, "0")
        
        const finYear = String(Number(entreeYear) + 1)
        
        const studentData = {
          nom: noms[i % noms.length],
          prenom: prenoms[i % prenoms.length],
          dateNaissance: `${year}-${month}-${day}T00:00:00.000Z`,
          age: age,
          origine: origines[i % origines.length],
          genre: genres[i % genres.length],
          degreScolaire: degres[i % degres.length],
          adresse: `${100 + i} Rue Principale`,
          codePostal: `H${Math.floor(Math.random() * 9) + 1}A ${Math.floor(Math.random() * 9) + 1}B${Math.floor(Math.random() * 9) + 1}`,
          ville: villes[i % villes.length],
          demeurAvec: demeurAvecOptions[i % demeurAvecOptions.length],
          parent1Type: i % 2 === 0 ? "Mere" : "Pere",
          parent1Nom: noms[(i + 5) % noms.length],
          parent1Prenom: i % 2 === 0 ? "Marie" : "Jean",
          parent1Tel: `514-555-${String(1000 + i).padStart(4, "0")}`,
          parent1Email: `parent${i + 1}@email.com`,
          contactUrgence: `Contact Urgence ${i + 1}`,
          contactUrgenceTel: `438-555-${String(2000 + i).padStart(4, "0")}`,
          contactUrgenceLien: i % 3 === 0 ? "Tante" : i % 3 === 1 ? "Oncle" : "Grand-parent",
          epipen: Math.random() < 0.1 ? "oui" : "non",
          ecoleReferente: ecoles[i % ecoles.length],
          intervenantNom: `Intervenant ${i + 1}`,
          intervenantTitre: i % 3 === 0 ? "TES" : i % 3 === 1 ? "Psychologue" : "Travailleur social",
          intervenantPoste: String(1000 + i),
          intervenantEmail: `intervenant${i + 1}@ecole.com`,
          directionNom: `Direction ${(i % 5) + 1}`,
          directionEmail: `direction${(i % 5) + 1}@ecole.com`,
          programme: programmes[i % programmes.length],
          dateEntree: `${entreeYear}-${entreeMonth}-${entreeDay}T00:00:00.000Z`,
          dateFin: `${finYear}-${entreeMonth}-${entreeDay}T00:00:00.000Z`,
          apresSejourPlan: i % 4 === 0 ? "Changement d'école" : i % 4 === 1 ? "Changement de programme" : i % 4 === 2 ? "Réintégration" : "À évaluer",
          motifReference: `Motif reference etudiant ${i + 1}`,
          motivationsAdolescent: `Motivations adolescent ${i + 1}`,
          status: "actif"
        }
        
        try {
          await lumi.entities.enrollments.create(studentData)
          successCount++
        } catch (error) {
          console.error(`Erreur création étudiant ${i + 1}:`, error)
        }
        
        // Petite pause entre chaque création
        if (i < 24) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      toast.dismiss(loadingToast)
      toast.success(`${successCount} étudiants créés avec succès !`)
      await refreshEnrollments()
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Erreur:", error)
      toast.error("Erreur lors de la génération des étudiants")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error}</p>
      </div>
    )
  }

  console.log("🚦 States:", { selectedEnrollment: !!selectedEnrollment, showForm, showNotesBoard, showVirtualProfiles, showStatusView })
  console.log("🔬 VRAIE valeur de selectedEnrollment:", selectedEnrollment)

  if (showForm) {
    console.log("❌ Bloqué par showForm")
    return (
      <EnrollmentForm
        onClose={() => {
          setShowForm(false)
          setEditingEnrollment(null)
        }}
        onSuccess={() => {
          refreshEnrollments()
          setShowForm(false)
          setEditingEnrollment(null)
        }}
        editingEnrollment={editingEnrollment}
      />
    )
  }

  if (showNotesBoard) {
    console.log("❌ Bloqué par showNotesBoard")
    return (
      <StickyNotesBoard
        notes={allNotes || []}
        enrollments={enrollments}
        onBack={() => {
          setShowNotesBoard(false)
          setSelectedEnrollment(null)
        }}
        onRefresh={fetchAllNotes}
      />
    )
  }

  // Vue des étudiants virtuels
  if (showVirtualProfiles) {
    console.log("❌ Bloqué par showVirtualProfiles")
    const activeVirtuals = virtualProfiles.filter(v => v.status === "actif")
    const closedVirtuals = virtualProfiles.filter(v => v.status === "ferme")

    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowVirtualProfiles(false)
                setSelectedEnrollment(null)
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all font-semibold">
              ← Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-900">👤 Étudiants Virtuels</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateVirtualProfiles}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium shadow-lg">
              🎲 Générer profils test
            </button>
            <button
              onClick={() => setShowCreateVirtualModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium shadow-lg">
              + Nouvel étudiant virtuel
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Êtes-vous sûr de vouloir supprimer TOUS les ${virtualProfiles.length} profils virtuels ?`)) return
                
                const loadingToast = toast.loading(`Suppression de ${virtualProfiles.length} profils virtuels...`)
                
                try {
                  let successCount = 0
                  for (const profile of virtualProfiles) {
                    try {
                      await deleteEnrollment(profile._id)
                      successCount++
                    } catch (error) {
                      console.error(`Erreur suppression profil ${profile._id}:`, error)
                    }
                  }
                  
                  toast.dismiss(loadingToast)
                  toast.success(`${successCount} profils virtuels supprimés avec succès`)
                  await refreshEnrollments()
                } catch (error) {
                  toast.dismiss(loadingToast)
                  console.error("Erreur:", error)
                  toast.error("Erreur lors de la suppression")
                }
              }}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors font-medium shadow-lg">
              🗑️ Vider tout
            </button>
          </div>
        </div>

        {/* Filtres Statut */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <div className="flex bg-white rounded-lg shadow-md overflow-hidden border border-gray-300">
            <button
              onClick={() => setVirtualFilter("actif")}
              className={`px-6 py-3 font-bold transition-all ${
                virtualFilter === "actif" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}>
              ✅ Actifs
            </button>
            <button
              onClick={() => setVirtualFilter("ferme")}
              className={`px-6 py-3 font-bold transition-all ${
                virtualFilter === "ferme" ? "bg-orange-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}>
              📁 Fermés
            </button>
          </div>
        </div>

        {/* Liste des profils virtuels */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Liste des profils virtuels
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({virtualFilter === "actif" ? "Actifs" : "Fermés"})
            </span>
          </h2>
          
          {filteredVirtualProfiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-xl text-gray-500 font-medium">
                {virtualFilter === "actif" ? "Aucun étudiant virtuel actif" : "Aucun étudiant virtuel fermé"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVirtualProfiles.map((profile) => (
                <div
                  key={profile._id}
                  className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setShowVirtualProfiles(false)
                    setShowForm(false)
                    setShowNotesBoard(false)
                    setShowStatusView(null)
                    setSelectedEnrollment(profile)
                  }}>
                  <div className="flex items-start gap-4">
                    <div className={`${profile.status === "actif" ? "bg-green-500" : "bg-gray-500"} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl`}>
                      👤
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{profile.titre || "Profil virtuel"}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {profile.programme && <div>📚 {profile.programme}</div>}
                        {profile.ecoleReferente && <div>🏫 {profile.ecoleReferente}</div>}
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            profile.status === "actif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {profile.status === "actif" ? "✓ Actif" : "📁 Fermé"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de création d'étudiant virtuel */}
        {showCreateVirtualModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Créer un nouvel étudiant virtuel</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newVirtualTitle}
                    onChange={(e) => setNewVirtualTitle(e.target.value)}
                    placeholder="Ex: Groupe A - Mathématiques"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programme <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newVirtualProgramme}
                    onChange={(e) => setNewVirtualProgramme(e.target.value)}
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
                    value={newVirtualSchool}
                    onChange={(e) => setNewVirtualSchool(e.target.value)}
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
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateVirtualModal(false)
                    setNewVirtualTitle("")
                    setNewVirtualProgramme("")
                    setNewVirtualSchool("")
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (!newVirtualTitle.trim() || !newVirtualProgramme || !newVirtualSchool) {
                      toast.error("Veuillez remplir tous les champs obligatoires")
                      return
                    }

                    try {
                      await createEnrollment({
                        titre: newVirtualTitle,
                        programme: newVirtualProgramme,
                        ecoleReferente: newVirtualSchool,
                        isVirtualProfile: true,
                        status: "actif",
                        prenom: "",
                        nom: "",
                        age: 0,
                        genre: "",
                        ville: "",
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
                        motivationsAdolescent: ""
                      } as any)
                      toast.success("Étudiant virtuel créé avec succès")
                      setShowCreateVirtualModal(false)
                      setNewVirtualTitle("")
                      setNewVirtualProgramme("")
                      setNewVirtualSchool("")
                    } catch (error) {
                      console.error("Erreur création profil virtuel:", error)
                      toast.error("Erreur lors de la création")
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium">
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Vue dédiée par statut
  if (showStatusView) {
    const statusData = {
      en_attente: { title: "Étudiants en Attente", list: pendingEnrollments, icon: "⏳", color: "yellow" },
      actif: { title: "Étudiants Actifs", list: activeEnrollments, icon: "✓", color: "green" },
      ferme: { title: "Dossiers Fermés", list: closedEnrollments, icon: "📁", color: "gray" }
    }[showStatusView]

    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowStatusView(null)
                setSelectedEnrollment(null)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              <span>←</span>
              <span>Retour</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              <span className="mr-3">{statusData.icon}</span>
              {statusData.title}
            </h1>
          </div>
          <div className="text-lg font-semibold text-gray-600">
            {statusData.list.length} étudiant{statusData.list.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Barre de recherche et filtre programme */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, prénom, ville, école ou programme..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filtre de programme */}
          {uniqueProgrammes.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par programme :
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setProgrammeFilter("tous")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    programmeFilter === "tous"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}>
                  📚 Tous
                </button>
                {uniqueProgrammes.map(prog => (
                  <button
                    key={prog}
                    onClick={() => setProgrammeFilter(prog)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      programmeFilter === prog
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}>
                    {prog}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Liste des étudiants */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusData.list
            .filter(e => {
              // Filtre par programme
              if (programmeFilter !== "tous" && e.programme !== programmeFilter) return false
              
              // Filtre par recherche
              if (!searchQuery.trim()) return true
              const query = searchQuery.toLowerCase()
              const fullName = `${e.prenom || ""} ${e.nom || ""}`.toLowerCase()
              const ville = (e.ville || "").toLowerCase()
              const ecole = (e.ecoleReferente || "").toLowerCase()
              const programme = (e.programme || "").toLowerCase()
              return fullName.includes(query) || ville.includes(query) || ecole.includes(query) || programme.includes(query)
            })
            .map((enrollment) => (
              <div
                key={enrollment._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => {
                  setShowStatusView(null)
                  setShowForm(false)
                  setShowNotesBoard(false)
                  setShowVirtualProfiles(false)
                  setSelectedEnrollment(enrollment)
                }}>
                <div className="flex items-start gap-4">
                  <div className={`${getAvatarColor(enrollment.status)} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                    {getInitials(enrollment.prenom, enrollment.nom)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {enrollment.prenom} {enrollment.nom}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>👤 {enrollment.age} ans • {enrollment.genre}</div>
                      {enrollment.ville && <div>{enrollment.ville}</div>}
                      {enrollment.programme && <div>📚 {enrollment.programme}</div>}
                      {enrollment.ecoleReferente && <div>🏫 {enrollment.ecoleReferente}</div>}
                      {enrollment.dateEntree && (
                        <div>📅 {formatDate(enrollment.dateEntree)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {statusData.list.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="text-6xl mb-4">{statusData.icon}</div>
            <p className="text-xl text-gray-500 font-medium">Aucun étudiant {showStatusView === 'en_attente' ? 'en attente' : showStatusView === 'actif' ? 'actif' : 'fermé'}</p>
          </div>
        )}
      </div>
    )
  }

  // Vue Statistiques
  if (showStats) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Header uniforme sans contour */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setShowStats(false)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <span>←</span>
            <span>Retour</span>
          </button>
          <span className="text-2xl">📊</span>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        </div>

        {/* Contenu des statistiques */}
        <StatsSamplePage onNavigate={() => setShowStats(false)} />
      </div>
    )
  }

  if (selectedEnrollment) {
    console.log("❌ Bloqué par selectedEnrollment, valeur =", selectedEnrollment)
    return (
      <EnrollmentDetails 
        enrollmentId={selectedEnrollment._id}
        onBack={() => {
          setSelectedEnrollment(null)
          if (selectedEnrollment.isVirtualProfile) {
            setShowVirtualProfiles(true)
          }
        }}
        onUpdate={refreshEnrollments}
        onDelete={async () => {
          await refreshEnrollments()
          setSelectedEnrollment(null)
          if (selectedEnrollment.isVirtualProfile) {
            setShowVirtualProfiles(true)
          }
        }}
        onTransferClick={onInitiateTransfer ? () => {
          onInitiateTransfer(selectedEnrollment)
        } : undefined}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord des étudiants</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg">
            + Nouvelle étudiant
          </button>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          {statsCards.map((card) => (
            <button
              key={card.id}
              onClick={(e) => {
                e.stopPropagation() // EMPÊCHER LA PROPAGATION DU CLIC!
                console.log("🔍 Carte cliquée:", card.id)
                // RESET TOUS LES AUTRES STATES D'ABORD!
                setSelectedEnrollment(null)
                setShowForm(false)
                setShowNotesBoard(false)
                setShowVirtualProfiles(false)
                setShowStatusView(null) // RESET showStatusView aussi!
                
                if (card.id === "notes") {
                  setShowNotesBoard(true)
                } else if (card.id === "stats") {
                  setShowStats(true)
                } else if (card.id === "virtuels") {
                  setShowVirtualProfiles(true)
                } else if (card.id === "en_attente" || card.id === "actif" || card.id === "ferme") {
                  console.log("✅ Activation showStatusView:", card.id)
                  setShowStatusView(card.id as any)
                }
              }}
              className={`${card.color} ${card.borderColor} border-2 rounded-lg p-3 hover:shadow-lg transition-all cursor-pointer text-left`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{card.icon}</span>
                <span className={`text-4xl font-bold ${card.textColor}`}>{card.count}</span>
              </div>
              <div className={`text-sm font-bold ${card.textColor} mb-1`}>{card.label}</div>
              <div className="text-xs text-gray-600">
                {card.id === "en_attente" ? "Voir la liste" : 
                 card.id === "actif" ? "Étudiants actifs" : 
                 card.id === "ferme" ? "Dossiers fermés" :
                 card.id === "virtuels" ? "Gestion des profils" :
                 card.id === "notes" ? "Notes sans suivi" :
                 card.id === "stats" ? "Rapports détaillés" : ""}
              </div>
            </button>
          ))}
        </div>

        {/* Actions de suppression */}
        {selectedIds.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗑️</span>
              <span className="text-lg font-semibold text-red-800">
                {selectedIds.length} étudiant(s) sélectionné(s)
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Annuler la sélection
              </button>
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg">
                🗑️ Supprimer la sélection
              </button>
            </div>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Recherche */}
            <div className="flex-1 w-full">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, prénom, ville, école ou programme..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtres */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveFilter("tous")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === "tous"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}>
                📋 Tous
              </button>
              <button
                onClick={() => setActiveFilter("en_attente")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === "en_attente"
                    ? "bg-yellow-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}>
                ⏳ En Attente
              </button>
              <button
                onClick={() => setActiveFilter("actif")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === "actif"
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}>
                ✓ Actif
              </button>
              <button
                onClick={() => setActiveFilter("ferme")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === "ferme"
                    ? "bg-gray-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}>
                📁 Fermé
              </button>
              <button
                onClick={() => setActiveFilter("refuse")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === "refuse"
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}>
                ✗ Refusé
              </button>
            </div>
          </div>

          {/* Filtre de programme (affiché pour tous les statuts) */}
          {uniqueProgrammes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par programme :
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setProgrammeFilter("tous")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    programmeFilter === "tous"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}>
                  📚 Tous
                </button>
                {uniqueProgrammes.map(prog => (
                  <button
                    key={prog}
                    onClick={() => setProgrammeFilter(prog)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      programmeFilter === prog
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}>
                    {prog}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tableau des étudiants */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 cursor-pointer"
                      checked={filteredEnrollments.length > 0 && selectedIds.length === filteredEnrollments.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ÉLÈVE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PROGRAMME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ÉCOLE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATE D'ENTRÉE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 cursor-pointer"
                        checked={selectedIds.includes(enrollment._id)}
                        onChange={() => toggleSelect(enrollment._id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`${getAvatarColor(enrollment.status)} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {getInitials(enrollment.prenom, enrollment.nom)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.prenom} {enrollment.nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {enrollment.age} ans • {enrollment.ville || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{enrollment.programme || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{enrollment.ecoleReferente || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {enrollment.dateEntree ? formatDate(enrollment.dateEntree) : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          enrollment.status === "actif"
                            ? "bg-green-100 text-green-800"
                            : enrollment.status === "ferme"
                            ? "bg-gray-100 text-gray-800"
                            : enrollment.status === "en_attente"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {enrollment.status === "actif" ? "✓ Actif" :
                         enrollment.status === "ferme" ? "Fermé" :
                         enrollment.status === "en_attente" ? "En attente" :
                         "Refusé"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedEnrollment(enrollment)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium">
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEnrollments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl text-gray-500 font-medium">Aucun étudiant trouvé</p>
              <p className="text-sm text-gray-400 mt-2">Essayez de modifier vos filtres ou votre recherche</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}