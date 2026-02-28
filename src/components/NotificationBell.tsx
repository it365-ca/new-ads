import React, { useState } from "react"
import { useNotifications } from "../hooks/useNotifications"
import { useNavigate } from "react-router-dom"
import { formatDate } from "../utils/dateFormat"

interface NotificationBellProps {
  userId: string
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(userId)
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification._id)
    setIsOpen(false)
    
    // Navigation selon le type d'entité
    if (notification.entityType === "enrollment") {
      // Navigation vers le tableau de bord pour voir l'inscription
      navigate("/")
    } else if (notification.entityType === "ticket") {
      // Navigation vers l'onglet tickets
      navigate("/?tab=tickets")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_enrollment":
        return "⏳"
      case "ticket_response":
        return "💬"
      default:
        return "🔔"
    }
  }

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className="relative">
      {/* Bouton Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge avec nombre de notifications non lues */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Menu déroulant des notifications */}
      {isOpen && (
        <>
          {/* Overlay pour fermer le menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel de notifications */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[300] max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
              <div>
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-600">{unreadCount} non lue{unreadCount !== 1 ? "s" : ""}</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  ✓ Tout marquer lu
                </button>
              )}
            </div>

            {/* Liste des notifications */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="text-5xl mb-2">🔔</div>
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${
                        !notification.lu ? "bg-indigo-50 border-l-4 border-indigo-500" : ""
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-semibold text-gray-900 ${!notification.lu ? "font-bold" : ""}`}>
                            {notification.titre}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification._id)
                          }}
                          className="text-gray-400 hover:text-red-600 flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 10 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Voir toutes les notifications ({notifications.length})
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
