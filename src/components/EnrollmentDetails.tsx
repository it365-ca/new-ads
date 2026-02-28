import React, { useState, useEffect } from "react"
import { useEnrollments } from "../hooks/useEnrollments"
import { useNotes } from "../hooks/useNotes"
import { useDocuments } from "../hooks/useDocuments"
import { useAuth } from "../hooks/useAuth"
import { useAttendances } from "../hooks/useAttendances"
import { useIntervenants } from "../hooks/useIntervenants"
import { CalendarView } from "./CalendarView"
import { AddressAutocomplete } from "./AddressAutocomplete"
import { ReportSelector } from "./ReportSelector"
import { EmailModal } from "./EmailModal"
import toast from "react-hot-toast"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import { useThemeContext } from "../contexts/ThemeContext"
import { formatDate, formatDateTime } from "../utils/dateFormat"
import { lumi } from "../lib/lumi"

interface Props {
  enrollmentId: string
  onBack: () => void
  onDelete?: () => void
  onTransferClick?: () => void
  onUpdate?: () => void
}

type ViewType = "dashboard" | "fiche" | "notes" | "documents" | "presences" | "rapports"

export const EnrollmentDetails: React.FC<Props> = ({ enrollmentId, onBack, onDelete, onTransferClick, onUpdate }) => {
  const { enrollments, loading: enrollmentLoading, updateEnrollment, deleteEnrollment } = useEnrollments()
  const { notes, loading: notesLoading, createNote, updateNote, deleteNote } = useNotes(enrollmentId)
  const { documents, loading: docsLoading, uploadDocument, deleteDocument } = useDocuments(enrollmentId)
  const { attendances, loading: attendancesLoading, createAttendance, updateAttendance } = useAttendances(enrollmentId)
  const { intervenantsForDropdown } = useIntervenants()
  const { user } = useAuth()
  const { getButtonClass, getBadgeClass, getTextClass, getBgClass } = useThemeContext()
  
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [noteContent, setNoteContent] = useState("")
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedData, setEditedData] = useState<any>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState("")
  const [editingNoteCounters, setEditingNoteCounters] = useState<any>({})
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  const [selectedAbsenceDate, setSelectedAbsenceDate] = useState<string | null>(null)
  const [absenceMotif, setAbsenceMotif] = useState("")
  const [absenceCommentaire, setAbsenceCommentaire] = useState("")
  const [viewCalendarMode, setViewCalendarMode] = useState(false)
  const [notesTab, setNotesTab] = useState<"create" | "view">("create")
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null)
  const [showReportEditor, setShowReportEditor] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  
  const [noteCounters, setNoteCounters] = useState({
    intervenant: "",
    dateCreation: new Date().toISOString().split('T')[0],
    dateEvenement: "",
    horaire: "",
    typeActivite: "",
    notionsImportantes: "",
    rappelsSuivis: "",
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
    nombreAutre: 0,
    organismeCommunautaire: 0,
    protectionJeunesse: 0,
    cisssmo: 0,
    ecoleAuxAdultes: 0,
    milieuStage: 0,
    policierPreventionniste: 0,
    ressourcePsychologique: 0
  })

  const enrollment = enrollments.find(e => e._id === enrollmentId)
  const enrollmentNotes = notes.filter(n => n.enrollmentId === enrollmentId)
  const enrollmentDocs = documents.filter(d => d.enrollmentId === enrollmentId)

  // Calculer les jours ouvrables entre dateEntree et dateFin
  const getWeekdays = (startDate: string, endDate: string): string[] => {
    const weekdays: string[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const day = date.getDay()
      // 1-5 = lundi à vendredi (0 = dimanche, 6 = samedi)
      if (day >= 1 && day <= 5) {
        weekdays.push(new Date(date).toISOString().split('T')[0])
      }
    }
    return weekdays
  }

  // Calculer le pourcentage de présence
  const calculateAttendancePercentage = (): { percentage: number, present: number, total: number } => {
    if (!enrollment?.dateEntree || !enrollment?.dateFin) {
      return { percentage: 0, present: 0, total: 0 }
    }

    const weekdays = getWeekdays(enrollment.dateEntree, enrollment.dateFin)
    const presentDays = attendances.filter(a => a.status === "present").length
    const percentage = weekdays.length > 0 ? Math.round((presentDays / weekdays.length) * 100) : 0

    return { percentage, present: presentDays, total: weekdays.length }
  }

  const attendanceStats = calculateAttendancePercentage()

  useEffect(() => {
    if (enrollment && !isEditMode) {
      setEditedData(enrollment)
    }
  }, [enrollment, isEditMode])

  // Auto-remplir le nom de l'intervenant connecté
  useEffect(() => {
    const fetchIntervenantName = async () => {
      if (user?.prenom && user?.nom) {
        const nomComplet = `${user.prenom} ${user.nom}`.trim()
        setNoteCounters(prev => ({ ...prev, intervenant: nomComplet }))
        return
      }

      if (user?.email) {
        try {
          const response = await lumi.entities.intervenants.list({ filter: { email: user.email } })
          const intervenantsList = Array.isArray(response) ? response : (response?.list || [])
          
          if (intervenantsList.length > 0) {
            const intervenant = intervenantsList[0]
            const nomComplet = `${intervenant.prenom || ''} ${intervenant.nom || ''}`.trim()
            setNoteCounters(prev => ({ ...prev, intervenant: nomComplet || user.email || 'Intervenant' }))
          } else {
            const nomComplet = user?.userName || `${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.email || 'Intervenant'
            setNoteCounters(prev => ({ ...prev, intervenant: nomComplet }))
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du nom de l\'intervenant:', error)
          const nomComplet = user?.userName || `${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.email || 'Intervenant'
          setNoteCounters(prev => ({ ...prev, intervenant: nomComplet }))
        }
      }
    }
    fetchIntervenantName()
  }, [user])

  const statusConfig = {
    en_attente: { label: "En Attente", color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    actif: { label: "Actif", color: "bg-green-100 text-green-800", icon: "✅" },
    ferme: { label: "Fermé", color: "bg-gray-100 text-gray-800", icon: "📁" },
    refuse: { label: "Refusé", color: "bg-red-100 text-red-800", icon: "❌" },
    virtuel: { label: "Virtuel", color: "bg-purple-100 text-purple-800", icon: "👤" }
  }

  // --- NOUVELLE FONCTION: GESTION DE LA NOTE APRES EMAIL ---
  const handleEmailNoteCreation = async (sujet: string, corps: string, destinataire: string, expediteur: string) => {
    try {
        // Utiliser directement le nom de l'intervenante sélectionnée
        const intervenantNom = expediteur || "Intervenant";

        const dateNow = new Date().toISOString();
        const content = `<strong>📧 Courriel envoyé à : ${destinataire}</strong><br/><br/><strong>Sujet :</strong> ${sujet}<br/><br/><strong>Message :</strong><br/>${corps}`;

        const emailNoteData = {
            intervenant: intervenantNom,
            dateCreation: dateNow,
            dateEvenement: dateNow.split('T')[0],
            horaire: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            typeActivite: "Courriel", 
            notionsImportantes: "Envoi de courriel via système",
            rappelsSuivis: "",
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
            nombreAutre: 0,
            organismeCommunautaire: 0,
            protectionJeunesse: 0,
            cisssmo: 0,
            ecoleAuxAdultes: 0,
            milieuStage: 0,
            policierPreventionniste: 0,
            ressourcePsychologique: 0
        };

        // Création de la note (non-système pour qu'elle apparaisse normalement)
        await createNote(content, intervenantNom, false, emailNoteData);
        
        // Rafraîchir la vue des notes
        setNotesTab("view");
        if (currentView !== "notes") {
            // Optionnel : rediriger vers les notes pour voir le résultat
            // setCurrentView("notes"); 
        }
        
    } catch (error) {
        console.error("Erreur lors de la création de la note courriel:", error);
        toast.error("Courriel envoyé, mais erreur lors de la création de la note associée.");
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error("La note ne peut pas être vide")
      return
    }
    try {
      let intervenantNom = ""
      
      if (user?.prenom && user?.nom) {
        intervenantNom = `${user.prenom} ${user.nom}`.trim()
      } else if (noteCounters.intervenant && noteCounters.intervenant !== 'Intervenant') {
        intervenantNom = noteCounters.intervenant
      }
      
      if (!intervenantNom || intervenantNom === 'Intervenant') {
        intervenantNom = user?.userName || user?.email || 'Intervenant'
      }
      
      const noteData = { 
        ...noteCounters, 
        intervenant: intervenantNom,
        dateCreation: new Date().toISOString()
      };

      await createNote(noteContent, intervenantNom, true, noteData)
      
      setNoteContent("")
      setNoteCounters({
        intervenant: intervenantNom,
        dateCreation: new Date().toISOString().split('T')[0],
        dateEvenement: "",
        horaire: "",
        typeActivite: "",
        notionsImportantes: "",
        rappelsSuivis: "",
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
        nombreAutre: 0,
        organismeCommunautaire: 0,
        protectionJeunesse: 0,
        cisssmo: 0,
        ecoleAuxAdultes: 0,
        milieuStage: 0,
        policierPreventionniste: 0,
        ressourcePsychologique: 0
      })
      
      setNotesTab("view")
      toast.success("Note ajoutée avec succès !")
    } catch (error) {
      console.error("Erreur ajout note:", error);
      toast.error("Erreur lors de l'ajout de la note")
    }
  }

  const handleEditNote = (noteId: string, currentContent: string, counters: any) => {
    setEditingNoteId(noteId)
    setEditingNoteContent(currentContent)
    setEditingNoteCounters(counters || {})
  }

  const handleSaveNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) {
      toast.error("La note ne peut pas être vide")
      return
    }
    try {
      const intervenantNom = editingNoteCounters.intervenant || "Intervenant"
      await updateNote(noteId, editingNoteContent, intervenantNom, editingNoteCounters)
      setEditingNoteId(null)
      setEditingNoteContent("")
      setEditingNoteCounters({})
      toast.success("Note modifiée")
    } catch (error) {
      toast.error("Erreur lors de la modification")
    }
  }

  const handleCancelNoteEdit = () => {
    setEditingNoteId(null)
    setEditingNoteContent("")
    setEditingNoteCounters({})
  }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  }

  const quillFormats = [
    'header', 'bold', 'italic', 'underline',
    'color', 'background', 'font', 'size',
    'list', 'bullet'
  ]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingFiles(true)
    setUploadProgress(0)
    const fileArray = Array.from(files)
    const loadingToast = toast.loading(`Téléversement de ${fileArray.length} fichier(s)... 0%`)
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 15
          if (next >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          toast.loading(`Téléversement de ${fileArray.length} fichier(s)... ${Math.round(next)}%`, { id: loadingToast })
          return next
        })
      }, 200)

      await uploadDocument(fileArray, enrollmentId)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      toast.loading(`Téléversement de ${fileArray.length} fichier(s)... 100%`, { id: loadingToast })
      
      setTimeout(() => {
        toast.dismiss(loadingToast)
        toast.success(`${fileArray.length} fichier(s) uploadé(s) avec succès! ✓`)
      }, 500)
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error("Erreur lors du téléversement")
      setUploadProgress(0)
    } finally {
      setIsUploadingFiles(false)
      e.target.value = ""
    }
  }

  const handleSaveChanges = () => {
    if (!editedData.prenom?.trim() || !editedData.nom?.trim()) {
      toast.error("Le prénom et le nom sont requis")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (editedData.parent1Email && !emailRegex.test(editedData.parent1Email)) {
      toast.error("Email du premier répondant invalide")
      return
    }
    if (editedData.parent2Email && !emailRegex.test(editedData.parent2Email)) {
      toast.error("Email du deuxième répondant invalide")
      return
    }
    if (editedData.intervenantEmail && !emailRegex.test(editedData.intervenantEmail)) {
      toast.error("Email de l'intervenant scolaire invalide")
      return
    }
    if (editedData.directionEmail && !emailRegex.test(editedData.directionEmail)) {
      toast.error("Email de la direction invalide")
      return
    }

    const criticalFields = ['prenom', 'nom', 'dateNaissance', 'parent1Email', 'parent1Tel', 'contactUrgence', 'contactUrgenceTel']
    const hasImportantChanges = criticalFields.some(field => editedData[field] !== enrollment[field])

    if (hasImportantChanges) {
      setPendingChanges(editedData)
      setShowConfirmDialog(true)
    } else {
      confirmSaveChanges(editedData)
    }
  }

  const confirmSaveChanges = async (dataToSave: any) => {
    try {
      await updateEnrollment(enrollmentId, dataToSave)
      
      const changedFields = Object.keys(dataToSave).filter(
        key => dataToSave[key] !== enrollment[key]
      )
      
      if (changedFields.length > 0) {
        const changeLog = changedFields.map(field => {
          const oldValue = enrollment[field] || "(vide)"
          const newValue = dataToSave[field] || "(vide)"
          return `${field}: "${oldValue}" → "${newValue}"`
        }).join("\n")
        
        await createNote(`📝 Modifications effectuées:\n${changeLog}`, "Système")
      }
      
      setIsEditMode(false)
      setShowConfirmDialog(false)
      setPendingChanges(null)
      toast.success("Modifications enregistrées avec succès")
      
      if (changedFields.includes('dateEntree') || changedFields.includes('dateFin')) {
        window.location.reload()
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  const handleCancelEdit = () => {
    setEditedData(enrollment)
    setIsEditMode(false)
  }

  const handleDeleteEnrollment = async () => {
    try {
      await deleteEnrollment(enrollmentId)
      toast.success("Étudiant supprimé avec succès")
      setShowDeleteDialog(false)
      if (onDelete) {
        onDelete()
      } else {
        onBack()
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...editedData, [field]: value }
    
    if (field === "dateNaissance" && value) {
      updatedData.age = calculateAge(value)
    }
    
    setEditedData(updatedData)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "ferme") {
      setPendingStatusChange(newStatus)
      setShowCloseConfirmDialog(true)
      return
    }
    
    try {
      const result = await updateEnrollment(enrollmentId, { status: newStatus })
      toast.success(`Statut changé à ${statusConfig[newStatus as keyof typeof statusConfig].label}`)
      if (result?.statusChanged && onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      toast.error("Erreur lors du changement de statut")
    }
  }

  const confirmCloseEnrollment = async () => {
    if (!pendingStatusChange) return
    
    try {
      const result = await updateEnrollment(enrollmentId, { status: pendingStatusChange })
      toast.success("Dossier fermé avec succès")
      setShowCloseConfirmDialog(false)
      setPendingStatusChange(null)
      if (result?.statusChanged && onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      toast.error("Erreur lors de la fermeture du dossier")
    }
  }

  if (enrollmentLoading || !enrollment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${getBgClass()} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Confirmer les modifications</h3>
              <p className="text-gray-600 mb-6">
                Vous êtes sur le point de modifier des informations critiques. Voulez-vous continuer ?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false)
                    setPendingChanges(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Annuler
                </button>
                <button
                  onClick={() => confirmSaveChanges(pendingChanges)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Confirmation Dialog */}
        {showCloseConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-orange-600 mb-4">⚠️ Fermer le dossier de l'étudiant</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir fermer le dossier de <strong>{enrollment.prenom} {enrollment.nom}</strong> ?
                <br /><br />
                Cette action marquera le dossier comme fermé. Vous pourrez le rouvrir plus tard si nécessaire.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCloseConfirmDialog(false)
                    setPendingStatusChange(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Annuler
                </button>
                <button
                  onClick={confirmCloseEnrollment}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  Confirmer la fermeture
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-red-600 mb-4">🗑️ Supprimer l'étudiant</h3>
              <p className="text-gray-600 mb-6">
                Cette action est irréversible. Toutes les notes et documents associés seront également supprimés.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Annuler
                </button>
                <button
                  onClick={handleDeleteEnrollment}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === "dashboard" && (
          <div className="space-y-6">
            {/* Boutons retour */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={onBack}
                className="bg-white border border-gray-300 shadow-sm px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                ← Retour
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="bg-indigo-600 text-white shadow-sm px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                🏠 Menu Principal
              </button>
            </div>
            {/* Informations rapides */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📌 Informations rapides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📝</div>
                  <div>
                    <p className="text-sm text-gray-600">Note</p>
                    <p className="font-semibold text-gray-900">{enrollment.prenom} {enrollment.nom}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🎓</div>
                  <div>
                    <p className="text-sm text-gray-600">Programme</p>
                    <p className="font-semibold text-gray-900">{enrollment.programme}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📅</div>
                  <div>
                    <p className="text-sm text-gray-600">Date d'entrée</p>
                    <p className="font-semibold text-gray-900">
                      {enrollment.dateEntree ? formatDate(enrollment.dateEntree) : "Non spécifié"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🏫</div>
                  <div>
                    <p className="text-sm text-gray-600">École</p>
                    <p className="font-semibold text-gray-900">{enrollment.ecoleReferente}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau de bord - 6 CARTES CÔTE À CÔTE (5 pour virtuels) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                📊 Tableau de bord
              </h2>
              <div className={`grid gap-4 ${enrollment.prenom === "" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-6"}`}>
                {/* Carte 1: Fiche (uniquement pour étudiants réels) */}
                {enrollment.prenom !== "" && (
                  <button
                    onClick={() => setCurrentView("fiche")}
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg hover:shadow-lg transition-all cursor-pointer border border-indigo-200 text-left relative h-full">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">📋</div>
                      <h3 className="font-bold text-gray-900 text-base">Fiche</h3>
                      <p className="text-xs text-gray-600 text-center">Infos complètes</p>
                    </div>
                  </button>
                )}

                {/* Carte 2: Note de Suivi */}
                <button
                  onClick={() => setCurrentView("notes")}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg hover:shadow-lg transition-all cursor-pointer border border-green-200 text-left relative h-full">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">📝</div>
                    <h3 className="font-bold text-gray-900 text-base">Note</h3>
                    <p className="text-xs text-gray-600 text-center">Notes actives</p>
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                      {enrollmentNotes.length}
                    </div>
                  </div>
                </button>

                {/* Carte 3: Documents */}
                <button
                  onClick={() => setCurrentView("documents")}
                  className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-lg hover:shadow-lg transition-all cursor-pointer border border-yellow-200 text-left relative h-full">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">📁</div>
                    <h3 className="font-bold text-gray-900 text-base">Documents</h3>
                    <p className="text-xs text-gray-600 text-center">Fichiers PDF</p>
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                      {enrollmentDocs.length}
                    </div>
                  </div>
                </button>

                {/* Carte 4: Transfert (pour profils virtuels) ou Présences (pour étudiants réels) */}
                {enrollment.prenom === "" ? (
                  <button
                    onClick={() => {
                      if (onTransferClick) {
                        onTransferClick()
                      }
                    }}
                    className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg hover:shadow-lg transition-all cursor-pointer border border-purple-200 text-left relative h-full">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">🔄</div>
                      <h3 className="font-bold text-gray-900 text-base">Transfert</h3>
                      <p className="text-xs text-gray-600 text-center">Vers étudiant</p>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentView("presences")}
                    className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg hover:shadow-lg transition-all cursor-pointer border border-blue-200 text-left relative h-full">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">📅</div>
                      <h3 className="font-bold text-gray-900 text-base">Présences</h3>
                      <p className="text-xs text-gray-600 text-center">Feuille de présence</p>
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                        {attendanceStats.percentage}%
                      </div>
                    </div>
                  </button>
                )}

                {/* Carte 5: Rapports */}
                <button
                  onClick={() => setShowReportEditor(true)}
                  className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-lg hover:shadow-lg transition-all cursor-pointer border border-pink-200 text-left relative h-full">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">📄</div>
                    <h3 className="font-bold text-gray-900 text-base">Rapport</h3>
                    <p className="text-xs text-gray-600 text-center">Créer rapport</p>
                  </div>
                </button>

                {/* Carte 6: Courriel (uniquement pour étudiants réels avec au moins un email) */}
                {enrollment.prenom !== "" && (enrollment.parent1Email || enrollment.parent2Email || enrollment.intervenantEmail || enrollment.directionEmail || enrollment.contactUrgenceEmail) && (
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="bg-gradient-to-br from-cyan-50 to-sky-50 p-6 rounded-lg hover:shadow-lg transition-all cursor-pointer border border-cyan-200 text-left relative h-full">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">✉️</div>
                      <h3 className="font-bold text-gray-900 text-base">Courriel</h3>
                      <p className="text-xs text-gray-600 text-center">Envoyer message</p>
                    </div>
                  </button>
                )}

                {/* Carte 7: Statuts */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-lg border border-green-200 h-full">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">{statusConfig[enrollment.status as keyof typeof statusConfig]?.icon || "✅"}</div>
                    <h3 className="font-bold text-gray-900 text-base">Statuts</h3>
                    <p className="text-xs text-gray-600 text-center">État actuel</p>
                    <select
                      value={enrollment.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`mt-1 px-3 py-1.5 rounded-lg font-medium text-xs cursor-pointer ${
                        statusConfig[enrollment.status as keyof typeof statusConfig].color
                      }`}>
                      {enrollment.prenom === "" ? (
                        // Profils virtuels : seulement Actif et Fermé
                        Object.entries(statusConfig)
                          .filter(([key]) => key === "actif" || key === "ferme")
                          .map(([key, { label, icon }]) => (
                            <option key={key} value={key}>{icon} {label}</option>
                          ))
                      ) : (
                        // Étudiants réels : tous les statuts
                        Object.entries(statusConfig).map(([key, { label, icon }]) => (
                          <option key={key} value={key}>{icon} {label}</option>
                        ))
                      )}
                    </select>
                    
                    {/* Case à cocher "Fermer toutes les notes" SEULEMENT pour profils virtuels */}
                    {enrollment.prenom === "" && (
                      <div className="mt-3 pt-3 border-t border-gray-200 w-full">
                        <label className="flex items-center justify-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                          <input
                            type="checkbox"
                            onChange={async (e) => {
                              if (!e.target.checked) return
                              if (!confirm("Fermer toutes les notes de ce profil ?")) {
                                e.target.checked = false
                                return
                              }
                              try {
                                await Promise.all(
                                  enrollmentNotes.map(n => 
                                    updateNote(n._id, n.content || n.contenu, n.auteurNom || n.author || "Intervenant", { ...n.counters, status: "ferme" })
                                  )
                                )
                                toast.success("Toutes les notes fermées")
                                e.target.checked = false
                              } catch (error) {
                                toast.error("Erreur")
                                e.target.checked = false
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="font-medium">Fermer notes</span>
                        </label>
                      </div>
                    )}

                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium w-full">
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fiche View */}
        {currentView === "fiche" && (
          <div className="space-y-6">
            {/* Boutons retour */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView("dashboard")}
                className="bg-white border border-gray-300 shadow-sm px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                ← Retour
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="bg-indigo-600 text-white shadow-sm px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                🏠 Menu Principal
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">📋 Fiche de l'étudiant</h1>

            {/* Boutons Modifier */}
            <div className="flex justify-end gap-3 mb-4">
              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  ✏️ Modifier
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                    ✓ Sauvegarder
                  </button>
                </>
              )}
            </div>

            {/* Contenu de la fiche */}
            <div className="space-y-6">
              {/* Section: Fiche complète de l'étudiant */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-8">
                  {/* Section 1: Fiche personnelle de l'élève */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Fiche personnelle de l'élève</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.prenom || ""} onChange={(e) => handleFieldChange("prenom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.prenom}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.nom || ""} onChange={(e) => handleFieldChange("nom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.nom}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                      {isEditMode ? (
                        <input type="date" value={editedData.dateNaissance || ""} onChange={(e) => handleFieldChange("dateNaissance", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.dateNaissance ? formatDate(enrollment.dateNaissance) : "Non spécifié"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Âge</label>
                      <p className="text-gray-900">{editedData.age || enrollment.age} ans</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                      {isEditMode ? (
                        <select value={editedData.genre || ""} onChange={(e) => handleFieldChange("genre", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Sélectionner...</option>
                          <option value="Masculin">Masculin</option>
                          <option value="Féminin">Féminin</option>
                          <option value="Non-binaire">Non-binaire</option>
                          <option value="Autre">Autre</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{enrollment.genre}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse complète
                        {isEditMode && <span className="text-xs text-gray-500 ml-2">(Tapez pour suggestions)</span>}
                      </label>
                      {isEditMode ? (
                        <AddressAutocomplete
                          value={editedData.adresse || ""}
                          onChange={(value) => handleFieldChange("adresse", value)}
                          onVilleChange={(ville) => handleFieldChange("ville", ville)}
                          onCodePostalChange={(codePostal) => handleFieldChange("codePostal", codePostal)}
                          placeholder="Ex: 123 Rue Principale"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <p className="text-gray-900">{enrollment.adresse}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.ville || ""} onChange={(e) => handleFieldChange("ville", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Auto-rempli" />
                      ) : (
                        <p className="text-gray-900">{enrollment.ville}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.codePostal || ""} onChange={(e) => handleFieldChange("codePostal", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Auto-rempli" />
                      ) : (
                        <p className="text-gray-900">{enrollment.codePostal}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone de l'élève</label>
                      {isEditMode ? (
                        <input type="tel" value={editedData.telEleve || ""} onChange={(e) => handleFieldChange("telEleve", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.telEleve}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Demeure avec</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.demeurAvec || ""} onChange={(e) => handleFieldChange("demeurAvec", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.demeurAvec}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Origine</label>
                      {isEditMode ? (
                        <select value={editedData.origine || ""} onChange={(e) => handleFieldChange("origine", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Sélectionner...</option>
                          <option value="Canadienne">Canadienne</option>
                          <option value="Asiatique occidental">Asiatique occidental</option>
                          <option value="Asiatique du Sud-Est">Asiatique du Sud-Est</option>
                          <option value="Europe de l'est/l'ouest">Europe de l'est/l'ouest</option>
                          <option value="Sud-Asiatique">Sud-Asiatique</option>
                          <option value="Latino-Américaine">Latino-Américaine</option>
                          <option value="Arabe">Arabe</option>
                          <option value="Africaine">Africaine</option>
                          <option value="Haïtienne">Haïtienne</option>
                          <option value="Chinoise">Chinoise</option>
                          <option value="Autochtone">Autochtone</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{enrollment.origine}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degré scolaire</label>
                      {isEditMode ? (
                        <select value={editedData.degreScolaire || ""} onChange={(e) => handleFieldChange("degreScolaire", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Sélectionner...</option>
                          <option value="6e Année">6e Année</option>
                          <option value="Secondaire 1">Secondaire 1</option>
                          <option value="Secondaire 2">Secondaire 2</option>
                          <option value="Secondaire 3">Secondaire 3</option>
                          <option value="Secondaire 4">Secondaire 4</option>
                          <option value="Secondaire 5">Secondaire 5</option>
                          <option value="FPT">FPT</option>
                          <option value="FMS">FMS</option>
                          <option value="GADP">GADP</option>
                          <option value="GADSP">GADSP</option>
                          <option value="PEP">PEP</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{enrollment.degreScolaire}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Appartement</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.appartement || ""} onChange={(e) => handleFieldChange("appartement", e.target.value)} placeholder="App. 101" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.appartement || "-"}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Coordonnées des répondants */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">👨‍👩‍👧 Coordonnées des répondants</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Premier répondant</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type (père, mère ou tuteur)</label>
                        {isEditMode ? (
                          <input type="text" value={editedData.parent1Type || ""} onChange={(e) => handleFieldChange("parent1Type", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent1Type || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        {isEditMode ? (
                          <input type="text" value={editedData.parent1Nom || ""} onChange={(e) => handleFieldChange("parent1Nom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent1Nom}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                        {isEditMode ? (
                          <input type="text" value={editedData.parent1Prenom || ""} onChange={(e) => handleFieldChange("parent1Prenom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent1Prenom || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                        {isEditMode ? (
                          <input type="tel" value={editedData.parent1Tel || ""} onChange={(e) => handleFieldChange("parent1Tel", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent1Tel}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        {isEditMode ? (
                          <input type="email" value={editedData.parent1Email || ""} onChange={(e) => handleFieldChange("parent1Email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent1Email}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Deuxième répondant</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type (père, mère ou tuteur)</label>
                        {isEditMode ? (
                          <input type="text" value={editedData.parent2Type || ""} onChange={(e) => handleFieldChange("parent2Type", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent2Type || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        {isEditMode ? (
                          <input type="text" value={editedData.parent2Nom || ""} onChange={(e) => handleFieldChange("parent2Nom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent2Nom || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        {isEditMode ? (
                          <input type="text" value={editedData.parent2Prenom || ""} onChange={(e) => handleFieldChange("parent2Prenom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent2Prenom || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        {isEditMode ? (
                          <input type="tel" value={editedData.parent2Tel || ""} onChange={(e) => handleFieldChange("parent2Tel", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent2Tel}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        {isEditMode ? (
                          <input type="email" value={editedData.parent2Email || ""} onChange={(e) => handleFieldChange("parent2Email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                        ) : (
                          <p className="text-gray-900">{enrollment.parent2Email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact d'urgence *</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.contactUrgence || ""} onChange={(e) => handleFieldChange("contactUrgence", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.contactUrgence}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone urgence *</label>
                      {isEditMode ? (
                        <input type="tel" value={editedData.contactUrgenceTel || ""} onChange={(e) => handleFieldChange("contactUrgenceTel", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.contactUrgenceTel}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lien de parenté *</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.contactUrgenceLien || ""} onChange={(e) => handleFieldChange("contactUrgenceLien", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.contactUrgenceLien || "-"}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Fiche médicale */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">🏥 Fiche médicale</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carte d'assurance maladie</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.assuranceMaladie || ""} onChange={(e) => handleFieldChange("assuranceMaladie", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.assuranceMaladie}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                      {isEditMode ? (
                        <input type="date" value={editedData.assuranceExpiration || ""} onChange={(e) => handleFieldChange("assuranceExpiration", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.assuranceExpiration ? formatDate(enrollment.assuranceExpiration) : "Non spécifié"}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                      {isEditMode ? (
                        <textarea value={editedData.allergies || ""} onChange={(e) => handleFieldChange("allergies", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.allergies || "Aucune"}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Problème(s) de santé? Si oui, spécifiez</label>
                      {isEditMode ? (
                        <textarea value={editedData.problemeSante || editedData.problemesSante || ""} onChange={(e) => handleFieldChange("problemeSante", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.problemeSante || enrollment.problemesSante || "Aucun"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nécessite un épipen</label>
                      {isEditMode ? (
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input type="radio" name="epipen" value="oui" checked={editedData.epipen === "oui"} onChange={(e) => handleFieldChange("epipen", e.target.value)} className="mr-2" />
                            Oui
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name="epipen" value="non" checked={editedData.epipen === "non"} onChange={(e) => handleFieldChange("epipen", e.target.value)} className="mr-2" />
                            Non
                          </label>
                        </div>
                      ) : (
                        <p className="text-gray-900">{enrollment.epipen || "-"}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Contacts scolaires */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">🏫 Contacts scolaires</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">École référente</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.ecoleReferente || ""} onChange={(e) => handleFieldChange("ecoleReferente", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.ecoleReferente}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'intervenant.e scolaire</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.intervenantNom || ""} onChange={(e) => handleFieldChange("intervenantNom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.intervenantNom || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.intervenantTitre || ""} onChange={(e) => handleFieldChange("intervenantTitre", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.intervenantTitre || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de poste</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.intervenantPoste || ""} onChange={(e) => handleFieldChange("intervenantPoste", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.intervenantPoste || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email intervenant</label>
                      {isEditMode ? (
                        <input type="email" value={editedData.intervenantEmail || ""} onChange={(e) => handleFieldChange("intervenantEmail", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.intervenantEmail}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Direction d'école</label>
                      {isEditMode ? (
                        <input type="text" value={editedData.directionNom || ""} onChange={(e) => handleFieldChange("directionNom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.directionNom}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email direction</label>
                      {isEditMode ? (
                        <input type="email" value={editedData.directionEmail || ""} onChange={(e) => handleFieldChange("directionEmail", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.directionEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 5: Programme et description */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Programme et description</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Programme choisi</label>
                      {isEditMode ? (
                        <select value={editedData.programme || ""} onChange={(e) => handleFieldChange("programme", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Sélectionner...</option>
                          <option value="ALT">ALT</option>
                          <option value="OPTION">OPTION</option>
                          <option value="PIVOT">PIVOT</option>
                          <option value="APOSTROPHE">APOSTROPHE</option>
                          <option value="SAUTS">SAUTS</option>
                          <option value="Suivis Estivaux">Suivis Estivaux</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{enrollment.programme}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date d'entrée au programme</label>
                      {isEditMode ? (
                        <input type="date" value={editedData.dateEntree || ""} onChange={(e) => handleFieldChange("dateEntree", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.dateEntree ? formatDate(enrollment.dateEntree) : "Non spécifié"}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin du programme</label>
                      {isEditMode ? (
                        <input type="date" value={editedData.dateFin || ""} onChange={(e) => handleFieldChange("dateFin", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.dateFin ? formatDate(enrollment.dateFin) : "Non spécifié"}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Suite au séjour, l'école envisage</label>
                      {isEditMode ? (
                        <select value={editedData.apresSejourPlan || ""} onChange={(e) => handleFieldChange("apresSejourPlan", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                          <option value="">Sélectionner...</option>
                          <option value="Changement d'école">Un changement d'école</option>
                          <option value="Changement de programme">Un changement de programme scolaire</option>
                          <option value="Réintégration">Une réintégration dans la même classe</option>
                          <option value="À évaluer">À évaluer</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{enrollment.apresSejourPlan || "-"}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motif principal de référence</label>
                      {isEditMode ? (
                        <textarea value={editedData.motifReference || ""} onChange={(e) => handleFieldChange("motifReference", e.target.value)} rows={3} placeholder="Comportements, attitudes, particularités et explication de la difficulté" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.motifReference || "-"}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Moyens déjà proposés à l'élève</label>
                      {isEditMode ? (
                        <textarea value={editedData.moyensProposesAutres || ""} onChange={(e) => handleFieldChange("moyensProposesAutres", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.moyensProposesAutres || "-"}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Suivi externe, préciser</label>
                      {isEditMode ? (
                        <textarea value={editedData.suiviExterne || ""} onChange={(e) => handleFieldChange("suiviExterne", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.suiviExterne || "-"}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motivations de l'adolescent.e</label>
                      {isEditMode ? (
                        <textarea value={editedData.motivationsAdolescent || ""} onChange={(e) => handleFieldChange("motivationsAdolescent", e.target.value)} rows={2} placeholder="Motivations nommées par l'adolescent.e à participer au programme" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        <p className="text-gray-900">{enrollment.motivationsAdolescent || "-"}</p>
                      )}
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
        )}

        {/* Notes View */}
        {currentView === "notes" && (
          <div className="space-y-6">
            {/* Boutons retour */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView("dashboard")}
                className="bg-white border border-gray-300 shadow-sm px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                ← Retour
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="bg-indigo-600 text-white shadow-sm px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                🏠 Menu Principal
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">📝 Notes de suivi</h1>

            {/* Contenu des notes */}
            <div className="bg-white rounded-lg shadow-md p-6 relative z-10">
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">📝 Notes de suivi</h2>
                  <div className="flex gap-2 relative z-20">
                    <button
                      onClick={() => setNotesTab("create")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors relative z-20 ${
                        notesTab === "create"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}>
                      ➕ Créer une note
                    </button>
                    <button
                      onClick={() => setNotesTab("view")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors relative z-20 ${
                        notesTab === "view"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}>
                      📋 Voir toutes les notes ({enrollmentNotes.length})
                    </button>
                  </div>
                </div>
                
                {/* Formulaire d'ajout de note */}
                {notesTab === "create" && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    📝 Nouvelle Note
                  </h3>
                  
                  {/* Section 1: Intervenant */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <span>👤</span> Auteur de la note
                    </label>
                    <select
                      value={noteCounters.intervenant}
                      onChange={(e) => setNoteCounters({...noteCounters, intervenant: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="">Sélectionner un intervenant...</option>
                      {intervenantsForDropdown.map((intervenant) => (
                        <option key={intervenant._id} value={`${intervenant.prenom} ${intervenant.nom}`}>
                          {intervenant.prenom} {intervenant.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section 2: Dates et Horaire */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span>📅</span> Date de création (auto)
                      </label>
                      <input
                        type="date"
                        value={noteCounters.dateCreation}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span>📆</span> Date d'événement
                      </label>
                      <input
                        type="date"
                        value={noteCounters.dateEvenement}
                        onChange={(e) => setNoteCounters({...noteCounters, dateEvenement: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <span>⏰</span> Horaire
                      </label>
                      <input
                        type="time"
                        value={noteCounters.horaire}
                        onChange={(e) => setNoteCounters({...noteCounters, horaire: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Section 3: Activité / Type de rencontre */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <span>🎯</span> Activité / Type de rencontre
                    </label>
                    <select
                      value={noteCounters.typeActivite}
                      onChange={(e) => setNoteCounters({...noteCounters, typeActivite: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="">Sélectionner le type d'activité...</option>
                      <option value="Rencontre individuelle">Rencontre individuelle</option>
                      <option value="Rencontre de groupe">Rencontre de groupe</option>
                      <option value="Contact téléphonique">Contact téléphonique</option>
                      <option value="Intervention scolaire">Intervention scolaire</option>
                      <option value="Activité de groupe">Activité de groupe</option>
                      <option value="Suivi avec partenaires">Suivi avec partenaires</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  {/* Section 4: Notions importantes / Observations */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <span>⚠️</span> Notions importantes / Observations
                    </label>
                    <textarea
                      value={noteCounters.notionsImportantes}
                      onChange={(e) => setNoteCounters({...noteCounters, notionsImportantes: e.target.value})}
                      placeholder="Notes importantes, observations clés..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* Section 6: Rappels / Suivis à faire */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <span>🎯</span> Rappels / Suivis à faire
                    </label>
                    <textarea
                      value={noteCounters.rappelsSuivis}
                      onChange={(e) => setNoteCounters({...noteCounters, rappelsSuivis: e.target.value})}
                      placeholder="Actions à effectuer, suivis nécessaires..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* Section 7: Contenu de la note */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <span>📝</span> Contenu de la note
                    </label>
                    <ReactQuill
                      theme="snow"
                      value={noteContent}
                      onChange={setNoteContent}
                      modules={quillModules}
                      formats={quillFormats}
                      className="bg-white"
                      style={{ height: "200px", marginBottom: "50px" }}
                    />
                  </div>
                  
                  {/* Compteurs de contacts */}
                  <div className="mt-4 space-y-3">
                    <h4 className="font-medium text-gray-900 text-sm">Interventions</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Contacts scolaires */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="font-medium text-blue-900 text-xs mb-2">👨‍🏫 Scolaire</h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Contact</label>
                            <input type="number" min="0" value={noteCounters.contactScolaire} onChange={(e) => setNoteCounters({...noteCounters, contactScolaire: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Rencontre</label>
                            <input type="number" min="0" value={noteCounters.rencontreScolaire} onChange={(e) => setNoteCounters({...noteCounters, rencontreScolaire: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Nombre</label>
                            <input type="number" min="0" value={noteCounters.nombreScolaire} onChange={(e) => setNoteCounters({...noteCounters, nombreScolaire: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Contacts jeune */}
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h5 className="font-medium text-green-900 text-xs mb-2">👤 Jeune</h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Contact</label>
                            <input type="number" min="0" value={noteCounters.contactJeune} onChange={(e) => setNoteCounters({...noteCounters, contactJeune: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Rencontre</label>
                            <input type="number" min="0" value={noteCounters.rencontreJeune} onChange={(e) => setNoteCounters({...noteCounters, rencontreJeune: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Nombre</label>
                            <input type="number" min="0" value={noteCounters.nombreJeune} onChange={(e) => setNoteCounters({...noteCounters, nombreJeune: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Contacts parents */}
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <h5 className="font-medium text-purple-900 text-xs mb-2">👨‍👩‍👧 Parents</h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Contact</label>
                            <input type="number" min="0" value={noteCounters.contactParent} onChange={(e) => setNoteCounters({...noteCounters, contactParent: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Rencontre</label>
                            <input type="number" min="0" value={noteCounters.rencontreParent} onChange={(e) => setNoteCounters({...noteCounters, rencontreParent: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Nombre</label>
                            <input type="number" min="0" value={noteCounters.nombreParent} onChange={(e) => setNoteCounters({...noteCounters, nombreParent: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Autres contacts */}
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <h5 className="font-medium text-orange-900 text-xs mb-2">🤝 Autres</h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Contact</label>
                            <input type="number" min="0" value={noteCounters.contactAutre} onChange={(e) => setNoteCounters({...noteCounters, contactAutre: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Rencontre</label>
                            <input type="number" min="0" value={noteCounters.rencontreAutre} onChange={(e) => setNoteCounters({...noteCounters, rencontreAutre: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-700 flex-1">Nombre</label>
                            <input type="number" min="0" value={noteCounters.nombreAutre} onChange={(e) => setNoteCounters({...noteCounters, nombreAutre: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Partenaires */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h5 className="font-medium text-gray-900 text-xs mb-2">🏢 Partenaires</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-700">Org. communautaire</label>
                          <input type="number" min="0" value={noteCounters.organismeCommunautaire} onChange={(e) => setNoteCounters({...noteCounters, organismeCommunautaire: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-700">Protection jeunesse</label>
                          <input type="number" min="0" value={noteCounters.protectionJeunesse} onChange={(e) => setNoteCounters({...noteCounters, protectionJeunesse: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-700">CISSSMO</label>
                          <input type="number" min="0" value={noteCounters.cisssmo} onChange={(e) => setNoteCounters({...noteCounters, cisssmo: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-700">École aux adultes</label>
                          <input type="number" min="0" value={noteCounters.ecoleAuxAdultes} onChange={(e) => setNoteCounters({...noteCounters, ecoleAuxAdultes: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-700">Milieu stage</label>
                          <input type="number" min="0" value={noteCounters.milieuStage} onChange={(e) => setNoteCounters({...noteCounters, milieuStage: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-700">Policier préventionniste</label>
                          <input type="number" min="0" value={noteCounters.policierPreventionniste} onChange={(e) => setNoteCounters({...noteCounters, policierPreventionniste: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-700">Ressource psychologique</label>
                          <input type="number" min="0" value={noteCounters.ressourcePsychologique} onChange={(e) => setNoteCounters({...noteCounters, ressourcePsychologique: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>

                  
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim()}
                    className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                    ➕ Ajouter la note
                  </button>
                </div>
                )}
                
                {/* Liste des notes */}
                {notesTab === "view" && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Notes existantes ({enrollmentNotes.length})</h3>
                  {notesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : enrollmentNotes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aucune note pour le moment
                    </div>
                  ) : (
                    enrollmentNotes.map((note) => (
                      <div key={note._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        {/* En-tête avec intervenant et actions */}
                        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                          <div className="flex-1">
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-600 mb-1">👤 Intervenant</label>
                              {editingNoteId === note._id ? (
                                <select
                                  value={editingNoteCounters.intervenant || ""}
                                  onChange={(e) => setEditingNoteCounters({...editingNoteCounters, intervenant: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                                  <option value="">Sélectionner un intervenant...</option>
                                  {intervenantsForDropdown.map((intervenant) => (
                                    <option key={intervenant._id} value={`${intervenant.prenom} ${intervenant.nom}`}>
                                      {intervenant.prenom} {intervenant.nom}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-lg font-bold text-gray-900">
                                  {typeof note.auteurNom === 'string' ? note.auteurNom : (note.counters && typeof note.counters === 'object' && typeof note.counters.intervenant === 'string' ? note.counters.intervenant : (typeof note.author === 'string' ? note.author : "-"))}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">📅 Date création</label>
                                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-medium">
                                  {note.counters?.dateCreation ? formatDate(note.counters.dateCreation) : (note.dateCreation ? formatDate(note.dateCreation) : (note.createdAt ? formatDate(note.createdAt) : "-"))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">📆 Date événement</label>
                                {editingNoteId === note._id ? (
                                  <input
                                    type="date"
                                    value={editingNoteCounters.dateEvenement || ""}
                                    onChange={(e) => setEditingNoteCounters({...editingNoteCounters, dateEvenement: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-900">
                                    {note.counters?.dateEvenement ? formatDate(note.counters.dateEvenement) : "-"}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">⏰ Horaire</label>
                                {editingNoteId === note._id ? (
                                  <input
                                    type="time"
                                    value={editingNoteCounters.horaire || ""}
                                    onChange={(e) => setEditingNoteCounters({...editingNoteCounters, horaire: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-900">{note.counters?.horaire || "-"}</div>
                                )}
                              </div>
                            </div>

                          </div>
                          <div className="flex items-center gap-2">
                            {editingNoteId !== note._id && (
                              <>
                                <button
                                  onClick={() => handleEditNote(note._id, note.content, note.counters)}
                                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                  ✏️ Modifier
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Supprimer cette note ?")) {
                                      try {
                                        await deleteNote(note._id)
                                        toast.success("Note supprimée")
                                      } catch (error) {
                                        toast.error("Erreur lors de la suppression")
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium">
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Type d'activité */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-600 mb-1">🎯 Activité / Type de rencontre</label>
                          {editingNoteId === note._id ? (
                            <select
                              value={editingNoteCounters.typeActivite || ""}
                              onChange={(e) => setEditingNoteCounters({...editingNoteCounters, typeActivite: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                              <option value="">Sélectionner le type d'activité...</option>
                              <option value="Rencontre individuelle">Rencontre individuelle</option>
                              <option value="Rencontre de groupe">Rencontre de groupe</option>
                              <option value="Contact téléphonique">Contact téléphonique</option>
                              <option value="Intervention scolaire">Intervention scolaire</option>
                              <option value="Activité de groupe">Activité de groupe</option>
                              <option value="Suivi avec partenaires">Suivi avec partenaires</option>
                              <option value="Autre">Autre</option>
                            </select>
                          ) : (
                            <div className={note.counters?.typeActivite ? "bg-indigo-50 p-3 rounded-lg text-sm font-medium text-indigo-900" : "text-sm text-gray-500"}>
                              {note.counters?.typeActivite || "-"}
                            </div>
                          )}
                        </div>

                        {/* Notions importantes */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-600 mb-1">⚠️ Notions importantes / Observations</label>
                          {editingNoteId === note._id ? (
                            <textarea
                              value={editingNoteCounters.notionsImportantes || ""}
                              onChange={(e) => setEditingNoteCounters({...editingNoteCounters, notionsImportantes: e.target.value})}
                              placeholder="Notes importantes, observations clés..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                          ) : (
                            <div className={note.counters?.notionsImportantes ? "bg-yellow-50 p-3 rounded-lg text-sm text-gray-800" : "text-sm text-gray-500"}>
                              {note.counters?.notionsImportantes || "-"}
                            </div>
                          )}
                        </div>

                        {/* Contenu principal */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                            <span>📝</span> Contenu de la note
                          </h4>
                          {editingNoteId === note._id ? (
                            <div>
                              <ReactQuill
                                theme="snow"
                                value={editingNoteContent}
                                onChange={setEditingNoteContent}
                                modules={quillModules}
                                formats={quillFormats}
                                className="bg-white"
                                style={{ height: "150px", marginBottom: "50px" }}
                              />
                            </div>
                          ) : (
                            <div
                              className="text-gray-700 prose prose-sm max-w-none bg-gray-50 p-3 rounded-lg"
                              dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                          )}
                        </div>

                        {/* Rappels / Suivis */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-600 mb-1">🎯 Rappels / Suivis à faire</label>
                          {editingNoteId === note._id ? (
                            <textarea
                              value={editingNoteCounters.rappelsSuivis || ""}
                              onChange={(e) => setEditingNoteCounters({...editingNoteCounters, rappelsSuivis: e.target.value})}
                              placeholder="Actions à effectuer, suivis nécessaires..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                          ) : (
                            <div className={note.counters?.rappelsSuivis ? "bg-blue-50 p-3 rounded-lg text-sm text-gray-800" : "text-sm text-gray-500"}>
                              {note.counters?.rappelsSuivis || "-"}
                            </div>
                          )}
                        </div>
                        
                        {/* Interventions */}
                        <div className="mb-4">
                          <h4 className="text-xs font-medium text-gray-600 mb-2">📊 Interventions</h4>
                          {editingNoteId === note._id ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              {/* Scolaire */}
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <h5 className="font-medium text-blue-900 text-xs mb-2">👨‍🏫 Scolaire</h5>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Contact</label>
                                    <input type="number" min="0" value={editingNoteCounters.contactScolaire || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, contactScolaire: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Rencontre</label>
                                    <input type="number" min="0" value={editingNoteCounters.rencontreScolaire || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, rencontreScolaire: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Nombre</label>
                                    <input type="number" min="0" value={editingNoteCounters.nombreScolaire || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, nombreScolaire: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Jeune */}
                              <div className="bg-green-50 p-3 rounded-lg">
                                <h5 className="font-medium text-green-900 text-xs mb-2">👤 Jeune</h5>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Contact</label>
                                    <input type="number" min="0" value={editingNoteCounters.contactJeune || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, contactJeune: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Rencontre</label>
                                    <input type="number" min="0" value={editingNoteCounters.rencontreJeune || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, rencontreJeune: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Nombre</label>
                                    <input type="number" min="0" value={editingNoteCounters.nombreJeune || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, nombreJeune: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Parents */}
                              <div className="bg-purple-50 p-3 rounded-lg">
                                <h5 className="font-medium text-purple-900 text-xs mb-2">👨‍👩‍👧 Parents</h5>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Contact</label>
                                    <input type="number" min="0" value={editingNoteCounters.contactParent || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, contactParent: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Rencontre</label>
                                    <input type="number" min="0" value={editingNoteCounters.rencontreParent || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, rencontreParent: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Nombre</label>
                                    <input type="number" min="0" value={editingNoteCounters.nombreParent || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, nombreParent: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Autres */}
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <h5 className="font-medium text-orange-900 text-xs mb-2">🤝 Autres</h5>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Contact</label>
                                    <input type="number" min="0" value={editingNoteCounters.contactAutre || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, contactAutre: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Rencontre</label>
                                    <input type="number" min="0" value={editingNoteCounters.rencontreAutre || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, rencontreAutre: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 flex-1">Nombre</label>
                                    <input type="number" min="0" value={editingNoteCounters.nombreAutre || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, nombreAutre: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Scolaire */}
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <h5 className="font-medium text-blue-900 text-xs mb-2">👨‍🏫 Scolaire</h5>
                                <div className="space-y-1 text-xs text-blue-800">
                                  <div>Contact: {note.counters?.contactScolaire || 0}</div>
                                  <div>Rencontre: {note.counters?.rencontreScolaire || 0}</div>
                                  <div>Nombre: {note.counters?.nombreScolaire || 0}</div>
                                </div>
                              </div>
                              {/* Jeune */}
                              <div className="bg-green-50 p-3 rounded-lg">
                                <h5 className="font-medium text-green-900 text-xs mb-2">👤 Jeune</h5>
                                <div className="space-y-1 text-xs text-green-800">
                                  <div>Contact: {note.counters?.contactJeune || 0}</div>
                                  <div>Rencontre: {note.counters?.rencontreJeune || 0}</div>
                                  <div>Nombre: {note.counters?.nombreJeune || 0}</div>
                                </div>
                              </div>
                              {/* Parents */}
                              <div className="bg-purple-50 p-3 rounded-lg">
                                <h5 className="font-medium text-purple-900 text-xs mb-2">👨‍👩‍👧 Parents</h5>
                                <div className="space-y-1 text-xs text-purple-800">
                                  <div>Contact: {note.counters?.contactParent || 0}</div>
                                  <div>Rencontre: {note.counters?.rencontreParent || 0}</div>
                                  <div>Nombre: {note.counters?.nombreParent || 0}</div>
                                </div>
                              </div>
                              {/* Autres */}
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <h5 className="font-medium text-orange-900 text-xs mb-2">🤝 Autres</h5>
                                <div className="space-y-1 text-xs text-orange-800">
                                  <div>Contact: {note.counters?.contactAutre || 0}</div>
                                  <div>Rencontre: {note.counters?.rencontreAutre || 0}</div>
                                  <div>Nombre: {note.counters?.nombreAutre || 0}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Partenaires */}
                        {editingNoteId === note._id ? (
                          <div className="mb-4">
                            <h4 className="text-xs font-medium text-gray-600 mb-2">🏢 Partenaires</h4>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-700">Org. communautaire</label>
                                  <input type="number" min="0" value={editingNoteCounters.organismeCommunautaire || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, organismeCommunautaire: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-700">Protection jeunesse</label>
                                  <input type="number" min="0" value={editingNoteCounters.protectionJeunesse || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, protectionJeunesse: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-700">CISSSMO</label>
                                  <input type="number" min="0" value={editingNoteCounters.cisssmo || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, cisssmo: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-700">École aux adultes</label>
                                  <input type="number" min="0" value={editingNoteCounters.ecoleAuxAdultes || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, ecoleAuxAdultes: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-700">Milieu stage</label>
                                  <input type="number" min="0" value={editingNoteCounters.milieuStage || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, milieuStage: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-700">Policier préventionniste</label>
                                  <input type="number" min="0" value={editingNoteCounters.policierPreventionniste || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, policierPreventionniste: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-700">Ressource psychologique</label>
                                  <input type="number" min="0" value={editingNoteCounters.ressourcePsychologique || 0} onChange={(e) => setEditingNoteCounters({...editingNoteCounters, ressourcePsychologique: parseInt(e.target.value) || 0})} className="w-12 px-1 py-1 text-xs border border-gray-300 rounded" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          note.counters && (note.counters.organismeCommunautaire > 0 || note.counters.protectionJeunesse > 0 || note.counters.cisssmo > 0 || note.counters.ecoleAuxAdultes > 0 || note.counters.milieuStage > 0 || note.counters.policierPreventionniste > 0 || note.counters.ressourcePsychologique > 0) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">🏢 Partenaires</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                {note.counters.organismeCommunautaire > 0 && <span className="bg-gray-100 px-2 py-1 rounded">Org. comm.: {note.counters.organismeCommunautaire}</span>}
                                {note.counters.protectionJeunesse > 0 && <span className="bg-gray-100 px-2 py-1 rounded">Protection: {note.counters.protectionJeunesse}</span>}
                                {note.counters.cisssmo > 0 && <span className="bg-gray-100 px-2 py-1 rounded">CISSSMO: {note.counters.cisssmo}</span>}
                                {note.counters.ecoleAuxAdultes > 0 && <span className="bg-gray-100 px-2 py-1 rounded">École adultes: {note.counters.ecoleAuxAdultes}</span>}
                                {note.counters.milieuStage > 0 && <span className="bg-gray-100 px-2 py-1 rounded">Stage: {note.counters.milieuStage}</span>}
                                {note.counters.policierPreventionniste > 0 && <span className="bg-gray-100 px-2 py-1 rounded">Policier: {note.counters.policierPreventionniste}</span>}
                                {note.counters.ressourcePsychologique > 0 && <span className="bg-gray-100 px-2 py-1 rounded">Psycho: {note.counters.ressourcePsychologique}</span>}
                              </div>
                            </div>
                          )
                        )}

                        {/* Boutons de sauvegarde en mode édition */}
                        {editingNoteId === note._id && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => handleSaveNote(note._id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                              ✓ Sauvegarder toutes les modifications
                            </button>
                            <button
                              onClick={handleCancelNoteEdit}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                              Annuler
                            </button>
                          </div>
                        )}

                        {/* Date de création */}
                        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                          Créée le {note.createdAt ? formatDateTime(note.createdAt) : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                )}
            </div>
            </div>
          </div>
        )}

        {/* Presences View */}
        {currentView === "presences" && (
          <div className="space-y-6">
            {/* Boutons retour */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView("dashboard")}
                className="bg-white border border-gray-300 shadow-sm px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                ← Retour
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="bg-indigo-600 text-white shadow-sm px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                🏠 Menu Principal
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">📅 Feuille de présence</h1>

            {/* Contenu des présences */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {!enrollment.dateEntree || !enrollment.dateFin ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Les dates d'entrée et de fin doivent être définies pour afficher la feuille de présence.</p>
                  <button
                    onClick={() => setCurrentView("fiche")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Configurer les dates
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats de présence */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Statistiques de présence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-indigo-600">{attendanceStats.total}</div>
                        <div className="text-sm text-gray-600 mt-1">Jours ouvrables</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{attendanceStats.present}</div>
                        <div className="text-sm text-gray-600 mt-1">Présences</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-red-600">
                          {attendances.filter(a => a.status === "absent").length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Absences</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {attendances.filter(a => a.status === "exclu").length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Exclusions</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">{attendanceStats.percentage}%</div>
                        <div className="text-sm text-gray-600 mt-1">Taux de présence</div>
                      </div>
                    </div>
                  </div>

                  {/* Calendrier des présences */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">📅 Calendrier ({enrollment.dateEntree ? formatDate(enrollment.dateEntree) : ""} - {enrollment.dateFin ? formatDate(enrollment.dateFin) : ""})</h3>
                      <button
                        onClick={() => setViewCalendarMode(!viewCalendarMode)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        {viewCalendarMode ? "📋 Vue liste" : "📅 Vue calendrier"}
                      </button>
                    </div>

                    {viewCalendarMode ? (
                      <CalendarView
                        attendances={attendances}
                        enrollment={enrollment}
                        onTogglePresence={async (date, currentStatus) => {
                          const attendance = attendances.find(a => a.date.split('T')[0] === date)
                          const newStatus = currentStatus === "present" ? "absent" : "present"
                          
                          if (attendance) {
                            await updateAttendance(attendance._id, { status: newStatus })
                          } else {
                            await createAttendance({
                              enrollmentId,
                              date,
                              status: newStatus
                            })
                          }
                          toast.success(`Marqué comme ${newStatus === "present" ? "présent" : "absent"}`)
                        }}
                      />
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {getWeekdays(enrollment.dateEntree, enrollment.dateFin).map((date) => {
                          const attendance = attendances.find(a => a.date.split('T')[0] === date)
                          const status = attendance?.status || "non_marque"
                          const statusConfig = {
                            present: { bg: "bg-green-100", text: "text-green-800", icon: "✓", label: "Présent" },
                            absent: { bg: "bg-red-100", text: "text-red-800", icon: "✗", label: "Absent" },
                            exclu: { bg: "bg-orange-100", text: "text-orange-800", icon: "🚫", label: "Exclu" },
                            non_marque: { bg: "bg-gray-100", text: "text-gray-600", icon: "?", label: "Non marqué" }
                          }

                          return (
                            <div key={date} className={`flex items-center justify-between p-4 rounded-lg border ${statusConfig[status].bg}`}>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{statusConfig[status].icon}</span>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </div>
                                  <div className={`text-sm ${statusConfig[status].text}`}>
                                    {statusConfig[status].label}
                                  </div>
                                  {attendance?.motifAbsence && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      Motif: {attendance.motifAbsence}
                                    </div>
                                  )}
                                  {attendance?.commentaire && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {attendance.commentaire}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {status !== "present" && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        if (attendance) {
                                          await updateAttendance(attendance._id, { status: "present" })
                                        } else {
                                          await createAttendance({
                                            enrollmentId,
                                            date,
                                            status: "present"
                                          })
                                        }
                                        toast.success("Marqué comme présent")
                                      } catch (error) {
                                        toast.error("Erreur")
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                                    ✓ Présent
                                  </button>
                                )}
                                {status !== "absent" && (
                                  <button
                                    onClick={() => {
                                      setSelectedAbsenceDate(date)
                                      setShowAbsenceModal(true)
                                    }}
                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                                    ✗ Absent
                                  </button>
                                )}
                                {status !== "exclu" && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const commentaire = prompt("Raison de l'exclusion (optionnel):") || ""
                                        if (attendance) {
                                          await updateAttendance(attendance._id, { status: "exclu", commentaire })
                                        } else {
                                          await createAttendance({
                                            enrollmentId,
                                            date,
                                            status: "exclu",
                                            commentaire
                                          })
                                        }
                                        toast.success("Marqué comme exclu")
                                      } catch (error) {
                                        toast.error("Erreur")
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
                                    🚫 Exclu
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents View */}
        {currentView === "documents" && (
          <div className="space-y-6">
            {/* Boutons retour */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView("dashboard")}
                className="bg-white border border-gray-300 shadow-sm px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                ← Retour
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="bg-indigo-600 text-white shadow-sm px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                🏠 Menu Principal
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">📁 Documents</h1>

            {/* Contenu des documents */}
            <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📄 Documents PDF</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploadingFiles}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg transition-all ${
                    isUploadingFiles ? "opacity-75 cursor-not-allowed" : "hover:bg-indigo-700 cursor-pointer"
                  }`}>
                  {isUploadingFiles ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Téléversement en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      <span>Télécharger des fichiers</span>
                    </>
                  )}
                </label>
                <p className="text-sm text-gray-500 mt-2">Formats acceptés: PDF uniquement</p>
                {isUploadingFiles && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{width: `${uploadProgress}%`}}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-indigo-600 font-medium">Téléversement en cours...</p>
                      <p className="text-sm text-indigo-700 font-bold">{Math.round(uploadProgress)}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Liste des documents */}
              {docsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : enrollmentDocs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun document pour le moment
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrollmentDocs.map((doc) => (
                    <div key={doc._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-3xl">📄</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 break-all">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {doc.createdAt ? formatDate(doc.createdAt) : ""}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                          className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1">
                          👁️ Visualiser
                        </button>
                        <a
                          href={doc.fileUrl}
                          download={doc.fileName}
                          onClick={() => toast.success("Téléchargement démarré")}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                          ⬇️ Télécharger
                        </a>
                        <button
                          onClick={async () => {
                            if (confirm("Supprimer ce document ?")) {
                              try {
                                await deleteDocument(doc._id, doc.fileUrl)
                                toast.success("Document supprimé")
                              } catch (error) {
                                toast.error("Erreur lors de la suppression")
                              }
                            }
                          }}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1">
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Modal Rapport */}
      {showReportEditor && (
        <ReportSelector
          enrollmentId={enrollmentId}
          enrollmentName={`${enrollment.prenom || ""} ${enrollment.nom || ""}`.trim() || enrollment.titre}
          isVirtual={enrollment.prenom === ""}
          onClose={() => setShowReportEditor(false)}
        />
      )}

      {/* Modal Courriel */}
      {showEmailModal && (enrollment.parent1Email || enrollment.parent2Email || enrollment.intervenantEmail || enrollment.directionEmail || enrollment.contactUrgenceEmail) && (() => {
        const availableEmails = []
        if (enrollment.parent1Email) {
          availableEmails.push({
            label: `Parent 1 (${enrollment.parent1Prenom || ''} ${enrollment.parent1Nom || ''})`.trim(),
            email: enrollment.parent1Email
          })
        }
        if (enrollment.parent2Email) {
          availableEmails.push({
            label: `Parent 2 (${enrollment.parent2Prenom || ''} ${enrollment.parent2Nom || ''})`.trim(),
            email: enrollment.parent2Email
          })
        }
        if (enrollment.contactUrgenceEmail) {
          availableEmails.push({
            label: `Contact urgence (${enrollment.contactUrgence || ''})`,
            email: enrollment.contactUrgenceEmail
          })
        }
        if (enrollment.intervenantEmail) {
          availableEmails.push({
            label: `Intervenant scolaire (${enrollment.intervenantNom || ''})`,
            email: enrollment.intervenantEmail
          })
        }
        if (enrollment.directionEmail) {
          availableEmails.push({
            label: `Direction école (${enrollment.directionNom || ''})`,
            email: enrollment.directionEmail
          })
        }
        
        return (
          <EmailModal
            enrollmentId={enrollmentId}
            studentName={`${enrollment.prenom} ${enrollment.nom}`}
            availableEmails={availableEmails}
            onClose={() => setShowEmailModal(false)}
            onSuccessCreateNote={handleEmailNoteCreation} // <--- CORRECTION MAJEURE: AJOUT DE LA PROP
          />
        )
      })()}

      {/* Modal d'absence avec motif et commentaire */}
      {showAbsenceModal && selectedAbsenceDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">❌ Marquer comme absent</h3>
              <p className="text-gray-600 mb-4">
                Date: <strong>{selectedAbsenceDate ? formatDate(selectedAbsenceDate) : ""}</strong>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif d'absence</label>
                <select
                  value={absenceMotif}
                  onChange={(e) => setAbsenceMotif(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Sélectionner un motif...</option>
                  <option value="Maladie">Maladie</option>
                  <option value="Rendez-vous médical">Rendez-vous médical</option>
                  <option value="Raisons familiales">Raisons familiales</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Non justifié">Non justifié</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire (optionnel)</label>
                <textarea
                  value={absenceCommentaire}
                  onChange={(e) => setAbsenceCommentaire(e.target.value)}
                  rows={3}
                  placeholder="Détails supplémentaires..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAbsenceModal(false)
                    setSelectedAbsenceDate(null)
                    setAbsenceMotif("")
                    setAbsenceCommentaire("")
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (!selectedAbsenceDate) return
                    try {
                      const attendance = attendances.find(a => a.date.split('T')[0] === selectedAbsenceDate)
                      
                      const absenceData = {
                        status: "absent",
                        motifAbsence: absenceMotif,
                        commentaire: absenceCommentaire
                      }

                      if (attendance) {
                        await updateAttendance(attendance._id, absenceData)
                      } else {
                        await createAttendance({
                          enrollmentId,
                          date: selectedAbsenceDate,
                          ...absenceData
                        })
                      }
                      
                      toast.success("Absence enregistrée")
                      setShowAbsenceModal(false)
                      setSelectedAbsenceDate(null)
                      setAbsenceMotif("")
                      setAbsenceCommentaire("")
                    } catch (error) {
                      toast.error("Erreur lors de l'enregistrement")
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Confirmer l'absence
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}