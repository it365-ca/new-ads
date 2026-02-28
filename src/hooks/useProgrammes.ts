import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

export interface StatsConfiguration {
  afficherGenre: boolean
  afficherAge: boolean
  afficherDegre: boolean
  afficherEcole: boolean
  afficherVille: boolean
  afficherOrigine: boolean
  afficherDemeurAvec: boolean
  afficherInterventions: boolean
  afficherPresence: boolean
  afficherEvolution: boolean
  afficherConversion: boolean
}

export interface Programme {
  _id: string
  nom: string
  code: string
  description?: string
  actif: boolean
  couleur?: string
  icone?: string
  statsConfiguration: StatsConfiguration
  ordre?: number
  capaciteMax?: number
  dureeTypique?: string
  createdAt: string
  updatedAt: string
}

export const useProgrammes = () => {
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchProgrammes = async (options?: {
    filter?: Record<string, any>
    sort?: Record<string, 1 | -1>
    limit?: number
    skip?: number
  }) => {
    setLoading(true)
    try {
      // Vérifier l'authentification avant de charger
      const user = await lumi.auth.refreshUser()
      if (!user) {
        console.warn("Utilisateur non authentifié")
        setLoading(false)
        return
      }
      
      const { list, total } = await lumi.entities.programmes.list(options || {})
      setProgrammes(list as Programme[])
      setTotal(total)
    } catch (error: any) {
      console.error("Erreur lors de la récupération des programmes:", error)
      if (error?.message === "PERMISSION_DENIED") {
        toast.error("Accès refusé : permissions insuffisantes pour accéder aux programmes")
      } else {
        toast.error("Échec du chargement des programmes")
      }
    } finally {
      setLoading(false)
    }
  }

  const createProgramme = async (data: Omit<Programme, "_id" | "createdAt" | "updatedAt">) => {
    try {
      const newProgramme = await lumi.entities.programmes.create({
        ...data,
        creator: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      toast.success("Programme créé avec succès")
      await fetchProgrammes()
      return newProgramme
    } catch (error) {
      console.error("Erreur lors de la création:", error)
      toast.error("Échec de la création du programme")
      throw error
    }
  }

  const updateProgramme = async (id: string, data: Partial<Programme>) => {
    try {
      const updated = await lumi.entities.programmes.update(id, {
        ...data,
        updatedAt: new Date().toISOString()
      })
      toast.success("Programme mis à jour avec succès")
      await fetchProgrammes()
      return updated
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      toast.error("Échec de la mise à jour")
      throw error
    }
  }

  const deleteProgramme = async (id: string) => {
    try {
      await lumi.entities.programmes.delete(id)
      toast.success("Programme supprimé avec succès")
      await fetchProgrammes()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Échec de la suppression")
      throw error
    }
  }

  useEffect(() => {
    const initProgrammes = async () => {
      try {
        // Attendre que l'utilisateur soit authentifié avant de charger
        const user = await lumi.auth.refreshUser()
        if (!user) {
          setLoading(false)
          return
        }
        await fetchProgrammes({ sort: { ordre: 1 } })
      } catch (error) {
        console.error("Erreur d'initialisation:", error)
        setLoading(false)
      }
    }
    initProgrammes()
  }, [])

  return {
    programmes,
    total,
    loading,
    fetchProgrammes,
    createProgramme,
    updateProgramme,
    deleteProgramme
  }
}
