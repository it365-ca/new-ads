import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"

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

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const result = await lumi.entities.tickets.list()
      
      // Gérer différentes structures de retour possibles
      let ticketsList: Ticket[] = []
      if (Array.isArray(result)) {
        ticketsList = result
      } else if (result?.list) {
        ticketsList = result.list
      } else if (result?.items) {
        ticketsList = result.items
      } else if (result?.data) {
        ticketsList = result.data
      }
      
      setTickets(ticketsList)
      setError(null)
    } catch (err) {
      setError("Erreur lors du chargement des tickets")
      console.error("Erreur fetchTickets:", err)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const createTicket = async (ticketData: Omit<Ticket, "_id" | "createdAt" | "updatedAt">) => {
    try {
      const now = new Date().toISOString()
      await lumi.entities.tickets.create({
        ...ticketData,
        createdAt: now,
        updatedAt: now
      })
      await fetchTickets()
    } catch (err) {
      console.error("Error creating ticket:", err)
      throw err
    }
  }

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      await lumi.entities.tickets.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      await fetchTickets()
    } catch (err) {
      console.error("Error updating ticket:", err)
      throw err
    }
  }

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    createTicket,
    updateTicket
  }
}
