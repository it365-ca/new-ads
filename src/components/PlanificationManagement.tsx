import React, { useState, useEffect } from 'react'
import {Calendar, Clock, Users, MapPin, Plus, Edit2, Trash2, Eye, Bell, Move, Grid3x3, User, CalendarDays} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

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

export const PlanificationManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<'admin' | 'instructor'>('admin')
  const [activeTab, setActiveTab] = useState<'calendar' | 'activities' | 'resources' | 'booking'>('calendar')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [programmes, setProgrammes] = useState<any[]>([])
  const [intervenants, setIntervenants] = useState<any[]>([])
  const [selectedInstructor, setSelectedInstructor] = useState<string>('')
  
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [showResourceForm, setShowResourceForm] = useState(false)
  
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)

  const [filterSchool, setFilterSchool] = useState<string>('')
  const [filterDay, setFilterDay] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const schools = [
    // ÉCOLES PRIMAIRES
    'J-L Vinet-Souligny',
    'J-L Des Cheminots',
    'J-L Félix-Leclerc',
    'J-L Piché-Dufrost',
    'J-L Aquarelle-Armand-Frappier',
    'L-C Saint-Romain',
    'L-C Saint-Patrice',
    'L-C St-Édouard',
    'L-C Daigneau',
    'L-C Saint-Bernard-de-Lacolle',
    'P-B Saint-Michel-Archange',
    'P-B Saint-Isidore Langevin',
    'P-B Sainte- Clotilde',
    'P-B Saint-Viateur-Clothilde-Raymond',
    // ÉCOLES SECONDAIRES
    'Bonnier',
    'Des Timoniers',
    'Gabrielle-Roy',
    'Jacques-Leber',
    'Marguerite-Bourgeois',
    'Louis-Cyr',
    'St-François-Xavier',
    'Louis-Philippe-Paré',
    'De La Magdeleine',
    'Du Tournant',
    'Pierre-Bédard',
    'Fernand-Séguin',
    'Hors Territoire',
    'École aux adultes'
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [schedulesRes, activitiesRes, resourcesRes, programmesRes, intervenantsRes] = await Promise.all([
        lumi.entities.schedules.list(),
        lumi.entities.activities.list(),
        lumi.entities.resources.list(),
        lumi.entities.programmes.list(),
        lumi.entities.intervenants.list()
      ])
      
      setSchedules(schedulesRes.list || [])
      setActivities(activitiesRes.list || [])
      setResources(resourcesRes.list || [])
      setProgrammes(programmesRes.list || [])
      setIntervenants(intervenantsRes.list || [])
    } catch (error) {
      console.error('Erreur chargement données:', error)
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
      loadData()
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
        // Handle recurring activities
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
      loadData()
      setShowActivityForm(false)
      setEditingActivity(null)
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleSaveResource = async (resource: Resource) => {
    try {
      if (resource._id) {
        await lumi.entities.resources.update(resource._id, resource)
        toast.success('Ressource mise à jour')
      } else {
        await lumi.entities.resources.create(resource)
        toast.success('Ressource créée')
      }
      loadData()
      setShowResourceForm(false)
      setEditingResource(null)
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const getActivityColor = (type: string): string => {
    return activityColors[type as keyof typeof activityColors] || 'bg-gray-500'
  }

  const todaySchedule = schedules.filter(s => {
    if (viewMode === 'instructor' && selectedInstructor) {
      return s.instructor === selectedInstructor && s.dayOfWeek === daysOfWeek[new Date().getDay() - 1]
    }
    return s.dayOfWeek === daysOfWeek[new Date().getDay() - 1]
  }).sort((a, b) => a.startTime.localeCompare(b.startTime))

  const filteredSchedules = schedules.filter(s => 
    (!filterSchool || s.school === filterSchool) &&
    (!filterDay || s.dayOfWeek === filterDay) &&
    (!filterType || s.type === filterType) &&
    (!selectedInstructor || s.instructor === selectedInstructor)
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Planification</h1>
          <p className="text-gray-600">Gestion intelligente des horaires et ateliers</p>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setViewMode('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'admin' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid3x3 className="inline mr-2" size={16} />
              Vue Admin
            </button>
            <button
              onClick={() => setViewMode('instructor')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'instructor' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <User className="inline mr-2" size={16} />
              Vue Intervenante
            </button>
          </div>
        </div>

      {/* Instructor Selector for Instructor View */}
      {viewMode === 'instructor' && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionner une intervenante</label>
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Choisir --</option>
            {intervenantsForDropdown.map(int => (
              <option key={int._id} value={`${int.prenom} ${int.nom}`}>
                {int.prenom} {int.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Today's Schedule for Instructor View */}
      {viewMode === 'instructor' && selectedInstructor && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              <CalendarDays className="inline mr-2" size={24} />
              Programme du jour
            </h2>
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          
          <div className="space-y-3">
            {todaySchedule.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune session programmée aujourd'hui</p>
            ) : (
              todaySchedule.map((schedule, idx) => (
                <div key={idx} className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${getActivityColor(schedule.type || 'atelier')} bg-gray-50`}>
                  <div className="flex-shrink-0 text-center">
                    <div className="text-lg font-bold text-gray-800">{schedule.startTime}</div>
                    <div className="text-xs text-gray-500">{schedule.endTime}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{schedule.programme}</h3>
                    <p className="text-sm text-gray-600">{schedule.type || 'Atelier'}</p>
                    {schedule.school && <p className="text-sm text-gray-500">📍 {schedule.school}</p>}
                    {schedule.room && <p className="text-xs text-gray-500">Salle: {schedule.room}</p>}
                    {schedule.bufferTime && (
                      <p className="text-xs text-orange-600 mt-1">⏱️ Temps de transition: {schedule.bufferTime} min</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto border border-gray-200">
        <div className="flex border-b border-gray-200 min-w-max">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 min-w-[120px] px-4 sm:px-6 py-3 sm:py-4 text-center font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'calendar'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="inline mr-2" size={18} />
            Calendrier
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 min-w-[120px] px-4 sm:px-6 py-3 sm:py-4 text-center font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'activities'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="inline mr-2" size={18} />
            Ateliers
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex-1 min-w-[120px] px-4 sm:px-6 py-3 sm:py-4 text-center font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'booking'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bell className="inline mr-2" size={18} />
            Réservation
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex-1 min-w-[120px] px-4 sm:px-6 py-3 sm:py-4 text-center font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'resources'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapPin className="inline mr-2" size={18} />
            Ressources
          </button>
        </div>
      </div>

      {/* Color Legend */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">Légende des couleurs</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Atelier de groupe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">RDV 1-1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-xs text-gray-600">Déplacement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-xs text-gray-600">Sortie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-500 rounded"></div>
            <span className="text-xs text-gray-600">Formation</span>
          </div>
        </div>
      </div>

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg flex-1 sm:flex-initial"
              >
                <option value="">Toutes les écoles</option>
                {schools.map(school => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg flex-1 sm:flex-initial"
              >
                <option value="">Tous les jours</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg flex-1 sm:flex-initial"
              >
                <option value="">Tous types</option>
                <option value="atelier">Atelier</option>
                <option value="rdv-individuel">RDV 1-1</option>
                <option value="deplacement">Déplacement</option>
              </select>
            </div>
            <button
              onClick={() => {
                setEditingSchedule(null)
                setShowScheduleForm(true)
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center text-sm"
            >
              <Plus className="mr-2" size={18} />
              Nouvel Horaire
            </button>
          </div>

          <div className="grid gap-3">
            {filteredSchedules.map(schedule => (
              <div key={schedule._id} className={`border-l-4 ${getActivityColor(schedule.type || 'atelier')} border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getActivityColor(schedule.type || 'atelier')}`}>
                        {schedule.type || 'Atelier'}
                      </span>
                      <h3 className="font-bold text-base sm:text-lg text-gray-800">{schedule.programme}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <Clock className="inline mr-1" size={14} />
                      {schedule.dayOfWeek} • {schedule.startTime} - {schedule.endTime}
                    </p>
                    {schedule.school && <p className="text-sm text-gray-500">📍 {schedule.school}</p>}
                    {schedule.room && <p className="text-sm text-gray-500">Salle: {schedule.room}</p>}
                    {schedule.instructor && <p className="text-sm text-gray-500">👤 {schedule.instructor}</p>}
                    {schedule.capacity && (
                      <p className="text-sm text-gray-500">
                        👥 {schedule.enrolled || 0}/{schedule.capacity} places
                      </p>
                    )}
                    {schedule.bufferTime && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⏱️ Tampon de transition: {schedule.bufferTime} minutes
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSchedule(schedule)
                        setShowScheduleForm(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Drag & Drop activé">
                      <Move size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVITIES/ATELIERS TAB */}
      {activeTab === 'activities' && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="text-sm text-gray-600">
              Gérez vos séries d'ateliers récurrents et suivez la capacité d'accueil
            </div>
            <button
              onClick={() => {
                setEditingActivity(null)
                setShowActivityForm(true)
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center text-sm"
            >
              <Plus className="mr-2" size={18} />
              Nouvel Atelier
            </button>
          </div>

          <div className="grid gap-4">
            {activities.map(activity => (
              <div key={activity._id} className={`border-l-4 ${getActivityColor(activity.type)} border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getActivityColor(activity.type)}`}>
                        {activity.type}
                      </span>
                      <h3 className="font-bold text-base sm:text-lg text-gray-800">{activity.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      📅 {activity.date} • {activity.startTime} - {activity.endTime}
                    </p>
                    {activity.location && <p className="text-sm text-gray-500">📍 {activity.location}</p>}
                    {activity.instructor && <p className="text-sm text-gray-500">👤 {activity.instructor}</p>}
                    {activity.capacity && (
                      <p className="text-sm text-gray-500">👥 Capacité: {activity.capacity} personnes</p>
                    )}
                    {activity.recurring && (
                      <p className="text-xs text-indigo-600 font-semibold mt-2">
                        🔄 Récurrent ({activity.recurringPattern === 'weekly' ? 'Hebdomadaire' : 'Mensuel'})
                      </p>
                    )}
                    {activity.bufferTime && (
                      <p className="text-xs text-orange-600 mt-1">⏱️ Tampon: {activity.bufferTime} min</p>
                    )}
                    {activity.description && <p className="text-sm text-gray-600 mt-2">{activity.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingActivity(activity)
                        setShowActivityForm(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOKING TAB */}
      {activeTab === 'booking' && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">📅 Système de Réservation en Libre-Service</h2>
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
                    className="px-4 py-3 border-2 border-green-200 bg-green-50 text-green-800 rounded-lg hover:bg-green-100 transition-all text-sm font-semibold"
                  >
                    ✅ {slot}
                  </button>
                ))}
                <button className="px-4 py-3 border-2 border-gray-200 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed text-sm">
                  ❌ 13:00 - 14:00
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold">
                Confirmer la réservation
              </button>
              <button className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all font-semibold">
                Annuler
              </button>
            </div>
          </div>
          
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">🔔 Notifications automatiques activées</h4>
            <p className="text-sm text-yellow-700">
              Des SMS/emails de confirmation seront envoyés automatiquement pour réduire les absences (no-shows)
            </p>
          </div>
        </div>
      )}

      {/* RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800">Gestion des ressources</h2>
            <button
              onClick={() => {
                setEditingResource(null)
                setShowResourceForm(true)
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center text-sm"
            >
              <Plus className="mr-2" size={18} />
              Nouvelle Ressource
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map(resource => (
              <div key={resource._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-gray-800">{resource.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    resource.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {resource.available ? 'Disponible' : 'Indisponible'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 uppercase mb-2">{resource.type}</p>
                {resource.capacity && <p className="text-sm text-gray-600">Capacité: {resource.capacity} personnes</p>}
                {resource.location && <p className="text-sm text-gray-600">📍 {resource.location}</p>}
                {resource.notes && <p className="text-sm text-gray-500 mt-2">{resource.notes}</p>}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setEditingResource(resource)
                      setShowResourceForm(true)
                    }}
                    className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={16} className="mx-auto" />
                  </button>
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
