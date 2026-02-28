import React, { useState, useEffect, useRef } from "react"
import { useConversations } from "../hooks/useConversations"
import { useMessages } from "../hooks/useMessages"
import { useIntervenants } from "../hooks/useIntervenants"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"
import { useThemeContext } from "../contexts/ThemeContext"
import { formatDateTime } from "../utils/dateFormat"

export const ChatInterface: React.FC = () => {
  const { getBgClass, getCardClass, getButtonClass } = useThemeContext()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messageContent, setMessageContent] = useState("")
  const [showNewChat, setShowNewChat] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "team" | "archived">("all")
  const [showContactInfo, setShowContactInfo] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { conversations, loading: loadingConv, createConversation, createGroupConversation, updateConversation, resetUnreadCount, deleteConversation } = useConversations()
  const { messages, loading: loadingMsg, sendMessage, markAsRead } = useMessages(selectedUserId || undefined)
  const { intervenants } = useIntervenants()

  const currentUserId = lumi.auth.user?.userId || ""
  const currentUserRole = lumi.auth.user?.userRole || "USER"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedUserId && messages && messages.length > 0) {
      const unreadMessages = messages.filter(m => m.recipientId === currentUserId && !m.isRead)
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(msg => markAsRead(msg._id))
      }
      
      const conv = conversations.find(c => 
        c.participants.some(p => p.userId === selectedUserId)
      )
      if (conv && conv.unreadCount[currentUserId] > 0) {
        resetUnreadCount(conv._id)
      }
    }
  }, [selectedUserId, messages])

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedUserId) return

    const recipient = conversations
      .find(c => c.participants.some(p => p.userId === selectedUserId))
      ?.participants.find(p => p.userId === selectedUserId)

    if (!recipient) return

    const messageToSend = messageContent
    setMessageContent("") // Vider imm\u00e9diatement l'input

    await sendMessage(
      selectedUserId,
      recipient.userName,
      recipient.userRole,
      messageToSend
    )

    const conv = conversations.find(c => 
      c.participants.some(p => p.userId === selectedUserId)
    )
    
    if (conv) {
      await updateConversation(conv._id, messageToSend.substring(0, 50), selectedUserId)
    }
  }

  const handleStartNewChat = async (userId: string, userName: string, userRole: "ADMIN" | "USER") => {
    await createConversation(userId, userName, userRole)
    setSelectedUserId(userId)
    setShowNewChat(false)
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast.error("Veuillez entrer un nom de groupe et sélectionner au moins un membre")
      return
    }
    
    await createGroupConversation(groupName, selectedMembers)
    setGroupName("")
    setSelectedMembers([])
    setShowCreateGroup(false)
  }

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return
    
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
      await deleteConversation(selectedConversation._id)
      setSelectedUserId(null)
    }
  }

  const selectedConversation = conversations.find(c => 
    c.participants.some(p => p.userId === selectedUserId)
  )

  const otherParticipant = selectedConversation?.participants.find(
    p => p.userId !== currentUserId
  )

  const availableUsers = React.useMemo(() => {
    if (currentUserRole === "ADMIN") {
      return intervenants.filter(i => i.actif && i.userId).map(i => ({
        userId: i.userId,
        userName: i.nom,
        userRole: "USER" as const
      }))
    } else {
      return intervenants.filter(i => i.actif && i.userId && i.userId !== currentUserId).map(i => ({
        userId: i.userId,
        userName: i.nom,
        userRole: i.userRole || "USER" as const
      }))
    }
  }, [currentUserRole, intervenants, currentUserId])

  const filteredUsers = availableUsers.filter(u => 
    u.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !conversations.some(c => c.participants.some(p => p.userId === u.userId))
  )

  const totalUnread = conversations.reduce((sum, conv) => 
    sum + (conv.unreadCount[currentUserId] || 0), 0
  )

  const filteredConversations = conversations.filter(conv => {
    const other = conv.participants.find(p => p.userId !== currentUserId)
    const matchesSearch = other?.userName.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === "team") {
      return matchesSearch && other?.userRole === "ADMIN"
    }
    return matchesSearch
  })

  if (loadingConv) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">💬 Messagerie</h1>
            {totalUnread > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                {totalUnread}
              </span>
            )}
          </div>
          <p className="text-gray-600">Communication et collaboration en temps réel</p>
        </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 250px)" }}>

        <div className="flex overflow-hidden" style={{ height: "100%" }}>
        {/* Sidebar gauche - Navigation et conversations */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Boutons d'action */}
          <div className="p-4 border-b border-gray-200 space-y-2">
            <button
              onClick={() => setShowNewChat(true)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
              <span>➕</span>
              <span>Nouveau message</span>
            </button>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
              <span>👥</span>
              <span>Créer un groupe</span>
            </button>
          </div>
          
          {/* Barre de recherche */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Tabs de filtrage */}
          <div className="flex border-b border-gray-200 px-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "all"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              Tous
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "team"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              Équipe
            </button>
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500 text-sm">Aucune conversation</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isGroup = conv.isGroup
                const other = conv.participants.find(p => p.userId !== currentUserId)
                const unread = conv.unreadCount[currentUserId] || 0
                const isSelected = isGroup ? selectedUserId === conv._id : selectedUserId === other?.userId

                return (
                  <div
                    key={conv._id}
                    onClick={() => setSelectedUserId(isGroup ? conv._id : (other?.userId || null))}
                    className={`p-4 cursor-pointer transition-all border-l-4 ${
                      isSelected
                        ? "bg-indigo-50 border-l-indigo-600"
                        : "border-l-transparent hover:bg-gray-50"
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`relative flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center font-semibold text-white text-sm ${
                        isGroup
                          ? "bg-gradient-to-br from-green-500 to-teal-500"
                          : other?.userRole === "ADMIN" 
                          ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                          : "bg-gradient-to-br from-blue-500 to-indigo-500"
                      }`}>
                        {isGroup ? "👥" : (other?.userName?.[0]?.toUpperCase() || "?")}
                        {isSelected && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {isGroup ? conv.groupName : other?.userName}
                          </h3>
                          {unread > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {isGroup ? `${conv.participants.length} membres` : (conv.lastMessage || "Nouvelle conversation")}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conv.lastMessageAt).toLocaleTimeString("fr-CA", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Panel central - Messages */}
        <div className="flex-1 flex flex-col bg-white">
          {showCreateGroup ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Créer un groupe</h2>
                <button
                  onClick={() => {
                    setShowCreateGroup(false)
                    setGroupName("")
                    setSelectedMembers([])
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Équipe Marketing, Support Client..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner les membres ({selectedMembers.length})
                  </label>
                  <div className="space-y-2">
                    {availableUsers.map(user => (
                      <div
                        key={user.userId}
                        onClick={() => toggleMemberSelection(user.userId)}
                        className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                          selectedMembers.includes(user.userId)
                            ? "bg-indigo-50 border-2 border-indigo-500"
                            : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                        }`}>
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-semibold text-white text-sm ${
                          user.userRole === "ADMIN" 
                            ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                            : "bg-gradient-to-br from-blue-500 to-indigo-500"
                        }`}>
                          {user.userName[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">{user.userName}</h3>
                          <p className="text-xs text-gray-500">
                            {user.userRole === "ADMIN" ? "Administrateur" : "Intervenant"}
                          </p>
                        </div>
                        {selectedMembers.includes(user.userId) && (
                          <span className="text-indigo-600 text-xl">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedMembers.length === 0}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  Créer le groupe
                </button>
              </div>
            </div>
          ) : showNewChat ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Nouvelle conversation</h2>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <p>Aucun utilisateur disponible</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <div
                        key={user.userId}
                        onClick={() => handleStartNewChat(user.userId, user.userName, user.userRole)}
                        className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-all flex items-center gap-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-semibold text-white text-sm ${
                          user.userRole === "ADMIN" 
                            ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                            : "bg-gradient-to-br from-blue-500 to-indigo-500"
                        }`}>
                          {user.userName[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{user.userName}</h3>
                          <p className="text-xs text-gray-500">
                            {user.userRole === "ADMIN" ? "Administrateur" : "Intervenant"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : !selectedUserId ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg font-medium">Sélectionnez une conversation</p>
                <p className="text-sm mt-1">Choisissez un contact pour commencer</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header conversation */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-semibold text-white text-sm ${
                      otherParticipant?.userRole === "ADMIN" 
                        ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                        : "bg-gradient-to-br from-blue-500 to-indigo-500"
                    }`}>
                      {otherParticipant?.userName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">
                        {otherParticipant?.userName}
                      </h2>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                        En ligne
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowContactInfo(!showContactInfo)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    ℹ️
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {loadingMsg ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-gray-500 font-medium">Aucun message</p>
                    <p className="text-gray-400 text-sm mt-1">Envoyez le premier message</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, idx) => {
                      const isOwn = msg.senderId === currentUserId
                      const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId

                      return (
                        <div
                          key={msg._id}
                          className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                          {!isOwn && showAvatar && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                              {msg.senderName[0]?.toUpperCase()}
                            </div>
                          )}
                          {!isOwn && !showAvatar && <div className="w-8"></div>}
                          
                          <div className={`max-w-md ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                            {showAvatar && !isOwn && (
                              <span className="text-xs text-gray-500 font-medium mb-1 ml-1">
                                {msg.senderName}
                              </span>
                            )}
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? "bg-indigo-600 text-white rounded-tr-sm"
                                  : "bg-white text-gray-900 border border-gray-200 rounded-tl-sm"
                              }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((att, i) => (
                                    <a
                                      key={i}
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`block text-xs underline ${
                                        isOwn ? "text-indigo-200" : "text-indigo-600"
                                      }`}>
                                      📎 {att.name}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className={`text-xs text-gray-400 mt-1 ${isOwn ? "mr-1" : "ml-1"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString("fr-CA", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                              {isOwn && (msg.isRead ? " ✓✓" : " ✓")}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input message */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2 items-end">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    📎
                  </button>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Écrivez votre message..."
                    rows={1}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    😊
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel droit - Infos contact */}
        {showContactInfo && selectedUserId && !showNewChat && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col items-center">
                <div className={`h-20 w-20 rounded-full flex items-center justify-center font-bold text-white text-2xl mb-3 ${
                  otherParticipant?.userRole === "ADMIN" 
                    ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                    : "bg-gradient-to-br from-blue-500 to-indigo-500"
                }`}>
                  {otherParticipant?.userName?.[0]?.toUpperCase() || "?"}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{otherParticipant?.userName}</h3>
                <p className="text-sm text-gray-500">
                  {otherParticipant?.userRole === "ADMIN" ? "Administrateur" : "Intervenant"}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                  <span>En ligne</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Détails du contact</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">📧</span>
                    <span className="text-gray-900">{otherParticipant?.userName}@benado.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">👤</span>
                    <span className="text-gray-900">{otherParticipant?.userRole === "ADMIN" ? "Administrateur" : "Intervenant"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Actions rapides</h4>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                    <span>📎</span>
                    <span>Partager un fichier</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                    <span>🔇</span>
                    <span>Désactiver notifications</span>
                  </button>
                  <button
                    onClick={handleDeleteConversation}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                    <span>🗑️</span>
                    <span>Supprimer conversation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
      </div>
    </div>
  )
}
