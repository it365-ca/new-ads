import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import { useCustomAuth } from "./useCustomAuth"
import toast from "react-hot-toast"

interface Message {
  _id: string
  senderId: string
  senderName: string
  senderRole: "ADMIN" | "USER"
  recipientId: string
  recipientName: string
  recipientRole: "ADMIN" | "USER"
  content: string
  isRead: boolean
  attachments?: Array<{
    url: string
    name: string
    type: string
  }>
  creator: string
  createdAt: string
  updatedAt: string
}

export const useMessages = (conversationUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useCustomAuth()
  const currentUserId = user?.userId || ""

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const result = await lumi.entities.messages.list()
      
      // Gérer les différents formats de réponse (items ou list)
      const items = result.items || result.list || []
      
      if (conversationUserId) {
        // Filtrer les messages pour cette conversation
        const filtered = items.filter((msg: Message) => 
          (msg.senderId === currentUserId && msg.recipientId === conversationUserId) ||
          (msg.senderId === conversationUserId && msg.recipientId === currentUserId)
        )
        setMessages(filtered.sort((a: Message, b: Message) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ))
      } else {
        setMessages(items)
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des messages")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (recipientId: string, recipientName: string, recipientRole: "ADMIN" | "USER", content: string, attachments: any[] = []) => {
    try {
      const now = new Date().toISOString()
      const tempId = `temp-${Date.now()}`
      
      // Ajout optimiste - le message apparaît immédiatement
      const optimisticMessage: Message = {
        _id: tempId,
        senderId: currentUserId,
        senderName: user?.userName || "Utilisateur",
        senderRole: user?.userRole || "USER",
        recipientId,
        recipientName,
        recipientRole,
        content,
        isRead: false,
        attachments,
        creator: currentUserId,
        createdAt: now,
        updatedAt: now
      }
      
      setMessages(prev => [...prev, optimisticMessage])
      
      // Envoi au serveur en arrière-plan
      const newMessage = await lumi.entities.messages.create({
        senderId: currentUserId,
        senderName: user?.userName || "Utilisateur",
        senderRole: user?.userRole || "USER",
        recipientId,
        recipientName,
        recipientRole,
        content,
        isRead: false,
        attachments,
        creator: currentUserId,
        createdAt: now,
        updatedAt: now
      })
      
      // Remplacer le message temporaire par le vrai
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? newMessage : msg
      ))
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message")
      console.error(error)
      // Retirer le message optimiste en cas d'erreur
      await fetchMessages()
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await lumi.entities.messages.update(messageId, {
        isRead: true,
        updatedAt: new Date().toISOString()
      })
      await fetchMessages()
    } catch (error) {
      console.error("Erreur lors du marquage du message", error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      await lumi.entities.messages.delete(messageId)
      await fetchMessages()
      toast.success("Message supprimé")
    } catch (error) {
      toast.error("Erreur lors de la suppression")
      console.error(error)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [conversationUserId])
  
  useEffect(() => {
    // Rafraîchir les messages toutes les 10 secondes seulement si une conversation est sélectionnée
    if (conversationUserId) {
      const interval = setInterval(fetchMessages, 10000)
      return () => clearInterval(interval)
    }
  }, [conversationUserId])

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    deleteMessage,
    fetchMessages
  }
}
