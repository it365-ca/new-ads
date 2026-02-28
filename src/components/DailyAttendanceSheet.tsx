import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useEnrollments } from "../hooks/useEnrollments"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"
import { formatDate } from "../utils/dateFormat"

interface AttendanceRecord {
  enrollmentId: string
  date: string
  status: "present" | "absent" | "exclu" | "non_marque"
  motifAbsence?: string
  commentaire?: string
}

export const DailyAttendanceSheet: React.FC = () => {
  const navigate = useNavigate()
  const { enrollments } = useEnrollments()
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({})
  const [loading, setLoading] = useState(false)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  // Filtrer les étudiants qui devraient être présents à la date sélectionnée
  const studentsForDate = useMemo(() => {
    const selected = new Date(selectedDate)
    const dayOfWeek = selected.getDay()
    
    // Seulement les jours ouvrables (lundi à vendredi)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return []
    }

    return enrollments.filter(e => {
      if (e.status !== "actif") return false
      
      const entryDate = new Date(e.dateEntree)
      const endDate = e.dateFin ? new Date(e.dateFin) : new Date("2099-12-31")
      
      return selected >= entryDate && selected <= endDate
    }).sort((a, b) => a.nom.localeCompare(b.nom))
  }, [enrollments, selectedDate])

  // Charger les présences existantes pour la date sélectionnée
  React.useEffect(() => {
    const loadAttendances = async () => {
      setLoading(true)
      try {
        const result = await lumi.entities.attendances.list({
          filter: { 
            date: { $regex: `^${selectedDate}` }
          }
        })
        
        const records: Record<string, AttendanceRecord> = {}
        result.list.forEach((att: any) => {
          records[att.enrollmentId] = {
            enrollmentId: att.enrollmentId,
            date: att.date.split("T")[0],
            status: att.status,
            motifAbsence: att.motifAbsence,
            commentaire: att.commentaire
          }
        })
        
        setAttendanceRecords(records)
      } catch (error) {
        console.error("Erreur chargement présences:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAttendances()
  }, [selectedDate])

  const handleMarkAttendance = async (enrollmentId: string, status: "present" | "absent" | "exclu") => {
    setSavingIds(prev => new Set(prev).add(enrollmentId))
    
    try {
      // Chercher si une présence existe déjà
      const existing = await lumi.entities.attendances.list({
        filter: {
          enrollmentId,
          date: { $regex: `^${selectedDate}` }
        }
      })

      const attendanceData: any = {
        enrollmentId,
        date: selectedDate,
        status
      }

      if (status === "absent") {
        const motif = prompt("Motif d'absence (optionnel):")
        const commentaire = prompt("Commentaire (optionnel):")
        if (motif) attendanceData.motifAbsence = motif
        if (commentaire) attendanceData.commentaire = commentaire
      } else if (status === "exclu") {
        const commentaire = prompt("Raison de l'exclusion (optionnel):")
        if (commentaire) attendanceData.commentaire = commentaire
      }

      if (existing.list.length > 0) {
        await lumi.entities.attendances.update(existing.list[0]._id, attendanceData)
      } else {
        await lumi.entities.attendances.create(attendanceData)
      }

      // Mettre à jour l'état local
      setAttendanceRecords(prev => ({
        ...prev,
        [enrollmentId]: attendanceData
      }))

      toast.success(`${status === "present" ? "✅ Présent" : status === "absent" ? "❌ Absent" : "🚫 Exclu"} marqué`)
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
      console.error(error)
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(enrollmentId)
        return newSet
      })
    }
  }

  const stats = useMemo(() => {
    const present = Object.values(attendanceRecords).filter(r => r.status === "present").length
    const absent = Object.values(attendanceRecords).filter(r => r.status === "absent").length
    const exclu = Object.values(attendanceRecords).filter(r => r.status === "exclu").length
    const nonMarque = studentsForDate.length - present - absent - exclu
    
    return { present, absent, exclu, nonMarque, total: studentsForDate.length }
  }, [attendanceRecords, studentsForDate])

  const isWeekend = () => {
    const day = new Date(selectedDate).getDay()
    return day === 0 || day === 6
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Feuille de Présence Quotidienne</h1>
          <p className="text-gray-600">Gestion des présences pour tous les étudiants actifs</p>
        </div>

        {/* Sélecteur de date */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner une date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="flex-1">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Date sélectionnée</p>
                <p className="text-lg font-semibold text-indigo-600">
                  {(() => {
                    const [year, month, day] = selectedDate.split("-").map(Number)
                    const date = new Date(year, month - 1, day)
                    return date.toLocaleDateString("fr-FR", { 
                      weekday: "long", 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })
                  })()}
                </p>
              </div>
            </div>
          </div>

          {isWeekend() && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-orange-800 text-center text-sm">Fin de semaine - Aucun étudiant prévu</p>
            </div>
          )}
        </div>

        {/* Statistiques du jour */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total étudiants</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Présents</p>
                <p className="text-3xl font-bold text-green-900">{stats.present}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Absents</p>
                <p className="text-3xl font-bold text-red-900">{stats.absent}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Exclus</p>
                <p className="text-3xl font-bold text-orange-900">{stats.exclu}</p>
              </div>
              <div className="text-4xl">🚫</div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Non marqués</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.nonMarque}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Liste des étudiants */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : studentsForDate.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg font-medium">Aucun étudiant prévu pour cette date</p>
              <p className="text-sm mt-2">
                {isWeekend() ? "C'est une fin de semaine" : "Vérifiez les dates d'entrée et de fin des étudiants"}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Étudiant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">École</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsForDate.map((enrollment) => {
                  const record = attendanceRecords[enrollment._id]
                  const isSaving = savingIds.has(enrollment._id)
                  
                  return (
                    <tr key={enrollment._id} className={`hover:bg-gray-50 ${
                      record?.status === "present" ? "bg-green-50" :
                      record?.status === "absent" ? "bg-red-50" :
                      record?.status === "exclu" ? "bg-orange-50" :
                      ""
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">
                              {enrollment.prenom?.[0]}{enrollment.nom?.[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => {
                                navigate("/")
                                setTimeout(() => {
                                  window.location.href = `/?enrollment=${enrollment._id}`
                                }, 100)
                              }}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors text-left">
                              {enrollment.prenom} {enrollment.nom}
                            </button>
                            <div className="text-sm text-gray-500">{enrollment.age} ans</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.programme}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {enrollment.ecoleReferente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(enrollment.dateEntree)} → {enrollment.dateFin ? formatDate(enrollment.dateFin) : "En cours"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSaving ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            <span className="text-sm text-gray-600">Enregistrement...</span>
                          </div>
                        ) : record?.status === "present" ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            ✅ Présent
                          </span>
                        ) : record?.status === "absent" ? (
                          <div className="space-y-1">
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold block w-fit">
                              ❌ Absent
                            </span>
                            {record.motifAbsence && (
                              <p className="text-xs text-gray-600">Motif: {record.motifAbsence}</p>
                            )}
                          </div>
                        ) : record?.status === "exclu" ? (
                          <div className="space-y-1">
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold block w-fit">
                              🚫 Exclu
                            </span>
                            {record.commentaire && (
                              <p className="text-xs text-gray-600">Raison: {record.commentaire}</p>
                            )}
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                            ⏳ Non marqué
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkAttendance(enrollment._id, "present")}
                            disabled={isSaving || record?.status === "present"}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              record?.status === "present"
                                ? "bg-green-600 text-white cursor-default"
                                : "bg-white border border-green-600 text-green-600 hover:bg-green-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}>
                            ✓ Présent
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(enrollment._id, "absent")}
                            disabled={isSaving || record?.status === "absent"}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              record?.status === "absent"
                                ? "bg-red-600 text-white cursor-default"
                                : "bg-white border border-red-600 text-red-600 hover:bg-red-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}>
                            ✗ Absent
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(enrollment._id, "exclu")}
                            disabled={isSaving || record?.status === "exclu"}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              record?.status === "exclu"
                                ? "bg-orange-600 text-white cursor-default"
                                : "bg-white border border-orange-600 text-orange-600 hover:bg-orange-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}>
                            🚫 Exclu
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Récapitulatif des absents du jour */}
        {stats.absent > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-900 mb-4">❌ Absents du jour ({stats.absent})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentsForDate
                .filter(e => attendanceRecords[e._id]?.status === "absent")
                .map(enrollment => {
                  const record = attendanceRecords[enrollment._id]
                  return (
                    <div key={enrollment._id} className="bg-white border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-semibold">
                            {enrollment.prenom?.[0]}{enrollment.nom?.[0]}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              navigate("/")
                              setTimeout(() => {
                                window.location.href = `/?enrollment=${enrollment._id}`
                              }, 100)
                            }}
                            className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline transition-colors text-left">
                            {enrollment.prenom} {enrollment.nom}
                          </button>
                          <p className="text-xs text-gray-600">{enrollment.programme}</p>
                        </div>
                      </div>
                      {record?.motifAbsence && (
                        <p className="text-xs text-red-700 mt-2">
                          <strong>Motif:</strong> {record.motifAbsence}
                        </p>
                      )}
                      {record?.commentaire && (
                        <p className="text-xs text-gray-600 mt-1">
                          <strong>Note:</strong> {record.commentaire}
                        </p>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}