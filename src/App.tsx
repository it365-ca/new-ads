import React, { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"
import { useCustomAuth } from "./hooks/useCustomAuth"
import { CustomLoginPage } from "./components/CustomLoginPage"
import { ResetPasswordPage } from "./components/ResetPasswordPage"
import { CompleteRegistrationPage } from "./components/CompleteRegistrationPage"
import { CreateFirstAdmin } from "./components/CreateFirstAdmin"
import { EnrollmentDashboard } from "./components/EnrollmentDashboard"
import { PublicEnrollmentPage } from "./components/PublicEnrollmentPage"
import SetupPage from "./components/SetupPage"
import { StatsSamplePage } from "./components/StatsSamplePage"
import { WeatherTestPage } from "./components/WeatherTestPage"
import { IntervenantsManagement } from "./components/IntervenantsManagement"
import { IntervenantsManagementPage } from "./pages/IntervenantsManagementPage"
import { ProgrammeManagement } from "./components/ProgrammeManagement"
import { PlanificationManagement } from "./components/PlanificationManagement"
import { UnifiedCalendarPlanning } from "./components/UnifiedCalendarPlanning"


import { NotificationBell } from "./components/NotificationBell"
import { WeatherWidget } from "./components/WeatherWidget"
import { AuditTrailModal } from "./components/AuditTrailModal"
import { AppointmentModal } from "./components/AppointmentModal"
import { AppointmentCalendarView } from "./components/AppointmentCalendarView"
import { Sidebar } from "./components/Sidebar"
import { ThemeCustomizer } from "./components/ThemeCustomizer"
import { DailyAttendanceSheet } from "./components/DailyAttendanceSheet"
import { CreateTestStudent } from "./pages/CreateTestStudent"
import { StudentCallList } from "./components/StudentCallList"
import { InitializeProgrammes } from "./pages/InitializeProgrammes"
import { ReportTemplateManagement } from "./components/ReportTemplateManagement"
import { useThemeContext } from "./contexts/ThemeContext"
import { lumi } from "./lib/lumi"
import { useEnrollments } from "./hooks/useEnrollments"

type TabType = "dashboard" | "presence" | "calendrier-planification" | "administration" | "tickets" | "support"

function MainApp() {
  const navigate = useNavigate()
  const { user, isAuthenticated, signOut, isLoading: authLoading } = useCustomAuth()
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [openNewStudentForm, setOpenNewStudentForm] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isSeeding, setIsSeeding] = useState(false)
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false)
  const themeContext = useThemeContext()
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showProgrammeManagement, setShowProgrammeManagement] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const { enrollments } = useEnrollments()
  
  // États pour le modal de prévisualisation du transfert
  const [showTransferPreview, setShowTransferPreview] = useState(false)
  const [showStudentSelectionModal, setShowStudentSelectionModal] = useState(false)
  const [selectedVirtualProfile, setSelectedVirtualProfile] = useState<any>(null)
  const [transferPreviewData, setTransferPreviewData] = useState<{
    virtualProfile: any
    targetStudent: any
    notesToTransfer: any[]
    documentsToTransfer: any[]
    fieldsToMerge: { field: string; virtualValue: any; currentValue: any }[]
  } | null>(null)

  // Fonction pour déterminer le message selon l'heure
  const getGreetingMessage = () => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 12) return "☀️ Bon Matin"
    if (hour >= 12 && hour < 18) return "☁️ Bon après-midi"
    return "🌙 Bonne soirée"
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const handleSeedStudents = async () => {
    if (!window.confirm("⚠️ Voulez-vous vraiment générer 20 étudiants fictifs ? Cette action va créer 20 nouvelles inscriptions.")) {
      return
    }

    setIsSeeding(true)
    const loadingToast = toast.loading("Génération de 20 étudiants fictifs en cours...")

    try {
      const sessionToken = localStorage.getItem("benado_session_token")
      console.log("🔑 Token custom avant appel:", sessionToken)
      if (!sessionToken) {
        toast.error("Erreur: Vous n'êtes pas connecté. Veuillez vous reconnecter.", { id: loadingToast })
        return
      }

      const response = await apiClient.functions.invoke("seedStudents20", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sessionToken}`
        },
        body: {}
      })
      
      if (response?.success) {
        toast.success(response.message || "20 étudiants fictifs créés avec succès !", { id: loadingToast, duration: 5000 })
        window.location.reload()
      } else {
        toast.error(response?.error || "Erreur lors de la génération", { id: loadingToast })
      }
    } catch (error) {
      console.error("Erreur seed:", error)
      toast.error("Erreur lors de la génération des étudiants", { id: loadingToast })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCreateTestEnrollment = async () => {
    const loadingToast = toast.loading("Création d'un étudiant test et envoi de l'email...")

    try {
      // Créer l'enrollment de test
      const testEnrollment = {
        nom: "Testé",
        prenom: "Jean",
        dateNaissance: "2010-05-15",
        age: "14",
        origine: "Canadienne",
        genre: "Masculin",
        degreScolaire: "Secondaire 2",
        adresseComplete: "123 Rue Test",
        appartement: "",
        codePostal: "J5V 1A1",
        ville: "St-Constant",
        demeurAvec: "Les deux parents",
        parent1Type: "Mère",
        parent1Nom: "Testé",
        parent1Prenom: "Marie",
        parent1Tel: "(450)123-4567",
        parent1Email: "test@example.com",
        parent2Type: "",
        parent2Nom: "",
        parent2Prenom: "",
        parent2Tel: "",
        parent2Email: "",
        contactUrgence: "Marie Testé",
        contactUrgenceTel: "(450)123-4567",
        contactUrgenceLien: "Mère",
        problemeSante: "",
        allergies: "",
        epipen: "non",
        ecoleReferente: "Jacques-Leber",
        intervenantNom: "Dupont",
        intervenantTitre: "Psychoéducateur",
        intervenantPoste: "1234",
        intervenantEmail: "intervenant@test.com",
        directionNom: "Martin",
        directionEmail: "direction@test.com",
        programme: "ALT",
        dateEntree: "2025-01-15",
        dateFin: "2025-01-25",
        apresSejourPlan: "Réintégration",
        motifReference: "Test d'envoi d'email",
        moyensProposesAutres: "",
        suiviExterne: "",
        motivationsAdolescent: "Participer au test",
        status: "en_attente"
      }

      await apiClient.entities.enrollments.create(testEnrollment)

      // Envoyer l'email de notification
      try {
        await apiClient.functions.invoke("notifyNewEnrollment", {
          method: "POST",
          body: {
            enrollment: {
              nom: testEnrollment.nom,
              prenom: testEnrollment.prenom,
              dateNaissance: testEnrollment.dateNaissance,
              age: testEnrollment.age,
              programme: testEnrollment.programme,
              dateEntree: testEnrollment.dateEntree,
              ecoleReferente: testEnrollment.ecoleReferente,
              parent1Nom: testEnrollment.parent1Nom,
              parent1Email: testEnrollment.parent1Email,
              parent1Tel: testEnrollment.parent1Tel,
              motifReference: testEnrollment.motifReference
            }
          }
        })
        toast.success("✅ Étudiant test créé et email envoyé !", { id: loadingToast })
      } catch (emailError) {
        console.error("Erreur email:", emailError)
        toast.error("Étudiant créé mais erreur lors de l'envoi de l'email", { id: loadingToast })
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la création de l'étudiant test", { id: loadingToast })
    }
  }

  const handleCleanupOrphanNotes = async () => {
    if (!window.confirm("⚠️ ATTENTION : Cette action va supprimer DÉFINITIVEMENT toutes les notes orphelines (notes liées à des étudiants supprimés). Continuer ?")) {
      return
    }

    const loadingToast = toast.loading("🧹 Nettoyage des notes orphelines en cours...")

    try {
      console.log("🔍 Appel Deno Function cleanupOrphanNotes")
      
      // Appel direct à la Deno Function via l'URL correcte
      const projectId = "p384255179950706688"
      const functionUrl = `https://api.lumi.new/v1/functions/${projectId}/cleanupOrphanNotes`
      
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("✅ Résultat:", result)

      if (result?.success) {
        toast.success(`✅ ${result.message} (${result.deletedCount} notes supprimées)`, { id: loadingToast })
        if (result.errors && result.errors.length > 0) {
          console.warn("⚠️ Erreurs partielles:", result.errors)
        }
      } else {
        throw new Error(result?.error || "Erreur inconnue")
      }
    } catch (error: any) {
      console.error("❌ Erreur nettoyage:", error?.message || error)
      toast.error(`❌ Erreur: ${error?.message || "Erreur inconnue"}`, { id: loadingToast })
    }
  }

  // Handler pour ouvrir le modal de sélection d'étudiant
  const handleInitiateTransfer = (virtualProfile: any) => {
    console.log("🔄 Ouverture modal sélection étudiant pour:", virtualProfile.titre)
    setSelectedVirtualProfile(virtualProfile)
    setShowStudentSelectionModal(true)
  }

  // Handler pour préparer la prévisualisation du transfert
  const handleShowTransferPreview = async (virtualProfile: any, targetStudent: any) => {
    console.log("🔍 Préparation de la prévisualisation du transfert...", { virtualProfile, targetStudent })
    
    if (!targetStudent) {
      toast.error("Aucun étudiant sélectionné")
      return
    }

    try {
      // Récupérer toutes les notes du profil virtuel
      const { list: allNotes } = await lumi.entities.notes.list({
        filter: { enrollmentId: virtualProfile._id },
        sort: { createdAt: -1 }
      })
      
      // Récupérer tous les documents du profil virtuel
      const { list: allDocuments } = await lumi.entities.documents.list({
        filter: { enrollmentId: virtualProfile._id },
        sort: { uploadedAt: -1 }
      })
      
      // Préparer les champs qui seront fusionnés
      const fieldsToMerge = [
        { field: "Programme", virtualValue: virtualProfile.programme || "N/A", currentValue: targetStudent.programme || "N/A" },
        { field: "École", virtualValue: virtualProfile.ecoleReferente || "N/A", currentValue: targetStudent.ecoleReferente || "N/A" },
        { field: "Motif de référence", virtualValue: virtualProfile.motifReference || "N/A", currentValue: targetStudent.motifReference || "N/A" },
        { field: "Après séjour", virtualValue: virtualProfile.apresSejourPlan || "N/A", currentValue: targetStudent.apresSejourPlan || "N/A" }
      ]
      
      // Mettre à jour les données de prévisualisation
      setTransferPreviewData({
        virtualProfile,
        targetStudent,
        notesToTransfer: allNotes,
        documentsToTransfer: allDocuments,
        fieldsToMerge
      })
      
      setShowTransferPreview(true)
      setShowStudentSelectionModal(false)
      console.log("✅ Prévisualisation prête", { notesCount: allNotes.length, documentsCount: allDocuments.length })
    } catch (error) {
      console.error("❌ Erreur préparation prévisualisation:", error)
      toast.error("Erreur lors de la prévisualisation")
    }
  }
  
  // Handler pour confirmer et exécuter le transfert complet
  const handleConfirmTransfer = async () => {
    if (!transferPreviewData) return
    
    const loadingToast = toast.loading("Transfert complet en cours...")
    
    try {
      const { virtualProfile, targetStudent, notesToTransfer, documentsToTransfer } = transferPreviewData
      
      // 1. Transférer toutes les notes
      for (const note of notesToTransfer) {
        await lumi.entities.notes.update((note as any)._id, {
          enrollmentId: targetStudent._id
        })
      }
      
      // 2. Transférer tous les documents
      for (const doc of documentsToTransfer) {
        await lumi.entities.documents.update((doc as any)._id, {
          enrollmentId: targetStudent._id
        })
      }
      
      // 3. Fusionner les informations du profil virtuel dans l'étudiant cible
      const updatedFields: any = {}
      
      if (virtualProfile.programme && !targetStudent.programme) {
        updatedFields.programme = virtualProfile.programme
      }
      if (virtualProfile.ecoleReferente && !targetStudent.ecoleReferente) {
        updatedFields.ecoleReferente = virtualProfile.ecoleReferente
      }
      if (virtualProfile.motifReference && !targetStudent.motifReference) {
        updatedFields.motifReference = virtualProfile.motifReference
      }
      if (virtualProfile.apresSejourPlan && !targetStudent.apresSejourPlan) {
        updatedFields.apresSejourPlan = virtualProfile.apresSejourPlan
      }
      if (virtualProfile.suiviExterne && !targetStudent.suiviExterne) {
        updatedFields.suiviExterne = virtualProfile.suiviExterne
      }
      if (virtualProfile.motivationsAdolescent && !targetStudent.motivationsAdolescent) {
        updatedFields.motivationsAdolescent = virtualProfile.motivationsAdolescent
      }
      
      // Mettre à jour l'étudiant cible avec les champs fusionnés
      if (Object.keys(updatedFields).length > 0) {
        await lumi.entities.enrollments.update(targetStudent._id, updatedFields)
      }
      
      // 4. Supprimer le profil virtuel
      await lumi.entities.enrollments.delete(virtualProfile._id)
      
      toast.success(`✅ Transfert complet réussi ! ${notesToTransfer.length} notes et ${documentsToTransfer.length} documents transférés.`, { id: loadingToast, duration: 5000 })
      
      // Fermer le modal et rafraîchir
      setShowTransferPreview(false)
      setTransferPreviewData(null)
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      
    } catch (error) {
      console.error("❌ Erreur lors du transfert:", error)
      toast.error("Erreur lors du transfert complet", { id: loadingToast })
    }
  }





  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#363636", color: "#fff" },
          success: { style: { background: "#10b981" } },
          error: { style: { background: "#ef4444" } }
        }}
      />

      <Routes>
        {/* Routes publiques SPÉCIFIQUES (doivent être AVANT la route "/") */}
        <Route path="/login" element={<CustomLoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/create-first-admin" element={<CreateFirstAdmin />} />
        <Route path="/formulaire" element={<PublicEnrollmentPage />} />
        <Route path="/statistiques-demo" element={<StatsSamplePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/complete-registration" element={<CompleteRegistrationPage />} />
        <Route path="/creer-etudiant-fictif" element={<CreateTestStudent />} />
        <Route path="/test-meteo" element={<WeatherTestPage />} />
        <Route path="/liste-appel-etudiants" element={
          authLoading ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : !isAuthenticated || !user ? (
            <CustomLoginPage />
          ) : (
            <StudentCallList />
          )
        } />
        <Route path="/presence-quotidienne" element={
          authLoading ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : !isAuthenticated || !user ? (
            <CustomLoginPage />
          ) : (
            <DailyAttendanceSheet />
          )
        } />
        <Route path="/gestion-programmes" element={
          authLoading ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : !isAuthenticated || !user ? (
            <CustomLoginPage />
          ) : (
            <ProgrammeManagement />
          )
        } />
        <Route path="/initialiser-programmes" element={
          authLoading ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : !isAuthenticated || !user ? (
            <CustomLoginPage />
          ) : (
            <InitializeProgrammes />
          )
        } />
        <Route path="/calendrier" element={
          authLoading ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : !isAuthenticated || !user ? (
            <CustomLoginPage />
          ) : (
            <UnifiedCalendarPlanning onCreateAppointment={() => setShowAppointmentModal(true)} />
          )
        } />
        <Route path="/gestion-templates-rapports" element={
          authLoading ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : !isAuthenticated || !user ? (
            <CustomLoginPage />
          ) : (
            <div className="min-h-screen bg-gray-50 p-6">
              <ReportTemplateManagement />
            </div>
          )
        } />
        <Route path="/gestion-intervenants" element={
          authLoading ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : !isAuthenticated || !user ? (
            <CustomLoginPage />
          ) : (
            <IntervenantsManagementPage />
          )
        } />
        
        {/* Route protégée pour l'administration (doit être EN DERNIER) */}
        <Route path="/" element={
          authLoading ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : !isAuthenticated || !user ? (
            <CustomLoginPage />
          ) : (
            <div className={`min-h-screen ${themeContext.getBgClass()} transition-all duration-500`}>
              {/* Header Navigation */}
              <header className="bg-white/90 backdrop-blur-md shadow-xl border-b border-gray-200/50 relative z-[100]">
                <div className="max-w-7xl mx-auto px-6 py-6">
                  <div className="flex items-center justify-between gap-8">
                    {/* Logo à gauche */}
                    <div className="flex-shrink-0">
                      <img 
                        src="https://static.lumi.new/8e/8e5f2a40e2bc63b9928e6d01978f5ebb.webp" 
                        alt="Logo Benado" 
                        className="w-28 h-28 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setActiveTab("dashboard")
                          navigate("/")
                          window.location.reload()
                        }}
                      />
                    </div>
                    
                    {/* Température et heure fondues dans l'en-tête */}
                    <div className="flex items-center gap-6 flex-1 justify-center">
                      <div className="flex items-center gap-6">
                        <WeatherWidget />
                        <span className="text-gray-400">|</span>
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-xl font-bold text-gray-800 tabular-nums">
                            {currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-base font-semibold text-gray-700">
                            {(() => {
                              const jour = currentTime.toLocaleDateString("fr-FR", { weekday: "long" })
                              const jourCapitalized = jour.charAt(0).toUpperCase() + jour.slice(1)
                              const mois = currentTime.toLocaleDateString("fr-FR", { month: "long" })
                              const date = currentTime.getDate()
                              const annee = currentTime.getFullYear()
                              return `${jourCapitalized}, ${date} ${mois}, ${annee}`
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Boutons d'action à droite */}
                    <div className="flex flex-col items-end gap-2 relative z-[200]">
                      <div className="text-lg font-bold text-gray-900">
                        Bonjour {user?.prenom || user?.nom || "Utilisateur"}
                      </div>
                      <div className="flex items-center gap-3">
                        <NotificationBell userId={user.userId} />

                        <button
                          onClick={signOut}
                          className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-sm font-medium">
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Content */}
              <main>
                {/* Onglets de navigation */}
                <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50">
                  <div className="max-w-7xl mx-auto px-6">
                    <nav className="flex justify-between items-center -mb-px">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveTab("dashboard")}
                          className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                            activeTab === "dashboard"
                              ? `${themeContext.getTextClass()} border-current`
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}>
                          📊 Tableau de bord
                        </button>
                        
                        <button
                          onClick={() => setActiveTab("presence")}
                          className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                            activeTab === "presence"
                              ? `${themeContext.getTextClass()} border-current`
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}>
                          📋 Feuille de Présence
                        </button>
                        
                        <button
                          onClick={() => setActiveTab("calendrier-planification")}
                          className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                            activeTab === "calendrier-planification"
                              ? `${themeContext.getTextClass()} border-current`
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}>
                          📅 Calendrier & Planification
                        </button>
                        
                        {user?.permissions?.accessStats && (
                          <button
                            onClick={() => setActiveTab("administration")}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                              activeTab === "administration"
                                ? `${themeContext.getTextClass()} border-current`
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}>
                            ⚙️ Administration
                          </button>
                        )}


                        

                      </div>
                    </nav>
                  </div>
                </div>

                {/* Contenu selon l'onglet actif */}
                {activeTab === "dashboard" ? (
                  <EnrollmentDashboard 
                    openFormTrigger={openNewStudentForm}
                    onFormOpenComplete={() => setOpenNewStudentForm(false)}
                    onInitiateTransfer={handleInitiateTransfer}
                    onOpenAppointmentModal={() => setShowAppointmentModal(true)}
                  />
                ) : activeTab === "presence" ? (
                  <DailyAttendanceSheet />
                ) : activeTab === "calendrier-planification" ? (
                  <UnifiedCalendarPlanning onCreateAppointment={() => setShowAppointmentModal(true)} />
                ) : activeTab === "administration" && user?.permissions?.accessStats ? (
                  <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-7xl mx-auto px-6">
                      {/* Header Section - Style uniforme */}
                      <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-xl">⚙️</span>
                          Centre d'Administration
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">Gérer les utilisateurs, données, programmes et paramètres</p>
                      </div>

                      {/* Dashboard Grid - Style uniforme */}
                      <div className="space-y-6">
                        
                        {/* Section: Gestion des données */}
                        <div>
                          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-lg">🗂️</span>
                            Gestion des Données
                          </h2>
                          <div className="space-y-3">
                            <button
                              onClick={() => setShowAuditTrail(true)}
                              className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200">
                              <span className="text-xl">📜</span>
                              <span className="font-medium text-gray-900 text-sm">Historique des Modifications</span>
                            </button>
                            

                            
                            <button
                              onClick={handleCleanupOrphanNotes}
                              className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200">
                              <span className="text-xl">🧹</span>
                              <span className="font-medium text-gray-900 text-sm">Nettoyage des Notes</span>
                            </button>
                          </div>
                        </div>

                        {/* Section: Gestion des utilisateurs */}
                        <div>
                          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-lg">👥</span>
                            Gestion des Utilisateurs
                          </h2>
                          <div className="space-y-3">
                            <button
                              onClick={() => navigate("/gestion-intervenants")}
                              className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200">
                              <span className="text-xl">👥</span>
                              <span className="font-medium text-gray-900 text-sm">Gérer les Intervenants</span>
                            </button>
                          </div>
                        </div>

                        {/* Section: Gestion des programmes */}
                        <div>
                          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-lg">📚</span>
                            Gestion des Programmes
                          </h2>
                          <div className="space-y-3">
                            <button
                              onClick={() => navigate("/gestion-programmes")}
                              className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200">
                              <span className="text-xl">📚</span>
                              <span className="font-medium text-gray-900 text-sm">Gérer les Programmes</span>
                            </button>
                            
                            <button
                              onClick={() => navigate("/initialiser-programmes")}
                              className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200">
                              <span className="text-xl">🔄</span>
                              <span className="font-medium text-gray-900 text-sm">⚠️ Réinitialiser les Programmes</span>
                            </button>
                          </div>
                        </div>

                        {/* Section: Gestion des rapports */}
                        <div>
                          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-lg">📄</span>
                            Gestion des Rapports
                          </h2>
                          <div className="space-y-3">
                            <button
                              onClick={() => navigate("/gestion-templates-rapports")}
                              className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200">
                              <span className="text-xl">📋</span>
                              <span className="font-medium text-gray-900 text-sm">Gérer les Templates</span>
                            </button>
                          </div>
                        </div>

                        {/* Section: Impression et Export */}
                        <div>
                          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-lg">🖨️</span>
                            Impression et Export
                          </h2>
                          <div className="space-y-3">
                            <button
                              onClick={() => navigate("/liste-appel-etudiants")}
                              className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200">
                              <span className="text-xl">📞</span>
                              <span className="font-medium text-gray-900 text-sm">Appels de Fin d'Année</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : null}
              </main>

              {/* Modal Audit Trail */}
              <AuditTrailModal 
                isOpen={showAuditTrail}
                onClose={() => setShowAuditTrail(false)}
              />

              {/* Modal Theme Customizer */}
              {showThemeCustomizer && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
                    <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <span>🎨</span> Thème
                        </h2>
                        <p className="text-indigo-100 text-sm mt-1">Personnalisez l'apparence de l'application selon vos préférences</p>
                      </div>
                      <button
                        onClick={() => setShowThemeCustomizer(false)}
                        className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all">
                        <span className="text-2xl">✕</span>
                      </button>
                    </div>
                    <div className="p-6">
                      <ThemeCustomizer userId={user.userId} onThemeChange={(theme) => themeContext.applyTheme(theme)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Gestion des Utilisateurs */}
              {showUserManagement && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto animate-slideUp">
                    <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <span>👥</span> Gestion des Intervenants
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">Ajouter, modifier ou supprimer des utilisateurs et gérer leurs permissions</p>
                      </div>
                      <button
                        onClick={() => setShowUserManagement(false)}
                        className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all">
                        <span className="text-2xl">✕</span>
                      </button>
                    </div>
                    <IntervenantsManagement />
                  </div>
                </div>
              )}

              {/* Modal Création de Rendez-vous */}
              <AppointmentModal
                isOpen={showAppointmentModal}
                onClose={() => setShowAppointmentModal(false)}
                userId={user.userId}
                userName={user?.prenom || user?.nom || user?.email || "Intervenant"}
              />

              {/* Modal Gestion des Programmes */}
              {showProgrammeManagement && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto animate-slideUp">
                    <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <span>📚</span> Gestion des Programmes
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">Créer et configurer des programmes avec leurs statistiques personnalisées</p>
                      </div>
                      <button
                        onClick={() => setShowProgrammeManagement(false)}
                        className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all">
                        <span className="text-2xl">✕</span>
                      </button>
                    </div>
                    <ProgrammeManagement />
                  </div>
                </div>
              )}

              {/* Modal Sélection d'Étudiant pour Transfert */}
              {showStudentSelectionModal && selectedVirtualProfile && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
                    <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <span>👥</span> Sélectionner l'étudiant cible
                        </h2>
                        <p className="text-indigo-100 text-sm mt-1">Choisissez l'étudiant qui recevra les notes de "{selectedVirtualProfile.titre}"</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowStudentSelectionModal(false)
                          setSelectedVirtualProfile(null)
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all">
                        <span className="text-2xl">✕</span>
                      </button>
                    </div>
                    
                    <div className="p-6">
                      {/* Barre de recherche */}
                      <div className="mb-6">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                          <input
                            type="text"
                            placeholder="Rechercher par nom, prénom..."
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Liste des étudiants */}
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                        {enrollments
                          .filter(e => !e.isVirtualProfile)
                          .map((student) => (
                            <button
                              key={student._id}
                              onClick={() => handleShowTransferPreview(selectedVirtualProfile, student)}
                              className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 border-2 border-gray-200 hover:border-indigo-400 rounded-lg p-4 transition-all text-left group">
                              <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${
                                  student.status === "actif" ? "bg-green-500" :
                                  student.status === "ferme" ? "bg-gray-500" :
                                  student.status === "en_attente" ? "bg-yellow-500" :
                                  "bg-red-500"
                                }`}>
                                  {(student.prenom || "").charAt(0).toUpperCase()}{(student.nom || "").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                    {student.prenom} {student.nom}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <span>👤</span> {student.age} ans • {student.genre}
                                    </span>
                                    {student.programme && (
                                      <span className="flex items-center gap-1">
                                        <span>📚</span> {student.programme}
                                      </span>
                                    )}
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      student.status === "actif" ? "bg-green-100 text-green-800" :
                                      student.status === "ferme" ? "bg-gray-100 text-gray-800" :
                                      student.status === "en_attente" ? "bg-yellow-100 text-yellow-800" :
                                      "bg-red-100 text-red-800"
                                    }`}>
                                      {student.status === "actif" ? "✓ Actif" :
                                       student.status === "ferme" ? "Fermé" :
                                       student.status === "en_attente" ? "En attente" :
                                       "Refusé"}
                                    </span>
                                  </div>
                                  {student.ecoleReferente && (
                                    <p className="text-sm text-gray-500 mt-1">🏫 {student.ecoleReferente}</p>
                                  )}
                                </div>
                                <div className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                  →
                                </div>
                              </div>
                            </button>
                          ))}
                      </div>

                      {enrollments.filter(e => !e.isVirtualProfile).length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">📭</div>
                          <p className="text-xl text-gray-500 font-medium">Aucun étudiant disponible</p>
                          <p className="text-sm text-gray-400 mt-2">Créez d'abord un étudiant réel pour pouvoir transférer les notes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Prévisualisation du Transfert Complet */}
              {showTransferPreview && transferPreviewData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-slideUp">
                    <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <span>🔄</span> Prévisualisation du Transfert Complet
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">Vérifiez les modifications avant de confirmer le transfert</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowTransferPreview(false)
                          setTransferPreviewData(null)
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all">
                        <span className="text-2xl">✕</span>
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Résumé du transfert */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <span>📊</span> Résumé du transfert
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 font-medium">Profil virtuel (source)</p>
                            <p className="text-gray-900 font-bold">{transferPreviewData.virtualProfile.titre}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Étudiant cible</p>
                            <p className="text-gray-900 font-bold">{transferPreviewData.targetStudent.nom} {transferPreviewData.targetStudent.prenom}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Notes à transférer</p>
                            <p className="text-gray-900 font-bold">{transferPreviewData.notesToTransfer.length} note(s)</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Documents à transférer</p>
                            <p className="text-gray-900 font-bold">{transferPreviewData.documentsToTransfer.length} document(s)</p>
                          </div>
                        </div>
                      </div>

                      {/* Liste des notes */}
                      {transferPreviewData.notesToTransfer.length > 0 && (
                        <div className="border-2 border-blue-200 rounded-lg p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span>📝</span> Notes à transférer ({transferPreviewData.notesToTransfer.length})
                          </h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {transferPreviewData.notesToTransfer.map((note: any, index: number) => (
                              <div key={index} className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs text-gray-500">
                                    {new Date(note.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                                  </span>
                                  <span className="text-xs font-medium text-blue-600">{note.intervenantNom || "Intervenant"}</span>
                                </div>
                                <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: note.content?.substring(0, 100) + (note.content?.length > 100 ? "..." : "") }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Liste des documents */}
                      {transferPreviewData.documentsToTransfer.length > 0 && (
                        <div className="border-2 border-green-200 rounded-lg p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span>📎</span> Documents à transférer ({transferPreviewData.documentsToTransfer.length})
                          </h3>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {transferPreviewData.documentsToTransfer.map((doc: any, index: number) => (
                              <div key={index} className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                                  <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}</p>
                                </div>
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">{doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "N/A"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Champs à fusionner */}
                      <div className="border-2 border-orange-200 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span>🔀</span> Informations à fusionner
                        </h3>
                        <div className="space-y-2">
                          {transferPreviewData.fieldsToMerge.map((field, index) => (
                            <div key={index} className="bg-orange-50 p-3 rounded-lg">
                              <p className="text-sm font-bold text-gray-900 mb-2">{field.field}</p>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <p className="text-gray-500 mb-1">Profil virtuel</p>
                                  <p className="text-gray-900 font-medium">{field.virtualValue}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">Étudiant actuel</p>
                                  <p className="text-gray-900 font-medium">{field.currentValue}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">⚠️ Les champs vides de l'étudiant seront remplis avec les valeurs du profil virtuel</p>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex gap-3 pt-4 border-t-2">
                        <button
                          onClick={() => {
                            setShowTransferPreview(false)
                            setTransferPreviewData(null)
                          }}
                          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium">
                          ✕ Annuler
                        </button>
                        <button
                          onClick={handleConfirmTransfer}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-bold shadow-lg">
                          ✅ Confirmer le transfert complet
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        } />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  )
}

export default App
