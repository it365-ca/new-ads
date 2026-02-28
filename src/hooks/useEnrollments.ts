import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import { useAuth } from "./useAuth"

export interface Enrollment {
  _id: string
  nom: string
  prenom: string
  dateNaissance: string
  age: number
  origine: string
  genre: string
  degreScolaire: string
  adresse: string
  codePostal: string
  ville: string
  demeurAvec: string
  parent1Type: string
  parent1Nom: string
  parent1Prenom: string
  parent1Tel: string
  parent1Email: string
  parent2Type?: string
  parent2Nom?: string
  parent2Prenom?: string
  parent2Tel?: string
  parent2Email?: string
  contactUrgence: string
  contactUrgenceTel: string
  contactUrgenceLien: string
  problemeSante?: string
  allergies?: string
  epipen: string
  ecoleReferente: string
  intervenantNom: string
  intervenantTitre: string
  intervenantPoste: string
  intervenantEmail: string
  directionNom: string
  directionEmail: string
  programme: string
  dateEntree: string
  dateFin: string
  apresSejourPlan: string
  motifReference: string
  moyensProposesAutres?: string
  moyensProposesChecked?: {
    emulation: boolean
    rencontreParents: boolean
    horaireAdapte: boolean
    suiviTES: boolean
    planIntervention: boolean
    suiviPsycho: boolean
    rencontreTutrice: boolean
  }
  suiviExterne?: string
  motivationsAdolescent: string
  status: "en_attente" | "actif" | "ferme" | "refuse"
  creator: string
  createdAt: string
  updatedAt: string
}

export const useEnrollments = () => {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 50

  // Fonction pour créer un log d'audit
  const createAuditLog = async (action: string, entityId: string, changes?: { before?: any; after?: any }) => {
    if (!user) return
    try {
      await lumi.entities.audit_logs.create({
        entityType: "enrollment",
        entityId,
        action,
        userId: user.userId,
        userName: user.userName,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        changes
      })
    } catch (error) {
      console.error("Failed to create audit log:", error)
    }
  }

  const fetchEnrollments = async (filter?: { status?: string }, reset = true) => {
    setLoading(true)
    try {
      const currentPage = reset ? 0 : page
      const { list } = await lumi.entities.enrollments.list({
        filter: filter || {},
        sort: { createdAt: -1 },
        limit: pageSize,
        skip: currentPage * pageSize
      })
      
      if (reset) {
        setEnrollments(list as Enrollment[])
        setPage(0)
      } else {
        setEnrollments(prev => [...prev, ...(list as Enrollment[])])
      }
      
      setHasMore(list.length === pageSize)
      if (!reset) setPage(prev => prev + 1)
    } catch (error) {
      console.error("Failed to fetch enrollments:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async (filter?: { status?: string }) => {
    if (!loading && hasMore) {
      await fetchEnrollments(filter, false)
    }
  }

  const createEnrollment = async (data: Omit<Enrollment, "_id" | "creator" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const newEnrollment = await lumi.entities.enrollments.create({
      ...data,
      creator: "user",
      createdAt: now,
      updatedAt: now
    })
    
    // Créer un log d'audit pour la création
    await createAuditLog("create", newEnrollment._id, {
      after: newEnrollment
    })
    
    // Créer une notification si le statut est "en_attente"
    if (data.status === "en_attente") {
      try {
        // Récupérer tous les administrateurs (permissions.accessAdministration: true)
        const { list: admins } = await lumi.entities.intervenants.list({
          filter: { "permissions.accessAdministration": true }
        })
        
        // Créer une notification pour chaque administrateur
        const notificationPromises = admins.map((admin: any) =>
          lumi.entities.notifications.create({
            userId: admin._id,
            type: "new_enrollment",
            titre: "Nouvelle inscription en attente",
            message: `${data.prenom} ${data.nom} - Programme ${data.programme}`,
            entityId: newEnrollment._id,
            entityType: "enrollment",
            lu: false,
            createdAt: now
          })
        )
        
        await Promise.all(notificationPromises)
      } catch (error) {
        console.error("Failed to create notification:", error)
      }
    }
    
    // Mise à jour réactive de l'état local
    setEnrollments(prev => [newEnrollment as Enrollment, ...prev])
    return newEnrollment
  }

  const updateEnrollment = async (id: string, data: Partial<Enrollment>) => {
    // Récupérer l'état avant modification
    const before = enrollments.find(e => e._id === id)
    const statusChanged = before?.status !== data.status
    
    const updated = await lumi.entities.enrollments.update(id, {
      ...data,
      updatedAt: new Date().toISOString()
    })
    
    // Créer un log d'audit pour la modification
    const action = statusChanged ? "status_change" : "update"
    await createAuditLog(action, id, {
      before,
      after: updated
    })
    
    // Ne jamais modifier la liste localement, laisser le parent recharger
    // Le parent doit appeler fetchEnrollments() après updateEnrollment si statusChanged === true
    
    return { ...updated, statusChanged }
  }

  const deleteEnrollment = async (id: string) => {
    try {
      // Récupérer l'état avant suppression
      const before = enrollments.find(e => e._id === id)
      
      // Supprimer l'étudiant
      await lumi.entities.enrollments.delete(id)
      
      // Mise à jour optimiste de l'état local
      setEnrollments(prev => prev.filter(e => e._id !== id))
      
      // Créer un log d'audit pour la suppression (ne bloque pas si échec)
      createAuditLog("delete", id, {
        before
      }).catch(err => console.error("Audit log failed:", err))
      
    } catch (error) {
      console.error("Failed to delete enrollment:", error)
      // Recharger la liste en cas d'erreur
      await fetchEnrollments()
      throw error
    }
  }

  useEffect(() => {
    fetchEnrollments()
  }, [])

  return {
    enrollments,
    loading,
    error: null,
    hasMore,
    page,
    refreshEnrollments: fetchEnrollments,
    fetchEnrollments,
    loadMore,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment
  }
}
