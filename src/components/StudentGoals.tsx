import React, { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

interface ProgressGoal {
  _id: string
  enrollmentId: string
  studentName: string
  title: string
  description: string
  category: string
  targetDate: string
  status: "en_cours" | "atteint" | "abandonne"
  progress: number
  milestones: {
    title: string
    completed: boolean
    completedAt?: string
  }[]
  createdAt: string
  updatedAt: string
}

export const StudentGoals: React.FC = () => {
  const [goals, setGoals] = useState<ProgressGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"all" | "en_cours" | "atteint" | "abandonne">("all")
  const [newGoal, setNewGoal] = useState({
    enrollmentId: "",
    title: "",
    description: "",
    category: "academique",
    targetDate: "",
    milestones: [""]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [goalsResult, enrollmentsResult] = await Promise.all([
        lumi.entities.studentGoals.list({}),
        lumi.entities.enrollments.list({})
      ])
      
      setGoals(goalsResult.list || [])
      setEnrollments(enrollmentsResult.list || [])
    } catch (error) {
      console.error("Erreur chargement:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async () => {
    if (!newGoal.enrollmentId || !newGoal.title || !newGoal.targetDate) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    const enrollment = enrollments.find(e => e._id === newGoal.enrollmentId)
    if (!enrollment) return

    try {
      await lumi.entities.studentGoals.create({
        enrollmentId: newGoal.enrollmentId,
        studentName: `${enrollment.prenom} ${enrollment.nom}`,
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        targetDate: newGoal.targetDate,
        status: "en_cours",
        progress: 0,
        milestones: newGoal.milestones.filter(m => m.trim()).map(m => ({
          title: m,
          completed: false
        }))
      })

      toast.success("Objectif créé avec succès")
      setShowAddModal(false)
      setNewGoal({
        enrollmentId: "",
        title: "",
        description: "",
        category: "academique",
        targetDate: "",
        milestones: [""]
      })
      loadData()
    } catch (error) {
      console.error("Erreur création:", error)
      toast.error("Erreur lors de la création")
    }
  }

  const handleToggleMilestone = async (goal: ProgressGoal, milestoneIndex: number) => {
    try {
      const updatedMilestones = [...goal.milestones]
      updatedMilestones[milestoneIndex] = {
        ...updatedMilestones[milestoneIndex],
        completed: !updatedMilestones[milestoneIndex].completed,
        completedAt: !updatedMilestones[milestoneIndex].completed ? new Date().toISOString() : undefined
      }

      const completedCount = updatedMilestones.filter(m => m.completed).length
      const progress = Math.round((completedCount / updatedMilestones.length) * 100)
      const status = progress === 100 ? "atteint" : "en_cours"

      await lumi.entities.studentGoals.update(goal._id, {
        milestones: updatedMilestones,
        progress,
        status
      })

      toast.success("Étape mise à jour")
      loadData()
    } catch (error) {
      console.error("Erreur mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleUpdateStatus = async (goalId: string, status: "en_cours" | "atteint" | "abandonne") => {
    try {
      await lumi.entities.studentGoals.update(goalId, { status })
      toast.success("Statut mis à jour")
      loadData()
    } catch (error) {
      console.error("Erreur mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const filteredGoals = filterStatus === "all" 
    ? goals 
    : goals.filter(g => g.status === filterStatus)

  const stats = {
    total: goals.length,
    enCours: goals.filter(g => g.status === "en_cours").length,
    atteints: goals.filter(g => g.status === "atteint").length,
    abandonnes: goals.filter(g => g.status === "abandonne").length,
    moyenneProgress: goals.length > 0 
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white mb-6">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <span>🎯</span> Gestion des Objectifs Individuels
        </h2>
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-90">Objectifs totaux</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.enCours}</div>
            <div className="text-sm opacity-90">En cours</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.atteints}</div>
            <div className="text-sm opacity-90">Atteints</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.abandonnes}</div>
            <div className="text-sm opacity-90">Abandonnés</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.moyenneProgress}%</div>
            <div className="text-sm opacity-90">Progression moy.</div>
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}>
            Tous ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus("en_cours")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === "en_cours"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}>
            En cours ({stats.enCours})
          </button>
          <button
            onClick={() => setFilterStatus("atteint")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === "atteint"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}>
            Atteints ({stats.atteints})
          </button>
          <button
            onClick={() => setFilterStatus("abandonne")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === "abandonne"
                ? "bg-gray-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}>
            Abandonnés ({stats.abandonnes})
          </button>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold flex items-center gap-2">
          <span>➕</span> Nouvel Objectif
        </button>
      </div>

      {/* Liste des objectifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map(goal => (
          <div key={goal._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`p-4 text-white ${
              goal.status === "atteint" 
                ? "bg-gradient-to-r from-green-600 to-emerald-600"
                : goal.status === "abandonne"
                ? "bg-gradient-to-r from-gray-600 to-gray-700"
                : "bg-gradient-to-r from-blue-600 to-indigo-600"
            }`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg">{goal.title}</h3>
                <span className="text-2xl">{
                  goal.category === "academique" ? "📚" :
                  goal.category === "social" ? "👥" :
                  goal.category === "comportemental" ? "🎭" : "🌟"
                }</span>
              </div>
              <p className="text-sm opacity-90 mb-2">{goal.studentName}</p>
              <div className="flex items-center gap-2 text-sm">
                <span>📅</span>
                <span>{new Date(goal.targetDate).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>

            <div className="p-4">
              {goal.description && (
                <p className="text-sm text-gray-700 mb-4">{goal.description}</p>
              )}

              {/* Barre de progression */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">Progression</span>
                  <span className="text-sm font-bold text-indigo-600">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2 mb-4">
                <p className="text-sm font-bold text-gray-700 mb-2">Étapes :</p>
                {goal.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={milestone.completed}
                      onChange={() => handleToggleMilestone(goal, index)}
                      className="mt-1 w-5 h-5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${
                        milestone.completed 
                          ? "line-through text-gray-500" 
                          : "text-gray-900"
                      }`}>
                        {milestone.title}
                      </p>
                      {milestone.completed && milestone.completedAt && (
                        <p className="text-xs text-green-600">
                          ✓ {new Date(milestone.completedAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Boutons statut */}
              <div className="flex gap-2">
                {goal.status !== "atteint" && (
                  <button
                    onClick={() => handleUpdateStatus(goal._id, "atteint")}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium">
                    ✓ Atteint
                  </button>
                )}
                {goal.status !== "abandonne" && (
                  <button
                    onClick={() => handleUpdateStatus(goal._id, "abandonne")}
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium">
                    ✕ Abandonner
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredGoals.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Aucun objectif à afficher
          </div>
        )}
      </div>

      {/* Modal ajout objectif */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl">
              <h3 className="text-2xl font-bold">Créer un Nouvel Objectif</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Étudiant *</label>
                <select
                  value={newGoal.enrollmentId}
                  onChange={(e) => setNewGoal({ ...newGoal, enrollmentId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none">
                  <option value="">Sélectionner un étudiant</option>
                  {enrollments.map(e => (
                    <option key={e._id} value={e._id}>
                      {e.prenom} {e.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Titre de l'objectif *</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Ex: Améliorer la moyenne en mathématiques"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  rows={3}
                  placeholder="Décrivez l'objectif en détail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie *</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none">
                    <option value="academique">📚 Académique</option>
                    <option value="social">👥 Social</option>
                    <option value="comportemental">🎭 Comportemental</option>
                    <option value="autre">🌟 Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date cible *</label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Étapes à suivre</label>
                {newGoal.milestones.map((milestone, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={milestone}
                      onChange={(e) => {
                        const updated = [...newGoal.milestones]
                        updated[index] = e.target.value
                        setNewGoal({ ...newGoal, milestones: updated })
                      }}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                      placeholder={`Étape ${index + 1}`}
                    />
                    {index > 0 && (
                      <button
                        onClick={() => {
                          const updated = newGoal.milestones.filter((_, i) => i !== index)
                          setNewGoal({ ...newGoal, milestones: updated })
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setNewGoal({ ...newGoal, milestones: [...newGoal.milestones, ""] })}
                  className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium">
                  + Ajouter une étape
                </button>
              </div>

              <div className="flex gap-3 pt-4 border-t-2">
                <button
                  onClick={handleAddGoal}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold">
                  Créer l'Objectif
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
