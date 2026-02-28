import React, { useState, useEffect, useMemo } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

interface Appointment {
  _id: string
  enrollmentId: string
  studentName: string
  datetime: string
  confirmed: boolean
  notes?: string
  calendarEventId?: string
}

interface Schedule {
  _id?: string
  programme: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room?: string
  instructor?: string
}

interface Activity {
  _id?: string
  title: string
  type: 'atelier' | 'sortie' | 'formation' | 'reunion'
  date: string
  startTime: string
  endTime: string
  location?: string
  participants?: string[]
  description?: string
}

interface AppointmentCalendarViewProps {
  onCreateAppointment?: () => void
}

export const AppointmentCalendarView: React.FC<AppointmentCalendarViewProps> = ({ onCreateAppointment }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [intervenants, setIntervenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [selectedInstructor, setSelectedInstructor] = useState<string>('')
  const [showScheduleView, setShowScheduleView] = useState(true)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDaySchedule, setSelectedDaySchedule] = useState<Date | null>(null)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const [appointmentsRes, schedulesRes, activitiesRes, intervenantsRes] = await Promise.all([
        lumi.entities.appointments.list({}),
        lumi.entities.schedules.list({}),
        lumi.entities.activities.list({}),
        lumi.entities.intervenants.list({})
      ])
      
      const allAppointments = appointmentsRes.list || []
      setAppointments(allAppointments)
      setSchedules(schedulesRes.list || [])
      setActivities(activitiesRes.list || [])
      setIntervenants(intervenantsRes.list || [])
      
      // Filtrer les rendez-vous d'aujourd'hui
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayEnd = new Date(today)
      todayEnd.setHours(23, 59, 59, 999)
      
      const todayRdv = allAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.datetime)
        return aptDate >= today && aptDate <= todayEnd
      })
      
      setTodayAppointments(todayRdv)
    } catch (error) {
      console.error("Erreur chargement rendez-vous:", error)
      toast.error("Erreur lors du chargement des rendez-vous")
    } finally {
      setLoading(false)
    }
  }

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()
    
    const weeks: (Date | null)[][] = []
    let currentWeek: (Date | null)[] = []
    
    // Jours vides au début
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null)
    }
    
    // Tous les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(new Date(year, month, day))
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    
    // Compléter la dernière semaine
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }
    
    return weeks
  }, [currentDate])

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    if (!date) return []
    const dateStr = date.toISOString().split("T")[0]
    return appointments.filter(apt => {
      const aptDate = new Date(apt.datetime).toISOString().split("T")[0]
      return aptDate === dateStr
    })
  }

  const getWeekDates = (): Date[] => {
    const start = new Date(currentDate)
    start.setDate(currentDate.getDate() - currentDate.getDay())
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const goToPreviousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 1)
      setCurrentDate(newDate)
    }
  }

  const goToNextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 1)
      setCurrentDate(newDate)
    }
  }

  const getPeriodLabel = () => {
    if (viewMode === 'month') {
      const month = currentDate.toLocaleDateString("fr-FR", { month: "long" })
      const year = String(currentDate.getFullYear())
      return `${month} ${year}`
    } else if (viewMode === 'week') {
      const weekDates = getWeekDates()
      const start = weekDates[0]
      const end = weekDates[6]
      const startDay = String(start.getDate()).padStart(2, "0")
      const endDay = String(end.getDate()).padStart(2, "0")
      const startMonth = start.toLocaleDateString("fr-FR", { month: "short" })
      const endMonth = end.toLocaleDateString("fr-FR", { month: "short" })
      const year = String(end.getFullYear())
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
    } else {
      const weekday = currentDate.toLocaleDateString("fr-FR", { weekday: "long" })
      const day = String(currentDate.getDate()).padStart(2, "0")
      const month = currentDate.toLocaleDateString("fr-FR", { month: "long" })
      const year = String(currentDate.getFullYear())
      return `${weekday}, ${day} ${month} ${year}`
    }
  }

  const getDayName = (day: number) => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    return days[day]
  }

  const getMonthName = () => {
    return currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDownloadICS = async (appointmentId: string) => {
    try {
      // Utiliser l'API directe pour le téléchargement de fichier
      const response = await fetch(`/api/appointments/${appointmentId}/download-ics`)
      if (!response.ok) throw new Error("Erreur téléchargement")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `rendez-vous-${appointmentId}.ics`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success("Fichier .ics téléchargé avec succès")
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce rendez-vous ?")) return
    
    try {
      await lumi.entities.appointments.delete(appointmentId)
      toast.success("Rendez-vous supprimé")
      loadAppointments()
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Erreur suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const getDayNameFromDate = (date: Date): string => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    return days[date.getDay()]
  }

  const todaySchedules = schedules.filter(s => {
    const today = getDayNameFromDate(new Date())
    return s.dayOfWeek === today && (!selectedInstructor || s.instructor === selectedInstructor)
  })

  const todayActivities = activities.filter(a => {
    const today = new Date()
    const activityDate = new Date(a.date)
    return activityDate.toDateString() === today.toDateString()
  })

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Titre */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📅 Gestion du Calendrier</h1>
      </div>

      {/* Filtres et vue */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-gray-700 font-medium text-sm">Intervenant:</label>
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium min-w-[200px]">
                <option value="">Tous les intervenants</option>
                {intervenants.map(i => (
                  <option key={i._id} value={i.nom}>{i.nom}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowScheduleView(!showScheduleView)}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                showScheduleView
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}>
              {showScheduleView ? '📅 Voir Calendrier Rendez-vous' : '📋 Voir Horaires Intervenants'}
            </button>
          </div>
          {!showScheduleView && (
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  viewMode === 'month'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}>
                📅 Mois
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  viewMode === 'week'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}>
                📆 Semaine
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  viewMode === 'day'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}>
                📋 Jour
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vue Horaires Intervenants */}
      {showScheduleView && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3 border-b border-gray-200 pb-4">
            <span>📋</span> Gestion du Calendrier des Intervenants - {getDayNameFromDate(new Date())}
          </h3>
          
          {/* Horaires de la journée */}
          {todaySchedules.length > 0 && (
            <div className="mb-6">
              <h4 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <span>🕐</span> Horaires de la Journée {selectedInstructor && `- ${selectedInstructor}`}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaySchedules.map(schedule => (
                  <div key={schedule._id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 hover:shadow-lg transition-all">
                    <div className="font-bold text-xl text-indigo-900 mb-3">{schedule.programme}</div>
                    <div className="text-sm text-gray-700 space-y-2">
                      <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                        <span className="text-lg">🕐</span>
                        <span className="font-bold text-base">{schedule.startTime} - {schedule.endTime}</span>
                      </div>
                      {schedule.instructor && (
                        <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                          <span className="text-lg">👤</span>
                          <span className="font-semibold">{schedule.instructor}</span>
                        </div>
                      )}
                      {schedule.room && (
                        <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                          <span className="text-lg">📍</span>
                          <span className="font-semibold">{schedule.room}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activités/Ateliers du jour */}
          {todayActivities.length > 0 && (
            <div className="mb-6">
              <h4 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <span>🎨</span> Ateliers & Activités de la Journée
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayActivities.map(activity => (
                  <div key={activity._id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-5 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-bold text-xl text-purple-900">{activity.title}</div>
                      <span className="px-3 py-1 bg-purple-200 text-purple-900 rounded-full text-xs font-bold uppercase">
                        {activity.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-2">
                      <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                        <span className="text-lg">🕐</span>
                        <span className="font-bold text-base">{activity.startTime} - {activity.endTime}</span>
                      </div>
                      {activity.location && (
                        <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                          <span className="text-lg">📍</span>
                          <span className="font-semibold">{activity.location}</span>
                        </div>
                      )}
                      {activity.description && (
                        <div className="text-gray-600 mt-3 bg-white/70 px-3 py-2 rounded-lg italic">{activity.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todaySchedules.length === 0 && todayActivities.length === 0 && (
            <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl">
              <div className="text-7xl mb-4">📭</div>
              <p className="text-2xl font-bold mb-2">Aucun horaire programmé aujourd'hui</p>
              <p className="text-lg">Sélectionnez un intervenant ou consultez un autre jour</p>
            </div>
          )}
        </div>
      )}

      {/* Section Rendez-vous d'aujourd'hui */}
      {!showScheduleView && todayAppointments.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <span>📅</span> Rendez-vous d'aujourd'hui ({todayAppointments.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAppointments.map(apt => (
              <div
                key={apt._id}
                onClick={() => setSelectedAppointment(apt)}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 cursor-pointer transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-lg text-gray-900">
                    {new Date(apt.datetime).toLocaleTimeString("fr-FR", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    apt.confirmed
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {apt.confirmed ? "✓" : "⏳"}
                  </span>
                </div>
                <div className="font-medium text-gray-900">{apt.studentName}</div>
                {apt.notes && (
                  <div className="text-sm text-gray-600 mt-2 line-clamp-2">{apt.notes}</div>
                )}
                {apt.calendarEventId && (
                  <div className="text-xs mt-2 flex items-center gap-1 text-gray-500">
                    <span>🔗</span> Synchronisé Gmail/Outlook
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!showScheduleView && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header avec navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
                <span>📅</span> Calendrier des Rendez-vous
              </h2>
              <p className="text-gray-600 mt-2">
                {appointments.length} rendez-vous au total • {todayAppointments.length} aujourd'hui
              </p>
            </div>
            <div className="flex gap-3">
              {onCreateAppointment && (
                <button
                  onClick={onCreateAppointment}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium shadow-sm flex items-center gap-2">
                  <span>➕</span> Nouveau RDV
                </button>
              )}
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-medium">
                Aujourd'hui
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={goToPreviousMonth}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all">
              <span className="text-2xl">←</span>
            </button>
            <h3 className="text-xl font-bold capitalize min-w-[250px] text-center text-gray-900">
              {getMonthName()}
            </h3>
            <button
              onClick={goToNextMonth}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all">
              <span className="text-2xl">→</span>
            </button>
          </div>
        </div>

        {/* Calendrier */}
        <div className="p-6">
          {viewMode === 'month' && (
            <>
              {/* En-têtes des jours */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <div key={day} className="text-center text-sm font-bold text-gray-700 py-2">
                    {getDayName(day)}
                  </div>
                ))}
              </div>

              {/* Grille du calendrier */}
              <div className="space-y-2">
                {calendarData.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-2">
                    {week.map((date, dayIndex) => {
                      if (!date) {
                        return <div key={dayIndex} className="h-24" />
                      }

                      const dayAppointments = getAppointmentsForDate(date)
                      const isToday = date.toDateString() === new Date().toDateString()
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6

                      return (
                        <div
                          key={dayIndex}
                          onClick={() => setSelectedDaySchedule(date)}
                          className={`h-24 rounded-lg border-2 p-2 transition-all cursor-pointer ${
                            isToday
                              ? "border-indigo-500 bg-indigo-50"
                              : isWeekend
                              ? "bg-gray-50 border-gray-200"
                              : "border-gray-300 bg-white hover:shadow-md hover:border-indigo-400"
                          }`}>
                          <div className="flex flex-col h-full">
                            <span className={`text-sm font-bold ${
                              isToday ? "text-indigo-600" : "text-gray-900"
                            }`}>
                              {date.getDate()}
                            </span>
                            
                            {dayAppointments.length > 0 && (
                              <div className="flex-1 mt-1 space-y-1 overflow-y-auto">
                                {dayAppointments.map(apt => (
                                  <button
                                    key={apt._id}
                                    onClick={() => setSelectedAppointment(apt)}
                                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate ${
                                      apt.confirmed
                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    }`}>
                                    {new Date(apt.datetime).toLocaleTimeString("fr-FR", { 
                                      hour: "2-digit", 
                                      minute: "2-digit" 
                                    })} - {apt.studentName}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {viewMode === 'week' && (
            <div>
              <div className="grid grid-cols-8 gap-2 mb-3">
                <div className="text-center text-sm font-bold text-gray-700 py-2">Heure</div>
                {getWeekDates().map((date, idx) => (
                  <div key={idx} className={`text-center text-sm font-bold py-2 rounded-t-lg ${
                    date.toDateString() === new Date().toDateString()
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700'
                  }`}>
                    <div>{getDayName(date.getDay())}</div>
                    <div className="text-lg font-bold">{date.getDate()}</div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="grid grid-cols-8 gap-2">
                    <div className="text-xs font-medium text-gray-600 py-3 text-right pr-2">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {getWeekDates().map((date, dayIdx) => {
                      const dayAppointments = getAppointmentsForDate(date).filter(apt => {
                        const aptHour = new Date(apt.datetime).getHours()
                        return aptHour === hour
                      })
                      const isToday = date.toDateString() === new Date().toDateString()

                      return (
                        <div
                          key={dayIdx}
                          className={`min-h-[60px] rounded-lg border p-1 ${
                            isToday ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'
                          }`}>
                          {dayAppointments.map(apt => (
                            <button
                              key={apt._id}
                              onClick={() => setSelectedAppointment(apt)}
                              className={`w-full text-left px-2 py-1 rounded text-xs font-medium mb-1 ${
                                apt.confirmed
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}>
                              <div className="font-bold">
                                {new Date(apt.datetime).toLocaleTimeString("fr-FR", { 
                                  hour: "2-digit", 
                                  minute: "2-digit" 
                                })}
                              </div>
                              <div className="truncate">{apt.studentName}</div>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div>
              <div className="mb-4 text-center">
                <h3 className="text-2xl font-bold text-gray-800">
                  {currentDate.toLocaleDateString("fr-FR", { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h3>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto bg-gradient-to-br from-gray-50 to-white rounded-xl p-4">
                {Array.from({ length: 24 }, (_, hour) => {
                  const hourAppointments = getAppointmentsForDate(currentDate).filter(apt => {
                    const aptHour = new Date(apt.datetime).getHours()
                    return aptHour === hour
                  })

                  return (
                    <div key={hour} className="flex gap-4 mb-2 group">
                      <div className="w-20 text-sm font-bold text-gray-600 py-3 text-right">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 min-h-[60px] rounded-lg border-2 border-gray-200 p-2 bg-white group-hover:border-indigo-300 transition-all">
                        {hourAppointments.length > 0 ? (
                          <div className="space-y-2">
                            {hourAppointments.map(apt => (
                              <button
                                key={apt._id}
                                onClick={() => setSelectedAppointment(apt)}
                                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md ${
                                  apt.confirmed
                                    ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-900 border-2 border-green-300'
                                    : 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-900 border-2 border-yellow-300'
                                }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-lg">
                                    {new Date(apt.datetime).toLocaleTimeString("fr-FR", { 
                                      hour: "2-digit", 
                                      minute: "2-digit" 
                                    })}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    apt.confirmed ? 'bg-green-200' : 'bg-yellow-200'
                                  }`}>
                                    {apt.confirmed ? '✓ Confirmé' : '⏳ En attente'}
                                  </span>
                                </div>
                                <div className="text-base font-bold">{apt.studentName}</div>
                                {apt.notes && (
                                  <div className="text-sm mt-2 opacity-80">{apt.notes}</div>
                                )}
                                {apt.calendarEventId && (
                                  <div className="text-xs mt-2 flex items-center gap-1">
                                    <span>🔗</span> Synchronisé Gmail/Outlook
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm py-2">Aucun rendez-vous</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Légende */}
          <div className="flex justify-center gap-6 mt-6 pt-6 border-t-2 border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500" />
              <span className="text-sm text-gray-700 font-medium">Confirmé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-500" />
              <span className="text-sm text-gray-700 font-medium">En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-50 border-2 border-indigo-500" />
              <span className="text-sm text-gray-700 font-medium">Aujourd'hui</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-blue-500" />
              <span className="text-sm text-gray-700 font-medium flex items-center gap-1">
                <span>🔗</span> Synchronisé Gmail/Outlook
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modal horaire complet de la journée */}
      {selectedDaySchedule && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <span>📋</span> Horaire Complet - {selectedDaySchedule.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  {selectedInstructor && (
                    <p className="text-indigo-100 text-sm mt-1">👤 Intervenant: {selectedInstructor}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDaySchedule(null)}
                  className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all">
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Horaires de la journée */}
              {(() => {
                const dayName = getDayNameFromDate(selectedDaySchedule)
                const daySchedules = schedules.filter(s => 
                  s.dayOfWeek === dayName && (!selectedInstructor || s.instructor === selectedInstructor)
                )
                
                return daySchedules.length > 0 ? (
                  <div>
                    <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <span>🕐</span> Horaires Programmés
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {daySchedules.map(schedule => (
                        <div key={schedule._id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4">
                          <div className="font-bold text-lg text-indigo-900 mb-2">{schedule.programme}</div>
                          <div className="text-sm text-gray-700 space-y-2">
                            <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                              <span>🕐</span>
                              <span className="font-bold">{schedule.startTime} - {schedule.endTime}</span>
                            </div>
                            {schedule.instructor && (
                              <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                                <span>👤</span>
                                <span className="font-semibold">{schedule.instructor}</span>
                              </div>
                            )}
                            {schedule.room && (
                              <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                                <span>📍</span>
                                <span className="font-semibold">{schedule.room}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="text-lg font-bold">Aucun horaire programmé pour cette journée</p>
                  </div>
                )
              })()}

              {/* Activités/Ateliers */}
              {(() => {
                const dayActivities = activities.filter(a => {
                  const activityDate = new Date(a.date)
                  return activityDate.toDateString() === selectedDaySchedule.toDateString()
                })
                
                return dayActivities.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <span>🎨</span> Ateliers & Activités
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dayActivities.map(activity => (
                        <div key={activity._id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-bold text-lg text-purple-900">{activity.title}</div>
                            <span className="px-2 py-1 bg-purple-200 text-purple-900 rounded-full text-xs font-bold uppercase">
                              {activity.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 space-y-2">
                            <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                              <span>🕐</span>
                              <span className="font-bold">{activity.startTime} - {activity.endTime}</span>
                            </div>
                            {activity.location && (
                              <div className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                                <span>📍</span>
                                <span className="font-semibold">{activity.location}</span>
                              </div>
                            )}
                            {activity.description && (
                              <div className="text-gray-600 mt-2 bg-white/70 px-3 py-2 rounded-lg italic text-xs">{activity.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Rendez-vous */}
              {(() => {
                const dayAppointments = getAppointmentsForDate(selectedDaySchedule)
                
                return dayAppointments.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <span>📅</span> Rendez-vous
                    </h4>
                    <div className="space-y-3">
                      {dayAppointments.map(apt => (
                        <div
                          key={apt._id}
                          onClick={() => {
                            setSelectedDaySchedule(null)
                            setSelectedAppointment(apt)
                          }}
                          className={`rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                            apt.confirmed
                              ? 'bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-300'
                              : 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300'
                          }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-lg">
                              {new Date(apt.datetime).toLocaleTimeString("fr-FR", { 
                                hour: "2-digit", 
                                minute: "2-digit" 
                              })}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              apt.confirmed ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'
                            }`}>
                              {apt.confirmed ? '✓ Confirmé' : '⏳ En attente'}
                            </span>
                          </div>
                          <div className="font-bold text-gray-900">{apt.studentName}</div>
                          {apt.notes && (
                            <div className="text-sm mt-2 text-gray-700">{apt.notes}</div>
                          )}
                          {apt.calendarEventId && (
                            <div className="text-xs mt-2 flex items-center gap-1 text-blue-700">
                              <span>🔗</span> Synchronisé Gmail/Outlook
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal détails du rendez-vous */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slideUp">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <span>📅</span> Détails du Rendez-vous
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Étudiant</p>
                  <p className="text-lg font-bold text-gray-900">{selectedAppointment.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Statut</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    selectedAppointment.confirmed
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {selectedAppointment.confirmed ? "✓ Confirmé" : "⏳ En attente"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(selectedAppointment.datetime).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Heure</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(selectedAppointment.datetime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-2">Notes</p>
                  <p className="text-gray-900">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.calendarEventId && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔗</span>
                    <p className="text-sm text-blue-900 font-bold">
                      Synchronisé avec Gmail/Outlook
                    </p>
                  </div>
                  <p className="text-xs text-blue-700">
                    Ce rendez-vous est automatiquement synchronisé avec votre calendrier externe. Toute modification sera propagée automatiquement.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t-2">
                <button
                  onClick={() => handleDownloadICS(selectedAppointment._id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium flex items-center justify-center gap-2">
                  <span>📥</span> Télécharger .ics
                </button>
                <button
                  onClick={() => handleDeleteAppointment(selectedAppointment._id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-medium flex items-center justify-center gap-2">
                  <span>🗑️</span> Supprimer
                </button>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
