import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgrammes } from '../hooks/useProgrammes'
import { useCustomAuth } from '../hooks/useCustomAuth'

interface Programme {
  _id: string
  nom: string
  description: string
  statsConfig: string[]
}

const AVAILABLE_STATS = [
  'Programme',
  'Sexe',
  'Demeure avec',
  'Statut familial',
  'Revenu familial',
  'Âge',
  'Nombre d\'enfants',
  'Rang dans la fratrie',
  'Statut d\'immigration',
  'Langue maternelle',
  'Scolarité',
  'École',
  'Interventions avec suivi',
  'Interventions sans suivi',
  'Interventions étudiants virtuels'
]

export function ProgrammeManagement() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useCustomAuth()
  const { programmes, loading, createProgramme, updateProgramme, deleteProgramme } = useProgrammes()
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    statsConfig: [] as string[]
  })

  // Rediriger si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("🚫 Utilisateur non authentifié, redirection vers /")
      navigate('/', { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate])

  // Afficher un loader pendant la vérification d'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Ne rien afficher si non authentifié (redirection en cours)
  if (!isAuthenticated) {
    return null
  }

  const handleAddProgramme = () => {
    setEditingProgramme(null)
    setFormData({ nom: '', description: '', statsConfig: [] })
    setIsFormOpen(true)
  }

  const handleEditProgramme = (programme: Programme) => {
    setEditingProgramme(programme)
    setFormData({
      nom: programme.nom,
      description: programme.description,
      statsConfig: programme.statsConfig || []
    })
    setIsFormOpen(true)
  }

  const handleDeleteProgramme = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      await deleteProgramme(id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom.trim()) {
      alert('Le nom du programme est requis')
      return
    }

    if (editingProgramme) {
      await updateProgramme(editingProgramme._id, formData)
    } else {
      await createProgramme(formData)
    }
    
    setIsFormOpen(false)
    setFormData({ nom: '', description: '', statsConfig: [] })
    setEditingProgramme(null)
  }

  const handleStatToggle = (stat: string) => {
    setFormData(prev => ({
      ...prev,
      statsConfig: prev.statsConfig.includes(stat)
        ? prev.statsConfig.filter(s => s !== stat)
        : [...prev.statsConfig, stat]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              ← Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Gérer les programmes</h1>
          </div>
          <button
            onClick={handleAddProgramme}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Nouveau programme
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des programmes...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom du programme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statistiques associées
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {programmes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Aucun programme trouvé. Cliquez sur "Nouveau programme" pour en créer un.
                      </td>
                    </tr>
                  ) : (
                    programmes.map((programme) => (
                      <tr key={programme._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{programme.nom}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{programme.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {programme.statsConfig && programme.statsConfig.length > 0 ? (
                              programme.statsConfig.map((stat) => (
                                <span
                                  key={stat}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                >
                                  {stat}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">Aucune statistique</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditProgramme(programme)}
                            className="text-purple-600 hover:text-purple-900 mr-4"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteProgramme(programme._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal formulaire */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProgramme ? 'Modifier le programme' : 'Nouveau programme'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du programme *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Programme régulier"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Description du programme..."
                  rows={3}
                />
              </div>

              {/* Statistiques */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Statistiques à afficher
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {AVAILABLE_STATS.map((stat) => (
                    <label
                      key={stat}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.statsConfig.includes(stat)}
                        onChange={() => handleStatToggle(stat)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{stat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false)
                    setFormData({ nom: '', description: '', statsConfig: [] })
                    setEditingProgramme(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingProgramme ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
