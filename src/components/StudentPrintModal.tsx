import React, { useState, useEffect } from "react"
import {X, Save, Printer, FileText, Filter, Download} from 'lucide-react'
import { useEnrollments } from "../hooks/useEnrollments"
import toast from "react-hot-toast"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { lumi } from '../lib/lumi'

interface PrintProfile {
  id: string
  name: string
  selectedFields: string[]
  programmes: string[]
  status: string[]
}

interface StudentPrintModalProps {
  isOpen: boolean
  onClose: () => void
  onStudentCalled?: (studentId: string) => void
}

// Toutes les questions du formulaire organisées par section
const FORM_FIELDS = {
  "Fiche personnelle": [
    { id: "nom", label: "1. Nom" },
    { id: "prenom", label: "2. Prénom" },
    { id: "dateNaissance", label: "3. Date de naissance" },
    { id: "age", label: "4. Âge" },
    { id: "origine", label: "5. Origine ethnoculturelle" },
    { id: "genre", label: "6. Genre" },
    { id: "degreScolaire", label: "7. Degré scolaire" },
    { id: "adresseComplete", label: "8. Adresse complète" },
    { id: "appartement", label: "9. Appartement" },
    { id: "codePostal", label: "10. Code postal" },
    { id: "ville", label: "11. Ville de résidence" },
    { id: "demeurAvec", label: "12. L'élève demeure avec" }
  ],
  "Coordonnées parents": [
    { id: "parent1Type", label: "13. Type parent 1" },
    { id: "parent1Nom", label: "14. Nom parent 1" },
    { id: "parent1Prenom", label: "15. Prénom parent 1" },
    { id: "parent1Tel", label: "16. Tél parent 1" },
    { id: "parent1Email", label: "17. Email parent 1" },
    { id: "parent2Type", label: "18. Type parent 2" },
    { id: "parent2Nom", label: "19. Nom parent 2" },
    { id: "parent2Prenom", label: "20. Prénom parent 2" },
    { id: "parent2Tel", label: "21. Tél parent 2" },
    { id: "parent2Email", label: "22. Email parent 2" }
  ],
  "Fiche médicale": [
    { id: "contactUrgence", label: "23. Contact urgence" },
    { id: "contactUrgenceTel", label: "24. Tél urgence" },
    { id: "contactUrgenceLien", label: "25. Lien de parenté" },
    { id: "problemeSante", label: "26. Problèmes de santé" },
    { id: "allergies", label: "27. Allergies" },
    { id: "epipen", label: "28. Nécessite épipen" }
  ],
  "Contacts scolaires": [
    { id: "ecoleReferente", label: "29. École référente" },
    { id: "intervenantNom", label: "30. Nom intervenant" },
    { id: "intervenantTitre", label: "31. Titre intervenant" },
    { id: "intervenantPoste", label: "32. Poste intervenant" },
    { id: "intervenantEmail", label: "33. Email intervenant" },
    { id: "directionNom", label: "34. Nom direction" },
    { id: "directionEmail", label: "35. Email direction" }
  ],
  "Programme et suivi": [
    { id: "programme", label: "36. Programme" },
    { id: "dateEntree", label: "37. Date d'entrée" },
    { id: "dateFin", label: "38. Date de fin" },
    { id: "apresSejourPlan", label: "39. Plan après séjour" },
    { id: "motifReference", label: "40. Motif de référence" },
    { id: "moyensProposesAutres", label: "41. Moyens proposés" },
    { id: "suiviExterne", label: "42. Suivi externe" },
    { id: "motivationsAdolescent", label: "43. Motivations" }
  ]
}

