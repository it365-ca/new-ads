import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

export interface Intervenant {
  _id: string
  nom: string
  prenom: string
  email: string
  userId: string
  actif: boolean
  dateAjout: string
  telephone?: string
  specialite?: string
  permissions?: {
    accessNotes: boolean
    accessStats: boolean
    modifierEtudiants: boolean
    supprimerEtudiants: boolean
    accessMessagerie: boolean
    accessTickets: boolean
    accessFeuillePres: boolean
    accessAdministration: boolean
  }
}

export function useIntervenants() {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchIntervenants = async () => {
    try {
      setLoading(true)
      const result = await lumi.entities.intervenants.list()
      console.log("Intervenants récupérés:", result)
      setIntervenants(result?.list || [])
    } catch (error) {
      console.error("Erreur lors du chargement des intervenants:", error)
      toast.error("Impossible de charger les intervenants")
    } finally {
      setLoading(false)
    }
  }

  // Filtre pour les menus déroulants : exclut administrateurs et programmeurs
  const intervenantsForDropdown = intervenants.filter(i => {
    const specialite = i.specialite?.toLowerCase() || ''
    return !specialite.includes('administrateur') && !specialite.includes('programmeur')
  })

  useEffect(() => {
    fetchIntervenants()
  }, [])

  const createIntervenant = async (data: any) => {
    try {
      console.log("🔍 useIntervenants.createIntervenant - Data reçue:", data)
      console.log("🔍 useIntervenants.createIntervenant - Prénom:", data.prenom)
      const result = await lumi.entities.intervenants.create(data)
      console.log("✅ useIntervenants.createIntervenant - Résultat SDK:", result)
      await fetchIntervenants()
      toast.success("Intervenant ajouté avec succès")
      return result
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error)
      toast.error("Erreur lors de l'ajout de l'intervenant")
      throw error
    }
  }

  const updateIntervenant = async (id: string, data: Partial<Intervenant>) => {
    try {
      const result = await lumi.entities.intervenants.update(id, data)
      await fetchIntervenants()
      toast.success("Intervenant modifié")
      return result
    } catch (error) {
      console.error("Erreur lors de la modification:", error)
      toast.error("Erreur lors de la modification")
      throw error
    }
  }

  const deleteIntervenant = async (id: string) => {
    try {
      await lumi.entities.intervenants.delete(id)
      await fetchIntervenants()
      toast.success("Intervenant supprimé")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression")
      throw error
    }
  }

  return {
    intervenants,
    intervenantsForDropdown,
    loading,
    createIntervenant,
    updateIntervenant,
    deleteIntervenant,
    refreshIntervenants: fetchIntervenants
  }
}
