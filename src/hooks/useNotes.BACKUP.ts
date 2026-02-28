import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"

export interface Note {
  _id: string
  enrollmentId: string
  contenu: string
  content?: string // Compatibility alias for contenu
  auteurNom: string
  author?: string // Compatibility alias for auteurNom
  suivi: boolean
  status?: string
  dateCreation?: string
  contactScolaire?: number
  rencontreScolaire?: number
  nombreScolaire?: number
  contactJeune?: number
  rencontreJeune?: number
  nombreJeune?: number
  contactParent?: number
  rencontreParent?: number
  nombreParent?: number
  contactAutre?: number
  rencontreAutre?: number
  nombreAutre?: number
  organismeCommunautaire?: number
  protectionJeunesse?: number
  cisssmo?: number
  ecoleAuxAdultes?: number
  milieuStage?: number
  policierPreventionniste?: number
  ressourcePsychologique?: number
  attachments?: Array<{fileName: string, fileUrl: string, fileType: string}>
  tags?: string[]
  reminders?: Array<{date: string, message: string, completed: boolean}>
  objectives?: Array<{title: string, description: string, progress: number, dueDate: string}>
  linkedDocuments?: string[]
  checklist?: Array<{task: string, completed: boolean}>
  mentions?: string[]
  evolutionData?: Array<{date: string, value: number, label: string}>
  isConfidential?: boolean
  template?: string
  counters?: any // Kept for backward compatibility if needed, but data is now flat
  creator: string
  createdAt: string
  updatedAt: string
  // Additional flattened fields from interventionData
  intervenant?: string
  dateEvenement?: string
  horaire?: string
  typeActivite?: string
  notionsImportantes?: string
  rappelsSuivis?: string
  elevesPresents?: string
  elevesAbsents?: string
  ecole?: string
  activite?: string
}

export const useNotes = (enrollmentId: string) => {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)

  // Helper to ensure notes have the 'counters' object expected by the UI (EnrollmentDetails),
  // even if the data is flattened in the DB.
  // Also handles field name mapping (content/contenu, author/auteurNom).
  const normalizeNote = (note: any): Note => {
    const counters = note.counters || {}
    const normalizedCounters = {
      ...counters,
      intervenant: counters.intervenant || note.intervenant || note.auteurNom || note.author,
      dateCreation: counters.dateCreation || note.dateCreation,
      dateEvenement: counters.dateEvenement || note.dateEvenement,
      horaire: counters.horaire || note.horaire,
      typeActivite: counters.typeActivite || note.typeActivite || note.activite,
      notionsImportantes: counters.notionsImportantes || note.notionsImportantes,
      rappelsSuivis: counters.rappelsSuivis || note.rappelsSuivis,
      elevesPresents: counters.elevesPresents || note.elevesPresents,
      elevesAbsents: counters.elevesAbsents || note.elevesAbsents,
      ecole: counters.ecole || note.ecole,
      
      // Numeric counters
      contactScolaire: counters.contactScolaire ?? note.contactScolaire ?? 0,
      rencontreScolaire: counters.rencontreScolaire ?? note.rencontreScolaire ?? 0,
      nombreScolaire: counters.nombreScolaire ?? note.nombreScolaire ?? 0,
      contactJeune: counters.contactJeune ?? note.contactJeune ?? 0,
      rencontreJeune: counters.rencontreJeune ?? note.rencontreJeune ?? 0,
      nombreJeune: counters.nombreJeune ?? note.nombreJeune ?? 0,
      contactParent: counters.contactParent ?? note.contactParent ?? 0,
      rencontreParent: counters.rencontreParent ?? note.rencontreParent ?? 0,
      nombreParent: counters.nombreParent ?? note.nombreParent ?? 0,
      contactAutre: counters.contactAutre ?? note.contactAutre ?? 0,
      rencontreAutre: counters.rencontreAutre ?? note.rencontreAutre ?? 0,
      nombreAutre: counters.nombreAutre ?? note.nombreAutre ?? 0,
      
      organismeCommunautaire: counters.organismeCommunautaire ?? note.organismeCommunautaire ?? 0,
      protectionJeunesse: counters.protectionJeunesse ?? note.protectionJeunesse ?? 0,
      cisssmo: counters.cisssmo ?? note.cisssmo ?? 0,
      ecoleAuxAdultes: counters.ecoleAuxAdultes ?? note.ecoleAuxAdultes ?? 0,
      milieuStage: counters.milieuStage ?? note.milieuStage ?? 0,
      policierPreventionniste: counters.policierPreventionniste ?? note.policierPreventionniste ?? 0,
      ressourcePsychologique: counters.ressourcePsychologique ?? note.ressourcePsychologique ?? 0
    }
    
    return {
      ...note,
      content: note.content || note.contenu || "", // Ensure content is available for UI
      contenu: note.contenu || note.content || "", // Ensure contenu is available for DB
      author: note.author || note.auteurNom || "", // Ensure author is available for UI
      auteurNom: note.auteurNom || note.author || "", // Ensure auteurNom is available for DB
      counters: normalizedCounters
    }
  }

  const fetchNotes = async () => {
    if (!enrollmentId) return
    setLoading(true)
    try {
      const { list } = await lumi.entities.notes.list({
        filter: { enrollmentId },
        sort: { createdAt: -1 }
      })
      const normalizedList = list.map(normalizeNote)
      setNotes(normalizedList)
    } catch (error) {
      console.error("Failed to fetch notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const createNote = async (contenu: string, auteurNom: string, suiviValue: boolean = false, interventionData?: any) => {
    const now = new Date().toISOString()
    const newNote = await lumi.entities.notes.create({
      enrollmentId,
      contenu: contenu,
      content: contenu, // Save both for robust compatibility
      auteurNom: auteurNom,
      author: auteurNom, // Save both for robust compatibility
      suivi: suiviValue,
      creator: "user",
      createdAt: now,
      updatedAt: now,
      ...interventionData // Spread counters/interventionData to root for flat structure
    })
    const normalizedNewNote = normalizeNote(newNote)
    setNotes(prev => [normalizedNewNote, ...prev])
    return normalizedNewNote
  }

  const updateNote = async (id: string, contenu: string, counters?: any) => {
    const updated = await lumi.entities.notes.update(id, {
      contenu: contenu,
      content: contenu, // Update both
      ...counters, // Spread counters to root
      updatedAt: new Date().toISOString()
    })
    setNotes(prev => prev.map(note => {
      if (note._id === id) {
        // Merge updates, then re-normalize to ensure counters is up to date
        const merged = { ...note, ...updated }
        return normalizeNote(merged)
      }
      return note
    }))
    return updated
  }

  const deleteNote = async (id: string) => {
    await lumi.entities.notes.delete(id)
    setNotes(prev => prev.filter(note => note._id !== id))
  }

  const toggleSuivi = async (id: string, currentSuivi: boolean) => {
    const updatedAt = new Date().toISOString()
    await lumi.entities.notes.update(id, {
      suivi: !currentSuivi,
      updatedAt
    })
    setNotes(prev => prev.map(note => 
      note._id === id ? { ...note, suivi: !currentSuivi, updatedAt } : note
    ))
  }

  useEffect(() => {
    fetchNotes()
  }, [enrollmentId])

  return {
    notes,
    loading,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    toggleSuivi
  }
}