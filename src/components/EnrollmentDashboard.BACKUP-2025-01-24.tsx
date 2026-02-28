import React, { useState, useMemo } from "react"
import { useEnrollments } from "../hooks/useEnrollments"
import { useAllNotes } from "../hooks/useAllNotes"
import { EnrollmentDetails } from "./EnrollmentDetails"
import { EnrollmentForm } from "./EnrollmentForm"
import { StickyNotesBoard } from "./StickyNotesBoard"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"
import { formatDate } from "../utils/dateFormat"

interface EnrollmentDashboardProps {
  openFormTrigger?: boolean
  onFormOpenComplete?: () => void
  onShowTransferPreview?: (virtualProfile: any, targetStudent: any) => void
}

export function EnrollmentDashboard({ openFormTrigger, onFormOpenComplete }: EnrollmentDashboardProps) {
  const { enrollments, loading, error, refreshEnrollments } = useEnrollments()
  const { allNotes, refreshAllNotes } = useAllNotes()
  
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null)
  const [activeFilter, setActiveFilter] = useState<"tous" | "en_attente" | "actif" | "ferme" | "refuse">("tous")
  const [searchQuery, setSearchQuery] = useState("")
  const [showVirtualProfiles, setShowVirtualProfiles] = useState(false)
  const [showNotesBoard, setShowNotesBoard] = useState(false)
  const [showStatusView, setShowStatusView] = useState<"en_attente" | "actif" | "ferme" | null>(null)
  const [showCreateVirtualModal, setShowCreateVirtualModal] = useState(false)
  const [newVirtualTitle, setNewVirtualTitle] = useState("")
  const [newVirtualProgramme, setNewVirtualProgramme] = useState("")
  const [newVirtualSchool, setNewVirtualSchool] = useState("")

  React.useEffect(() => {
    if (openFormTrigger) {
      setShowForm(true)
      onFormOpenComplete?.()
    }
  }, [openFormTrigger, onFormOpenComplete])

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
    return (allNotes || []).filter((note: any) => !note.enrollmentId || note.enrollmentId === "global")
  }, [allNotes])

  // Profils virtuels
  const virtualProfiles = useMemo(() => {
    return enrollments.filter(e => e.isVirtualProfile === true)
  }, [enrollments])

  // Statistiques
  const statsCards = [
    { id: "en_attente", label: "En attente", count: pendingEnrollments.length, icon: "⏳", color: "bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-300" },
    { id: "actif", label: "Actifs", count: activeEnrollments.length, icon: "✓", color: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-300" },
    { id: "ferme", label: "Fermés", count: closedEnrollments.length, icon: "📁", color: "bg-gray-100", textColor: "text-gray-800", borderColor: "border-gray-300" },
    { id: "virtuels", label: "Étudiants Virtuels", count: virtualProfiles.length, icon: "👤", color: "bg-blue-100", textColor: "text-blue-800", borderColor: "border-blue-300" },
    { id: "notes", label: "Notes", count: notesWithoutTracking.length, icon: "📝", color: "bg-orange-100", textColor: "text-orange-800", borderColor: "border-orange-300" },
    { id: "stats", label: "Statistiques", count: realEnrollments.length, icon: "📊", color: "bg-purple-100", textColor: "text-purple-800", borderColor: "border-purple-300" }
  ]

  // Filtrage par recherche et statut
  const filteredEnrollments = useMemo(() => {
    let filtered = realEnrollments

    // Filtre par statut
    if (activeFilter === "en_attente") filtered = pendingEnrollments
    else if (activeFilter === "actif") filtered = activeEnrollments
    else if (activeFilter === "ferme") filtered = closedEnrollments
    else if (activeFilter === "refuse") filtered = refusedEnrollments

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => {
        const fullName = `${e.prenom || ""} ${e.nom || ""}`.toLowerCase()
        const ville = (e.ville || "").toLowerCase()
        const ecole = (e.ecoleReferente || "").toLowerCase()
        return fullName.includes(query) || ville.includes(query) || ecole.includes(query)
      })
    }

    return filtered
  }, [realEnrollments, activeFilter, searchQuery, pendingEnrollments, activeEnrollments, closedEnrollments, refusedEnrollments])

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet étudiant ?")) return
    
    try {
      await lumi.entities.enrollments.delete(id)
      toast.success("Étudiant supprimé avec succès")
      refreshEnrollments()
    } catch (error) {
      console.error("Erreur suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
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

  if (selectedEnrollment) {
    return (
      <EnrollmentDetails 
        enrollment={selectedEnrollment}
        onBack={() => setSelectedEnrollment(null)}
        onUpdate={refreshEnrollments}
      />
    )
  }

  if (showForm) {
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
    return (
      <StickyNotesBoard
        notes={allNotes}
        enrollments={enrollments}
        onBack={() => setShowNotesBoard(false)}
        onRefresh={refreshAllNotes}
      />
    )
  }

  // Vue des étudiants virtuels
  if (showVirtualProfiles) {
    const activeVirtuals = virtualProfiles.filter(v => v.status === "actif")
    const closedVirtuals = virtualProfiles.filter(v => v.status === "ferme")

    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVirtualProfiles(false)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              <span>←</span>
              <span>Retour</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              <span className="mr-3">👤</span>
              Étudiants Virtuels
            </h1>
          </div>
          <button
            onClick={() => setShowCreateVirtualModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium shadow-lg">
            + Nouvel étudiant virtuel
          </button>
        </div>

        {/* Cartes de filtrage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">✓</span>
              <span className="text-3xl font-bold text-green-800">{activeVirtuals.length}</span>
            </div>
            <div className="text-sm font-medium text-green-800">Actifs</div>
          </div>
          
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">📁</span>
              <span className="text-3xl font-bold text-gray-800">{closedVirtuals.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-800">Fermés</div>
          </div>
          
          <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">👥</span>
              <span className="text-3xl font-bold text-blue-800">{virtualProfiles.length}</span>
            </div>
            <div className="text-sm font-medium text-blue-800">Tous</div>
          </div>
        </div>

        {/* Liste des profils virtuels */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Liste des profils virtuels</h2>
          
          {virtualProfiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-xl text-gray-500 font-medium">Aucun étudiant virtuel</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {virtualProfiles.map((profile) => (
                <div
                  key={profile._id}
                  className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedEnrollment(profile)}>
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
                    <option value="">Sélectionner un programme</option>
                    <option value="Aide aux devoirs">Aide aux devoirs</option>
                    <option value="Intervention psychosociale">Intervention psychosociale</option>
                    <option value="Soutien alimentaire">Soutien alimentaire</option>
                    <option value="Activités parascolaires">Activités parascolaires</option>
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
                    <option value="">Sélectionner une école</option>
                    <option value="École primaire Saint-Joseph">École primaire Saint-Joseph</option>
                    <option value="École secondaire Jean-Jacques-Rousseau">École secondaire Jean-Jacques-Rousseau</option>
                    <option value="École internationale de Montréal">École internationale de Montréal</option>
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
                      await lumi.entities.enrollments.create({
                        titre: newVirtualTitle,
                        programme: newVirtualProgramme,
                        ecoleReferente: newVirtualSchool,
                        isVirtualProfile: true,
                        status: "actif",
                        prenom: "",
                        nom: "",
                        age: 0,
                        genre: "",
                        ville: ""
                      })
                      toast.success("Étudiant virtuel créé avec succès")
                      setShowCreateVirtualModal(false)
                      setNewVirtualTitle("")
                      setNewVirtualProgramme("")
                      setNewVirtualSchool("")
                      refreshEnrollments()
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
              onClick={() => setShowStatusView(null)}
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

        {/* Barre de recherche */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, prénom, ville ou école..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste des étudiants */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusData.list
            .filter(e => {
              if (!searchQuery.trim()) return true
              const query = searchQuery.toLowerCase()
              const fullName = `${e.prenom || ""} ${e.nom || ""}`.toLowerCase()
              const ville = (e.ville || "").toLowerCase()
              const ecole = (e.ecoleReferente || "").toLowerCase()
              return fullName.includes(query) || ville.includes(query) || ecole.includes(query)
            })
            .map((enrollment) => (
              <div
                key={enrollment._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedEnrollment(enrollment)}>
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
                      {enrollment.ville && <div>📍 {enrollment.ville}</div>}
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Tableau de bord des étudiants</h1>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {statsCards.map((card) => (
            <button
              key={card.id}
              onClick={() => {
                if (card.id === "notes") {
                  setShowNotesBoard(true)
                } else if (card.id === "stats") {
                  window.location.href = "/statistiques-demo"
                } else if (card.id === "virtuels") {
                  setShowVirtualProfiles(true)
                } else if (card.id === "en_attente" || card.id === "actif" || card.id === "ferme") {
                  setShowStatusView(card.id as any)
                }
              }}
              className={`${card.color} ${card.borderColor} border-2 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{card.icon}</span>
                <span className={`text-3xl font-bold ${card.textColor}`}>{card.count}</span>
              </div>
              <div className={`text-sm font-medium ${card.textColor}`}>{card.label}</div>
              {card.id !== "notes" && card.id !== "stats" && (
                <div className="text-xs text-gray-600 mt-1">
                  {card.id === "en_attente" ? "Voir la liste" : 
                   card.id === "actif" ? "Étudiants actifs" : 
                   "Dossiers fermés"}
                </div>
              )}
              {card.id === "notes" && (
                <div className="text-xs text-gray-600 mt-1">Gestion notes</div>
              )}
              {card.id === "stats" && (
                <div className="text-xs text-gray-600 mt-1">Rapports</div>
              )}
            </button>
          ))}
        </div>

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
                  placeholder="Rechercher par nom, prénom, ville ou école..."
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
        </div>

        {/* Tableau des étudiants */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input type="checkbox" className="rounded border-gray-300" />
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
                      <input type="checkbox" className="rounded border-gray-300" />
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
                            {enrollment.age} ans {enrollment.genre === "Masculin" ? "•" : "•"} {enrollment.genre === "Masculin" ? "Candiac" : enrollment.ville || "N/A"}
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
