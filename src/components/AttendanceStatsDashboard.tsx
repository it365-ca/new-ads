import React, { useState, useMemo } from "react"
import { useEnrollments } from "../hooks/useEnrollments"
import { lumi } from "../lib/lumi"
import { formatDate } from "../utils/dateFormat"

interface AttendanceStats {
  enrollmentId: string
  studentName: string
  programme: string
  totalDays: number
  presentDays: number
  absentDays: number
  excluDays: number
  attendanceRate: number
  recentAbsences: Array<{ date: string; motif?: string }>
}

export const AttendanceStatsDashboard: React.FC = () => {
  const { enrollments } = useEnrollments()
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("month")
  const [selectedProgramme, setSelectedProgramme] = useState<string>("all")

  // Charger les données de présence
  React.useEffect(() => {
    const loadAttendances = async () => {
      setLoading(true)
      try {
        const result = await lumi.entities.attendances.list({
          limit: 10000
        })
        setAttendanceData(result.list)
      } catch (error) {
        console.error("Erreur chargement présences:", error)
      } finally {
        setLoading(false)
      }
    }
    loadAttendances()
  }, [])

  // Calculer les statistiques par étudiant
  const stats: AttendanceStats[] = useMemo(() => {
    const now = new Date()
    let startDate = new Date()

    if (selectedPeriod === "week") {
      startDate.setDate(now.getDate() - 7)
    } else if (selectedPeriod === "month") {
      startDate.setMonth(now.getMonth() - 1)
    } else {
      startDate = new Date("2020-01-01")
    }

    const activeEnrollments = enrollments.filter(e => {
      if (selectedProgramme !== "all" && e.programme !== selectedProgramme) return false
      return e.status === "actif"
    })

    return activeEnrollments.map(enrollment => {
      const studentAttendances = attendanceData.filter(att => 
        att.enrollmentId === enrollment._id && 
        new Date(att.date) >= startDate
      )

      const presentDays = studentAttendances.filter(att => att.status === "present").length
      const absentDays = studentAttendances.filter(att => att.status === "absent").length
      const excluDays = studentAttendances.filter(att => att.status === "exclu").length
      const totalDays = presentDays + absentDays

      const recentAbsences = studentAttendances
        .filter(att => att.status === "absent")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(att => ({
          date: att.date,
          motif: att.motifAbsence
        }))

      return {
        enrollmentId: enrollment._id,
        studentName: `${enrollment.prenom} ${enrollment.nom}`,
        programme: enrollment.programme,
        totalDays,
        presentDays,
        absentDays,
        excluDays,
        attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
        recentAbsences
      }
    }).sort((a, b) => a.attendanceRate - b.attendanceRate)
  }, [enrollments, attendanceData, selectedPeriod, selectedProgramme])

  // Statistiques globales
  const globalStats = useMemo(() => {
    const totalStudents = stats.length
    const avgAttendanceRate = stats.reduce((sum, s) => sum + s.attendanceRate, 0) / totalStudents || 0
    const studentsBelow80 = stats.filter(s => s.attendanceRate < 80).length
    const studentsBelow90 = stats.filter(s => s.attendanceRate < 90 && s.attendanceRate >= 80).length

    return {
      totalStudents,
      avgAttendanceRate,
      studentsBelow80,
      studentsBelow90
    }
  }, [stats])

  const programmes = useMemo(() => {
    const uniqueProgs = new Set(enrollments.map(e => e.programme))
    return Array.from(uniqueProgs).filter(Boolean)
  }, [enrollments])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Statistiques d'Assiduité</h1>
          <p className="text-gray-600">Tableau de bord complet des présences et taux d'assiduité</p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📅 Période</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="all">Depuis le début</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🎓 Programme</label>
              <select
                value={selectedProgramme}
                onChange={(e) => setSelectedProgramme(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="all">Tous les programmes</option>
                {programmes.map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Étudiants suivis</p>
                <p className="text-3xl font-bold text-gray-900">{globalStats.totalStudents}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Taux moyen</p>
                <p className="text-3xl font-bold text-green-900">{globalStats.avgAttendanceRate.toFixed(1)}%</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Entre 80-90%</p>
                <p className="text-3xl font-bold text-yellow-900">{globalStats.studentsBelow90}</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Moins de 80%</p>
                <p className="text-3xl font-bold text-red-900">{globalStats.studentsBelow80}</p>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>
        </div>

        {/* Liste des étudiants */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Étudiant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jours total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Présents</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absents</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Exclus</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Taux</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernières absences</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.map((stat) => {
                  const rateColor = 
                    stat.attendanceRate >= 90 ? "text-green-600" :
                    stat.attendanceRate >= 80 ? "text-yellow-600" :
                    "text-red-600"
                  
                  const bgColor = 
                    stat.attendanceRate >= 90 ? "bg-green-50" :
                    stat.attendanceRate >= 80 ? "bg-yellow-50" :
                    "bg-red-50"

                  return (
                    <tr key={stat.enrollmentId} className={`hover:bg-gray-50 ${bgColor}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => window.location.href = "/?enrollment=" + stat.enrollmentId}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                          {stat.studentName}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.programme}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {stat.totalDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          {stat.presentDays}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                          {stat.absentDays}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                          {stat.excluDays}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-2xl font-bold ${rateColor}`}>
                          {stat.attendanceRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {stat.recentAbsences.length > 0 ? (
                          <div className="space-y-1">
                            {stat.recentAbsences.slice(0, 3).map((absence, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium">{formatDate(absence.date)}</span>
                                {absence.motif && <span className="text-gray-500"> - {absence.motif}</span>}
                              </div>
                            ))}
                            {stat.recentAbsences.length > 3 && (
                              <div className="text-xs text-gray-400">+ {stat.recentAbsences.length - 3} autre(s)</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Aucune absence</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Étudiants à risque */}
        {globalStats.studentsBelow80 > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-900 mb-4">🚨 Étudiants à risque (moins de 80% de présence)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats
                .filter(s => s.attendanceRate < 80)
                .map(stat => (
                  <div key={stat.enrollmentId} className="bg-white border border-red-200 rounded-lg p-4">
                    <button
                      onClick={() => window.location.href = "/?enrollment=" + stat.enrollmentId}
                      className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline transition-colors block mb-2">
                      {stat.studentName}
                    </button>
                    <p className="text-sm text-gray-600 mb-2">{stat.programme}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-red-600">{stat.attendanceRate.toFixed(0)}%</span>
                      <span className="text-sm text-gray-600">{stat.absentDays} absences</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
