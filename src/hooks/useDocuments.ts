import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"

export interface Document {
  _id: string
  enrollmentId: string
  fileName: string
  fileUrl: string
  fileType?: string
  creator: string
  createdAt: string
  updatedAt: string
}

export const useDocuments = (enrollmentId?: string) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchDocuments = async () => {
    if (!enrollmentId || enrollmentId === "dummy") return
    setLoading(true)
    try {
      const { list } = await lumi.entities.documents.list({
        filter: { enrollmentId },
        sort: { createdAt: -1 }
      })
      setDocuments(list as Document[])
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (files: File[], targetEnrollmentId?: string) => {
    setUploading(true)
    try {
      console.log("📤 [useDocuments] Starting upload process")
      console.log("📤 [useDocuments] Files count:", files.length)
      console.log("📤 [useDocuments] Files details:", files.map(f => ({ 
        name: f.name, 
        size: f.size, 
        type: f.type,
        lastModified: f.lastModified 
      })))
      
      // Validation des fichiers avant upload
      if (!files || files.length === 0) {
        throw new Error("Aucun fichier à télécharger")
      }

      const idToUse = targetEnrollmentId || enrollmentId
      if (!idToUse) {
        throw new Error("ID d'inscription manquant")
      }

      console.log("📤 [useDocuments] Target enrollmentId:", idToUse)
      
      // Upload via SDK Lumi
      console.log("🔄 [useDocuments] Calling lumi.tools.file.upload...")
      const results = await lumi.tools.file.upload(files)
      console.log("✅ [useDocuments] Upload successful, results:", results)
      
      if (!results || results.length === 0) {
        throw new Error("L'upload n'a retourné aucun résultat")
      }

      const now = new Date().toISOString()
      const newDocs: Document[] = []

      // Création des enregistrements dans la base de données
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        console.log(`💾 [useDocuments] Processing result ${i + 1}/${results.length}:`, result)
        
        // Le SDK Lumi retourne 'fileUrl' et non 'url'
        const uploadedUrl = result.fileUrl || result.url
        if (!uploadedUrl) {
          console.warn(`⚠️ [useDocuments] Result ${i + 1} has no URL, skipping`)
          continue
        }

        try {
          console.log(`💾 [useDocuments] Creating DB record for: ${result.fileName || result.name}`)
          const newDoc = await lumi.entities.documents.create({
            enrollmentId: idToUse,
            fileName: result.fileName || result.name || files[i]?.name || `file-${i}`,
            fileUrl: uploadedUrl,
            fileType: result.type || files[i]?.type || 'application/octet-stream',
            creator: "user",
            createdAt: now,
            updatedAt: now
          })
          console.log(`✅ [useDocuments] DB record created:`, newDoc)
          newDocs.push(newDoc as Document)
        } catch (dbError) {
          console.error(`❌ [useDocuments] Failed to create DB record for ${result.fileName || result.name}:`, dbError)
          // Continue avec les autres fichiers même si un échoue
        }
      }

      console.log(`📋 [useDocuments] Successfully processed ${newDocs.length}/${results.length} documents`)

      // Rafraîchir la liste depuis la base de données pour garantir l'affichage
      if (idToUse === enrollmentId) {
        console.log(`🔄 [useDocuments] Refreshing documents list from database...`)
        // Petit délai pour garantir que la base de données a bien enregistré
        await new Promise(resolve => setTimeout(resolve, 500))
        await fetchDocuments()
        console.log(`✅ [useDocuments] Documents list refreshed, count:`, documents.length)
      }

      return results
    } catch (error: any) {
      console.error("❌ [useDocuments] Upload failed")
      console.error("❌ [useDocuments] Error type:", error?.constructor?.name)
      console.error("❌ [useDocuments] Error message:", error?.message)
      console.error("❌ [useDocuments] Error stack:", error?.stack)
      console.error("❌ [useDocuments] Full error object:", error)
      
      // Message d'erreur utilisateur plus explicite
      const userMessage = error?.message || "Erreur lors du téléchargement du fichier"
      throw new Error(userMessage)
    } finally {
      setUploading(false)
      console.log("🏁 [useDocuments] Upload process finished")
    }
  }

  const deleteDocument = async (id: string, fileUrl: string) => {
    try {
      console.log("🗑️ [useDocuments] Starting delete process")
      console.log("🗑️ [useDocuments] Document ID:", id)
      console.log("🗑️ [useDocuments] File URL:", fileUrl)
      
      // Étape 1 : Supprimer l'enregistrement de la base de données d'abord
      console.log("🔄 [useDocuments] Deleting DB record...")
      await lumi.entities.documents.delete(id)
      console.log("✅ [useDocuments] DB record deleted")
      
      // Étape 2 : Tenter de supprimer le fichier du stockage cloud (non-bloquant)
      console.log("🔄 [useDocuments] Attempting to delete file from storage...")
      try {
        await lumi.tools.file.delete([fileUrl])
        console.log("✅ [useDocuments] File deleted from storage")
      } catch (fileError: any) {
        // Ne pas bloquer si la suppression du fichier échoue (fichier déjà supprimé ou permissions)
        console.warn("⚠️ [useDocuments] File deletion failed, but DB record was removed:", fileError?.message || fileError)
      }
      
      // Étape 3 : Mettre à jour l'état local
      setDocuments(prev => prev.filter(doc => doc._id !== id))
      console.log("✅ [useDocuments] Document deletion completed")
    } catch (error: any) {
      console.error("❌ [useDocuments] Delete failed")
      console.error("❌ [useDocuments] Error type:", error?.constructor?.name)
      console.error("❌ [useDocuments] Error message:", error?.message)
      console.error("❌ [useDocuments] Error stack:", error?.stack)
      console.error("❌ [useDocuments] Full error object:", error)
      throw error
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [enrollmentId])

  return {
    documents,
    loading,
    uploading,
    fetchDocuments,
    uploadDocument,
    deleteDocument
  }
}
