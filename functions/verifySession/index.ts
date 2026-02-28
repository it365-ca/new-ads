import { createClient } from "@lumi.new/sdk"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const { sessionToken } = await req.json()
    console.log(JSON.stringify({ stage: "start", hasToken: Boolean(sessionToken), timestamp: new Date().toISOString() }))

    if (!sessionToken) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: "Token manquant" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const projectId = Deno.env.get("PROJECT_ID") || "p384255179950706688"
    const apiBaseUrl = Deno.env.get("API_BASE_URL") || "https://api.lumi.new"
    const lumiApiKey = Deno.env.get("LUMI_API_KEY") || ""

    console.log(JSON.stringify({
      stage: "config",
      keys: {
        PROJECT_ID: Boolean(projectId),
        API_BASE_URL: Boolean(apiBaseUrl),
        LUMI_API_KEY: Boolean(lumiApiKey)
      }
    }))

    // Créer le client Lumi avec la clé API système (pas le sessionToken custom)
    const lumi = createClient({
      projectId,
      apiBaseUrl,
      authOrigin: "",
      authorization: `Bearer ${lumiApiKey}`
    })

    console.log(JSON.stringify({ stage: "sdk_call", action: "auth.refreshUser" }))
    
    // CRITIQUE: refreshUser() avec la clé API système
    try {
      await lumi.auth.refreshUser()
      console.log(JSON.stringify({ stage: "sdk_response", action: "auth.refreshUser", success: true }))
    } catch (refreshError: any) {
      console.error(JSON.stringify({ stage: "error", action: "auth.refreshUser", message: refreshError.message }))
    }

    console.log(JSON.stringify({ stage: "sdk_call", action: "authSessions.list", filter: { sessionToken } }))

    // Récupérer la session via SDK (maintenant authentifié avec LUMI_API_KEY)
    const sessionsResult = await lumi.entities.authSessions.list({
      filter: { sessionToken }
    })

    const sessions = sessionsResult?.list || []
    
    console.log(JSON.stringify({ stage: "sdk_response", action: "authSessions.list", found: sessions.length }))

    if (sessions.length === 0) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: "Session invalide" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const session = sessions[0]

    // Vérifier expiration
    const expiresAt = new Date(session.expiresAt)
    if (expiresAt < new Date()) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: "Session expirée" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    console.log(JSON.stringify({ stage: "sdk_call", action: "intervenants.get", intervenantId: session.userId }))

    // Récupérer l'intervenant par son _id MongoDB (stocké dans session.userId)
    const intervenant = await lumi.entities.intervenants.get(session.userId)

    console.log(JSON.stringify({ stage: "sdk_response", action: "intervenants.get", found: Boolean(intervenant) }))

    if (!intervenant) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: "Utilisateur non trouvé" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    if (!intervenant.actif) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: "Compte désactivé" 
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      })
    }

    console.log(JSON.stringify({ stage: "response", valid: true, email: intervenant.email }))

    return new Response(JSON.stringify({ 
      valid: true,
      user: {
        userId: intervenant._id,
        email: intervenant.email,
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        permissions: intervenant.permissions || {}
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error(JSON.stringify({ stage: "error", type: error.constructor.name, message: error.message, stack: error.stack }))
    return new Response(JSON.stringify({ 
      valid: false,
      error: "Erreur lors de la vérification" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
