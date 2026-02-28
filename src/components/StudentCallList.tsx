import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'
import {X, FileText, Printer, Phone, CheckCircle, Clock, Users, TrendingUp, Calendar, ArrowLeft, Filter, Save} from 'lucide-react'

interface Enrollment {
  _id: string
  prenom: string
  nom: string
  programme?: string
  statut?: string
  status?: string
  dateEntree?: string
  [key: string]: any
}

interface Programme {
  _id: string
  nom: string
}

// Les 43 questions du formulaire organisées par section
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

export function StudentCallList() {
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(false)
  const [calling, setCalling] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [calledStudentIds, setCalledStudentIds] = useState<Set<string>>(new Set())
  const [recentCalls, setRecentCalls] = useState<any[]>([])
  
  // Filtres
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['actif'])
  const [dateDebut, setDateDebut] = useState<string>('')
  const [dateFin, setDateFin] = useState<string>('')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showStudents, setShowStudents] = useState(false)
  const [filterProfiles, setFilterProfiles] = useState<any[]>([])
  const [profileName, setProfileName] = useState('')
  const [showSaveProfile, setShowSaveProfile] = useState(false)
  
  const [stats, setStats] = useState({
    total: 0,
    called: 0,
    remaining: 0,
    todayCalls: 0
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchCurrentUser()
        await fetchProgrammes()
        const calledIds = await fetchCalledStudents()
        await fetchAllEnrollments(calledIds)
        loadFilterProfiles()
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error)
      }
    }
    initializeData()
  }, [])

  useEffect(() => {
    const filtered = getFilteredStudents()
    setEnrollments(filtered)
    setStats(prev => ({
      ...prev,
      remaining: filtered.length
    }))
  }, [selectedProgrammes, selectedStatus, dateDebut, dateFin, allEnrollments, calledStudentIds])

  const fetchProgrammes = async () => {
    try {
      const { list } = await lumi.entities.programmes.list({})
      setProgrammes(list || [])
    } catch (error) {
      console.error('Erreur lors du chargement des programmes:', error)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const user = await lumi.auth.refreshUser()
      const { list: intervenants } = await lumi.entities.intervenants.list({
        filter: {
          email: user?.email
        }
      })
      
      if (intervenants && intervenants.length > 0) {
        const intervenant = intervenants[0]
        const nomComplet = `${intervenant.prenom || ''} ${intervenant.nom || ''}`.trim()
        
        if (nomComplet) {
          setCurrentUser({ ...user, ...intervenant, nomComplet })
          return
        }
      }
      
      if (user?.userName && user.userName !== 'Intervenant') {
        setCurrentUser({ ...user, nomComplet: user.userName })
        return
      }
      
      setCurrentUser({ ...user, nomComplet: 'Intervenant' })
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error)
      setCurrentUser({ userName: 'Intervenant', email: 'system@benado.com', nomComplet: 'Intervenant' })
    }
  }

  const fetchCalledStudents = async () => {
    try {
      const { list: notes } = await lumi.entities.notes.list({
        filter: {
          contenu: { $regex: 'a été appelé par l\'intervenante', $options: 'i' }
        },
        sort: { createdAt: -1 }
      })
      
      const calledIds = new Set(notes.map(note => note.enrollmentId).filter(Boolean))
      setCalledStudentIds(calledIds)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayNotes = notes.filter(note => {
        const noteDate = new Date(note.createdAt)
        return noteDate >= today
      }).slice(0, 5)
      
      setRecentCalls(todayNotes)
      
      const todayCallsCount = notes.filter(note => {
        const noteDate = new Date(note.createdAt)
        return noteDate >= today
      }).length
      
      setStats(prev => ({
        ...prev,
        called: calledIds.size,
        todayCalls: todayCallsCount
      }))
      
      return calledIds
    } catch (error) {
      console.error('❌ Erreur lors du chargement des étudiants appelés:', error)
      const emptySet = new Set()
      setCalledStudentIds(emptySet)
      return emptySet
    }
  }

  const fetchAllEnrollments = async (excludeIds?: Set<string>) => {
    setLoading(true)
    try {
      const { list } = await lumi.entities.enrollments.list({
        filter: {
          $or: [
            { statut: { $in: ['actif', 'en_attente', 'ferme', 'refuse'] } },
            { status: { $in: ['actif', 'en_attente', 'ferme', 'refuse'] } }
          ]
        },
        sort: { nom: 1, prenom: 1 }
      })
      
      setAllEnrollments(list)
      
      setStats(prev => ({
        ...prev,
        total: list.length,
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants:', error)
      toast.error('Erreur lors du chargement des étudiants')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredStudents = () => {
    return allEnrollments.filter(e => {
      const studentStatus = e.statut || e.status || 'actif'
      const matchStatus = selectedStatus.includes(studentStatus)
      const matchProgramme = selectedProgrammes.length === 0 || selectedProgrammes.includes(e.programme || '')
      const isVirtual = e.prenom === ''
      const isCalled = calledStudentIds.has(e._id)
      
      if (isCalled) return false
      
      let matchDate = true
      if (dateDebut || dateFin) {
        const entryDate = new Date(e.dateEntree || '')
        if (dateDebut && entryDate < new Date(dateDebut)) matchDate = false
        if (dateFin && entryDate > new Date(dateFin)) matchDate = false
      }
      
      if (selectedStatus.includes('virtuel') && isVirtual) {
        return matchProgramme && matchDate
      }
      
      return matchStatus && matchProgramme && !isVirtual && matchDate
    })
  }

  const handleCallStudent = async (enrollment: Enrollment) => {
    if (calling.includes(enrollment._id)) {
      return
    }

    setCalling([...calling, enrollment._id])

    try {
      const user = await lumi.auth.refreshUser()
      const userEmail = user?.email?.trim() || ''

      let finalIntervenantName = 'Intervenant'
      let creatorId = 'system'

      if (userEmail) {
        try {
          const { list: intervenants } = await lumi.entities.intervenants.list({
            filter: { email: userEmail }
          })
          
          if (intervenants && intervenants.length > 0) {
            const intervenant = intervenants[0]
            const prenom = (intervenant.prenom || '').trim()
            const nom = (intervenant.nom || '').trim()
            
            if (prenom && nom) {
              finalIntervenantName = `${prenom} ${nom}`
              creatorId = intervenant.userId || intervenant._id || 'system'
            }
          }
        } catch (error) {
          console.error('❌ [APPEL] Erreur lors de la recherche intervenant:', error)
        }
      }
      
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
      
      const noteContenu = `L'étudiant ${enrollment.prenom} ${enrollment.nom} a été appelé par l'intervenante ${finalIntervenantName} le ${dateComplete}`

      const noteData = {
        enrollmentId: enrollment._id,
        contenu: noteContenu,
        auteurNom: finalIntervenantName, 
        suivi: true,
        status: 'actif',
        creator: creatorId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        dateCreation: dateComplete,
        counters: {
          intervenant: finalIntervenantName,
          dateCreation: dateComplete
        }
      }
      
      await lumi.entities.notes.create(noteData)

      toast.success(`${enrollment.prenom} ${enrollment.nom} appelé avec succès`)

      await fetchCalledStudents()
      
      setTimeout(() => {
        setEnrollments(prev => prev.filter(e => e._id !== enrollment._id))
        setCalling(prev => prev.filter(id => id !== enrollment._id))
        setCalledStudentIds(prev => new Set([...prev, enrollment._id]))
        
        setStats(prev => ({
          ...prev,
          called: prev.called + 1,
          remaining: prev.remaining - 1,
          todayCalls: prev.todayCalls + 1
        }))
      }, 500)

    } catch (error: any) {
      console.error('Erreur complète lors de l\'appel de l\'étudiant:', error)
      toast.error(`Erreur: ${error?.message || 'Erreur lors de l\'enregistrement de l\'appel'}`)
      setCalling(prev => prev.filter(id => id !== enrollment._id))
    }
  }

  const toggleProgramme = (programmeName: string) => {
    setSelectedProgrammes(prev =>
      prev.includes(programmeName)
        ? prev.filter(p => p !== programmeName)
        : [...prev, programmeName]
    )
  }

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    )
  }

  const loadFilterProfiles = () => {
    const saved = localStorage.getItem('filterProfiles')
    if (saved) {
      setFilterProfiles(JSON.parse(saved))
    }
  }

  const saveFilterProfile = () => {
    if (!profileName.trim()) {
      toast.error('Veuillez entrer un nom pour le profil')
      return
    }
    
    const newProfile = {
      id: Date.now().toString(),
      name: profileName,
      programmes: selectedProgrammes,
      status: selectedStatus,
      dateDebut,
      dateFin,
      fields: selectedFields
    }
    
    const updated = [...filterProfiles, newProfile]
    setFilterProfiles(updated)
    localStorage.setItem('filterProfiles', JSON.stringify(updated))
    setProfileName('')
    setShowSaveProfile(false)
    toast.success('Profil sauvegardé avec succès')
  }

  const loadFilterProfile = (profile: any) => {
    setSelectedProgrammes(profile.programmes)
    setSelectedStatus(profile.status)
    setDateDebut(profile.dateDebut)
    setDateFin(profile.dateFin)
    setSelectedFields(profile.fields)
    toast.success(`Profil "${profile.name}" chargé`)
  }

  const deleteFilterProfile = (profileId: string) => {
    const updated = filterProfiles.filter(p => p.id !== profileId)
    setFilterProfiles(updated)
    localStorage.setItem('filterProfiles', JSON.stringify(updated))
    toast.success('Profil supprimé')
  }

  const handleShowStudents = () => {
    setShowStudents(true)
    toast.success(`${enrollments.length} étudiant(s) affiché(s)`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des étudiants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6 py-8 print-section">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6 print-header">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 no-print"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📞</span>
              <h1 className="text-2xl font-bold text-gray-900">
                Appels de fin d'année
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors font-medium flex items-center gap-2 no-print"
            >
              <Printer className="w-5 h-5" />
              Imprimer la liste
            </button>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{stats.remaining} à appeler</p>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">À Appeler</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.remaining}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Appelés</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.called}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Progression</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{Math.round((stats.called / stats.total) * 100) || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.round((stats.called / stats.total) * 100) || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Gestion des profils de filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 no-print">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Save className="w-5 h-5" />
              Profils de filtres sauvegardés
            </h3>
            <button
              onClick={() => setShowSaveProfile(!showSaveProfile)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Sauvegarder le filtre actuel
            </button>
          </div>
          
          {showSaveProfile && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Nom du profil (ex: Étudiants actifs 2025)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveFilterProfile}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => setShowSaveProfile(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg text-sm font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
          
          {filterProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {filterProfiles.map((profile) => (
                <div key={profile.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{profile.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => loadFilterProfile(profile)}
                        className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-xs font-medium"
                      >
                        Charger
                      </button>
                      <button
                        onClick={() => deleteFilterProfile(profile.id)}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Aucun profil sauvegardé</p>
          )}
        </div>

        {/* Sélection de période - Simple et visible */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 no-print">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Période d'entrée</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Date de début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                min="2000-01-01"
                max="2099-12-31"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Date de fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                min="2000-01-01"
                max="2099-12-31"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtres avancés {showFilters ? '▼' : '▶'}
          </button>
        </div>

        {/* Section de filtres avancés (cachée par défaut) */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6 no-print">
            <div className="space-y-6">
              {/* Programmes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Programmes (multi-sélection)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {programmes.map((prog) => (
                    <div
                      key={prog._id}
                      onClick={() => toggleProgramme(prog.nom)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedProgrammes.includes(prog.nom)
                          ? 'bg-indigo-50 border-indigo-500'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedProgrammes.includes(prog.nom)}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-900">{prog.nom}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statuts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Statuts (multi-sélection)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { value: 'en_attente', label: 'En attente' },
                    { value: 'actif', label: 'Actif' },
                    { value: 'ferme', label: 'Fermé' },
                    { value: 'refuse', label: 'Refusé' },
                    { value: 'virtuel', label: 'Virtuel' }
                  ].map(({ value, label }) => (
                    <div
                      key={value}
                      onClick={() => toggleStatus(value)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedStatus.includes(value)
                          ? 'bg-green-50 border-green-500'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedStatus.includes(value)}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Champs à afficher */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Champs à afficher</h3>
                <div className="space-y-4">
                  {Object.entries(FORM_FIELDS).map(([section, fields]) => (
                    <div key={section}>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">{section}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {fields.map((field) => (
                          <label key={field.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedFields.includes(field.id)}
                              onChange={() => toggleField(field.id)}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-700">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Résumé */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{selectedFields.length}</span> champs sélectionnés • 
                  <span className="font-semibold ml-2">{enrollments.length}</span> étudiant(s) correspondant(s)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bouton Afficher les étudiants */}
        {!showStudents && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-center no-print">
            <button
              onClick={handleShowStudents}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-lg transition-colors inline-flex items-center gap-3"
            >
              <Users className="w-6 h-6" />
              Afficher les étudiants ({enrollments.length})
            </button>
          </div>
        )}

        {/* Liste des étudiants */}
        {showStudents && (
        <div className="space-y-3">
          {enrollments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Aucun étudiant à appeler
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  Tous les étudiants correspondant aux filtres ont été appelés.
                </p>
                <button
                  onClick={() => fetchAllEnrollments()}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Recharger la liste
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Liste des étudiants ({enrollments.length})
                </h3>
              </div>
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment._id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all ${
                    calling.includes(enrollment._id) ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  {/* En-tête avec nom et bouton */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                        {enrollment.prenom?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {enrollment.prenom} {enrollment.nom}
                        </h3>
                        {enrollment.programme && (
                          <p className="text-xs text-gray-500">{enrollment.programme}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCallStudent(enrollment)
                      }}
                      disabled={calling.includes(enrollment._id)}
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm no-print"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Étudiant Appelé</span>
                    </button>
                  </div>

                  {/* Affichage des informations si des champs sont sélectionnés */}
                  {selectedFields.length > 0 && (
                    <div className="p-4">
                      {Object.entries(FORM_FIELDS).map(([section, fields]) => {
                        const visibleFields = fields.filter(f => selectedFields.includes(f.id) && enrollment[f.id])
                        if (visibleFields.length === 0) return null
                        
                        return (
                          <div key={section} className="mb-4 last:mb-0">
                            <h4 className="text-sm font-bold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                              {section}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {visibleFields.map(field => (
                                <div key={field.id} className="bg-gray-50 p-2 rounded">
                                  <p className="text-xs font-medium text-gray-600">
                                    {field.label}
                                  </p>
                                  <p className="text-sm text-gray-900 mt-0.5">
                                    {enrollment[field.id] || '-'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
