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
    const { nom, prenom, email, password, permissions } = await req.json()
    console.log(JSON.stringify({ stage: "request", nom, prenom, email, hasPassword: Boolean(password) }))

    if (!nom || !prenom || !email || !password) {
      return new Response(JSON.stringify({ 
        error: "Tous les champs sont requis" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Pas besoin d'auth pour la création du premier admin
    const lumi = createClient({
      projectId: "p384255179950706688",
      apiBaseUrl: "https://api.lumi.new",
      authOrigin: ""
    })

    console.log(JSON.stringify({ stage: "sdk_call", action: "intervenants.list", filter: { email } }))

    // Vérifier si l'email existe déjà
    const result = await lumi.entities.intervenants.list({
      filter: { email },
      limit: 1
    })

    console.log(JSON.stringify({ stage: "sdk_response", found: result.list?.length || 0 }))

    if (result.list && result.list.length > 0) {
      return new Response(JSON.stringify({
        error: "Cet email est déjà utilisé"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Générer un salt unique
    const salt = crypto.randomUUID()
    const passwordHash = await hashPassword(password, salt)

    console.log(JSON.stringify({ stage: "sdk_call", action: "intervenants.create" }))

    // Créer l'intervenant
    const intervenant = await lumi.entities.intervenants.create({
      nom,
      prenom,
      email,
      userId: "",
      telephone: "",
      specialite: "",
      actif: true,
      dateAjout: new Date().toISOString(),
      salt,
      passwordHash,
      permissions: permissions || {
        accessNotes: false,
        accessStats: false,
        modifierEtudiants: false,
        supprimerEtudiants: false,
        accessMessagerie: false,
        accessTickets: false
      }
    })

    console.log(JSON.stringify({ stage: "response", success: true, userId: intervenant._id }))

    return new Response(JSON.stringify({
      success: true,
      message: "Intervenant enregistré avec succès",
      intervenant
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error(JSON.stringify({ stage: "error", type: error.constructor?.name, message: error.message }))
    return new Response(JSON.stringify({
      error: "Erreur lors de l'enregistrement"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
