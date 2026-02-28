import React, { useState, useMemo } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"
import { formatDate } from "../utils/dateFormat"
import ReactMarkdown from "react-markdown"
import Select from "react-select"

interface StickyNote {
  _id: string
  contenu: string
  auteurNom: string
  ecole: string
  couleur: string
  position: { x: number; y: number }
  categorie: string
  rappel?: {
    date: string
    heure: string
    type: "telephone_parent" | "telephone_eleve" | "rencontre" | "suivi" | "autre"
    description: string
  }
  checklist?: Array<{ text: string; completed: boolean }>
  createdAt: string
}

interface StickyNotesBoardProps {
  notes: any[]
  enrollments: any[]
  onBack: () => void
  onRefresh: () => void
}

export const StickyNotesBoard: React.FC<StickyNotesBoardProps> = ({ notes, enrollments, onBack, onRefresh }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("tous")
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNote, setEditingNote] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Formulaire nouvelle note
  const [newNoteData, setNewNoteData] = useState({
    contenu: "",
    auteurNom: "",
    ecole: "",
    couleur: "yellow",
    categorie: "general",
    rappelDate: "",
    rappelHeure: "",
    rappelType: "telephone_parent" as const,
    rappelDescription: "",
    hasRappel: false,
    checklist: [] as Array<{ text: string; completed: boolean }>
  })

  const [statusFilter, setStatusFilter] = useState<"actif" | "ferme" | "supprime" | "termine">("actif")

  const categories = [
    { id: "tous", label: "📋 Tous", color: "bg-gray-600" },
    { id: "principal", label: "🏠 Principal", color: "bg-green-600" },
    { id: "telephone", label: "📞 Téléphone", color: "bg-yellow-600" },
    { id: "rencontre", label: "👥 Rencontre", color: "bg-blue-600" },
    { id: "urgent", label: "⚡ Urgent", color: "bg-red-600" }
  ]

  const couleurs = [
    { id: "yellow", nom: "Jaune", bg: "bg-yellow-200", border: "border-yellow-300" },
    { id: "pink", nom: "Rose", bg: "bg-pink-200", border: "border-pink-300" },
    { id: "blue", nom: "Bleu", bg: "bg-blue-200", border: "border-blue-300" },
    { id: "green", nom: "Vert", bg: "bg-green-200", border: "border-green-300" },
    { id: "orange", nom: "Orange", bg: "bg-orange-200", border: "border-orange-300" },
    { id: "purple", nom: "Violet", bg: "bg-purple-200", border: "border-purple-300" }
  ]

  const filteredNotes = useMemo(() => {
    let filtered = (notes || [])
    
    // Filtre statut (actif, fermé, supprimé, terminé)
    if (statusFilter === "actif") {
      filtered = filtered.filter(n => !n.suivi && n.status !== "supprime" && n.status !== "ferme")
    } else if (statusFilter === "ferme") {
      filtered = filtered.filter(n => !n.suivi && n.status === "ferme")
    } else if (statusFilter === "supprime") {
      filtered = filtered.filter(n => !n.suivi && n.status === "supprime")
    } else if (statusFilter === "termine") {
      filtered = filtered.filter(n => n.suivi === true)
    }
    
    // Filtre catégorie
    if (selectedCategory !== "tous") {
      filtered = filtered.filter(n => n.categorie === selectedCategory)
    }
    
    // Filtre recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n => 
        n.contenu?.toLowerCase().includes(query) ||
        n.auteurNom?.toLowerCase().includes(query) ||
        n.ecole?.toLowerCase().includes(query) ||
        n.rappel?.description?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [notes, selectedCategory, searchQuery, statusFilter])

  const handleCreateNote = async () => {
    if (!newNoteData.contenu.trim() || !newNoteData.auteurNom.trim() || !newNoteData.ecole.trim()) {
      toast.error("Contenu, intervenant et école requis")
      return
    }

    try {
      const now = new Date().toISOString()
      const notePayload: any = {
        enrollmentId: "global",
        contenu: newNoteData.contenu,
        auteurNom: newNoteData.auteurNom,
        ecole: newNoteData.ecole,
        couleur: newNoteData.couleur,
        categorie: newNoteData.categorie,
        suivi: false,
        creator: "user",
        createdAt: now,
        updatedAt: now,
        status: "actif",
        position: { x: Math.random() * 300, y: Math.random() * 200 },
        // Champs numériques requis initialisés à 0
        contactScolaire: 0,
        rencontreScolaire: 0,
        nombreScolaire: 0,
        contactJeune: 0,
        rencontreJeune: 0,
        nombreJeune: 0,
        contactParent: 0,
        rencontreParent: 0,
        nombreParent: 0,
        contactAutre: 0,
        rencontreAutre: 0,
        nombreAutre: 0
      }

      if (newNoteData.hasRappel && newNoteData.rappelDate) {
        notePayload.rappel = {
          date: newNoteData.rappelDate,
          heure: newNoteData.rappelHeure,
          type: newNoteData.rappelType,
          description: newNoteData.rappelDescription
        }
      }

      if (newNoteData.checklist.length > 0) {
        notePayload.checklist = newNoteData.checklist
      }

      await lumi.entities.notes.create(notePayload)
      
      toast.success("Note créée avec succès!")
      setShowNewNoteModal(false)
      setNewNoteData({
        contenu: "",
        auteurNom: "",
        ecole: "",
        couleur: "yellow",
        categorie: "general",
        rappelDate: "",
        rappelHeure: "",
        rappelType: "telephone_parent",
        rappelDescription: "",
        hasRappel: false,
        checklist: []
      })
      
      // Rafraîchir immédiatement les notes
      await onRefresh()
    } catch (error) {
      console.error("Erreur création note:", error)
      toast.error("Erreur lors de la création")
    }
  }

  const getCouleurClasses = (couleurId: string) => {
    const couleur = couleurs.find(c => c.id === couleurId) || couleurs[0]
    return { bg: couleur.bg, border: couleur.border }
  }

  // Grouper les notes par date pour la vue timeline
  const notesByDate = useMemo(() => {
    const grouped: { [key: string]: any[] } = {}
    filteredNotes.forEach(note => {
      if (!note.createdAt) {
        if (!grouped['Sans date']) grouped['Sans date'] = []
        grouped['Sans date'].push(note)
        return
      }
      // Extraire uniquement la partie date (YYYY-MM-DD) sans conversion de fuseau horaire
      const dateStr = note.createdAt.split('T')[0]
      if (!grouped[dateStr]) grouped[dateStr] = []
      grouped[dateStr].push(note)
    })
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredNotes])

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all font-semibold">
              ← Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-900">📌 Tableau de Notes</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (!confirm("⚠️ ATTENTION : Cela va supprimer DÉFINITIVEMENT toutes les notes (même celles marquées comme supprimées). Continuer ?")) return
                try {
                  toast.loading("Suppression en cours...")
                  const { list } = await lumi.entities.notes.list({ filter: {} })
                  let count = 0
                  for (const note of list) {
                    await lumi.entities.notes.delete(note._id)
                    count++
                  }
                  toast.dismiss()
                  toast.success(`${count} notes supprimées définitivement`)
                  onRefresh()
                } catch (error) {
                  toast.dismiss()
                  console.error("Erreur suppression totale:", error)
                  toast.error("Erreur lors de la suppression")
                }
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xl font-bold transition-all transform hover:scale-105">
              🗑️ Vider tout
            </button>
            <button
              onClick={() => setShowNewNoteModal(true)}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-xl font-bold transition-all transform hover:scale-105">
              + Nouvelle Note
            </button>
          </div>
        </div>

        {/* Filtres Statut */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <div className="flex bg-white rounded-lg shadow-md overflow-hidden border border-gray-300">
            <button
              onClick={() => setStatusFilter("actif")}
              className={`px-6 py-3 font-bold transition-all ${
                statusFilter === "actif" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}>
              ✅ Actives
            </button>
            <button
              onClick={() => setStatusFilter("termine")}
              className={`px-6 py-3 font-bold transition-all ${
                statusFilter === "termine" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}>
              ✓ Terminées
            </button>
            <button
              onClick={() => setStatusFilter("ferme")}
              className={`px-6 py-3 font-bold transition-all ${
                statusFilter === "ferme" ? "bg-orange-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}>
              📁 Fermées
            </button>
            <button
              onClick={() => setStatusFilter("supprime")}
              className={`px-6 py-3 font-bold transition-all ${
                statusFilter === "supprime" ? "bg-red-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}>
              🗑️ Supprimées
            </button>
          </div>
        </div>

        {/* Recherche */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <input
            type="text"
            placeholder="🔍 Rechercher une note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-md"
          />
        </div>

        {/* Onglets Catégories */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-lg font-bold shadow-md transition-all transform hover:scale-105 ${
                selectedCategory === cat.id ? `${cat.color} text-white ring-4 ring-blue-200` : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Vue Timeline */}
        <div className="space-y-6">
          {notesByDate.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-8xl mb-4">📋</div>
              <p className="text-2xl text-gray-500 font-bold">Aucune note à afficher</p>
            </div>
          ) : (
            notesByDate.map(([date, dayNotes]) => (
              <div key={date} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                {/* En-tête de jour */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-gray-200">
                  <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                    📅 {date === 'Sans date' ? 'Sans date' : (() => {
                      // Parser la date en format local (YYYY-MM-DD)
                      const [year, month, day] = date.split('-').map(Number)
                      const localDate = new Date(year, month - 1, day)
                      return localDate.toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    })()}
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-bold text-gray-700">
                    {dayNotes.length} note{dayNotes.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Liste des notes du jour */}
                <div className="space-y-3">
                  {dayNotes.map((note) => {
                    const enrollment = enrollments.find(e => e._id === note.enrollmentId)
                    const { bg, border } = getCouleurClasses(note.couleur || "yellow")
                    const hasRappel = note.rappel?.date
                    const catInfo = categories.find(c => c.id === note.categorie)

                    return (
                      <div
                        key={note._id}
                        className={`${bg} ${border} border-l-4 rounded-lg p-4 shadow-md hover:shadow-xl transition-all`}>
                        
                        <div className="flex items-start justify-between gap-4">
                          {/* Contenu principal */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {catInfo && (
                                <span className={`${catInfo.color} text-white px-2 py-1 rounded text-xs font-bold`}>
                                  {catInfo.label}
                                </span>
                              )}
                              <span className="text-xs text-gray-600">
                                {new Date(note.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {hasRappel && (
                                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                                  ⏰ Rappel {formatDate(note.rappel.date)}
                                </span>
                              )}
                            </div>

                            {enrollment && (
                              <div className="mb-2">
                                <p className="font-bold text-gray-900 text-sm">
                                  👤 {enrollment.prenom} {enrollment.nom}
                                </p>
                                <p className="text-xs text-gray-700">🏫 {note.ecole}</p>
                              </div>
                            )}

                            <div className="text-sm text-gray-900 mb-2 whitespace-pre-wrap">
                              {note.contenu}
                            </div>

                            {/* Checklist */}
                            {note.checklist && note.checklist.length > 0 && (
                              <div className="mt-3 space-y-1 bg-white/50 p-2 rounded">
                                {note.checklist.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <input 
                                      type="checkbox" 
                                      checked={item.completed} 
                                      onChange={async () => {
                                        const updated = [...note.checklist]
                                        updated[idx].completed = !updated[idx].completed
                                        try {
                                          await lumi.entities.notes.update(note._id, { checklist: updated })
                                          onRefresh()
                                        } catch (error) {
                                          console.error("Erreur checklist:", error)
                                        }
                                      }}
                                      className="rounded border-gray-400"
                                    />
                                    <span className={`text-xs ${item.completed ? "line-through text-gray-600" : "text-gray-900"}`}>
                                      {item.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {hasRappel && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-xs font-bold text-red-700">
                                  📞 {note.rappel.type === "telephone_parent" ? "Appel parent" : 
                                     note.rappel.type === "telephone_eleve" ? "Appel élève" :
                                     note.rappel.type === "rencontre" ? "Rencontre" : 
                                     note.rappel.type === "suivi" ? "Suivi" : "Autre"}
                                </p>
                                <p className="text-xs text-gray-700">
                                  {note.rappel.heure} - {note.rappel.description}
                                </p>
                              </div>
                            )}

                            <div className="mt-2 text-xs text-gray-600">
                              ✍️ {note.auteurNom}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setEditingNote(note)
                                setShowEditModal(true)
                              }}
                              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded text-sm font-medium transition-all shadow-sm">
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await lumi.entities.notes.update(note._id, { suivi: true, updatedAt: new Date().toISOString() })
                                  toast.success("Note terminée")
                                  onRefresh()
                                } catch (error) {
                                  console.error("Erreur suivi:", error)
                                  toast.error("Erreur")
                                }
                              }}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-all shadow-sm">
                              ✓ Terminer
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm("Fermer cette note ?")) return
                                try {
                                  await lumi.entities.notes.update(note._id, { status: "ferme", updatedAt: new Date().toISOString() })
                                  toast.success("Note fermée")
                                  onRefresh()
                                } catch (error) {
                                  console.error("Erreur fermeture:", error)
                                  toast.error("Erreur")
                                }
                              }}
                              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium transition-all shadow-sm">
                              📁 Fermer
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm("Supprimer cette note ?")) return
                                try {
                                  await lumi.entities.notes.update(note._id, { status: "supprime", updatedAt: new Date().toISOString() })
                                  toast.success("Note supprimée")
                                  onRefresh()
                                } catch (error) {
                                  console.error("Erreur suppression:", error)
                                  toast.error("Erreur")
                                }
                              }}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-all shadow-sm">
                              🗑️ Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Nouvelle Note */}
        {showNewNoteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📝 Nouvelle Note</h2>
                <button
                  onClick={() => setShowNewNoteModal(false)}
                  className="text-gray-400 hover:text-gray-900 text-3xl">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Intervenant */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">👤 Intervenant *</label>
                  <input
                    type="text"
                    value={newNoteData.auteurNom}
                    onChange={(e) => setNewNoteData({...newNoteData, auteurNom: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Votre nom"
                  />
                </div>

                {/* École */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">🏫 École *</label>
                  <select
                    value={newNoteData.ecole}
                    onChange={(e) => setNewNoteData({...newNoteData, ecole: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
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

                {/* Couleur */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">🎨 Couleur</label>
                  <div className="flex gap-2 flex-wrap">
                    {couleurs.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setNewNoteData({...newNoteData, couleur: c.id})}
                        className={`w-12 h-12 ${c.bg} ${c.border} border-2 rounded-lg transition-all ${
                          newNoteData.couleur === c.id ? "ring-4 ring-indigo-500 scale-110" : "hover:scale-105"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">📁 Catégorie</label>
                  <select
                    value={newNoteData.categorie}
                    onChange={(e) => setNewNoteData({...newNoteData, categorie: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {categories.filter(c => c.id !== "tous").map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                    <option value="general">📋 Général</option>
                  </select>
                </div>

                {/* Contenu */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">📝 Contenu de la note *</label>
                  <textarea
                    value={newNoteData.contenu}
                    onChange={(e) => setNewNoteData({...newNoteData, contenu: e.target.value})}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Écrivez votre note ici..."
                  />
                </div>

                {/* Checklist */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">☑️ Liste de tâches (optionnel)</label>
                  {newNoteData.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updated = [...newNoteData.checklist]
                          updated[idx].text = e.target.value
                          setNewNoteData({...newNoteData, checklist: updated})
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      />
                      <button
                        onClick={() => {
                          const updated = newNoteData.checklist.filter((_, i) => i !== idx)
                          setNewNoteData({...newNoteData, checklist: updated})
                        }}
                        className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewNoteData({...newNoteData, checklist: [...newNoteData.checklist, { text: "", completed: false }]})}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium">
                    + Ajouter une tâche
                  </button>
                </div>

                {/* Rappel */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNoteData.hasRappel}
                      onChange={(e) => setNewNoteData({...newNoteData, hasRappel: e.target.checked})}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="text-gray-900 font-bold">⏰ Ajouter un rappel de rendez-vous</span>
                  </label>

                  {newNoteData.hasRappel && (
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">📅 Date</label>
                          <input
                            type="date"
                            value={newNoteData.rappelDate}
                            onChange={(e) => setNewNoteData({...newNoteData, rappelDate: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">🕐 Heure</label>
                          <input
                            type="time"
                            value={newNoteData.rappelHeure}
                            onChange={(e) => setNewNoteData({...newNoteData, rappelHeure: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm mb-1">📞 Type de rendez-vous</label>
                        <select
                          value={newNoteData.rappelType}
                          onChange={(e) => setNewNoteData({...newNoteData, rappelType: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded">
                          <option value="telephone_parent">📞 Téléphone avec parent</option>
                          <option value="telephone_eleve">📱 Téléphone avec élève</option>
                          <option value="rencontre">👥 Rencontre en personne</option>
                          <option value="suivi">📋 Suivi administratif</option>
                          <option value="autre">🔹 Autre</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm mb-1">📝 Description</label>
                        <textarea
                          value={newNoteData.rappelDescription}
                          onChange={(e) => setNewNoteData({...newNoteData, rappelDescription: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded resize-none"
                          placeholder="Détails du rendez-vous..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateNote}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105">
                  ✓ Créer la note
                </button>
                <button
                  onClick={() => setShowNewNoteModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-all">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Édition */}
        {showEditModal && editingNote && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">✏️ Modifier la note</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-900 text-3xl">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">📝 Contenu</label>
                  <textarea
                    value={editingNote.contenu}
                    onChange={(e) => setEditingNote({...editingNote, contenu: e.target.value})}
                    rows={8}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">🎨 Couleur</label>
                  <div className="flex gap-2">
                    {couleurs.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setEditingNote({...editingNote, couleur: c.id})}
                        className={`w-12 h-12 ${c.bg} ${c.border} border-2 rounded-lg transition-all ${
                          editingNote.couleur === c.id ? "ring-4 ring-indigo-500 scale-110" : "hover:scale-105"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">📁 Catégorie</label>
                  <select
                    value={editingNote.categorie || "general"}
                    onChange={(e) => setEditingNote({...editingNote, categorie: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg">
                    {categories.filter(c => c.id !== "tous").map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                    <option value="general">📋 Général</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    try {
                      await lumi.entities.notes.update(editingNote._id, {
                        contenu: editingNote.contenu,
                        couleur: editingNote.couleur,
                        categorie: editingNote.categorie,
                        updatedAt: new Date().toISOString()
                      })
                      setShowEditModal(false)
                      onRefresh()
                    } catch (error) {
                      console.error("Erreur modification:", error)
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all">
                  💾 Enregistrer
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-all">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
