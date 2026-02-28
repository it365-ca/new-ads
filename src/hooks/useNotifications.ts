import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"

export interface Notification {
  _id: string
  userId: string
  type: "new_enrollment" | "ticket_response"
  titre: string
  message: string
  entityId: string
  entityType: "enrollment" | "ticket"
  lu: boolean
  createdAt: string
  expiresAt?: string
}

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    
    setLoading(true)
    try {
      const response = await lumi.entities.notifications.list({
        filter: { userId },
        sort: { createdAt: -1 },
        limit: 50
      })
      
      if (response && response.list) {
        setNotifications(response.list as Notification[])
        setUnreadCount(response.list.filter((n: any) => !n.lu).length)
      } else {
        // Si la réponse est vide ou invalide, on initialise avec un tableau vide
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      // Gestion silencieuse de l'erreur pour éviter les logs inutiles lors de l'initialisation
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const createNotification = async (data: Omit<Notification, "_id" | "createdAt">) => {
    try {
      await lumi.entities.notifications.create({
        ...data,
        createdAt: new Date().toISOString()
      })
      await fetchNotifications()
    } catch (error) {
      console.error("Failed to create notification:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await lumi.entities.notifications.update(notificationId, { lu: true })
      await fetchNotifications()
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.lu)
      await Promise.all(unreadNotifs.map(n => lumi.entities.notifications.update(n._id, { lu: true })))
      await fetchNotifications()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await lumi.entities.notifications.delete(notificationId)
      await fetchNotifications()
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  useEffect(() => {
    if (userId && userId.length > 0) {
      // Délai court pour s'assurer que l'authentification est complète
      const timeoutId = setTimeout(() => {
        fetchNotifications()
      }, 100)
      
      // Polling toutes les 30 secondes pour les nouvelles notifications
      const interval = setInterval(fetchNotifications, 30000)
      
      return () => {
        clearTimeout(timeoutId)
        clearInterval(interval)
      }
    } else {
      // Réinitialiser si pas d'userId
      setNotifications([])
      setUnreadCount(0)
    }
  }, [userId])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}
