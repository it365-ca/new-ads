import React, { useMemo } from "react"
import { formatDate } from "../utils/dateFormat"

interface CalendarViewProps {
  startDate: string
  endDate: string
  attendances: Array<{
    _id: string
    date: string
    status: "present" | "absent" | "non_marque"
    motifAbsence?: string
    commentaire?: string
  }>
  onDateClick: (date: string) => void
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  startDate,
  endDate,
  attendances,
  onDateClick
}) => {
  const calendarData = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const months: { [key: string]: Date[] } = {}

    // Générer tous les jours entre start et end
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!months[monthKey]) {
        months[monthKey] = []
      }
      months[monthKey].push(new Date(date))
    }

    return months
  }, [startDate, endDate])

  const getAttendanceStatus = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    const attendance = attendances.find(a => a.date.split("T")[0] === dateStr)
    return attendance?.status || "non_marque"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500"
      case "absent":
        return "bg-red-500"
      default:
        return "bg-gray-200"
    }
  }

  const getDayName = (day: number) => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    return days[day]
  }

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("fr-CA", { month: "long", year: "numeric" })
  }

  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  return (
    <div className="space-y-6">
      {Object.entries(calendarData).map(([monthKey, dates]) => {
        // Organiser les dates par semaine
        const weeks: Date[][] = []
        let currentWeek: Date[] = []
        
        // Ajouter les jours vides au début du mois
        const firstDate = dates[0]
        const firstDay = firstDate.getDay()
        for (let i = 0; i < firstDay; i++) {
          currentWeek.push(null as any)
        }

        dates.forEach(date => {
          currentWeek.push(date)
          if (currentWeek.length === 7) {
            weeks.push(currentWeek)
            currentWeek = []
          }
        })

        if (currentWeek.length > 0) {
          while (currentWeek.length < 7) {
            currentWeek.push(null as any)
          }
          weeks.push(currentWeek)
        }

        return (
          <div key={monthKey} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize">
              {getMonthName(monthKey)}
            </h3>
            
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {getDayName(day)}
                </div>
              ))}
            </div>

            {/* Grille du calendrier */}
            <div className="space-y-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((date, dayIndex) => {
                    if (!date) {
                      return <div key={dayIndex} className="h-16" />
                    }

                    const status = getAttendanceStatus(date)
                    const weekend = isWeekend(date)
                    const dateStr = date.toISOString().split("T")[0]

                    return (
                      <button
                        key={dayIndex}
                        onClick={() => onDateClick(dateStr)}
                        disabled={weekend}
                        className={`h-16 rounded-lg border-2 transition-all ${
                          weekend
                            ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                            : "hover:shadow-md cursor-pointer border-gray-300"
                        }`}>
                        <div className="flex flex-col items-center justify-center h-full p-1">
                          <span className="text-sm font-medium text-gray-900">
                            {date.getDate()}
                          </span>
                          {!weekend && (
                            <div className={`w-8 h-2 rounded-full mt-1 ${getStatusColor(status)}`} />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Légende */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-sm text-gray-600">Présent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-sm text-gray-600">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200" />
                <span className="text-sm text-gray-600">Non marqué</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
