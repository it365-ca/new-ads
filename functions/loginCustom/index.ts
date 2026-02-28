import { createClient } from "@lumi.new/sdk"

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

Deno.serve(async (req) => {
  console.log(JSON.stringify({ stage: "start", url: req.url, method: req.method }))

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const { email, password } = await req.json()
    console.log(JSON.stringify({ stage: "request", email, hasPassword: Boolean(password) }))

    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: "Email et mot de passe requis" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Pas besoin d'auth pour le login
    const lumi = createClient({
      projectId: "p384255179950706688",
      apiBaseUrl: "https://api.lumi.new",
      authOrigin: ""
    })

    console.log(JSON.stringify({ stage: "sdk_call", action: "intervenants.list", filter: { email } }))

    // Chercher l'intervenant par email
    const result = await lumi.entities.intervenants.list({
      filter: { email },
      limit: 1
    })

    console.log(JSON.stringify({ stage: "sdk_response", found: result.list?.length || 0 }))

    if (!result.list || result.list.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Email ou mot de passe incorrect" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const intervenant = result.list[0]

    // Vérifier si actif
    if (!intervenant.actif) {
      console.log(JSON.stringify({ stage: "error", reason: "account_disabled" }))
      return new Response(JSON.stringify({ 
        error: "Votre compte est désactivé" 
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Vérifier le mot de passe
    const passwordHash = await hashPassword(password, intervenant.salt)
    if (passwordHash !== intervenant.passwordHash) {
      console.log(JSON.stringify({ stage: "error", reason: "invalid_password" }))
      return new Response(JSON.stringify({ 
        error: "Email ou mot de passe incorrect" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Créer une session
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 jours

    const userAgent = req.headers.get("User-Agent") || "Unknown"
    const ipAddress = req.headers.get("X-Forwarded-For") || "Unknown"

    console.log(JSON.stringify({ stage: "sdk_call", action: "authSessions.create" }))

    await lumi.entities.authSessions.create({
      userId: intervenant._id, // Stocker l'ObjectId MongoDB pour identification unique
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      userAgent,
      ipAddress
    })

    console.log(JSON.stringify({ stage: "response", success: true }))

    return new Response(JSON.stringify({ 
      success: true,
      sessionToken,
      mustChangePassword: intervenant.mustChangePassword || false,
      user: {
        userId: intervenant._id, // MongoDB ObjectId pour updateIntervenantPassword
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
    console.error(JSON.stringify({ stage: "error", type: error.constructor?.name, message: error.message }))
    return new Response(JSON.stringify({ 
      error: "Erreur lors de la connexion" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
