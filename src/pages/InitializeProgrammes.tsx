import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lumi } from '../lib/lumi'
import { useModal } from '../contexts/ModalContext'

// Les 6 programmes originaux du formulaire
const PROGRAMMES_ORIGINAUX = [
  {
    nom: 'ALT',
    code: 'ALT',
    description: 'Comportements d\'intimidation (5 ou 10 jours)',
    actif: true,
    statsConfiguration: {
      afficherGenre: true,
      afficherAge: true,
      afficherDegre: true,
      afficherEcole: true,
      afficherVille: true,
      afficherOrigine: true,
      afficherDemeurAvec: true,
      afficherInterventions: true,
      afficherPresence: true,
      afficherEvolution: true,
      afficherConversion: true
    },
    ordre: 1
  },
  {
    nom: 'OPTION',
    code: 'OPTION',
    description: 'Suspension scolaire (3 ou 10 jours)',
    actif: true,
    statsConfiguration: {
      afficherGenre: true,
      afficherAge: true,
      afficherDegre: true,
      afficherEcole: true,
      afficherVille: true,
      afficherOrigine: true,
      afficherDemeurAvec: true,
      afficherInterventions: true,
      afficherPresence: true,
      afficherEvolution: true,
      afficherConversion: true
    },
    ordre: 2
  },
  {
    nom: 'PIVOT',
    code: 'PIVOT',
    description: 'Non fréquentation, absentéisme (15 ans+)',
    actif: true,
    statsConfiguration: {
      afficherGenre: true,
      afficherAge: true,
      afficherDegre: true,
      afficherEcole: true,
      afficherVille: true,
      afficherOrigine: true,
      afficherDemeurAvec: true,
      afficherInterventions: true,
      afficherPresence: true,
      afficherEvolution: true,
      afficherConversion: true
    },
    ordre: 3
  },
  {
    nom: 'APOSTROPHE',
    code: 'APOSTROPHE',
    description: 'Difficultés d\'adaptation (13-14 ans, 8 semaines)',
    actif: true,
    statsConfiguration: {
      afficherGenre: true,
      afficherAge: true,
      afficherDegre: true,
      afficherEcole: true,
      afficherVille: true,
      afficherOrigine: true,
      afficherDemeurAvec: true,
      afficherInterventions: true,
      afficherPresence: true,
      afficherEvolution: true,
      afficherConversion: true
    },
    ordre: 4
  },
  {
    nom: 'SAUTS',
    code: 'SAUTS',
    description: 'Transition vers le secondaire (Estival)',
    actif: true,
    statsConfiguration: {
      afficherGenre: true,
      afficherAge: true,
      afficherDegre: true,
      afficherEcole: true,
      afficherVille: true,
      afficherOrigine: true,
      afficherDemeurAvec: true,
      afficherInterventions: true,
      afficherPresence: true,
      afficherEvolution: true,
      afficherConversion: true
    },
    ordre: 5
  },
  {
    nom: 'Suivis Estivaux',
    code: 'SUIVIS_ESTIVAUX',
    description: 'Accompagnement individualisé',
    actif: true,
    statsConfiguration: {
      afficherGenre: true,
      afficherAge: true,
      afficherDegre: true,
      afficherEcole: true,
      afficherVille: true,
      afficherOrigine: true,
      afficherDemeurAvec: true,
      afficherInterventions: true,
      afficherPresence: true,
      afficherEvolution: true,
      afficherConversion: true
    },
    ordre: 6
  }
]

export function InitializeProgrammes() {
  const navigate = useNavigate()
  const { success, error: showError } = useModal()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'confirm' | 'processing' | 'done'>('confirm')

  const handleInitialize = async () => {
    setLoading(true)
    setStep('processing')

    try {
      // 1. Récupérer tous les programmes existants
      const { list: existingProgrammes } = await lumi.entities.programmes.list({})
      
      // 2. Supprimer tous les programmes existants
      for (const prog of existingProgrammes) {
        await lumi.entities.programmes.delete(prog._id)
      }

      // 3. Créer les 6 programmes originaux
      for (const prog of PROGRAMMES_ORIGINAUX) {
        await lumi.entities.programmes.create({
          ...prog,
          creator: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      setStep('done')
      success('Les 6 programmes originaux ont été réinitialisés avec succès!')
      
      setTimeout(() => {
        navigate('/gestion-programmes')
      }, 2000)
    } catch (err: any) {
      console.error('Erreur lors de l\'initialisation:', err)
      console.error('Message d\'erreur:', err?.message)
      console.error('Stack:', err?.stack)
      showError(`Erreur lors de la réinitialisation des programmes: ${err?.message || 'Erreur inconnue'}`)
      setStep('confirm')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
        {step === 'confirm' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Réinitialiser les programmes
              </h1>
              <p className="text-gray-600">
                Cette action va supprimer TOUS les programmes existants et créer les 6 programmes originaux du formulaire
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-2">Les 6 programmes qui seront créés :</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {PROGRAMMES_ORIGINAUX.map((prog, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <div>
                      <strong>{prog.nom}</strong> - {prog.description}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>⚠️ Attention :</strong> Cette action est irréversible. Tous les programmes actuels seront supprimés.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleInitialize}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                Réinitialiser maintenant
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Réinitialisation en cours...
            </h2>
            <p className="text-gray-600">
              Suppression des anciens programmes et création des programmes originaux
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Réinitialisation terminée !
            </h2>
            <p className="text-gray-600">
              Les 6 programmes originaux ont été créés avec succès
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Redirection vers la gestion des programmes...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
