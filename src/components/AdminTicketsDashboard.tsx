import React, { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { lumi } from "../lib/lumi" // Assurez-vous que ce chemin est correct
import { formatDateTime } from "../utils/dateFormat" // Assurez-vous que ce chemin est correct

// Interface Ticket
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

export const AdminTicketsDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [reponseMessage, setReponseMessage] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("tous")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const isAdmin = currentUser?.permissions?.accessAdministration === true

  // --- Initialisation ---
  const fetchTicketsRef = React.useRef<() => void>(() => {})

  const fetchTicketsInternal = async () => {
    try {
      setLoading(true)
      
      // Toujours récupérer l'utilisateur le plus frais du SDK
      let user = lumi.auth.user
      if (!user) {
         try {
           await lumi.auth.refreshUser()
           user = lumi.auth.user
         } catch (e) {
           console.warn("Refresh user failed inside fetch", e)
         }
      }

      // Si toujours pas d'user, on utilise celui du state ou on arrête
      const activeUser = user || currentUser
      
      const result = await lumi.entities.tickets.list()
      
      let ticketsList: Ticket[] = []
      if (Array.isArray(result)) ticketsList = result
      else if (result?.list) ticketsList = result.list
      else if (result?.items) ticketsList = result.items
      else if (result?.data) ticketsList = result.data
      else if (result) ticketsList = [result]
      
      // Logique de filtrage (Admin vs User)
      const isUserAdmin = activeUser?.permissions?.accessAdministration === true || activeUser?.userRole === 'admin'
      
      if (!isUserAdmin) {
        if (activeUser?.email) {
            ticketsList = ticketsList.filter(t => t.createdByEmail === activeUser.email)
        } else {
            // Si pas d'email, on ne montre rien par sécurité
            ticketsList = []
        }
      }
      
      setTickets(ticketsList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
      
      // Mettre à jour le currentUser si on en a récupéré un frais
      if (user && (!currentUser || currentUser.email !== user.email)) {
          setCurrentUser(user)
      }

    } catch (error) {
      console.error("Erreur chargement tickets:", error)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  fetchTicketsRef.current = fetchTicketsInternal

  useEffect(() => {
    fetchTicketsInternal()
    
    // Écouter l'événement de création de ticket
    const handleTicketCreated = () => {
      console.log("🔔 Nouveau ticket détecté (AdminDashboard)")
      // Petit délai pour la propagation DB
      setTimeout(() => {
        fetchTicketsRef.current()
      }, 1000)
    }
    
    window.addEventListener('ticketCreated', handleTicketCreated)
    return () => window.removeEventListener('ticketCreated', handleTicketCreated)
  }, [])

  const formatDeleteError = (error: any) => {
    const msg = error?.message || error?.toString?.() || "Erreur inconnue"
    if (/permission|forbidden|unauthorized|auth|401|403/i.test(msg)) {
      return "Accès refusé. Session expirée ou droits insuffisants."
    }
    return msg
  }

  // --- Actions ---

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await lumi.entities.tickets.update(ticketId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      toast.success("Statut mis à jour")
      
      // Mise à jour locale optimiste
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t))
      if (selectedTicket?._id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus })
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
      console.error(error)
    }
  }

  // C'est ici que la correction majeure a lieu
  const handleDeleteSelected = async () => {
    if (selectedTicketIds.length === 0) {
      toast.error("Aucun ticket sélectionné")
      return
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedTicketIds.length} ticket(s) ?`)) {
      return
    }

    const toastId = toast.loading("Préparation de la suppression...")
    let successCount = 0
    let failCount = 0

    try {
      // 1. Tenter de réveiller le SDK avant toute chose
      if (!lumi.auth.user) {
        try {
            console.log("🔄 Tentative de refresh SDK avant delete...")
            await lumi.auth.refreshUser()
        } catch (e) {
            console.warn("Refresh SDK échoué", e)
        }
      }

      // 2. Vérification ultime
      if (!lumi.auth.user) {
        toast.dismiss(toastId)
        toast.error("Session SDK inactive. Veuillez vous déconnecter et reconnecter.")
        return
      }

      toast.loading(`Suppression de ${selectedTicketIds.length} ticket(s)...`, { id: toastId })

      // 3. Boucle de suppression
      for (const ticketId of selectedTicketIds) {
        // Sécurité type
        if (!ticketId || typeof ticketId !== 'string') {
          console.warn(`⚠️ ID invalide ignoré:`, ticketId)
          failCount++
          continue
        }

        try {
          console.log(`🗑️ Tentative suppression ticket: ${ticketId}`)
          const deleteResult = await lumi.entities.tickets.delete(ticketId)
          console.log(`✅ Résultat suppression ${ticketId}:`, deleteResult)
          
          // Vérifier si la suppression a vraiment réussi
          if (deleteResult && typeof deleteResult === 'object' && 'error' in deleteResult) {
            // Si l'objet contient une clé 'error', c'est un échec
            console.error(`❌ Suppression échouée pour ${ticketId}:`, deleteResult)
            failCount++
          } else {
            successCount++
          }
        } catch (error: any) {
          failCount++
          console.error(`❌ Erreur delete ${ticketId}:`, {
            message: error?.message,
            code: error?.code,
            status: error?.status,
            full: error
          })
        }
      }

      toast.dismiss(toastId)

      // 4. Feedback
      if (successCount > 0 && failCount === 0) {
        toast.success(`${successCount} ticket(s) supprimé(s)`)
      } else if (failCount > 0) {
        toast.warning(`${successCount} supprimé(s), ${failCount} erreur(s).`)
      }

      // 5. Nettoyage
      setSelectedTicketIds([])
      await fetchTickets() // Recharger la liste depuis le serveur

    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error(`Erreur critique: ${formatDeleteError(error)}`)
    }
  }

  const handleRepondre = async () => {
    if (!selectedTicket || !reponseMessage.trim()) {
      toast.error("Message vide")
      return
    }

    if (selectedTicket.status === "Fermé") {
      toast.error("Ticket fermé")
      return
    }

    try {
      // On utilise currentUser pour l'affichage, mais le SDK utilisera son user interne
      const nouvelleReponse = {
        auteur: currentUser?.userName || "Support",
        auteurEmail: currentUser?.email || "",
        message: reponseMessage,
        date: new Date().toISOString(),
        isAdmin: true
      }

      const reponsesUpdated = [...(selectedTicket.reponses || []), nouvelleReponse]

      await lumi.entities.tickets.update(selectedTicket._id, {
        reponses: reponsesUpdated,
        status: "En cours",
        updatedAt: new Date().toISOString()
      })

      // Notification Email
      try {
        await lumi.tools.email.send({
          to: selectedTicket.createdByEmail,
          subject: `Réponse au ticket ${selectedTicket.ticketId}`,
          fromName: "Support",
          html: `<p>${reponseMessage}</p>`
        })
      } catch (e) { console.warn("Email failed", e) }

      toast.success("Réponse envoyée")
      setReponseMessage("")
      
      // Mise à jour locale
      const updatedTicket = { ...selectedTicket, reponses: reponsesUpdated, status: "En cours" }
      setTickets(prev => prev.map(t => t._id === selectedTicket._id ? updatedTicket : t))
      setSelectedTicket(updatedTicket)

    } catch (error) {
      toast.error("Erreur envoi réponse")
      console.error(error)
    }
  }

  // --- Gestion Selection ---
  const toggleSelectTicket = (ticketId: string) => {
    setSelectedTicketIds(prev => 
      prev.includes(ticketId) ? prev.filter(id => id !== ticketId) : [...prev, ticketId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedTicketIds.length === filteredTickets.length) {
      setSelectedTicketIds([])
    } else {
      setSelectedTicketIds(filteredTickets.map(t => t._id))
    }
  }

  // --- Filtrage & Stats ---
  const filteredTickets = tickets.filter(ticket => {
    const matchStatus = filterStatus === "tous" || ticket.status === filterStatus
    const matchSearch = (ticket.ticketId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (ticket.sujet || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (ticket.createdByName || "").toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    nouveau: tickets.filter(t => t.status === "Nouveau").length,
    enCours: tickets.filter(t => t.status === "En cours").length,
    resolu: tickets.filter(t => t.status === "Résolu").length,
    total: tickets.length
  }

  const getPrioriteColor = (p: string) => {
    switch (p) {
      case "Urgente": return "bg-red-100 text-red-800"
      case "Haute": return "bg-orange-100 text-orange-800"
      case "Normale": return "bg-yellow-100 text-yellow-800"
      case "Basse": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Nouveau": return "bg-blue-100 text-blue-800"
      case "En cours": return "bg-purple-100 text-purple-800"
      case "En attente": return "bg-yellow-100 text-yellow-800"
      case "Résolu": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Vue Détail Ticket
  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <button onClick={() => setSelectedTicket(null)} className="px-4 py-2 bg-white border rounded hover:bg-gray-50">← Retour</button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{selectedTicket.ticketId}</h1>
            </div>
            <select 
              value={selectedTicket.status}
              onChange={(e) => handleStatusChange(selectedTicket._id, e.target.value)}
              className="px-4 py-2 border rounded"
            >
              <option value="Nouveau">Nouveau</option>
              <option value="En cours">En cours</option>
              <option value="En attente">En attente</option>
              <option value="Résolu">Résolu</option>
              <option value="Fermé">Fermé</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Info */}
            <div className="col-span-1 bg-white p-6 rounded shadow space-y-4">
               <h3 className="font-bold">Détails</h3>
               <div><span className="text-gray-500">Sujet:</span> <p>{selectedTicket.sujet}</p></div>
               <div><span className="text-gray-500">Priorité:</span> <br/><span className={`px-2 py-0.5 rounded text-sm ${getPrioriteColor(selectedTicket.priorite)}`}>{selectedTicket.priorite}</span></div>
               <div><span className="text-gray-500">De:</span> <p>{selectedTicket.createdByName}</p> <p className="text-xs text-gray-400">{selectedTicket.createdByEmail}</p></div>
               <div><span className="text-gray-500">Date:</span> <p>{new Date(selectedTicket.createdAt).toLocaleDateString()}</p></div>
            </div>

            {/* Conversation */}
            <div className="col-span-2 bg-white p-6 rounded shadow flex flex-col h-[600px]">
               <div className="bg-gray-50 p-4 rounded mb-4 border-l-4 border-blue-500">
                 <p className="font-bold mb-1">{selectedTicket.createdByName} a écrit :</p>
                 <p>{selectedTicket.description}</p>
               </div>
               
               <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                 {selectedTicket.reponses?.map((rep, idx) => (
                   <div key={idx} className={`p-3 rounded ${rep.isAdmin ? "bg-purple-50 ml-8 border-l-4 border-purple-500" : "bg-gray-100 mr-8"}`}>
                     <div className="flex justify-between text-xs text-gray-500 mb-1">
                       <span>{rep.auteur}</span>
                       <span>{new Date(rep.date).toLocaleString()}</span>
                     </div>
                     <p>{rep.message}</p>
                   </div>
                 ))}
               </div>

               {selectedTicket.status !== "Fermé" ? (
                 <div className="mt-auto">
                   <textarea 
                     className="w-full border p-2 rounded mb-2" 
                     rows={3} 
                     value={reponseMessage} 
                     onChange={e => setReponseMessage(e.target.value)}
                     placeholder="Votre réponse..."
                   />
                   <button onClick={handleRepondre} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Envoyer</button>
                 </div>
               ) : (
                 <div className="text-center text-gray-500 bg-gray-100 p-2 rounded">Ticket fermé</div>
               )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vue Liste (Dashboard)
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">📋 {isAdmin ? "Gestion Tickets" : "Mes Tickets"}</h1>
        <p className="text-gray-600 mb-8">{isAdmin ? "Vue Administrateur" : "Vue Utilisateur"}</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">Total: <span className="font-bold text-2xl block">{stats.total}</span></div>
          <div className="bg-blue-50 p-4 rounded shadow text-blue-800">Nouveaux: <span className="font-bold text-2xl block">{stats.nouveau}</span></div>
          <div className="bg-purple-50 p-4 rounded shadow text-purple-800">En cours: <span className="font-bold text-2xl block">{stats.enCours}</span></div>
          <div className="bg-green-50 p-4 rounded shadow text-green-800">Résolus: <span className="font-bold text-2xl block">{stats.resolu}</span></div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white p-4 rounded shadow mb-6 flex gap-4">
          <input 
            type="text" 
            placeholder="Recherche..." 
            className="flex-1 border p-2 rounded"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select 
            className="border p-2 rounded"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="tous">Tous statuts</option>
            <option value="Nouveau">Nouveau</option>
            <option value="En cours">En cours</option>
            <option value="Résolu">Résolu</option>
            <option value="Fermé">Fermé</option>
          </select>
          {selectedTicketIds.length > 0 && (
            <button onClick={handleDeleteSelected} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              🗑️ Supprimer ({selectedTicketIds.length})
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" onChange={toggleSelectAll} checked={filteredTickets.length > 0 && selectedTicketIds.length === filteredTickets.length} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sujet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.map(ticket => (
                <tr key={ticket._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedTicketIds.includes(ticket._id)} onChange={() => toggleSelectTicket(ticket._id)} />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{ticket.ticketId}</td>
                  <td className="px-6 py-4 text-sm">{ticket.sujet}</td>
                  <td className="px-6 py-4"><span className={`px-2 text-xs rounded ${getStatusColor(ticket.status)}`}>{ticket.status}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 text-xs rounded ${getPrioriteColor(ticket.priorite)}`}>{ticket.priorite}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedTicket(ticket)} className="text-purple-600 hover:text-purple-900 font-medium text-sm">Voir</button>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Aucun ticket trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}