export const StudentPrintModal: React.FC<StudentPrintModalProps> = ({ isOpen, onClose, onStudentCalled }) => {
  const { enrollments } = useEnrollments()
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>(["actif"])
  const [dateDebut, setDateDebut] = useState<string>("")
  const [dateFin, setDateFin] = useState<string>("")
  const [profiles, setProfiles] = useState<PrintProfile[]>([])
  const [currentProfileName, setCurrentProfileName] = useState("")
  const [showSaveProfile, setShowSaveProfile] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<string>("")
  const [calledStudentIds, setCalledStudentIds] = useState<Set<string>>(new Set())
  const [loadingCalled, setLoadingCalled] = useState(false)
  const [viewMode, setViewMode] = useState<'config' | 'selection'>('config')
  const [calling, setCalling] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Fonction pour normaliser une date au format YYYY-MM-DD avec année sur 4 chiffres
  const normalizeDateValue = (dateString: string): string => {
    if (!dateString) return ""
    // Extraire les parties de la date
    const parts = dateString.split('-')
    if (parts.length !== 3) return dateString
    
    // Forcer l'année sur 4 chiffres uniquement et empêcher tout dépassement
    let year = parts[0].replace(/\D/g, '').slice(0, 4)
    const month = parts[1].slice(0, 2)
    const day = parts[2].slice(0, 2)
    
    return `${year}-${month}-${day}`
  }

  // Fonction pour formater les dates correctement (JJ/MM/AAAA)
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = String(date.getFullYear()).slice(0, 4) // Forcer 4 chiffres uniquement
    return `${day}/${month}/${year}`
  }

  // Charger les profils sauvegardés et les étudiants déjà appelés
  useEffect(() => {
    const initializeModal = async () => {
      try {
        const savedProfiles = localStorage.getItem("printProfiles")
        if (savedProfiles) {
          setProfiles(JSON.parse(savedProfiles))
        }
        await fetchCalledStudents()
        await fetchCurrentUser()
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du modal:', error)
      }
    }
    if (isOpen) {
      initializeModal()
    }
  }, [isOpen])

  // Récupérer les étudiants déjà appelés
  const fetchCalledStudents = async () => {
    setLoadingCalled(true)
    try {
      const { list: notes } = await lumi.entities.notes.list({
        filter: {
          contenu: { $regex: 'a été appelé par l\'intervenante', $options: 'i' }
        }
      })
      
      const calledIds = new Set(notes.map(note => note.enrollmentId).filter(Boolean))
      setCalledStudentIds(calledIds)
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants appelés:', error)
    } finally {
      setLoadingCalled(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const user = await lumi.auth.refreshUser()
      setCurrentUser(user || { userName: 'Intervenant', email: 'system@benado.com' })
      console.log('✅ [PRINT MODAL] Utilisateur chargé:', user?.email || user?.userName || 'Utilisateur par défaut')
    } catch (error) {
      console.error('❌ [PRINT MODAL] Erreur lors de la récupération de l\'utilisateur:', error)
      setCurrentUser({ userName: 'Intervenant', email: 'system@benado.com' })
    }
  }

  // Appeler un étudiant
  const handleCallStudent = async (enrollment: any) => {
    console.log('=')
    console.log('='.repeat(80))
    console.log('🎯🎯🎯 [PRINT MODAL] FUNCTION handleCallStudent TRIGGERED 🎯🎯🎯')
    console.log('Student:', enrollment.prenom, enrollment.nom)
    console.log('ID:', enrollment._id)
    console.log('='.repeat(80))
    
    if (calling.includes(enrollment._id)) {
      console.log('⚠️ [PRINT MODAL] Déjà en cours d\'appel, abandon')
      return
    }

    setCalling([...calling, enrollment._id])
    console.log('📞 [PRINT MODAL] Début de l\'appel...')

    try {
      // -----------------------------------------------------------
      // ÉTAPE CRITIQUE : RÉCUPÉRATION DE L'INTERVENANT CONNECTÉ
      // -----------------------------------------------------------
      const user = await lumi.auth.refreshUser()
      const userEmailRaw = (user?.email || '').trim()
      const userId = (user?.userId || user?.id || user?.user_id || '').toString()

      console.log('👤 [PRINT MODAL] Utilisateur connecté (auth):', { email: userEmailRaw, userId, userName: user?.userName, prenom: user?.prenom, nom: user?.nom })

      let intervenantNom = 'Intervenant'
      let matchedIntervenant: any = null

      // PRIORITÉ ABSOLUE : Utiliser les infos de l'utilisateur connecté directement
      if (user?.prenom && user?.nom) {
        intervenantNom = `${user.prenom} ${user.nom}`.trim()
        console.log('✅ [PRINT MODAL] Nom pris directement depuis user auth:', intervenantNom)
      } else {
          // Stratégie pour récupérer le PRENOM et NOM complet de l'intervenant
          // 1. Essayer par userId
          // 2. Essayer par email lowercase
          // 3. Essayer par email brut
          
          let intervenantsList: any[] = []
          
          // Recherche 1 : par userId
          if (userId) {
            const res = await lumi.entities.intervenants.list({ filter: { userId } })
            intervenantsList = res?.list || []
          }
          
          // Recherche 2 : par email (si pas trouvé par userId)
          if (intervenantsList.length === 0 && userEmailRaw) {
            const res = await lumi.entities.intervenants.list({ filter: { email: userEmailRaw.toLowerCase() } })
            intervenantsList = res?.list || []
          }
          
          // Recherche 3 : par email brut (si pas trouvé par email lower case)
          if (intervenantsList.length === 0 && userEmailRaw) {
            const res = await lumi.entities.intervenants.list({ filter: { email: userEmailRaw } })
            intervenantsList = res?.list || []
          }

          console.log('👥 [PRINT MODAL] Intervenants correspondants trouvés:', intervenantsList.length, intervenantsList)

          // Résolution du nom final
          matchedIntervenant = intervenantsList[0]

          if (matchedIntervenant) {
            const p = (matchedIntervenant.prenom || '').trim()
            const n = (matchedIntervenant.nom || '').trim()
            if (p || n) {
                intervenantNom = `${p} ${n}`.trim()
            }
          } else if (user?.userName && user.userName !== 'Intervenant') {
            // Fallback sur le userName de l'auth
            intervenantNom = user.userName
          }
      }

      console.log('✅ [PRINT MODAL] Nom FINAL pour la note:', intervenantNom)
      
      // -----------------------------------------------------------
      
      // Formater la date et l'heure pour la note
      const now = new Date()
      const joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
      
      const jourSemaine = joursSemaine[now.getDay()]
      const jour = now.getDate()
      const moisNom = mois[now.getMonth()]
      const annee = now.getFullYear()
      const heure = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      
      const dateComplete = `${jourSemaine} ${jour} ${moisNom} ${annee} à ${heure}:${minutes}`
      
      // Utilisation du nom final résolu
      const noteContenu = `L'étudiant ${enrollment.prenom} ${enrollment.nom} a été appelé par l'intervenante ${intervenantNom} le ${dateComplete}`

      const creatorId = (matchedIntervenant?.userId || userId || 'system').toString()
      
      console.log('[PRINT MODAL] Création note pour étudiant:', enrollment._id, enrollment.prenom, enrollment.nom)
      
      const noteData = {
        enrollmentId: enrollment._id,
        contenu: noteContenu,
        // ICI C'EST LE POINT CLÉ: On force le champ auteurNom avec le nom complet résolu
        auteurNom: intervenantNom,
        suivi: true,
        status: 'actif',
        creator: creatorId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        dateCreation: dateComplete,
        counters: {
          // ICI AUSSI : On s'assure que le compteur reflète le bon nom
          intervenant: intervenantNom,
          dateCreation: dateComplete
        }
      }
      
      console.log('[PRINT MODAL] Données de la note:', noteData)
      
      console.log('🚀 [PRINT MODAL] Tentative de création de note via SDK...')
      const result = await lumi.entities.notes.create(noteData)
      console.log('✅ [PRINT MODAL] Note créée avec succès:', result)

      toast.success(`${enrollment.prenom} ${enrollment.nom} appelé avec succès`)

      // Ajouter à la liste des étudiants appelés
      setCalledStudentIds(prev => new Set([...prev, enrollment._id]))
      setCalling(prev => prev.filter(id => id !== enrollment._id))
      
      // Notifier la page parent
      if (onStudentCalled) {
        onStudentCalled(enrollment._id)
      }

    } catch (error: any) {
      console.error('Erreur complète lors de l\'appel de l\'étudiant:', error)
      console.error('Message d\'erreur:', error?.message)
      console.error('Stack:', error?.stack)
      toast.error(`Erreur: ${error?.message || 'Erreur lors de l\'enregistrement de l\'appel'}`)
      setCalling(prev => prev.filter(id => id !== enrollment._id))
    }
  }

  // Sélectionner tous les champs d'une section
  const toggleSection = (sectionFields: { id: string; label: string }[]) => {
    const sectionIds = sectionFields.map(f => f.id)
    const allSelected = sectionIds.every(id => selectedFields.includes(id))
    
    if (allSelected) {
      setSelectedFields(prev => prev.filter(id => !sectionIds.includes(id)))
    } else {
      setSelectedFields(prev => [...new Set([...prev, ...sectionIds])])
    }
  }

  // Toggle un champ individuel
  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    )
  }

  // Toggle programme
  const toggleProgramme = (programme: string) => {
    setSelectedProgrammes(prev =>
      prev.includes(programme)
        ? prev.filter(p => p !== programme)
        : [...prev, programme]
    )
  }

  // Toggle statut
  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  // Sauvegarder un profil
  const saveProfile = () => {
    if (!currentProfileName.trim()) {
      toast.error("Veuillez entrer un nom de profil")
      return
    }

    const newProfile: PrintProfile = {
      id: Date.now().toString(),
      name: currentProfileName,
      selectedFields,
      programmes: selectedProgrammes,
      status: selectedStatus
    }

    const updatedProfiles = [...profiles, newProfile]
    setProfiles(updatedProfiles)
    localStorage.setItem("printProfiles", JSON.stringify(updatedProfiles))
    setCurrentProfileName("")
    setShowSaveProfile(false)
    toast.success(`Profil "${currentProfileName}" sauvegardé`)
  }

  // Charger un profil
  const loadProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId)
    if (profile) {
      setSelectedFields(profile.selectedFields)
      setSelectedProgrammes(profile.programmes || [])
      setSelectedStatus(profile.status)
      setSelectedProfile(profileId)
      toast.success(`Profil "${profile.name}" chargé`)
    }
  }

  // Supprimer un profil
  const deleteProfile = (profileId: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId)
    setProfiles(updatedProfiles)
    localStorage.setItem("printProfiles", JSON.stringify(updatedProfiles))
    if (selectedProfile === profileId) {
      setSelectedProfile("")
    }
    toast.success("Profil supprimé")
  }

  // Générer l'impression
  const handlePrint = () => {
    if (selectedFields.length === 0) {
      toast.error("Veuillez sélectionner au moins un champ")
      return
    }

    if (selectedStatus.length === 0) {
      toast.error("Veuillez sélectionner au moins un statut")
      return
    }

    if (selectedProgrammes.length === 0) {
      toast.error("Veuillez sélectionner au moins un programme")
      return
    }

    // Filtrer les étudiants
    const filteredStudents = getFilteredStudents()

    if (filteredStudents.length === 0) {
      toast.error("Aucun étudiant ne correspond aux critères")
      return
    }

    // Créer le contenu HTML pour l'impression
    const printContent = generatePrintHTML(filteredStudents)
    
    // Ouvrir dans une nouvelle fenêtre pour impression
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }

    toast.success(`${filteredStudents.length} formulaire(s) préparé(s) pour impression`)
  }

  // Exporter en PDF
  const handleExportPDF = () => {
    if (selectedFields.length === 0) {
      toast.error("Veuillez sélectionner au moins un champ")
      return
    }

    if (selectedStatus.length === 0) {
      toast.error("Veuillez sélectionner au moins un statut")
      return
    }

    if (selectedProgrammes.length === 0) {
      toast.error("Veuillez sélectionner au moins un programme")
      return
    }

    const filteredStudents = getFilteredStudents()

    if (filteredStudents.length === 0) {
      toast.error("Aucun étudiant ne correspond aux critères")
      return
    }

    try {
      // Créer le PDF en format paysage
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      filteredStudents.forEach((student, index) => {
        if (index > 0) {
          pdf.addPage()
        }

        // Titre
        pdf.setFontSize(18)
        pdf.setTextColor(31, 41, 55)
        pdf.text(`Formulaire Étudiant ${index + 1}/${filteredStudents.length}`, 15, 15)

        // Informations d'en-tête
        pdf.setFontSize(10)
        pdf.setTextColor(75, 85, 99)
        const headerY = 25
        pdf.text(`Nom: ${student.nom || ""} ${student.prenom || ""}`, 15, headerY)
        pdf.text(`Programme: ${student.programme || "N/A"}`, 110, headerY)
        pdf.text(`Statut: ${student.status || "actif"}`, 200, headerY)

        // Ligne de séparation
        pdf.setDrawColor(59, 130, 246)
        pdf.setLineWidth(0.5)
        pdf.line(15, headerY + 3, 282, headerY + 3)

        let currentY = headerY + 10

        // Générer les sections
        Object.entries(FORM_FIELDS).forEach(([sectionName, fields]) => {
          const visibleFields = fields.filter(f => selectedFields.includes(f.id))
          
          if (visibleFields.length > 0) {
            // Vérifier si on a besoin d'une nouvelle page
            if (currentY > 180) {
              pdf.addPage()
              currentY = 15
            }

            // Titre de section
            pdf.setFillColor(243, 244, 246)
            pdf.rect(15, currentY, 267, 8, 'F')
            pdf.setFontSize(12)
            pdf.setTextColor(75, 85, 99)
            pdf.text(sectionName, 17, currentY + 5.5)
            currentY += 10

            // Préparer les données pour le tableau
            const tableData = visibleFields.map(field => {
              const value = (student as any)[field.id] || "—"
              return [field.label, String(value)]
            })

            // Ajouter le tableau
            autoTable(pdf, {
              startY: currentY,
              head: [['Champ', 'Valeur']],
              body: tableData,
              theme: 'grid',
              styles: {
                fontSize: 9,
                cellPadding: 3
              },
              headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
              },
              columnStyles: {
                0: { cellWidth: 80, fontStyle: 'bold', textColor: [107, 114, 128] },
                1: { cellWidth: 187 }
              },
              margin: { left: 15, right: 15 }
            })

            currentY = (pdf as any).lastAutoTable.finalY + 5
          }
        })
      })

      // Sauvegarder le PDF
      const fileName = `fiches_etudiants_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      toast.success(`PDF exporté: ${fileName}`)
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error)
      toast.error("Erreur lors de la génération du PDF")
    }
  }

  // Fonction utilitaire pour obtenir les étudiants filtrés
  const getFilteredStudents = () => {
    return enrollments.filter(e => {
      const matchStatus = selectedStatus.includes(e.status || "actif")
      const matchProgramme = selectedProgrammes.includes(e.programme || "")
      const isVirtual = e.prenom === ""
      const isCalled = calledStudentIds.has(e._id)
      
      // Exclure les étudiants déjà appelés
      if (isCalled) {
        return false
      }
      
      // Filtrage par date d'entrée
      let matchDate = true
      if (dateDebut || dateFin) {
        const entryDate = new Date(e.dateEntree)
        if (dateDebut && entryDate < new Date(dateDebut)) {
          matchDate = false
        }
        if (dateFin && entryDate > new Date(dateFin)) {
          matchDate = false
        }
      }
      
      // Si "virtuel" est sélectionné dans les statuts, inclure les profils virtuels
      if (selectedStatus.includes("virtuel") && isVirtual) {
        return matchProgramme && matchDate
      }
      
      // Sinon, exclure les profils virtuels
      return matchStatus && matchProgramme && !isVirtual && matchDate
    })
  }

  // Générer le HTML pour l'impression
  const generatePrintHTML = (students: any[]) => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Formulaires Étudiants</title>
        <style>
          @page { size: landscape; margin: 1cm; }
          body { font-family: Arial, sans-serif; font-size: 10pt; }
          .student-page { page-break-after: always; padding: 20px; }
          .student-page:last-child { page-break-after: auto; }
          h1 { font-size: 16pt; color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
          h2 { font-size: 12pt; color: #4b5563; margin-top: 15px; margin-bottom: 8px; background: #f3f4f6; padding: 5px 10px; }
          .field-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .field { border: 1px solid #e5e7eb; padding: 8px; border-radius: 4px; background: #fafafa; }
          .field-label { font-weight: bold; color: #6b7280; font-size: 9pt; margin-bottom: 3px; }
          .field-value { color: #1f2937; word-wrap: break-word; }
          .header-info { display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px; background: #eff6ff; border-radius: 4px; }
          .header-item { font-weight: bold; }
        </style>
      </head>
      <body>
    `

    students.forEach((student, index) => {
      html += `
        <div class="student-page">
          <h1>📋 Formulaire Étudiant ${index + 1}/${students.length}</h1>
          <div class="header-info">
            <div class="header-item">Nom: ${student.nom || ""} ${student.prenom || ""}</div>
            <div class="header-item">Programme: ${student.programme || "N/A"}</div>
            <div class="header-item">Statut: ${student.status || "actif"}</div>
          </div>
      `

      // Grouper par section
      Object.entries(FORM_FIELDS).forEach(([sectionName, fields]) => {
        const visibleFields = fields.filter(f => selectedFields.includes(f.id))
        if (visibleFields.length > 0) {
          html += `<h2>${sectionName}</h2><div class="field-grid">`
          visibleFields.forEach(field => {
            const value = (student as any)[field.id] || "—"
            html += `
              <div class="field">
                <div class="field-label">${field.label}</div>
                <div class="field-value">${value}</div>
              </div>
            `
          })
          html += `</div>`
        }
      })

      html += `</div>`
    })

    html += `</body></html>`
    return html
  }

  if (!isOpen) return null

  const filteredStudents = getFilteredStudents()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">
                {viewMode === 'config' ? 'Impression Formulaires Étudiants' : 'Appel des Étudiants'}
              </h2>
              <p className="text-indigo-100 text-sm">
                {viewMode === 'config' ? 'Configuration personnalisée d\'impression' : 'Sélectionnez les étudiants appelés'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Selection - Affichage des fiches complètes */}
        {viewMode === 'selection' ? (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setViewMode('config')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2">
                  ← Retour à la configuration
                </button>
                <div className="text-right">
                  <div className="text-3xl font-bold text-indigo-600">{filteredStudents.length}</div>
                  <div className="text-sm text-gray-500">étudiants restants</div>
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Tous les étudiants ont été appelés !</h2>
                  <p className="text-gray-600">Il n'y a plus d'étudiants correspondant aux critères.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredStudents.map((student, index) => (
                    <div
                      key={student._id}
                      className={`bg-white border-2 border-gray-300 rounded-xl shadow-lg transition-all duration-300 ${
                        calling.includes(student._id) ? 'opacity-50 scale-95' : 'opacity-100'
                      }`}>
                      {/* En-tête de la fiche */}
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-bold">
                              📋 {student.prenom} {student.nom}
                            </h2>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Programme: {student.programme || "N/A"}</span>
                              <span>•</span>
                              <span>Statut: {student.status || "actif"}</span>
                              <span>•</span>
                              <span>Fiche {index + 1}/{filteredStudents.length}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('🔘🔘🔘 [PRINT MODAL] BUTTON CLICKED - Étudiant Appelé')
                              console.log('🎯 Calling handleCallStudent NOW...')
                              handleCallStudent(student)
                            }}
                            disabled={calling.includes(student._id)}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                            <span>✓</span>
                            <span>Étudiant Appelé</span>
                          </button>
                        </div>
                      </div>

                      {/* Contenu de la fiche avec les questions sélectionnées */}
                      <div className="p-6 space-y-6">
                        {Object.entries(FORM_FIELDS).map(([sectionName, fields]) => {
                          const visibleFields = fields.filter(f => selectedFields.includes(f.id))
                          
                          if (visibleFields.length === 0) return null

                          return (
                            <div key={sectionName} className="border-b border-gray-200 pb-4 last:border-b-0">
                              {/* Titre de section */}
                              <h3 className="text-lg font-bold text-gray-800 mb-4 bg-gray-100 px-4 py-2 rounded-lg">
                                {sectionName}
                              </h3>
                              
                              {/* Grille des champs */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
                                {visibleFields.map(field => {
                                  const value = (student as any)[field.id] || "—"
                                  return (
                                    <div key={field.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                      <div className="text-xs font-semibold text-gray-600 mb-1">
                                        {field.label}
                                      </div>
                                      <div className="text-sm text-gray-900 font-medium">
                                        {value}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Content - Mode Configuration */}
            <div className="flex-1 overflow-y-auto p-6">
          {/* Profils sauvegardés */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Save className="w-5 h-5" />
              Profils d'impression sauvegardés
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {profiles.map(profile => (
                <div key={profile.id} className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-2">
                  <button
                    onClick={() => loadProfile(profile.id)}
                    className={`font-medium hover:text-indigo-600 transition ${
                      selectedProfile === profile.id ? "text-indigo-600" : "text-gray-700"
                    }`}>
                    {profile.name}
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className="text-red-500 hover:text-red-700 text-sm">
                    ✕
                  </button>
                </div>
              ))}
              {profiles.length === 0 && (
                <p className="text-gray-500 text-sm">Aucun profil sauvegardé</p>
              )}
            </div>
            <button
              onClick={() => setShowSaveProfile(!showSaveProfile)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
              + Sauvegarder la configuration actuelle
            </button>
            {showSaveProfile && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={currentProfileName}
                  onChange={(e) => setCurrentProfileName(e.target.value)}
                  placeholder="Nom du profil..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={saveProfile}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                  Sauvegarder
                </button>
              </div>
            )}
          </div>

          {/* Filtres */}
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </h3>
            
            {/* Section Programmes */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Programmes (multi-sélection)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {["ALT", "OPTION", "PIVOT", "APOSTROPHE", "SAUTS", "Suivis Estivaux"].map((prog) => (
                  <button
                    key={prog}
                    onClick={() => toggleProgramme(prog)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      selectedProgrammes.includes(prog)
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-400"
                    }`}>
                    <input
                      type="checkbox"
                      checked={selectedProgrammes.includes(prog)}
                      readOnly
                      className="w-4 h-4"
                    />
                    {prog}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Statuts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Statuts (multi-sélection)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <button
                  onClick={() => toggleStatus("en_attente")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedStatus.includes("en_attente")
                      ? "bg-yellow-600 text-white shadow-md"
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-yellow-400"
                  }`}>
                  <input
                    type="checkbox"
                    checked={selectedStatus.includes("en_attente")}
                    readOnly
                    className="w-4 h-4"
                  />
                  En attente
                </button>
                <button
                  onClick={() => toggleStatus("actif")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedStatus.includes("actif")
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-green-400"
                  }`}>
                  <input
                    type="checkbox"
                    checked={selectedStatus.includes("actif")}
                    readOnly
                    className="w-4 h-4"
                  />
                  Actif
                </button>
                <button
                  onClick={() => toggleStatus("ferme")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedStatus.includes("ferme")
                      ? "bg-gray-600 text-white shadow-md"
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}>
                  <input
                    type="checkbox"
                    checked={selectedStatus.includes("ferme")}
                    readOnly
                    className="w-4 h-4"
                  />
                  Fermé
                </button>
                <button
                  onClick={() => toggleStatus("refuse")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedStatus.includes("refuse")
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400"
                  }`}>
                  <input
                    type="checkbox"
                    checked={selectedStatus.includes("refuse")}
                    readOnly
                    className="w-4 h-4"
                  />
                  Refusé
                </button>
                <button
                  onClick={() => toggleStatus("virtuel")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedStatus.includes("virtuel")
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400"
                  }`}>
                  <input
                    type="checkbox"
                    checked={selectedStatus.includes("virtuel")}
                    readOnly
                    className="w-4 h-4"
                  />
                  Virtuel
                </button>
              </div>
            </div>

            {/* Section Période */}
            <div className="mt-5 pt-5 border-t border-gray-300">
              <label className="block text-sm font-medium text-gray-700 mb-3">📅 Période d'entrée</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={normalizeDateValue(dateDebut)}
                    onChange={(e) => setDateDebut(normalizeDateValue(e.target.value))}
                    max="9999-12-31"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={normalizeDateValue(dateFin)}
                    onChange={(e) => setDateFin(normalizeDateValue(e.target.value))}
                    max="9999-12-31"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              {(dateDebut || dateFin) && (
                <button
                  onClick={() => {
                    setDateDebut("")
                    setDateFin("")
                  }}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  ✕ Réinitialiser les dates
                </button>
              )}
            </div>
          </div>

          {/* Sélection des champs */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 mb-3">Champs à imprimer</h3>
            {Object.entries(FORM_FIELDS).map(([sectionName, fields]) => (
              <div key={sectionName} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">{sectionName}</h4>
                  <button
                    onClick={() => toggleSection(fields)}
                    className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition">
                    {fields.every(f => selectedFields.includes(f.id)) ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {fields.map(field => (
                    <label key={field.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => toggleField(field.id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <strong>{selectedFields.length}</strong> champs sélectionnés •{" "}
            <strong>{filteredStudents.length}</strong>{" "}
            étudiant(s) correspondant(s) {loadingCalled && <span className="text-gray-400">(chargement...)</span>}
            {(dateDebut || dateFin) && (
              <span className="ml-2 text-indigo-600 font-medium">
                • 📅 {dateDebut && `Du ${formatDateDisplay(dateDebut)}`}
                {dateFin && ` au ${formatDateDisplay(dateFin)}`}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium">
              Annuler
            </button>
            <button
              onClick={() => {
                if (filteredStudents.length === 0) {
                  toast.error("Aucun étudiant ne correspond aux critères")
                  return
                }
                setViewMode('selection')
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2">
              📞 Mode Appel ({filteredStudents.length})
            </button>
            <button
              onClick={handleExportPDF}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-medium flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Imprimer
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
