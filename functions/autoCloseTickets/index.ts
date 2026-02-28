import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const LUMI_API_KEY = Deno.env.get("LUMI_API_KEY")
const API_BASE_URL = Deno.env.get("API_BASE_URL")

interface Ticket {
  _id: string
  ticketId: string
  status: string
  updatedAt: string
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

async function autoCloseResolvedTickets() {
  try {
    console.log("[INFO] Démarrage de la fermeture automatique des tickets résolus...")

    // Récupérer tous les tickets avec statut "Résolu"
    const response = await fetch(`${API_BASE_URL}/entities/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LUMI_API_KEY}`
      },
      body: JSON.stringify({
        action: "list",
        data: {}
      })
    })

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.statusText}`)
    }

    const result = await response.json()
    const tickets: Ticket[] = result.list || []
    
    console.log(`[INFO] ${tickets.length} tickets trouvés au total`)

    // Calculer la date limite (30 jours en arrière)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    let closedCount = 0

    // Parcourir les tickets et fermer ceux résolus depuis plus de 30 jours
    for (const ticket of tickets) {
      if (ticket.status === "Résolu") {
        const updatedDate = new Date(ticket.updatedAt)
        
        // Si le ticket a été résolu il y a plus de 30 jours
        if (updatedDate < thirtyDaysAgo) {
          console.log(`[INFO] Fermeture du ticket ${ticket.ticketId} (résolu le ${ticket.updatedAt})`)
          
          // Mettre à jour le statut à "Fermé"
          await fetch(`${API_BASE_URL}/entities/tickets/${ticket._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${LUMI_API_KEY}`
            },
            body: JSON.stringify({
              status: "Fermé",
              updatedAt: new Date().toISOString()
            })
          })
          
          closedCount++
        }
      }
    }

    console.log(`[SUCCESS] ${closedCount} ticket(s) fermé(s) automatiquement`)

    return {
      success: true,
      message: `${closedCount} ticket(s) fermé(s) automatiquement`,
      closedCount,
      totalTickets: tickets.length
    }

  } catch (error) {
    console.error("[ERROR] Erreur lors de la fermeture automatique:", error)
    throw error
  }
}

// Tâche cron quotidienne à 2h UTC
Deno.cron("Auto-close resolved tickets", "0 2 * * *", async () => {
  console.log("[CRON] Exécution de la tâche de fermeture automatique...")
  await autoCloseResolvedTickets()
})

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Permettre le déclenchement manuel via API
    const result = await autoCloseResolvedTickets()

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("[ERROR]", error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
