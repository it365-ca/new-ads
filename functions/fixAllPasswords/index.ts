import { createClient } from "@lumi.new/sdk"

// Fonction de hashage avec salt (identique à loginCustom)
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

// Mot de passe temporaire pour tous les comptes
const TEMP_PASSWORD = "Benado2024!"

Deno.serve(async (req) => {
  console.log(JSON.stringify({ stage: "start", method: req.method, url: req.url }))

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    // Utiliser le LUMI_API_KEY de l'environnement (pas besoin d'autorisation utilisateur)
    const apiKey = Deno.env.get("LUMI_API_KEY")
    const lumi = createClient({
      projectId: "p384255179950706688",
      apiBaseUrl: "https://api.lumi.new",
      authOrigin: "",
      authorization: `Bearer ${apiKey}`
    })

    console.log(JSON.stringify({ stage: "fetching_intervenants", hasApiKey: Boolean(apiKey) }))

    // Récupérer tous les intervenants
    const result = await lumi.entities.intervenants.list({ limit: 100 })
    
    if (!result.list || result.list.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucun intervenant trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log(JSON.stringify({ stage: "found_intervenants", count: result.list.length }))

    const updated = []
    const errors = []

    // Mettre à jour chaque intervenant
    for (const intervenant of result.list) {
      try {
        // Hash le mot de passe temporaire avec le salt existant
        const passwordHash = await hashPassword(TEMP_PASSWORD, intervenant.salt)
        
        await lumi.entities.intervenants.update(intervenant._id, {
          passwordHash,
          mustChangePassword: true
        })

        updated.push({
          email: intervenant.email,
          nom: intervenant.nom,
          prenom: intervenant.prenom
        })

        console.log(JSON.stringify({
          stage: "updated",
          email: intervenant.email
        }))
      } catch (error: any) {
        errors.push({
          email: intervenant.email,
          error: error.message
        })
        console.error(JSON.stringify({
          stage: "error_updating",
          email: intervenant.email,
          error: error.message
        }))
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${updated.length} intervenants mis à jour`,
        temporaryPassword: TEMP_PASSWORD,
        updated,
        errors
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error: any) {
    console.error(JSON.stringify({
      stage: "error",
      type: error.constructor?.name,
      message: error.message
    }))

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})