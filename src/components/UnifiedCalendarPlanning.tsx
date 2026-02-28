import React, { useState, useEffect, useMemo } from 'react'
import {Calendar, Clock, Users, MapPin, Plus, Edit2, Trash2, Bell, Grid3x3, User, CalendarDays, Filter, Download, Search} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

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
  type?: 'atelier' | 'rdv-individuel' | 'deplacement'
  school?: string
  capacity?: number
  enrolled?: number
  bufferTime?: number
  color?: string
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
  recurring?: boolean
  recurringPattern?: 'weekly' | 'monthly'
  recurringEndDate?: string
  instructor?: string
  capacity?: number
  color?: string
  bufferTime?: number
}

interface Resource {
  _id?: string
  name: string
  type: 'salle' | 'materiel' | 'equipement'
  capacity?: number
  available: boolean
  location?: string
  notes?: string
}

const activityColors = {
  'atelier': 'bg-blue-500',
  'rdv-individuel': 'bg-green-500',
  'deplacement': 'bg-orange-500',
  'sortie': 'bg-purple-500',
  'formation': 'bg-pink-500',
  'reunion': 'bg-indigo-500'
}

interface UnifiedCalendarPlanningProps {
  onCreateAppointment?: () => void
}

export const UnifiedCalendarPlanning: React.FC<UnifiedCalendarPlanningProps> = ({ onCreateAppointment }) => {
  const [activeView, setActiveView] = useState<'calendar' | 'schedule' | 'booking'>('calendar')
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [programmes, setProgrammes] = useState<any[]>([])
  const [intervenants, setIntervenants] = useState<any[]>([])
  const [intervenantsForDropdown, setIntervenantsForDropdown] = useState<any[]>([])
  
  // Filter states
  const [selectedInstructor, setSelectedInstructor] = useState<string>('')
  const [filterSchool, setFilterSchool] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Modal states
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedDayDetails, setSelectedDayDetails] = useState<Date | null>(null)
  
  const [loading, setLoading] = useState(true)

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const schools = ['École Primaire A', 'École Primaire B', 'Collège Centre', 'Lycée Nord']

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [appointmentsRes, schedulesRes, activitiesRes, resourcesRes, programmesRes, intervenantsRes] = await Promise.all([
        lumi.entities.appointments.list({}),
        lumi.entities.schedules.list({}),
        lumi.entities.activities.list({}),
        lumi.entities.resources.list({}),
        lumi.entities.programmes.list({}),
        lumi.entities.intervenants.list({})
      ])
      
      setAppointments(appointmentsRes.list || [])
      setSchedules(schedulesRes.list || [])
      setActivities(activitiesRes.list || [])
      setResources(resourcesRes.list || [])
      setProgrammes(programmesRes.list || [])
      const allIntervenants = intervenantsRes.list || []
      setIntervenants(allIntervenants)
      // Filtrer pour les menus déroulants
      setIntervenantsForDropdown(allIntervenants.filter((i: any) => {
        const specialite = i.specialite?.toLowerCase() || ''
        return !specialite.includes('administrateur') && !specialite.includes('programmeur')
      }))
    } catch (error) {
      console.error('Erreur chargement données:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  // Calendar data generation
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()
    
    const weeks: (Date | null)[][] = []
    let currentWeek: (Date | null)[] = []
    
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(new Date(year, month, day))
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }
    
    return weeks
  }, [currentDate])

  const getEventsForDate = (date: Date) => {
    if (!date) return { appointments: [], schedules: [], activities: [] }
    
    const dateStr = date.toISOString().split('T')[0]
    const dayName = getDayNameFromDate(date)
    
    const dayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.datetime).toISOString().split('T')[0]
      return aptDate === dateStr
    })
    
    const daySchedules = schedules.filter(s => s.dayOfWeek === dayName)
    
    const dayActivities = activities.filter(a => {
      const actDate = new Date(a.date).toISOString().split('T')[0]
      return actDate === dateStr
    })
    
    return { appointments: dayAppointments, schedules: daySchedules, activities: dayActivities }
  }

  const getDayNameFromDate = (date: Date): string => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    return days[date.getDay()]
  }

  const getDayName = (day: number) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    return days[day]
  }

  const getMonthName = () => {
    return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
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

  const getActivityColor = (type: string): string => {
    return activityColors[type as keyof typeof activityColors] || 'bg-gray-500'
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) return
    
    try {
      await lumi.entities.appointments.delete(appointmentId)
      toast.success('Rendez-vous supprimé')
      loadAllData()
      setSelectedAppointment(null)
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleSaveSchedule = async (schedule: Schedule) => {
    try {
      if (schedule._id) {
        await lumi.entities.schedules.update(schedule._id, schedule)
        toast.success('Horaire mis à jour')
      } else {
        await lumi.entities.schedules.create(schedule)
        toast.success('Horaire créé')
      }
      loadAllData()
      setShowScheduleForm(false)
      setEditingSchedule(null)
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleSaveActivity = async (activity: Activity) => {
    try {
      if (activity._id) {
        await lumi.entities.activities.update(activity._id, activity)
        toast.success('Activité mise à jour')
      } else {
        if (activity.recurring && activity.recurringPattern && activity.recurringEndDate) {
          const startDate = new Date(activity.date)
          const endDate = new Date(activity.recurringEndDate)
          const instances = []
          
          let currentDate = new Date(startDate)
          while (currentDate <= endDate) {
            instances.push({
              ...activity,
              date: currentDate.toISOString().split('T')[0],
              recurring: false
            })
            
            if (activity.recurringPattern === 'weekly') {
              currentDate.setDate(currentDate.getDate() + 7)
            } else if (activity.recurringPattern === 'monthly') {
              currentDate.setMonth(currentDate.getMonth() + 1)
            }
          }
          
          await Promise.all(instances.map(inst => lumi.entities.activities.create(inst)))
          toast.success(`${instances.length} sessions créées`)
        } else {
          await lumi.entities.activities.create(activity)
          toast.success('Activité créée')
        }
      }
      loadAllData()
      setShowActivityForm(false)
      setEditingActivity(null)
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const filteredSchedules = schedules.filter(s => 
    (!filterSchool || s.school === filterSchool) &&
    (!filterType || s.type === filterType) &&
    (!selectedInstructor || s.instructor === selectedInstructor) &&
    (!searchQuery || s.programme.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const todayEvents = useMemo(() => {
    const today = new Date()
    return getEventsForDate(today)
  }, [appointments, schedules, activities, currentDate])

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Calendrier & Planification</h1>
        <p className="text-gray-600">Gestion unifiée des rendez-vous, horaires et ateliers</p>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveView('calendar')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
              activeView === 'calendar'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <Calendar className="inline mr-2" size={18} />
            Vue Calendrier
          </button>
          <button
            onClick={() => setActiveView('schedule')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
              activeView === 'schedule'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <Clock className="inline mr-2" size={18} />
            Horaires & Ateliers
          </button>
          <button
            onClick={() => setActiveView('booking')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
              activeView === 'booking'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <Bell className="inline mr-2" size={18} />
            Réservation
          </button>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Intervenant Filter */}
            <select
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">Tous les intervenants</option>
              {intervenantsForDropdown.map(i => (
                <option key={i._id} value={`${i.prenom} ${i.nom}`}>{i.prenom} {i.nom}</option>
              ))}
            </select>

            {/* School Filter */}
            {activeView === 'schedule' && (
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">Toutes les écoles</option>
                {schools.map(school => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2">
            {activeView === 'calendar' && onCreateAppointment && (
              <button
                onClick={onCreateAppointment}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2">
                <Plus size={18} />
                Nouveau RDV
              </button>
            )}
            {activeView === 'schedule' && (
              <>
                <button
                  onClick={() => {
                    setEditingSchedule(null)
                    setShowScheduleForm(true)
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2">
                  <Plus size={18} />
                  Nouvel Horaire
                </button>
                <button
                  onClick={() => {
                    setEditingActivity(null)
                    setShowActivityForm(true)
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2">
                  <Plus size={18} />
                  Nouvel Atelier
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Calendrier Unifié
                </h2>
                <p className="text-gray-600 mt-1">
                  {appointments.length} RDV • {schedules.length} horaires • {activities.length} ateliers
                </p>
              </div>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-medium text-sm">
                Aujourd'hui
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-6">
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

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <div key={day} className="text-center text-sm font-bold text-gray-700 py-2">
                  {getDayName(day)}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="space-y-2">
              {calendarData.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((date, dayIndex) => {
                    if (!date) {
                      return <div key={dayIndex} className="h-28" />
                    }

                    const events = getEventsForDate(date)
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    const totalEvents = events.appointments.length + events.schedules.length + events.activities.length

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => setSelectedDayDetails(date)}
                        className={`h-28 rounded-lg border-2 p-2 transition-all cursor-pointer ${
                          isToday
                            ? 'border-indigo-500 bg-indigo-50'
                            : isWeekend
                            ? 'bg-gray-50 border-gray-200'
                            : 'border-gray-300 bg-white hover:shadow-md hover:border-indigo-400'
                        }`}>
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-bold ${
                              isToday ? 'text-indigo-600' : 'text-gray-900'
                            }`}>
                              {date.getDate()}
                            </span>
                            {totalEvents > 0 && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                {totalEvents}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-1 overflow-y-auto">
                            {events.appointments.slice(0, 2).map(apt => (
                              <div
                                key={apt._id}
                                className={`text-xs px-2 py-1 rounded truncate ${
                                  apt.confirmed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                📅 {new Date(apt.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            ))}
                            {events.schedules.slice(0, 1).map((sch, idx) => (
                              <div key={idx} className="text-xs px-2 py-1 rounded truncate bg-blue-100 text-blue-800">
                                🕐 {sch.startTime}
                              </div>
                            ))}
                            {events.activities.slice(0, 1).map(act => (
                              <div key={act._id} className="text-xs px-2 py-1 rounded truncate bg-purple-100 text-purple-800">
                                🎨 {act.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6 pt-6 border-t-2 border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500" />
                <span className="text-sm text-gray-700 font-medium">RDV Confirmé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-500" />
                <span className="text-sm text-gray-700 font-medium">Horaire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-500" />
                <span className="text-sm text-gray-700 font-medium">Atelier</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule View */}
      {activeView === 'schedule' && (
        <div className="space-y-6">
          {/* Today's Overview */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-sm border-2 border-indigo-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarDays size={24} />
              Programme d'aujourd'hui - {getDayNameFromDate(new Date())}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">{todayEvents.appointments.length}</div>
                <div className="text-sm text-gray-600">Rendez-vous</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">{todayEvents.schedules.length}</div>
                <div className="text-sm text-gray-600">Horaires programmés</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600">{todayEvents.activities.length}</div>
                <div className="text-sm text-gray-600">Ateliers & Activités</div>
              </div>
            </div>
          </div>

          {/* Schedules List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Horaires Hebdomadaires</h3>
            <div className="grid gap-3">
              {filteredSchedules.map(schedule => (
                <div key={schedule._id} className={`border-l-4 ${getActivityColor(schedule.type || 'atelier')} border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getActivityColor(schedule.type || 'atelier')}`}>
                          {schedule.type || 'Atelier'}
                        </span>
                        <h4 className="font-bold text-lg text-gray-800">{schedule.programme}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <Clock className="inline mr-1" size={14} />
                        {schedule.dayOfWeek} • {schedule.startTime} - {schedule.endTime}
                      </p>
                      {schedule.school && <p className="text-sm text-gray-500">🏫 {schedule.school}</p>}
                      {schedule.room && <p className="text-sm text-gray-500">📍 {schedule.room}</p>}
                      {schedule.instructor && <p className="text-sm text-gray-500">👤 {schedule.instructor}</p>}
                      {schedule.capacity && (
                        <p className="text-sm text-gray-500">
                          👥 {schedule.enrolled || 0}/{schedule.capacity} places
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditingSchedule(schedule)
                        setShowScheduleForm(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activities List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ateliers & Activités</h3>
            <div className="grid gap-4">
              {activities.map(activity => (
                <div key={activity._id} className={`border-l-4 ${getActivityColor(activity.type)} border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getActivityColor(activity.type)}`}>
                          {activity.type}
                        </span>
                        <h4 className="font-bold text-lg text-gray-800">{activity.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        📅 {activity.date} • {activity.startTime} - {activity.endTime}
                      </p>
                      {activity.location && <p className="text-sm text-gray-500">📍 {activity.location}</p>}
                      {activity.instructor && <p className="text-sm text-gray-500">👤 {activity.instructor}</p>}
                      {activity.capacity && <p className="text-sm text-gray-500">👥 Capacité: {activity.capacity} personnes</p>}
                      {activity.recurring && (
                        <p className="text-xs text-indigo-600 font-semibold mt-2">
                          🔄 Récurrent ({activity.recurringPattern === 'weekly' ? 'Hebdomadaire' : 'Mensuel'})
                        </p>
                      )}
                      {activity.description && <p className="text-sm text-gray-600 mt-2">{activity.description}</p>}
                    </div>
                    <button
                      onClick={() => {
                        setEditingActivity(activity)
                        setShowActivityForm(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Booking View */}
      {activeView === 'booking' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Système de Réservation</h2>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-indigo-200">
            <p className="text-gray-700 mb-4">
              Les écoles peuvent sélectionner des créneaux selon la disponibilité réelle des intervenantes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">École demandeuse</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">-- Sélectionner --</option>
                  {schools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type de session</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">-- Sélectionner --</option>
                  <option value="atelier">Atelier de groupe</option>
                  <option value="rdv-individuel">RDV individuel</option>
                  <option value="formation">Formation</option>
                </select>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Créneaux disponibles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {['09:00 - 10:30', '11:00 - 12:30', '14:00 - 15:30', '16:00 - 17:30'].map(slot => (
                  <button
                    key={slot}
                    className="px-4 py-3 border-2 border-green-200 bg-green-50 text-green-800 rounded-lg hover:bg-green-100 transition-all text-sm font-semibold">
                    ✅ {slot}
                  </button>
                ))}
                <button className="px-4 py-3 border-2 border-gray-200 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed text-sm">
                  ❌ 13:00 - 14:00
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold">
                Confirmer la réservation
              </button>
              <button className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all font-semibold">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Day Details */}
      {selectedDayDetails && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">
                    📋 Détails - {selectedDayDetails.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDayDetails(null)}
                  className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all">
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {(() => {
                const events = getEventsForDate(selectedDayDetails)
                
                return (
                  <>
                    {/* Appointments */}
                    {events.appointments.length > 0 && (
                      <div>
                        <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                          <span>📅</span> Rendez-vous ({events.appointments.length})
                        </h4>
                        <div className="space-y-3">
                          {events.appointments.map(apt => (
                            <div
                              key={apt._id}
                              onClick={() => {
                                setSelectedDayDetails(null)
                                setSelectedAppointment(apt)
                              }}
                              className={`rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                                apt.confirmed
                                  ? 'bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-300'
                                  : 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300'
                              }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-lg">
                                  {new Date(apt.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  apt.confirmed ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'
                                }`}>
                                  {apt.confirmed ? '✓ Confirmé' : '⏳ En attente'}
                                </span>
                              </div>
                              <div className="font-bold text-gray-900">{apt.studentName}</div>
                              {apt.notes && <div className="text-sm mt-2 text-gray-700">{apt.notes}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Schedules */}
                    {events.schedules.length > 0 && (
                      <div>
                        <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                          <span>🕐</span> Horaires Programmés ({events.schedules.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {events.schedules.map((schedule, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4">
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
                    )}

                    {/* Activities */}
                    {events.activities.length > 0 && (
                      <div>
                        <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                          <span>🎨</span> Ateliers & Activités ({events.activities.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {events.activities.map(activity => (
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
                    )}

                    {events.appointments.length === 0 && events.schedules.length === 0 && events.activities.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-xl font-bold">Aucun événement prévu pour cette journée</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Appointment Details */}
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
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedAppointment.confirmed ? '✓ Confirmé' : '⏳ En attente'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(selectedAppointment.datetime).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Heure</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(selectedAppointment.datetime).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
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
                    Ce rendez-vous est automatiquement synchronisé avec votre calendrier externe.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t-2">
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
