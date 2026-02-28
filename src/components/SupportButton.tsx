import React, { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { lumi } from "../lib/lumi"
import { formatDateTime } from "../utils/dateFormat"

interface SupportButtonProps {
  user: {
    userId: string
    email: string
    userName: string
    userRole: string
  }
}

interface Ticket {
  _id: string
  ticketId: string
  type: string
  sujet: string
  description: string
  status: string
  priorite: string
  createdBy: string
  createdByEmail: string
  createdByName: string
  reponses: Array<{
    auteur: string
    auteurEmail: string
    message: string
    date: string
    isAdmin: boolean
  }>
  createdAt: string
  updatedAt: string
}

export const SupportButton: React.FC<SupportButtonProps> = ({ user }) => {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"create" | "list">("create")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [formData, setFormData] = useState({
    type: "",
    sujet: "",
    description: "",
    priorite: "Normale"
  })

  useEffect(() => {
    if (showModal && activeTab === "list") {
      fetchMyTickets()
    }
  }, [showModal, activeTab])

  const fetchMyTickets = async () => {
    try {
      // Refresh user si nécessaire
      if (!user?.userId) {
         try { await lumi.auth.refreshUser() } catch(e) {}
      }

      // Récupérer TOUS les tickets puis filtrer localement pour être sûr
      // (parfois le filtre côté serveur peut être capricieux si les index manquent)
      const result = await lumi.entities.tickets.list()
      
      let allTickets: Ticket[] = []
      if (Array.isArray(result)) allTickets = result
      else if (result?.list) allTickets = result.list
      
      // Filtrer pour l'utilisateur courant
      const myTickets = allTickets.filter((t: Ticket) => 
        t.createdBy === user.userId || t.createdByEmail === user.email
      )

      setTickets(myTickets.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    } catch (error) {
      toast.error("Erreur lors du chargement des tickets")
      console.error(error)
    }
  }

  const handleDeleteMyTicket = async (ticket: Ticket) => {
    const id = ticket?._id
    if (!id) {
      toast.error("ID du ticket manquant")
      return
    }

    if (!window.confirm(`Supprimer définitivement le ticket ${ticket.ticketId} ?`)) {
      return
    }

    const toastId = toast.loading("Suppression en cours...")
    try {
      await lumi.entities.tickets.delete(id)
      toast.dismiss(toastId)
      toast.success("Ticket supprimé")
      await fetchMyTickets()
    } catch (error: any) {
      toast.dismiss(toastId)
      const msg = error?.message || "Suppression impossible (permissions/auth)"
      toast.error(msg)
      console.error("Suppression ticket échouée:", { id, error })
    }
  }

  const generateTicketId = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, "0")
    return `TICKET-${day}-${month}-${year}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.type || !formData.sujet || !formData.description) {
      toast.error("Veuillez remplir tous les champs requis")
      return
    }

    setIsSubmitting(true)
    try {
      const ticketId = generateTicketId()
      const now = new Date().toISOString()

      await lumi.entities.tickets.create({
        ticketId,
        type: formData.type,
        sujet: formData.sujet,
        description: formData.description,
        status: "Nouveau",
        priorite: formData.priorite,
        createdBy: user.userId,
        createdByEmail: user.email,
        createdByName: user.userName,
        reponses: [],
        creator: user.userId,
        createdAt: now,
        updatedAt: now
      })

      try {
        await lumi.tools.email.send({
          to: "support@it-365.ca",
          subject: `Ticket créé pour l'application Benado - ${ticketId}`,
          fromName: "Support Benado",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Nouveau ticket de support - ${ticketId}</h2>
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Type:</strong> ${formData.type}</p>
                <p><strong>Sujet:</strong> ${formData.sujet}</p>
                <p><strong>Priorité:</strong> ${formData.priorite}</p>
                <p><strong>Créé par:</strong> ${user.userName} (${user.email})</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString("fr-CA")}</p>
              </div>
              <div style="background: white; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
                <h3 style="color: #374151; margin-top: 0;">Description:</h3>
                <p style="white-space: pre-wrap; color: #6B7280;">${formData.description}</p>
              </div>
              <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
                Vous pouvez suivre et répondre à ce ticket directement dans l'application Benado.
              </p>
            </div>
          `
        })
      } catch (emailError) {
        console.warn("Email notification failed:", emailError)
      }

      toast.success(`Ticket ${ticketId} créé avec succès! 🎫`)
      setFormData({ type: "", sujet: "", description: "", priorite: "Normale" })
      setActiveTab("list")
      
      // Émettre un événement pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('ticketCreated', { detail: { ticketId } }))
      
      // Délai pour laisser le temps à la base de données de synchroniser
      setTimeout(() => {
        fetchMyTickets()
      }, 500)
    } catch (error) {
      toast.error("Erreur lors de la création du ticket")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case "Urgente": return "bg-red-100 text-red-800"
      case "Haute": return "bg-orange-100 text-orange-800"
      case "Normale": return "bg-yellow-100 text-yellow-800"
      case "Basse": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Nouveau": return "bg-blue-100 text-blue-800"
      case "En cours": return "bg-purple-100 text-purple-800"
      case "En attente": return "bg-yellow-100 text-yellow-800"
      case "Résolu": return "bg-green-100 text-green-800"
      case "Fermé": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm font-medium">
        🎫 Support
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
            style={{ margin: 'auto' }}>
            
            {/* Header avec dégradé */}
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 p-4 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                    <span className="text-3xl">🎫</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Support Technique</h2>
                    <p className="text-purple-100 text-xs">Créez un ticket ou consultez vos demandes</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all text-2xl font-bold leading-none w-10 h-10 flex items-center justify-center">
                  ✕
                </button>
              </div>
            </div>

            {/* Onglets */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("create")}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === "create"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  ✏️ Créer un ticket
                </button>
                <button
                  onClick={() => setActiveTab("list")}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === "list"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  📋 Mes tickets ({tickets.length})
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "create" ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type de demande <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
                      <option value="">Sélectionner un type...</option>
                      <option value="Trouble technique">🔧 Trouble technique</option>
                      <option value="Suggestion">💡 Suggestion</option>
                      <option value="Amélioration">⭐ Amélioration</option>
                      <option value="Question">❓ Question</option>
                      <option value="Autre">📌 Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priorité <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.priorite}
                      onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
                      <option value="Basse">🟢 Basse - Peut attendre</option>
                      <option value="Normale">🟡 Normale - Standard</option>
                      <option value="Haute">🟠 Haute - Important</option>
                      <option value="Urgente">🔴 Urgente - Bloquant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sujet}
                      onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                      placeholder="Ex: Problème d'affichage des statistiques"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description détaillée <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Décrivez le problème en détail..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Plus vous donnez de détails, plus vite nous pourrons vous aider
                    </p>
                  </div>



                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]">
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Création en cours...
                        </span>
                      ) : (
                        "✓ Créer le ticket"
                      )}
                    </button>
                  </div>
                </form>
              ) : selectedTicket ? (
                /* Vue détail du ticket */
                <div className="p-6">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="mb-4 text-purple-600 hover:text-purple-800 font-medium">
                    ← Retour à la liste
                  </button>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedTicket.ticketId}</h3>
                        <p className="text-gray-600">{selectedTicket.sujet}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded ${getPrioriteColor(selectedTicket.priorite)}`}>
                          {selectedTicket.priorite}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Type: {selectedTicket.type}</p>
                    <p className="text-sm text-gray-600">Créé le: {formatDateTime(selectedTicket.createdAt)}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-2">Description initiale:</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>

                    {selectedTicket.reponses && selectedTicket.reponses.length > 0 && (
                      <>
                        <h4 className="font-bold text-gray-900 mt-6">Réponses de l'équipe support:</h4>
                        {selectedTicket.reponses.map((reponse, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg ${
                              reponse.isAdmin
                                ? "bg-purple-50 border-l-4 border-purple-500"
                                : "bg-gray-50 border-l-4 border-gray-300"
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-8 h-8 ${reponse.isAdmin ? "bg-purple-500" : "bg-gray-400"} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                                {reponse.auteur[0]}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {reponse.auteur}
                                  {reponse.isAdmin && <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Admin</span>}
                                </p>
                                <p className="text-xs text-gray-500">{formatDateTime(reponse.date)}</p>
                              </div>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{reponse.message}</p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Liste des tickets */
                <div className="p-6">
                  {tickets.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-gray-600 mb-4">Aucun ticket créé</p>
                      <button
                        onClick={() => setActiveTab("create")}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all">
                        Créer votre premier ticket
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket._id}
                          onClick={() => setSelectedTicket(ticket)}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-start justify-between mb-2 gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900">{ticket.ticketId}</h3>
                              <p className="text-gray-700 text-sm truncate">{ticket.sujet}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${getPrioriteColor(ticket.priorite)}`}>
                                {ticket.priorite}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDeleteMyTicket(ticket)
                                }}
                                className="px-2 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                                Supprimer
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{ticket.type}</span>
                            <span>{formatDateTime(ticket.createdAt)}</span>
                          </div>
                          {ticket.reponses && ticket.reponses.length > 0 && (
                            <div className="mt-2 text-xs text-purple-600 font-medium">
                              💬 {ticket.reponses.length} réponse(s)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
