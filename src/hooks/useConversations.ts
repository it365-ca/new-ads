import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import { useCustomAuth } from "./useCustomAuth"
import toast from "react-hot-toast"
import { useIntervenants } from "./useIntervenants"

interface Conversation {
  _id: string
  participants: Array<{
    userId: string
    userName: string
    userRole: "ADMIN" | "USER"
  }>
  lastMessage: string
  lastMessageAt: string
  unreadCount: Record<string, number>
  creator: string
  createdAt: string
  updatedAt: string
  isGroup: boolean
  groupName: string
  groupAvatar?: string
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useCustomAuth()
  const currentUserId = user?.userId || ""
  const { intervenants } = useIntervenants()

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const result = await lumi.entities.conversations.list()
      
      // Gérer les différents formats de réponse (items ou list)
      const items = result.items || result.list || []
      
      // Filtrer les conversations où l'utilisateur est participant
      const userConversations = items.filter((conv: Conversation) => 
        conv.participants.some(p => p.userId === currentUserId)
      )
      
      // Trier par dernière activité
      const sorted = userConversations.sort((a: Conversation, b: Conversation) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )
      
      setConversations(sorted)
    } catch (error) {
      toast.error("Erreur lors du chargement des conversations")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (otherUserId: string, otherUserName: string, otherUserRole: "ADMIN" | "USER") => {
    try {
      // Vérifier si une conversation existe déjà
      const existing = conversations.find(conv => 
        conv.participants.some(p => p.userId === otherUserId)
      )
      
      if (existing) {
        return existing._id
      }

      const now = new Date().toISOString()
      const result = await lumi.entities.conversations.create({
        participants: [
          {
            userId: currentUserId,
            userName: user?.userName || "Utilisateur",
            userRole: user?.userRole || "USER"
          },
          {
            userId: otherUserId,
            userName: otherUserName,
            userRole: otherUserRole
          }
        ],
        lastMessage: "",
        lastMessageAt: now,
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0
        },
        creator: currentUserId,
        createdAt: now,
        updatedAt: now,
        isGroup: false,
        groupName: ""
      })
      
      await fetchConversations()
      return result._id
    } catch (error) {
      toast.error("Erreur lors de la création de la conversation")
      console.error(error)
    }
  }

  const createGroupConversation = async (groupName: string, memberIds: string[]) => {
    try {
      const now = new Date().toISOString()
      
      // Récupérer les infos des membres
      const members = memberIds.map(id => {
        const intervenant = intervenants?.find(i => i.userId === id)
        return {
          userId: id,
          userName: intervenant?.nom || "Utilisateur",
          userRole: intervenant?.userRole || "USER" as const
        }
      })
      
      // Ajouter l'utilisateur actuel
      members.unshift({
        userId: currentUserId,
        userName: user?.userName || "Utilisateur",
        userRole: user?.userRole || "USER"
      })
      
      // Initialiser les compteurs non lus
      const unreadCount: Record<string, number> = {}
      members.forEach(m => {
        unreadCount[m.userId] = 0
      })
      
      const result = await lumi.entities.conversations.create({
        participants: members,
        lastMessage: "",
        lastMessageAt: now,
        unreadCount,
        creator: currentUserId,
        createdAt: now,
        updatedAt: now,
        isGroup: true,
        groupName
      })
      
      toast.success(`Groupe "${groupName}" créé`)
      await fetchConversations()
      return result._id
    } catch (error) {
      toast.error("Erreur lors de la création du groupe")
      console.error(error)
    }
  }

  const updateConversation = async (conversationId: string, lastMessage: string, incrementUnreadFor: string) => {
    try {
      const conversation = conversations.find(c => c._id === conversationId)
      if (!conversation) return

      const newUnreadCount = { ...conversation.unreadCount }
      newUnreadCount[incrementUnreadFor] = (newUnreadCount[incrementUnreadFor] || 0) + 1

      await lumi.entities.conversations.update(conversationId, {
        lastMessage,
        lastMessageAt: new Date().toISOString(),
        unreadCount: newUnreadCount,
        updatedAt: new Date().toISOString()
      })
      
      await fetchConversations()
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la conversation", error)
    }
  }

  const resetUnreadCount = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c._id === conversationId)
      if (!conversation) return

      const newUnreadCount = { ...conversation.unreadCount }
      newUnreadCount[currentUserId] = 0

      await lumi.entities.conversations.update(conversationId, {
        unreadCount: newUnreadCount,
        updatedAt: new Date().toISOString()
      })
      
      await fetchConversations()
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du compteur", error)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])
  
  useEffect(() => {
    // Rafraîchir les conversations toutes les 30 secondes (discret)
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [])

  const deleteConversation = async (conversationId: string) => {
    try {
      await lumi.entities.conversations.delete(conversationId)
      toast.success("Conversation supprimée")
      await fetchConversations()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
      console.error(error)
    }
  }

  return {
    conversations,
    loading,
    createConversation,
    createGroupConversation,
    updateConversation,
    resetUnreadCount,
    deleteConversation,
    fetchConversations
  }
}
