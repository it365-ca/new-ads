import React, { useState, useMemo } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"
import { formatDate } from "../utils/dateFormat"

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
  const [draggedNote, setDraggedNote] = useState<string | null>(null)
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNote, setEditingNote] = useState<any>(null)
  
  // ... keep existing code
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
    let filtered = (notes || []).filter(n => !n.suivi && n.status !== "supprime" && n.status !== "ferme")
    
    if (selectedCategory !== "tous") {
      filtered = filtered.filter(n => n.categorie === selectedCategory)
    }
    
    return filtered
  }, [notes, selectedCategory])

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
      toast.success("Note créée !")
      onRefresh()
    } catch (error) {
      console.error("Erreur création post-it:", error)
      toast.error("Erreur lors de la création")
    }
  }

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [boardRef, setBoardRef] = useState<HTMLDivElement | null>(null)

  // ... keep existing code for drag/drop and other functions
  
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* ... keep existing JSX */}
    </div>
  )
}
