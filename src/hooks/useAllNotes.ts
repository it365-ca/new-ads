import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import { Note } from "./useNotes"

export const useAllNotes = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAllNotes = async (filter?: { suivi?: boolean } | any) => {
    setLoading(true)
    try {
      // Ignorer si le paramètre est un événement DOM
      const cleanFilter = (filter && typeof filter === 'object' && !('target' in filter)) ? filter : {}
      const response = await lumi.entities.notes.list({
        filter: cleanFilter,
        sort: { createdAt: -1 }
      })
      console.log("✅ Notes récupérées:", response)
      console.log("✅ Nombre de notes:", response.list?.length || 0)
      setNotes(response.list as Note[] || [])
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des notes:")
      if (error instanceof Error) {
        console.error("Message:", error.message)
        console.error("Stack:", error.stack)
      } else {
        console.error("Erreur non-standard:", String(error))
      }
      // En cas d'erreur, s'assurer que notes est un tableau vide
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const toggleSuivi = async (id: string, suivi: boolean) => {
    await lumi.entities.notes.update(id, {
      suivi,
      updatedAt: new Date().toISOString()
    })
    await fetchAllNotes()
  }

  const updateNote = async (id: string, contenu: string) => {
    await lumi.entities.notes.update(id, {
      contenu,
      updatedAt: new Date().toISOString()
    })
    await fetchAllNotes()
  }

  const deleteNote = async (id: string) => {
    await lumi.entities.notes.update(id, {
      status: "supprime",
      updatedAt: new Date().toISOString()
    })
    await fetchAllNotes()
  }

  const restoreNote = async (id: string) => {
    await lumi.entities.notes.update(id, {
      status: "actif",
      updatedAt: new Date().toISOString()
    })
    await fetchAllNotes()
  }

  const permanentDeleteNote = async (id: string) => {
    await lumi.entities.notes.delete(id)
    await fetchAllNotes()
  }

  const transferNote = async (noteId: string, newEnrollmentId: string) => {
    // Mise à jour simple pour transférer la note tout en conservant son contenu
    await lumi.entities.notes.update(noteId, {
      enrollmentId: newEnrollmentId,
      updatedAt: new Date().toISOString()
    })
    await fetchAllNotes()
  }

  useEffect(() => {
    fetchAllNotes()
  }, [])

  return {
    notes,
    loading,
    fetchAllNotes,
    toggleSuivi,
    updateNote,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
    transferNote
  }
}
