import React, { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

interface Absence {
  _id: string
  enrollmentId: string
  studentName: string
  date: string
  type: "absence" | "retard"
  reason?: string
  justified: boolean
  parentNotified: boolean
  notificationSentAt?: string
}

export const AbsenceManagement: React.FC = () => {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "absence" | "retard">("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [selectedEnrollment, setSelectedEnrollment] = useState("")
  const [newAbsence, setNewAbsence] = useState({
    type: "absence" as "absence" | "retard",
    date: new Date().toISOString().split("T")[0],
    reason: "",
    justified: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [absencesResult, enrollmentsResult] = await Promise.all([
        lumi.entities.absences.list({}),
        lumi.entities.enrollments.list({})
      ])
      
      setAbsences(absencesResult.list || [])
      setEnrollments(enrollmentsResult.list || [])
    } catch (error) {
      console.error("Erreur chargement:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const handleAddAbsence = async () => {
    if (!selectedEnrollment) {
      toast.error("Veuillez sélectionner un étudiant")
      return
    }

    const enrollment = enrollments.find(e => e._id === selectedEnrollment)
    if (!enrollment) return

    try {
      await lumi.entities.absences.create({
        enrollmentId: selectedEnrollment,
        studentName: `${enrollment.prenom} ${enrollment.nom}`,
        date: newAbsence.date,
        type: newAbsence.type,
        reason: newAbsence.reason,
        justified: newAbsence.justified,
        parentNotified: false
      })

      toast.success(`${newAbsence.type === "absence" ? "Absence" : "Retard"} enregistré(e)`)
      setShowAddModal(false)
      setSelectedEnrollment("")
      setNewAbsence({
        type: "absence",
        date: new Date().toISOString().split("T")[0],
        reason: "",
        justified: false
      })
      loadData()
    } catch (error) {
      console.error("Erreur création:", error)
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleNotifyParent = async (absence: Absence) => {
    if (!window.confirm(`Envoyer une notification aux parents de ${absence.studentName} ?`)) return

    try {
      const enrollment = enrollments.find(e => e._id === absence.enrollmentId)
      if (!enrollment) {
        toast.error("Étudiant introuvable")
        return
      }

      // Appeler la Deno function pour envoyer l'email
      await lumi.functions.invoke("notifyAbsence", {
        method: "POST",
        body: {
          parentEmail: enrollment.parent1Email || enrollment.parent2Email,
          studentName: absence.studentName,
          absenceType: absence.type,
          date: absence.date,
          reason: absence.reason
        }
      })

      // Mettre à jour l'absence
      await lumi.entities.absences.update(absence._id, {
        parentNotified: true,
        notificationSentAt: new Date().toISOString()
      })

      toast.success("Notification envoyée aux parents")
      loadData()
    } catch (error) {
      console.error("Erreur notification:", error)
      toast.error("Erreur lors de l'envoi de la notification")
    }
  }

  const handleToggleJustified = async (absence: Absence) => {
    try {
      await lumi.entities.absences.update(absence._id, {
        justified: !absence.justified
      })
      toast.success("Statut mis à jour")
      loadData()
    } catch (error) {
      console.error("Erreur mise à jour:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const filteredAbsences = filter === "all" 
    ? absences 
    : absences.filter(a => a.type === filter)

  const stats = {
    totalAbsences: absences.filter(a => a.type === "absence").length,
    totalRetards: absences.filter(a => a.type === "retard").length,
    nonJustifies: absences.filter(a => !a.justified).length,
    nonNotifies: absences.filter(a => !a.parentNotified).length
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
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white mb-6">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <span>⚠️</span> Gestion des Absences & Retards
        </h2>
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.totalAbsences}</div>
            <div className="text-sm opacity-90">Absences totales</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.totalRetards}</div>
            <div className="text-sm opacity-90">Retards totals</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.nonJustifies}</div>
            <div className="text-sm opacity-90">Non justifiés</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{stats.nonNotifies}</div>
            <div className="text-sm opacity-90">Parents non notifiés</div>
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}>
            Tous ({absences.length})
          </button>
          <button
            onClick={() => setFilter("absence")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "absence"
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}>
            Absences ({stats.totalAbsences})
          </button>
          <button
            onClick={() => setFilter("retard")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "retard"
                ? "bg-yellow-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}>
            Retards ({stats.totalRetards})
          </button>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold flex items-center gap-2">
          <span>➕</span> Enregistrer Absence/Retard
        </button>
      </div>

      {/* Liste des absences */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Étudiant</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Raison</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Justifié</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Parents notifiés</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAbsences.map(absence => (
                <tr key={absence._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(absence.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {absence.studentName}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      absence.type === "absence"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {absence.type === "absence" ? "❌ Absence" : "⏰ Retard"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {absence.reason || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleJustified(absence)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        absence.justified
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}>
                      {absence.justified ? "✓ Oui" : "Non"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {absence.parentNotified ? (
                      <div className="text-sm">
                        <span className="text-green-600 font-bold">✓ Oui</span>
                        {absence.notificationSentAt && (
                          <div className="text-xs text-gray-500">
                            {new Date(absence.notificationSentAt).toLocaleString("fr-FR")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-red-600 font-bold text-sm">Non</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {!absence.parentNotified && (
                      <button
                        onClick={() => handleNotifyParent(absence)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium">
                        📧 Notifier
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAbsences.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucune donnée à afficher
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajout absence/retard */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-4 rounded-t-2xl">
              <h3 className="text-2xl font-bold">Enregistrer Absence/Retard</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Étudiant *</label>
                <select
                  value={selectedEnrollment}
                  onChange={(e) => setSelectedEnrollment(e.target.value)}
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
                <label className="block text-sm font-bold text-gray-700 mb-2">Type *</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setNewAbsence({ ...newAbsence, type: "absence" })}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                      newAbsence.type === "absence"
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>
                    ❌ Absence
                  </button>
                  <button
                    onClick={() => setNewAbsence({ ...newAbsence, type: "retard" })}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                      newAbsence.type === "retard"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>
                    ⏰ Retard
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={newAbsence.date}
                  onChange={(e) => setNewAbsence({ ...newAbsence, date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Raison (optionnel)</label>
                <textarea
                  value={newAbsence.reason}
                  onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  rows={3}
                  placeholder="Raison de l'absence ou du retard..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="justified"
                  checked={newAbsence.justified}
                  onChange={(e) => setNewAbsence({ ...newAbsence, justified: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="justified" className="text-sm font-medium text-gray-700">
                  Marquer comme justifié
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t-2">
                <button
                  onClick={handleAddAbsence}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold">
                  Enregistrer
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
