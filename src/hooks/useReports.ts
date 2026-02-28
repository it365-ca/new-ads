import { useState, useEffect, useCallback } from "react"
import { lumi } from "../lib/lumi"
import { useCustomAuth } from "./useCustomAuth"

export interface Report {
  _id: string
  enrollmentId: string
  titre: string
  contenu: string
  typeTemplate: "standard" | "avec_notes" | "resume_notes" | "personnalise"
  templateId?: string
  metadata?: {
    auteurNom?: string
    dateDebut?: string
    dateFin?: string
  }
  creator: string
  createdAt: string
  updatedAt: string
}

export interface ReportTemplate {
  _id: string
  nom: string
  description?: string
  contenuHTML: string
  hasLogo: boolean
  hasHeader: boolean
  logoUrl?: string
  isPublic: boolean
  creator: string
  createdAt: string
  updatedAt: string
}

export const useReports = (enrollmentId?: string) => {
  const { user } = useCustomAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const fetchReports = useCallback(async () => {
    if (!enrollmentId) return
    setLoading(true)
    try {
      const { list } = await lumi.entities.reports.list({
        filter: { enrollmentId },
        sort: { createdAt: -1 }
      })
      setReports(list as Report[])
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }, [enrollmentId])

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const { list } = await lumi.entities.report_templates.list({
        sort: { createdAt: -1 }
      })
      setTemplates(list as ReportTemplate[])
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const createReport = async (data: Omit<Report, "_id" | "creator" | "createdAt" | "updatedAt">) => {
    if (!user) throw new Error("User not authenticated")
    
    const now = new Date().toISOString()
    const newReport = await lumi.entities.reports.create({
      ...data,
      creator: user.userId,
      createdAt: now,
      updatedAt: now
    })
    
    setReports(prev => [newReport as Report, ...prev])
    return newReport
  }

  const updateReport = async (id: string, data: Partial<Report>) => {
    const updated = await lumi.entities.reports.update(id, {
      ...data,
      updatedAt: new Date().toISOString()
    })
    
    setReports(prev => prev.map(r => r._id === id ? { ...r, ...updated } as Report : r))
    return updated
  }

  const deleteReport = async (id: string) => {
    await lumi.entities.reports.delete(id)
    setReports(prev => prev.filter(r => r._id !== id))
  }

  const createTemplate = async (data: Omit<ReportTemplate, "_id" | "creator" | "createdAt" | "updatedAt">) => {
    if (!user || !user.userId) {
      console.error('❌ User not authenticated:', user)
      throw new Error("User not authenticated")
    }
    
    const now = new Date().toISOString()
    console.log('✅ Creating template with user:', user.userId)
    const newTemplate = await lumi.entities.report_templates.create({
      ...data,
      creator: user.userId,
      createdAt: now,
      updatedAt: now
    })
    
    setTemplates(prev => [newTemplate as ReportTemplate, ...prev])
    return newTemplate
  }

  const updateTemplate = async (id: string, data: Partial<ReportTemplate>) => {
    const updated = await lumi.entities.report_templates.update(id, {
      ...data,
      updatedAt: new Date().toISOString()
    })
    
    setTemplates(prev => prev.map(t => t._id === id ? { ...t, ...updated } as ReportTemplate : t))
    return updated
  }

  const deleteTemplate = async (id: string) => {
    try {
      console.log('🗑️ Suppression template avec ID:', id)
      console.log('🔍 Type de l\'ID:', typeof id, 'Valeur:', id)
      
      const result = await lumi.entities.report_templates.delete(id)
      console.log('✅ Résultat de la suppression:', result)
      
      setTemplates(prev => prev.filter(t => t._id !== id))
      console.log('✅ Template supprimé avec succès de la liste locale')
    } catch (error: any) {
      console.error('❌ Erreur complète lors de la suppression du template:', {
        error,
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        response: error?.response,
        status: error?.status
      })
      
      // Construction d'un message d'erreur détaillé
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue lors de la suppression'
      const newError = new Error(errorMessage)
      newError.name = error?.name || 'DeleteError'
      throw newError
    }
  }

  useEffect(() => {
    if (enrollmentId) {
      fetchReports()
    }
  }, [fetchReports, enrollmentId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    reports,
    templates,
    loading,
    fetchReports,
    fetchTemplates,
    createReport,
    updateReport,
    deleteReport,
    createTemplate,
    updateTemplate,
    deleteTemplate
  }
}