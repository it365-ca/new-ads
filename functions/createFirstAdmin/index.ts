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

  // Accepter GET et POST pour faciliter l'appel depuis le navigateur

  try {
    const lumi = createClient({
      projectId: "p384255179950706688",
      apiBaseUrl: "https://api.lumi.new",
      authOrigin: ""
    })

    console.log(JSON.stringify({ stage: "sdk_initialized" }))

    // Vérifier si admin@benado.com existe déjà
    const existing = await lumi.entities.intervenants.list({ 
      filter: { email: "admin@benado.com" },
      limit: 1 
    })
    console.log(JSON.stringify({ stage: "check_existing", found: existing.list.length }))

    if (existing.list.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "Admin admin@benado.com existe déjà",
        credentials: {
          email: "admin@benado.com",
          password: "Admin123!"
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    const salt = crypto.randomUUID()
    const password = "Admin123!"
    const passwordHash = await hashPassword(password, salt)

    console.log(JSON.stringify({ stage: "creating_admin" }))

    const admin = await lumi.entities.intervenants.create({
      nom: "Administrateur",
      prenom: "Benado",
      email: "admin@benado.com",
      userId: crypto.randomUUID(),
      telephone: "",
      specialite: "Administrateur système",
      actif: true,
      dateAjout: new Date().toISOString(),
      salt,
      passwordHash,
      permissions: {
        accessNotes: true,
        accessStats: true,
        modifierEtudiants: true,
        supprimerEtudiants: true,
        accessMessagerie: true,
        accessTickets: true
      }
    })

    console.log(JSON.stringify({ stage: "response", adminId: admin._id }))

    return new Response(JSON.stringify({
      success: true,
      message: "Admin créé avec succès !",
      credentials: {
        email: "admin@benado.com",
        password: "Admin123!"
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error(JSON.stringify({ stage: "error", message: error.message }))
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Erreur lors de la création"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
