import { createClient } from "npm:@lumi.new/sdk@0.3.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

// Initialiser le client Lumi pour les tâches cron
const lumi = createClient({
  projectId: Deno.env.get("PROJECT_ID")!,
  apiBaseUrl: Deno.env.get("API_BASE_URL")!,
  authorization: `Bearer ${Deno.env.get("LUMI_API_KEY")}`,
})

// Tâche cron : archiver les notes fermées après 30 jours
Deno.cron(
  "Archive closed notes",
  "0 2 * * *", // Tous les jours à 2h du matin UTC
  { backoffSchedule: [1000, 5000, 10000] },
  async () => {
    console.log("🔄 Starting automatic archiving of closed notes...")
    
    try {
      // Date limite : 30 jours avant aujourd'hui
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      // Récupérer toutes les notes avec status "ferme" et updatedAt > 30 jours
      const { list } = await lumi.entities.notes.list({
        filter: {
          status: "ferme",
          updatedAt: { $lt: thirtyDaysAgo }
        }
      })

      if (list.length === 0) {
        console.log("✅ No notes to archive")
        return
      }

      // Mettre à jour le statut vers "supprime" (archivage)
      for (const note of list) {
        await lumi.entities.notes.update(note._id, {
          status: "supprime",
          updatedAt: new Date().toISOString()
        })
      }

      console.log(`✅ Successfully archived ${list.length} closed notes older than 30 days`)
    } catch (error) {
      console.error("❌ Error during archiving:", error)
      throw error // Déclencher le backoffSchedule
    }
  }
)

// Handler HTTP pour tests manuels
async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405)
    }

    // Exécuter l'archivage manuellement
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { list } = await lumi.entities.notes.list({
      filter: {
        status: "ferme",
        updatedAt: { $lt: thirtyDaysAgo }
      }
    })

    if (list.length === 0) {
      return jsonResponse({ 
        success: true, 
        message: "No notes to archive",
        archived: 0 
      })
    }

    for (const note of list) {
      await lumi.entities.notes.update(note._id, {
        status: "supprime",
        updatedAt: new Date().toISOString()
      })
    }

    return jsonResponse({ 
      success: true, 
      message: `Successfully archived ${list.length} closed notes`,
      archived: list.length
    })
  } catch (error) {
    console.error("Error:", error)
    return jsonResponse({ 
      error: error.message ?? "Internal server error" 
    }, 500)
  }
}

Deno.serve(handler)
